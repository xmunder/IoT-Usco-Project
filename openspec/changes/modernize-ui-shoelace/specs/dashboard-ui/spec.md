# dashboard-ui Specification

## Purpose
Managing the UI layout, presentation components, and user interactions of the IoT Dashboard using Shoelace Web Components.

## Requirements

### Requirement: Modernized Layout Shell
The system MUST provide a responsive dashboard layout utilizing native CSS Flexbox and Grid, avoiding heavy CSS framework container classes.

#### Scenario: Displaying the dashboard on desktop
- GIVEN a user accesses the dashboard on a large screen
- WHEN the page loads
- THEN the layout is organized into a responsive CSS Grid for sensor cards
- AND the navigation uses standard Flexbox formatting

### Requirement: Web Component Based Navigation
The system MUST render the navigation bar and interactive elements using Shoelace components (`sl-button`, `sl-icon`).

#### Scenario: Navigation interactions
- GIVEN the dashboard header is visible
- WHEN the user clicks a navigation `sl-button`
- THEN the appropriate action is triggered with native visual feedback (ripple/focus)

### Requirement: Modern Authentication Dialog
The system MUST handle login interactions through a native Shoelace dialog (`sl-dialog`) rather than a legacy framework modal.

#### Scenario: User initiates login
- GIVEN the user is unauthenticated
- WHEN they click the "Login" button
- THEN an `sl-dialog` opens containing `sl-input` fields for email and password
- AND legacy bootstrap modal logic is not triggered

### Requirement: Sensor Visualizations Wrapper
The system MUST present sensor data tools (e.g. JustGage) inside isolated Shoelace cards (`sl-card`).

#### Scenario: Displaying a sensor reading
- GIVEN live sensor data is streaming
- WHEN the dashboard updates
- THEN the JustGage SVG renders seamlessly within the light DOM of an `sl-card` component
