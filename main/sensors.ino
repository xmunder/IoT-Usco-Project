//Librerias
#include <WiFi.h> //Libreria WiFi
#include <Firebase_ESP_Client.h> //Libreria ESP32
#include "DHT.h" //Libreria DHT11
//#define DHTPIN 13 //Defino pin de lectura del sensor DHT11 
//#define DHTTYPE DHT11 //Defino el tipo de sensor
DHT dht(13,DHT11); 

//HC-SR04
#define trig 32
#define eco 33
float duracion;
float distancia;

#include <MQUnifiedsensor.h>
/************************Hardware Related Macros************************************/
#define         Board                   ("ESP-32") // Wemos ESP-32 or other board, whatever have ESP32 core.
#define         Pin                     (34)  //IO25 for your ESP32 WeMos Board, pinout here: https://i.pinimg.com/originals/66/9a/61/669a618d9435c702f4b67e12c40a11b8.jpg
/***********************Software Related Macros************************************/
#define         Type                    ("MQ-135") //MQ3 or other MQ Sensor, if change this verify your a and b values.
#define         Voltage_Resolution      (3.3) // 3V3 <- IMPORTANT. Source: https://randomnerdtutorials.com/esp32-adc-analog-read-arduino-ide/
#define         ADC_Bit_Resolution      (12) // ESP-32 bit resolution. Source: https://randomnerdtutorials.com/esp32-adc-analog-read-arduino-ide/
#define         RatioMQ135CleanAir        (3.6) // Ratio of your sensor, for this example an MQ-3
/*****************************Globals***********************************************/
MQUnifiedsensor MQ135(Board, Voltage_Resolution, ADC_Bit_Resolution, Pin, Type);
/*****************************Globals***********************************************/

//Defino las credenciales de la RED WiFI
#define WIFI_SSID "ANGELICA69"
#define WIFI_PASSWORD "saloaang69"

//Defino la API Key generada por FIREBASE
#define API_KEY "AIzaSyCUc80qnnpCK_McrFzRf5qABGWqDilYwfk"

//Defino las credenciales para el acceso a la Real Time Database
#define USER_EMAIL "u20201185364@usco.edu.co"
#define USER_PASSWORD "66850922a"

//Defino el URL de la Real Time Database
#define DATABASE_URL "https://iot-usco-project-default-rtdb.firebaseio.com/"

// Provide the token generation process info.
#include "addons/TokenHelper.h"
// Provide the RTDB payload printing info and other helper functions.
#include "addons/RTDBHelper.h"

//Defino los objectios de Firebase
FirebaseData fbdo;
FirebaseAuth auth;
FirebaseConfig config;

//Creo variable para guardar USER UID
String uid;

//Creo variables para guardar los PATHS de la Database
String databasePath;
String tempPath;
String humPath;
String distPath;
String coPath;
String alcoholPath;
String co2Path;

//Creo variables para almacenar los datos de los sensores
float temperature;
float humidity;

//Variables temporizadoras para enviar lecturas a Firebase
unsigned long sendDataPrevMillis = 0;
unsigned long timerDelay = 5000;

//Funcion para comprobar la conexion WiFI
void initWiFi() {
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  Serial.print("Conectando a la red WiFi...");
  while (WiFi.status() != WL_CONNECTED) {
    Serial.print('.');
    delay(1000);
  }
  Serial.println(WiFi.localIP());
  Serial.println();
}

//Escritura de los valores enviados a Firebase estableciendo el typo de dato y el PATH
void sendFloat(String path, float value){
  if (Firebase.RTDB.setFloat(&fbdo, path.c_str(), value)){
    Serial.print("Writing value: ");
    Serial.print (value);
    Serial.print(" on the following path: ");
    Serial.println(path);
    Serial.println("PASSED");
    Serial.println("PATH: " + fbdo.dataPath());
    Serial.println("TYPE: " + fbdo.dataType());
  }
  else {
    Serial.println("FAILED");
    Serial.println("REASON: " + fbdo.errorReason());
  }
}

void setup() {
  Serial.begin(115200);
  pinMode(trig,OUTPUT);
  pinMode(eco,INPUT);
  
  //Calibracion MQ135
  MQ135.setRegressionMethod(1);
  MQ135.init();
  Serial.print("Calibrating please wait.");
  float calcR0 = 0;
  for(int i = 1; i<=10; i ++)
  {
    MQ135.update(); // Update data, the arduino will read the voltage from the analog pin
    calcR0 += MQ135.calibrate(RatioMQ135CleanAir);
    Serial.print(".");
  }
  MQ135.setR0(calcR0/10);
  Serial.println("  done!.");
  
  if(isinf(calcR0)) {Serial.println("Warning: Conection issue, R0 is infinite (Open circuit detected) please check your wiring and supply"); while(1);}
  if(calcR0 == 0){Serial.println("Warning: Conection issue found, R0 is zero (Analog pin shorts to ground) please check your wiring and supply"); while(1);}
  /*****************************  MQ CAlibration ********************************************/ 
  //Serial.println("** Values from MQ-135 ****");
  //Serial.println("|    CO   |  Alcohol |   CO2  |  Toluen  |  NH4  |  Aceton  |");  
  
  dht.begin();
  //Inicializo la conexion Wi-Fi a la ESP32
  initWiFi();

  //Asigno la API Key para la conexion a Firebase
  config.api_key = API_KEY;

  //Assigno la credenciales para el acceso a la Real Time Database
  auth.user.email = USER_EMAIL;
  auth.user.password = USER_PASSWORD;

  //Asigno el URL para la conexion a la Real Time Database
  config.database_url = DATABASE_URL;
  Firebase.reconnectWiFi(true);
  fbdo.setResponseSize(4096);
  
  // Assign the callback function for the long running token generation task */
  config.token_status_callback = tokenStatusCallback; //see addons/TokenHelper.h

  // Assign the maximum retry of token generation
  config.max_token_generation_retry = 5;

  //Inicializo la libreria Firebase dandole las credenciales y configuración
  Firebase.begin(&config, &auth);

  //Obtengo el USER ID creado desde Firebase Getting the user UID might take a few seconds
  Serial.println("Obteniendo User UID");
  while ((auth.token.uid) == "") {
    Serial.print('.');
    delay(1000);
  }
  // Imprimo user UID
  uid = auth.token.uid.c_str();
  Serial.print("User UID: ");
  Serial.println(uid);

  //Creo los database path
  databasePath = "/UsersData/" + uid;

  //Creo los database path para la lectura de los sensores
  tempPath = databasePath + "/temperature"; // --> UsersData/<user_uid>/temperature
  humPath = databasePath + "/humidity"; // --> UsersData/<user_uid>/humidity
  distPath = databasePath + "/distance"; //// --> UsersData/<user_uid>/dis
  coPath = databasePath + "/co"; // --> UsersData/<user_uid>/co
  alcoholPath = databasePath + "/alcohol"; // --> UsersData/<user_uid>/alcohol
  co2Path = databasePath + "/co2"; // --> UsersData/<user_uid>/co2
}

void loop() {
  //Funcion para enviar las lecturas de las sensores a Firebase
  if (Firebase.ready() && (millis() - sendDataPrevMillis > timerDelay || sendDataPrevMillis == 0)){
    sendDataPrevMillis = millis();

    //Lectura de Temperatura y humedad 
    temperature = dht.readTemperature();
    delay(1000);
    humidity = dht.readHumidity();
    delay(1000);

    //Lectura de Calidad del aire
    MQ135.update(); // Update data, the arduino will read the voltage from the analog pin
  
    MQ135.setA(605.18); MQ135.setB(-3.937); // Configure the equation to calculate CO concentration value
    float CO = MQ135.readSensor(); // Sensor will read PPM concentration using the model, a and b values set previously or from the setup
  
    MQ135.setA(77.255); MQ135.setB(-3.18); //Configure the equation to calculate Alcohol concentration value
    float Alcohol = MQ135.readSensor(); // Sensor will read PPM concentration using the model, a and b values set previously or from the setup
  
    MQ135.setA(110.47); MQ135.setB(-2.862); // Configure the equation to calculate CO2 concentration value
    float CO2 = MQ135.readSensor(); // Sensor will read PPM concentration using the model, a and b values set previously or from the setup
  
    //MQ135.setA(44.947); MQ135.setB(-3.445); // Configure the equation to calculate Toluen concentration value
    //float Toluen = MQ135.readSensor(); // Sensor will read PPM concentration using the model, a and b values set previously or from the setup
    
    //MQ135.setA(102.2 ); MQ135.setB(-2.473); // Configure the equation to calculate NH4 concentration value
    //float NH4 = MQ135.readSensor(); // Sensor will read PPM concentration using the model, a and b values set previously or from the setup
  
    //MQ135.setA(34.668); MQ135.setB(-3.369); // Configure the equation to calculate Aceton concentration value
    //float Aceton = MQ135.readSensor(); // Sensor will read PPM concentration using the model, a and b values set previously or from the setup
    
    //Serial.print("|   "); Serial.print(CO); 
    //Serial.print("   |   "); Serial.print(Alcohol);
    //Serial.print("   |   "); Serial.print(CO2 + 400); 
    //Serial.print("   |   "); Serial.print(Toluen); 
    //Serial.print("   |   "); Serial.print(NH4); 
    //Serial.print("   |   "); Serial.print(Aceton);
    //Serial.println("   |");
    delay(1000);

    //Lectura Distancia
    digitalWrite(trig,LOW);
    delayMicroseconds(4);
    digitalWrite(trig,HIGH);
    delayMicroseconds(4);
    digitalWrite(trig,LOW);
    
    duracion = pulseIn(eco,HIGH); //Recibe el pulso
    distancia = duracion / 58.2;

    //Activacion de etapa de potencia
    if (Firebase.RTDB.getString(&fbdo,"/UsersData/6CYXcRaq2QVuOc3B0PPUw9BgHsz1/toggleStatus/status")){
      if(fbdo.dataTypeEnum() == fb_esp_rtdb_data_type_string){
        if (fbdo.to<String>()== "ON"){
          pinMode(4,OUTPUT);
          digitalWrite(4,HIGH);
        }else{
          pinMode(4,OUTPUT);
          digitalWrite(4,LOW);
        }
      }
    }else{
      Serial.println(fbdo.errorReason());
    }
    
    //Envio de datos 
    sendFloat(tempPath, temperature); 
    sendFloat(humPath, humidity);
    sendFloat(distPath,distancia);
    sendFloat(coPath, CO);
    sendFloat(alcoholPath, Alcohol);
    sendFloat(co2Path, CO2 + 400);
  }
}
