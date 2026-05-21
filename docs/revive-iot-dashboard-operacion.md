# Operación mínima — Revive IoT Dashboard

## 1. Configuración local obligatoria

1. Copiá `main/public/config.example.js` a `main/public/config.js`.
2. Completá `window.FIREBASE_CONFIG` con los valores reales del proyecto Firebase.
3. Completá en `main/sensors.ino` los placeholders inline: `WIFI_SSID`, `WIFI_PASSWORD`, `API_KEY`, `USER_EMAIL`, `USER_PASSWORD` y `DATABASE_URL`.

> En la variante para Wokwi el firmware queda en un solo `.ino`, así que no uses `credentials.h`.
> `main/public/config.js` sigue ignorado por git a propósito.

## 2. Tests del dashboard

Desde la raíz del repo:

```bash
npm install
npm test
```

## 3. Deploy de reglas Firebase

Desde `main/`:

```bash
firebase deploy --only database
```

## 4. Smoke checklist manual

- Login exitoso desde `main/public/index.html` con usuario Firebase válido.
- La descripción pública desaparece cuando el usuario inicia sesión.
- Los valores nulos muestran `--` sin romper gauges ni consola.
- Los botones `ON` / `OFF` escriben `UsersData/{uid}/toggleStatus/status`.
- El firmware obtiene el `uid` autenticado con `FirebaseClient`, escribe en `UsersData/{uid}` y responde al cambio de toggle.
- Un usuario autenticado NO puede leer/escribir `UsersData/{otroUid}`.
