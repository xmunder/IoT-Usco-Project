# dashboard-ui Specification

## Purpose
Managing the UI logic, gauges, and robust handling of sensor data for the IoT Dashboard.

## Requirements

### Requirement: Modular Dashboard Components
The system MUST separate UI logic into modular components such as `GaugeManager` and `SensorService`.

#### Scenario: Instantiating components
- GIVEN the dashboard is loading
- WHEN the initialization sequence starts
- THEN it instantiates `SensorService` to manage data and `GaugeManager` to handle UI elements independently.

### Requirement: Robust Null Handling
The system MUST handle null or undefined sensor readings gracefully without crashing.

#### Scenario: Null reading received
- GIVEN the dashboard is running
- WHEN a null or missing value is received from the sensor data
- THEN the dashboard displays a fallback indicator (e.g., "--" or 0)
- AND no JavaScript errors are thrown.

### Requirement: Testable UI Logic
The system MUST have testable UI modules using Jest and jsdom.

#### Scenario: Running UI unit tests
- GIVEN the test environment is configured
- WHEN `npm test` is executed
- THEN all tests for `GaugeManager` and `SensorService` pass without requiring a real DOM or Firebase connection.