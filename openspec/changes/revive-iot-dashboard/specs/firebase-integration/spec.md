# firebase-integration Specification

## Purpose
Secure connection, data access, listener cleanup, and secret management for the dashboard and firmware.

## Requirements

### Requirement: Firebase Database Security
The system MUST enforce strict Firebase security rules (`database.rules.json`) that restrict data access to authenticated users based on their UID.

#### Scenario: Unauthorized access attempt
- GIVEN a user is not authenticated or uses an invalid UID
- WHEN they attempt to read or write to the database
- THEN the access is denied by Firebase rules.

### Requirement: Runtime Configuration in Firmware and Frontend
The system MUST obtain Firebase runtime configuration from environment-specific sources, using ignored frontend config files and Wokwi-compatible inline placeholders in firmware.

#### Scenario: Building the firmware
- GIVEN the firmware source code
- WHEN running the `.ino` file in Wokwi or compiling it for ESP32
- THEN it reads WiFi and Firebase credentials from the inline placeholder section at the top of `main/sensors.ino`
- AND it derives database paths from the authenticated UID.

#### Scenario: Loading the frontend
- GIVEN the web dashboard is served
- WHEN the Firebase SDK initializes
- THEN it reads configuration from an ignored `config.js` file.

### Requirement: Listener Cleanup
The system MUST keep track of active Firebase `onValue` listeners and clean them up properly on teardown or disconnection.

#### Scenario: Disconnecting listeners
- GIVEN active Firebase listeners are registered in an array
- WHEN the dashboard is reinitialized or disconnected
- THEN all stored unsubscribe functions are called to prevent memory leaks and zombie listeners.
