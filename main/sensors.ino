// Wokwi / ESP32:
// - instalá la librería "FirebaseClient" de mobizt
// - NO uses la vieja "Firebase ESP Client"
// - mantené los placeholders en este mismo archivo para simular sin credentials.h
// - este sketch prioriza diagnóstico visible por Serial desde el arranque

#define ENABLE_USER_AUTH
#define ENABLE_DATABASE

#include <WiFi.h>
#include <WiFiClientSecure.h>
#include <FirebaseClient.h>
#include "DHT.h"
#include <MQUnifiedsensor.h>
#include <math.h>
#include <string.h>

// Configuración inline para simulación/Wokwi.
// Reemplazá estos valores por los de tu proyecto Firebase.
#define WIFI_SSID "REPLACE_ME"
#define WIFI_PASSWORD "REPLACE_ME"

#define API_KEY "REPLACE_ME"
#define USER_EMAIL "REPLACE_ME"
#define USER_PASSWORD "REPLACE_ME"
#define DATABASE_URL "https://REPLACE_ME-default-rtdb.firebaseio.com/"

constexpr unsigned long FIREBASE_WRITE_INTERVAL_MS = 2000UL;
constexpr int FIREBASE_FLOAT_DECIMALS = 2;
constexpr unsigned long WIFI_CONNECT_TIMEOUT_MS = 15000UL;
constexpr unsigned long WIFI_RETRY_INTERVAL_MS = 5000UL;
constexpr unsigned long FIREBASE_WAIT_LOG_INTERVAL_MS = 4000UL;
constexpr unsigned long DIAGNOSTIC_HEARTBEAT_INTERVAL_MS = 5000UL;
constexpr unsigned long CONFIG_WARNING_INTERVAL_MS = 8000UL;
constexpr unsigned long SERIAL_BOOT_DELAY_MS = 250UL;
constexpr unsigned long ULTRASONIC_TIMEOUT_US = 30000UL;
constexpr size_t USER_AUTH_EXPIRY_SECONDS = 3300;
constexpr float CO2_BASELINE_PPM = 400.0f;

#define DHT_PIN 13

// HC-SR04
#define trig 32
#define eco 33
#define POWER_STAGE_PIN 4

/************************Hardware Related Macros************************************/
#define Board ("ESP-32")
#define Pin (34)
/***********************Software Related Macros************************************/
#define Type ("MQ-135")
#define Voltage_Resolution (3.3)
#define ADC_Bit_Resolution (12)
#define RatioMQ135CleanAir (3.6)

using AsyncClient = AsyncClientClass;

String uid;
String databasePath;
String tempPath;
String humPath;
String distPath;
String coPath;
String alcoholPath;
String co2Path;
String toggleStatusPath;

unsigned long sendDataPrevMillis = 0;
unsigned long lastHeartbeatMillis = 0;
unsigned long lastWiFiAttemptMillis = 0;
unsigned long lastFirebaseWaitLogMillis = 0;
unsigned long lastConfigWarningMillis = 0;
unsigned long lastUidWarningMillis = 0;
unsigned long lastMq135WarningMillis = 0;
unsigned long acquisitionCycle = 0;

bool waitingForFirebaseLogged = false;
bool firebaseInitStarted = false;
bool mq135Available = false;
bool configurationStatusLogged = false;

DHT &getDht() {
  static DHT dht(DHT_PIN, DHT22);
  return dht;
}

MQUnifiedsensor &getMq135() {
  static MQUnifiedsensor mq135(Board, Voltage_Resolution, ADC_Bit_Resolution, Pin, Type);
  return mq135;
}

WiFiClientSecure &getSslClient() {
  static WiFiClientSecure sslClient;
  return sslClient;
}

AsyncClient &getAsyncClient() {
  static AsyncClient asyncClient(getSslClient());
  return asyncClient;
}

UserAuth &getUserAuth() {
  static UserAuth userAuth(API_KEY, USER_EMAIL, USER_PASSWORD, USER_AUTH_EXPIRY_SECONDS);
  return userAuth;
}

FirebaseApp &getFirebaseApp() {
  static FirebaseApp firebaseApp;
  return firebaseApp;
}

RealtimeDatabase &getDatabase() {
  static RealtimeDatabase database;
  return database;
}

void logInfo(const char *scope, const String &message) {
  Serial.printf("[%10lu ms] %-10s %s\n", millis(), scope, message.c_str());
}

void logWarn(const char *scope, const String &message) {
  Serial.printf("[%10lu ms] WARN/%s %s\n", millis(), scope, message.c_str());
}

void logError(const char *scope, const String &message) {
  Serial.printf("[%10lu ms] ERROR/%s %s\n", millis(), scope, message.c_str());
}

void logBoot(uint8_t step, const String &message) {
  Serial.printf("[%10lu ms] BOOT %u: %s\n", millis(), step, message.c_str());
}

bool isConfiguredValue(const char *value, bool allowEmpty = false) {
  if (value == nullptr) {
    return false;
  }

  if (strstr(value, "REPLACE_ME") != nullptr) {
    return false;
  }

  if (!allowEmpty && strlen(value) == 0) {
    return false;
  }

  return true;
}

bool isWiFiConfigReady() {
  return isConfiguredValue(WIFI_SSID) && isConfiguredValue(WIFI_PASSWORD, true);
}

bool isFirebaseConfigReady() {
  return isConfiguredValue(API_KEY) && isConfiguredValue(USER_EMAIL) && isConfiguredValue(USER_PASSWORD) && isConfiguredValue(DATABASE_URL);
}

void maybeLogConfigurationWarnings() {
  const unsigned long now = millis();

  if (lastConfigWarningMillis != 0 && now - lastConfigWarningMillis < CONFIG_WARNING_INTERVAL_MS) {
    return;
  }

  lastConfigWarningMillis = now;

  if (!isConfiguredValue(WIFI_SSID)) {
    logWarn("CONFIG", "WIFI_SSID vacío o en REPLACE_ME");
  }

  if (!isConfiguredValue(WIFI_PASSWORD, true)) {
    logWarn("CONFIG", "WIFI_PASSWORD en REPLACE_ME");
  }

  if (!isConfiguredValue(API_KEY)) {
    logWarn("CONFIG", "API_KEY vacío o en REPLACE_ME");
  }

  if (!isConfiguredValue(USER_EMAIL)) {
    logWarn("CONFIG", "USER_EMAIL vacío o en REPLACE_ME");
  }

  if (!isConfiguredValue(USER_PASSWORD)) {
    logWarn("CONFIG", "USER_PASSWORD vacío o en REPLACE_ME");
  }

  if (!isConfiguredValue(DATABASE_URL)) {
    logWarn("CONFIG", "DATABASE_URL vacío o en REPLACE_ME");
  }
}

void logConfigurationStatus() {
  if (configurationStatusLogged) {
    return;
  }

  configurationStatusLogged = true;

  if (isWiFiConfigReady() && isFirebaseConfigReady()) {
    logInfo("CONFIG", "Placeholders inline reemplazados; WiFi/Firebase listos para iniciar.");
    return;
  }

  logWarn("CONFIG", "Se detectaron placeholders o campos vacíos. El sketch seguirá vivo y lo avisará por Serial.");
  maybeLogConfigurationWarnings();
}

void logAsyncResult(AsyncResult &aResult) {
  if (!aResult.isResult()) {
    return;
  }

  if (aResult.isEvent()) {
    Serial.printf("[%10lu ms] FIREBASE   event [%s] -> %s (%d)\n",
                  millis(),
                  aResult.uid().c_str(),
                  aResult.eventLog().message().c_str(),
                  aResult.eventLog().code());
  }

  if (aResult.isDebug()) {
    Serial.printf("[%10lu ms] FIREBASE   debug [%s] -> %s\n",
                  millis(),
                  aResult.uid().c_str(),
                  aResult.debug().c_str());
  }

  if (aResult.isError()) {
    Serial.printf("[%10lu ms] FIREBASE   error [%s] -> %s (%d)\n",
                  millis(),
                  aResult.uid().c_str(),
                  aResult.error().message().c_str(),
                  aResult.error().code());
  }

  if (aResult.available()) {
    Serial.printf("[%10lu ms] FIREBASE   payload [%s] -> %s\n",
                  millis(),
                  aResult.uid().c_str(),
                  aResult.c_str());
  }
}

void authHandler(AsyncResult &aResult) {
  logAsyncResult(aResult);
}

void printLastFirebaseError(const String &action) {
  if (!firebaseInitStarted) {
    return;
  }

  AsyncClient &asyncClient = getAsyncClient();
  const int errorCode = asyncClient.lastError().code();

  if (errorCode == 0) {
    return;
  }

  logError("FIREBASE", action + " falló (" + String(errorCode) + "): " + asyncClient.lastError().message());
}

void initDatabasePaths() {
  databasePath = "/UsersData/" + uid;
  tempPath = databasePath + "/temperature";
  humPath = databasePath + "/humidity";
  distPath = databasePath + "/distance";
  coPath = databasePath + "/co";
  alcoholPath = databasePath + "/alcohol";
  co2Path = databasePath + "/co2";
  toggleStatusPath = databasePath + "/toggleStatus/status";

  logInfo("RTDB", String("Base path activa: ") + databasePath);
}

bool captureUid() {
  const String currentUid = getFirebaseApp().getUid();

  if (currentUid.length() == 0) {
    return false;
  }

  if (uid == currentUid && databasePath.length() > 0) {
    return true;
  }

  uid = currentUid;
  initDatabasePaths();
  logInfo("AUTH", String("User UID: ") + uid);
  return true;
}

bool ensureWiFiConnected() {
  if (!isWiFiConfigReady()) {
    maybeLogConfigurationWarnings();
    return false;
  }

  if (WiFi.status() == WL_CONNECTED) {
    return true;
  }

  const unsigned long now = millis();

  if (lastWiFiAttemptMillis != 0 && now - lastWiFiAttemptMillis < WIFI_RETRY_INTERVAL_MS) {
    return false;
  }

  lastWiFiAttemptMillis = now;

  logInfo("WIFI", String("Iniciando conexión con timeout de ") + String(WIFI_CONNECT_TIMEOUT_MS) + " ms");
  WiFi.mode(WIFI_STA);
  WiFi.setSleep(false);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);

  unsigned long start = millis();
  unsigned long lastProgressMillis = start - 1000UL;

  while (WiFi.status() != WL_CONNECTED && millis() - start < WIFI_CONNECT_TIMEOUT_MS) {
    if (millis() - lastProgressMillis >= 1000UL) {
      Serial.printf("[%10lu ms] WIFI       esperando... status=%d elapsed=%lu ms\n",
                    millis(),
                    WiFi.status(),
                    millis() - start);
      lastProgressMillis = millis();
    }

    delay(100);
  }

  if (WiFi.status() == WL_CONNECTED) {
    logInfo("WIFI", "Conectado. IP local: " + WiFi.localIP().toString());
    return true;
  }

  logError("WIFI", "Timeout de conexión. El sketch NO se detiene; reintentará.");
  WiFi.disconnect();
  return false;
}

void startFirebaseIfNeeded() {
  if (firebaseInitStarted) {
    return;
  }

  if (!isFirebaseConfigReady()) {
    maybeLogConfigurationWarnings();
    return;
  }

  if (WiFi.status() != WL_CONNECTED) {
    return;
  }

  logInfo("FIREBASE", "Inicializando FirebaseClient en forma diferida...");

  WiFiClientSecure &sslClient = getSslClient();
  FirebaseApp &firebaseApp = getFirebaseApp();
  RealtimeDatabase &database = getDatabase();
  UserAuth &userAuth = getUserAuth();

  sslClient.setInsecure();
  initializeApp(getAsyncClient(), firebaseApp, getAuth(userAuth), authHandler);
  firebaseApp.getApp<RealtimeDatabase>(database);
  database.url(DATABASE_URL);

  firebaseInitStarted = true;
  waitingForFirebaseLogged = false;
  logInfo("FIREBASE", "initializeApp disparado en modo async; esperando app.ready() y UID.");
}

bool ensureFirebaseReady() {
  if (!firebaseInitStarted) {
    startFirebaseIfNeeded();
    return false;
  }

  FirebaseApp &firebaseApp = getFirebaseApp();
  firebaseApp.loop();

  if (!firebaseApp.ready()) {
    const unsigned long now = millis();

    if (!waitingForFirebaseLogged || now - lastFirebaseWaitLogMillis >= FIREBASE_WAIT_LOG_INTERVAL_MS) {
      logWarn("FIREBASE", "App no está ready todavía; sigo esperando autenticación.");
      printLastFirebaseError("Estado Firebase");
      waitingForFirebaseLogged = true;
      lastFirebaseWaitLogMillis = now;
    }

    return false;
  }

  waitingForFirebaseLogged = false;

  if (!captureUid()) {
    const unsigned long now = millis();

    if (lastUidWarningMillis == 0 || now - lastUidWarningMillis >= FIREBASE_WAIT_LOG_INTERVAL_MS) {
      logWarn("FIREBASE", "App ready, pero UID todavía vacío.");
      lastUidWarningMillis = now;
    }

    return false;
  }

  return true;
}

bool sendFloat(const String &path, float value, int decimals = FIREBASE_FLOAT_DECIMALS) {
  if (path.length() == 0) {
    logError("RTDB", "Path vacío; UID todavía no disponible.");
    return false;
  }

  if (isnan(value)) {
    logWarn("RTDB", String("Lectura inválida; no se envía a ") + path);
    return false;
  }

  const bool ok = getDatabase().set<number_t>(getAsyncClient(), path, number_t(value, decimals));

  if (!ok) {
    printLastFirebaseError("Escritura en " + path);
    return false;
  }

  logInfo("RTDB", String("Write ok ") + path + " = " + String(value, decimals));
  return true;
}

String normalizeToggleStatus(String status) {
  status.replace("\"", "");
  status.trim();
  status.toUpperCase();
  return status;
}

void applyPowerStatus(const String &status) {
  digitalWrite(POWER_STAGE_PIN, status == "ON" ? HIGH : LOW);
}

void syncPowerStage() {
  if (toggleStatusPath.length() == 0) {
    logWarn("POWER", "toggleStatusPath vacío; se omite la lectura del relay.");
    return;
  }

  const String rawStatus = getDatabase().get<String>(getAsyncClient(), toggleStatusPath);
  const int errorCode = getAsyncClient().lastError().code();

  if (errorCode != 0) {
    printLastFirebaseError("Lectura de toggleStatus");

    if (rawStatus.length() == 0) {
      return;
    }
  }

  const String status = normalizeToggleStatus(rawStatus);

  if (status == "ON" || status == "OFF") {
    applyPowerStatus(status);
    logInfo("POWER", String("toggleStatus actualizado a: ") + status);
    return;
  }

  logWarn("POWER", String("toggleStatus vacío o inválido: ") + rawStatus);
}

bool initMq135() {
  logBoot(4, "Calibrando MQ135 (10 muestras)...");

  MQUnifiedsensor &mq135 = getMq135();
  mq135.setRegressionMethod(1);
  mq135.init();

  float calcR0 = 0.0f;

  for (int i = 1; i <= 10; i++) {
    mq135.update();
    const float sample = mq135.calibrate(RatioMQ135CleanAir);
    calcR0 += sample;
    Serial.printf("[%10lu ms] MQ135      calibración %d/10 sample=%.4f\n", millis(), i, sample);
  }

  const float r0 = calcR0 / 10.0f;
  mq135.setR0(r0);

  if (isinf(calcR0) || isinf(r0) || isnan(r0)) {
    mq135Available = false;
    logWarn("MQ135", "R0 inválido/infinito. Continúo sin bloquear el sketch.");
    return false;
  }

  if (r0 <= 0.0f) {
    mq135Available = false;
    logWarn("MQ135", "R0 cero o negativo. Continúo sin bloquear el sketch.");
    return false;
  }

  mq135Available = true;
  logInfo("MQ135", String("Calibración lista. R0=") + String(r0, 4));
  return true;
}

void readDhtValues(float &temperature, float &humidity) {
  temperature = getDht().readTemperature();
  humidity = getDht().readHumidity();

  if (isnan(temperature) || isnan(humidity)) {
    logWarn("DHT22", "Lectura NaN; revisá warm-up o el sensor en Wokwi.");
    return;
  }

  logInfo("DHT22", String("Temp=") + String(temperature, 2) + "C Hum=" + String(humidity, 2) + "%");
}

void readMq135Values(float &co, float &alcohol, float &co2) {
  if (!mq135Available) {
    const unsigned long now = millis();

    if (lastMq135WarningMillis == 0 || now - lastMq135WarningMillis >= DIAGNOSTIC_HEARTBEAT_INTERVAL_MS) {
      logWarn("MQ135", "Sensor degradado; CO/Alcohol/CO2 se omiten.");
      lastMq135WarningMillis = now;
    }

    co = NAN;
    alcohol = NAN;
    co2 = NAN;
    return;
  }

  MQUnifiedsensor &mq135 = getMq135();
  mq135.update();

  mq135.setA(605.18);
  mq135.setB(-3.937);
  co = mq135.readSensor();

  mq135.setA(77.255);
  mq135.setB(-3.18);
  alcohol = mq135.readSensor();

  mq135.setA(110.47);
  mq135.setB(-2.862);
  co2 = mq135.readSensor() + CO2_BASELINE_PPM;

  if (isnan(co) || isnan(alcohol) || isnan(co2)) {
    logWarn("MQ135", "Lectura inválida detectada en CO/Alcohol/CO2.");
    return;
  }

  logInfo("MQ135", String("CO=") + String(co, 2) + " Alcohol=" + String(alcohol, 2) + " CO2=" + String(co2, 2));
}

float readDistanceCm() {
  digitalWrite(trig, LOW);
  delayMicroseconds(4);
  digitalWrite(trig, HIGH);
  delayMicroseconds(10);
  digitalWrite(trig, LOW);

  const unsigned long duration = pulseIn(eco, HIGH, ULTRASONIC_TIMEOUT_US);

  if (duration == 0) {
    logWarn("HCSR04", "pulseIn timeout; distancia no disponible.");
    return NAN;
  }

  const float distance = duration / 58.2f;
  logInfo("HCSR04", String("Distancia=") + String(distance, 2) + " cm");
  return distance;
}

void printHeartbeat() {
  if (millis() - lastHeartbeatMillis < DIAGNOSTIC_HEARTBEAT_INTERVAL_MS) {
    return;
  }

  lastHeartbeatMillis = millis();
  const char *wifiState = WiFi.status() == WL_CONNECTED ? "UP" : "DOWN";
  const char *firebaseState = "OFF";

  if (firebaseInitStarted) {
    firebaseState = getFirebaseApp().ready() ? "READY" : "WAIT";
  }

  Serial.printf("[%10lu ms] HEARTBEAT  wifi=%s firebase=%s uid=%s mq135=%s\n",
                millis(),
                wifiState,
                firebaseState,
                uid.length() > 0 ? uid.c_str() : "<sin_uid>",
                mq135Available ? "OK" : "DEGRADED");
}

void setup() {
  Serial.begin(115200);
  delay(SERIAL_BOOT_DELAY_MS);
  Serial.println();

  logBoot(1, "setup() arrancó; diagnóstico robusto habilitado.");

  pinMode(trig, OUTPUT);
  pinMode(eco, INPUT);
  pinMode(POWER_STAGE_PIN, OUTPUT);
  applyPowerStatus("OFF");
  logBoot(2, "Pines configurados; etapa de potencia en OFF.");

  getDht().begin();
  logBoot(3, "DHT22 inicializado.");

  initMq135();
  logBoot(5, mq135Available ? "MQ135 listo." : "MQ135 degradado; el loop seguirá con warnings.");

  logConfigurationStatus();
  logBoot(6, "Configuración revisada; preparo WiFi/Firebase.");

  WiFi.persistent(false);
  WiFi.setAutoReconnect(true);

  logBoot(7, "Intentando conexión WiFi con timeout.");
  const bool wifiReady = ensureWiFiConnected();

  if (wifiReady) {
    logBoot(8, "WiFi OK; FirebaseClient se inicializará en el loop.");
  } else {
    logBoot(8, "WiFi no disponible todavía; Firebase queda diferido al loop.");
  }

  logBoot(9, "setup() finalizado; entrando al loop.");
}

void loop() {
  printHeartbeat();

  if (!ensureWiFiConnected()) {
    delay(50);
    return;
  }

  startFirebaseIfNeeded();

  if (!ensureFirebaseReady()) {
    delay(50);
    return;
  }

  if (sendDataPrevMillis != 0 && millis() - sendDataPrevMillis <= FIREBASE_WRITE_INTERVAL_MS) {
    delay(10);
    return;
  }

  sendDataPrevMillis = millis();
  acquisitionCycle++;

  Serial.printf("[%10lu ms] LOOP %lu: inicio de ciclo de adquisición.\n", millis(), acquisitionCycle);

  float temperature = NAN;
  float humidity = NAN;
  float distance = NAN;
  float co = NAN;
  float alcohol = NAN;
  float co2 = NAN;

  Serial.printf("[%10lu ms] LOOP %lu: leyendo DHT22...\n", millis(), acquisitionCycle);
  readDhtValues(temperature, humidity);

  Serial.printf("[%10lu ms] LOOP %lu: leyendo MQ135...\n", millis(), acquisitionCycle);
  readMq135Values(co, alcohol, co2);

  Serial.printf("[%10lu ms] LOOP %lu: leyendo HC-SR04...\n", millis(), acquisitionCycle);
  distance = readDistanceCm();

  Serial.printf("[%10lu ms] LOOP %lu: sincronizando toggleStatus...\n", millis(), acquisitionCycle);
  syncPowerStage();

  Serial.printf("[%10lu ms] LOOP %lu: enviando datos a RTDB...\n", millis(), acquisitionCycle);
  sendFloat(tempPath, temperature);
  sendFloat(humPath, humidity);
  sendFloat(distPath, distance);
  sendFloat(coPath, co);
  sendFloat(alcoholPath, alcohol);
  sendFloat(co2Path, co2);

  Serial.printf("[%10lu ms] LOOP %lu: ciclo finalizado.\n", millis(), acquisitionCycle);
}
