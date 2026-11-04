# CarData for BMW & MINI

A Homey Pro app for following your BMW or MINI's battery, charging, location, doors and windows, using BMW's official CarData service.

This app is based on [BMW / Mini Connected](https://github.com/lsiddiquee/com.rexwel.bmwconnected) by Likhan Siddiquee and its contributors, and is released under the same GPL-3.0 licence. It runs as a separate app with its own app ID (`com.seyedjafari.bmwconnected`), so it can be installed alongside the original. Don't stream with both at once: BMW allows one CarData streaming connection per account.

Monitor your BMW or Mini vehicle data in Homey using the official BMW CarData API.

This app provides **read-only** access to vehicle telematics data including location, battery/fuel levels, door/window status, charging information, and more. Real-time updates are delivered via MQTT streaming, with fallback to REST API polling when needed.

## Prerequisites

### 1. BMW CarData API Access

You must register for the BMW CarData API before pairing your vehicle:

1. Visit the [BMW ConnectedDrive Customer Portal](https://www.bmw.co.uk/en-gb/mybmw/vehicle-overview)
2. Log in with your BMW/Mini ConnectedDrive account
3. Navigate to **CarData** section
4. **Subscribe** to the **CarData API** service (free)
5. **Subscribe** to the **CarData Streaming** service (free, optional but recommended)
6. **Generate a Client ID** (save this for pairing)
7. Ensure your vehicle is mapped to your account as **PRIMARY** user

**Important**: Complete steps 1-6 **before** adding your vehicle in Homey.

### 2. Vehicle Requirements

- Vehicle must support BMW ConnectedDrive
- Active ConnectedDrive contract
- Active SIM card in vehicle
- Vehicle location: EU (currently supported region)
- User mapping: PRIMARY (not SECONDARY/co-user)

## Pairing Your Vehicle

1. Open the Homey app and go to **Devices** → **Add Device**
2. Select **BMW Connected** app
3. Choose your brand (BMW or Mini)
4. Follow the **OAuth Device Code Flow** pairing process:
   - Enter your **Client ID** from the BMW portal
   - A **user code** and **verification URL** will be displayed
   - If you cannot click the link, you can use another device to open the [link url here](https://customer.bmwgroup.com/oneid/#/link).
   - Visit the URL in a browser and enter the code
   - Authorize the app in the BMW portal
   - Return to Homey - pairing will complete automatically
5. **Container Selection** (optional):
   - A **container** is a BMW CarData API data structure that defines which telematic data keys (e.g., battery level, location, door status) the app can retrieve
   - If you have an existing container ID from the BMW portal, enter it here
   - If left empty, the app will **automatically create a new container** with the 46 essential telematic keys needed for Homey monitoring
   - The container will be named "Homey BMW Integration" with purpose "Vehicle telemetry for Homey smart home"
6. Select your vehicle from the list
7. Device will be created with real-time monitoring

## Features

### Homey Capabilities

This app displays the following data in Homey:

**All Vehicles:**

- Mileage (km/miles)
- Range (total remaining range)
- Location (GPS map view)
- Alarm (generic alarm status) (Door lock and/ir secured)

**Electric Vehicles (BEV/PHEV):**

- Battery level (%)
- Charging status (charging/not charging/complete)

**Plugin Hybrid Vehicles (PHEV):**

- Electric only range (km/miles)

**Combustion/Hybrid Vehicles:**

- Remaining fuel (liters/gallons)

**Note**: While the app collects additional vehicle data (door status, window status, lock status, tire pressures, etc.) via the BMW CarData API, these are not currently exposed as individual Homey capabilities. They are available internally for future enhancements.

### Flow Cards

**Triggers:**

- Location changed
- Battery level changed
- Fuel level changed (combustion/hybrid)
- Charging status changed (electric/hybrid)
- Refueling detected (combustion/hybrid)
- Trip completed (vehicle stopped after movement)

**Conditions:**

- Battery level is above/below X%
- Fuel level is above/below X%
- Vehicle is charging (yes/no)
- Vehicle is inside geofence (specific location)

**Actions:**

- None (read-only API)

## Data Delivery: MQTT Streaming vs API Polling

The BMW CarData API provides two methods for retrieving vehicle data:

### MQTT Streaming (Recommended)

**How it works:**

- Real-time push notifications via MQTT protocol
- Updates delivered within seconds when vehicle data changes
- **No impact on API quota** (unlimited)
- Battery-efficient for Homey

**Requirements:**

- CarData Streaming subscription (free, enabled in BMW portal)
- Configure which telematic data keys to receive in the portal

**Telematic Keys Used by Homey:**

This app subscribes to **46 essential telematic keys** out of 244 available keys for comprehensive vehicle monitoring. The keys are organized by category:

**Core Vehicle Data (46 keys total):**

- **Electric Battery & Charging** (10 keys): `vehicle.electricalSystem.battery.stateOfCharge`, `vehicle.body.chargingPort.status`, `vehicle.body.chargingPort.dcStatus`, `vehicle.drivetrain.electricEngine.remainingElectricRange`, `vehicle.drivetrain.batteryManagement.header`, `vehicle.drivetrain.electricEngine.kombiRemainingElectricRange`, `vehicle.drivetrain.electricEngine.charging.status`, `vehicle.drivetrain.electricEngine.charging.timeToFullyCharged`, `vehicle.powertrain.electric.battery.stateOfCharge.target`, plus trip segment HV SOC
- **Combustion Fuel** (3 keys): `vehicle.drivetrain.fuelSystem.level`, `vehicle.drivetrain.fuelSystem.remainingFuel`, `vehicle.drivetrain.totalRemainingRange`, `vehicle.drivetrain.lastRemainingRange`
- **Location** (4 keys): `vehicle.cabin.infotainment.navigation.currentLocation.latitude`, `vehicle.cabin.infotainment.navigation.currentLocation.longitude`, `vehicle.cabin.infotainment.navigation.currentLocation.heading`, `vehicle.cabin.infotainment.navigation.currentLocation.altitude`
- **Doors** (4 keys): `vehicle.cabin.door.row1.driver.isOpen`, `vehicle.cabin.door.row1.passenger.isOpen`, `vehicle.cabin.door.row2.driver.isOpen`, `vehicle.cabin.door.row2.passenger.isOpen`
- **Windows** (4 keys): `vehicle.cabin.window.row1.driver.status`, `vehicle.cabin.window.row1.passenger.status`, `vehicle.cabin.window.row2.driver.status`, `vehicle.cabin.window.row2.passenger.status`
- **Lock State** (1 key): `vehicle.cabin.door.status` (SECURED/UNLOCKED)
- **Trunk & Hood** (3 keys): `vehicle.body.trunk.isOpen`, `vehicle.body.trunk.isLocked`, `vehicle.body.hood.isOpen`
- **Sunroof** (1 key): `vehicle.cabin.sunroof.status`
- **Vehicle Status** (3 keys): `vehicle.vehicle.travelledDistance`, `vehicle.isMoving`, `vehicle.drivetrain.engine.isActive`
- **Climate** (2 keys): `vehicle.vehicle.preConditioning.activity`, `vehicle.cabin.hvac.preconditioning.status.comfortState`
- **Tire Pressures** (8 keys): All 4 wheels pressure + target values (`vehicle.chassis.axle.row1/row2.wheel.left/right.tire.pressure` and `pressureTarget`)
- **Service** (1 key): `vehicle.status.conditionBasedServicesCount`

**Trip Detection (3 keys):**

The app also monitors trip completion using these additional keys:

- `vehicle.trip.segment.end.time` - Timestamp when trip ended
- `vehicle.trip.segment.end.travelledDistance` - Mileage at trip end
- `vehicle.trip.segment.end.drivetrain.batteryManagement.hvSoc` - Battery SOC at trip end

These trip segment keys enable the app to detect when a journey is completed and trigger the "trip completed" flow card.

To configure streaming in the BMW portal:

1. Navigate to **CarData** → **Configure Data Stream**
2. Select the telematic keys you want to receive (Homey uses 46 keys)
3. Save configuration
4. Credentials will be visible for use

**Status:** Automatically enabled if streaming subscription is active.

### Stream health

The stream recovers by itself. If it can't start, or a login renewal or the network fails, it retries after 30 s, 1, 2, 4 and 8 minutes, then every 15 minutes until it's back. It renews its BMW login shortly before the hourly token expires instead of waiting to be rejected. A once-a-minute check also restarts it if it's ever found stopped with no retry planned.

Each car shows two extra values in Homey:

- **Car data stream**: Live, Connecting, Reconnecting, Off (turned off in the device settings) or Unavailable (the app can't start the stream at all, for example after a failed login).
- **Last car data**: when the car measured the newest data received, by stream or by API poll. It uses the car's own timestamps, so old data replayed after a reconnect or returned by a poll doesn't look fresh. It never goes backwards, except when the Homey clock itself steps back.

For Flows there's a **Car data stream changed** trigger (with the new state as a tag), and two conditions:

- **Car data stream is live**: changes reach Homey within seconds. A parked car can stay silent for hours while the stream is fine, so use this to decide whether a battery level read earlier is still current.
- **Car data was updated in the last … minutes**: the car measured new data within that time.

### Flow cards

Triggers fire only when a value really changes between two known states: never on the first data after the app starts, and never because a value is missing.

| Trigger                                                                        | Fires when                                                                                        | Needs these items ticked in the BMW CarData stream  |
| ------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------- | --------------------------------------------------- |
| The car was locked / unlocked                                                  | the car's lock state changes (BMW sends it only now and then, so it can lag)                      | `vehicle.cabin.door.status`                         |
| The charging flap was locked / unlocked                                        | the charging flap lock changes                                                                    | `vehicle.body.flap.isLocked`                        |
| A charging cable was plugged in / unplugged                                    | the cable is connected or disconnected                                                            | `vehicle.body.chargingPort.status`                  |
| Charging status changed                                                        | charging starts, pauses, ends, errors and so on                                                   | `vehicle.drivetrain.electricEngine.charging.status` |
| Battery level changed and is above X%                                          | every change of the battery level while it is above X (with 80: at 81, again at 82, …; not at 80) | `vehicle.drivetrain.batteryManagement.header`       |
| Climate started / stopped / status changed                                     | climate preconditioning starts, stops or changes mode                                             | `vehicle.vehicle.preConditioning.activity`          |
| Car data stream changed                                                        | the stream goes Live, Reconnecting, Off or Unavailable                                            | —                                                   |
| Location changed, geofence entered / exited, drive session started / completed | the car reports a new location or the end of a trip                                               | the location and `vehicle.trip.segment.end.*` items |

Conditions: the car is locked, a charging cable is plugged in, charging status is …, battery charge is less than …, inside a geofence, car data stream is live, car data was updated in the last … minutes. When the data a condition needs isn't known yet, the flow stops with an error that says so, instead of guessing.

The charging state uses the cable sensor as well as the charging status, so a car that's plugged in and waiting for a scheduled start shows "plugged in", and a paused charge shows "plugged in, paused".

### REST API Polling (Fallback)

**How it works:**

- Periodic HTTP requests to fetch vehicle data
- **Strict quota: 50 requests per 24 hours**
- Counter starts from first request, expires 24 hours later
- **Manually enabled/disabled in device settings**

**Rate Limit Implications:**

- 50 requests/24h = 1 request per ~29 minutes maximum
- Recommended: Use MQTT streaming instead
- API polling should only be used as fallback when MQTT unavailable

**Configuration:**

API polling is controlled via device settings:

- Navigate to **Device Settings** → **Enable API polling** (checkbox)
- Default: **Enabled** after pairing
- **Recommended**: Disable API polling once MQTT streaming is confirmed working to conserve quota

**Warning:** Do **not** enable frequent polling unless MQTT is unavailable. The 50 request limit is easily exhausted with polling intervals under 30 minutes.

## Settings

You can control data delivery methods in each device's settings:

- **Enable MQTT streaming** (checkbox, default: enabled): Real-time push updates via MQTT protocol
- **Enable API polling** (checkbox, default: enabled): Periodic REST API polling for vehicle data
- **API polling interval** (number, default: 60 minutes): How often to poll the API when enabled

**Recommended Configuration:**

1. After pairing, verify MQTT streaming is working (check logs or observe real-time updates)
2. Once confirmed, **disable API polling** to conserve the 50 req/24h quota
3. Use MQTT streaming as primary data source
4. Only re-enable API polling if MQTT streaming fails

The app automatically:

- Manages authentication token refresh (OAuth tokens expire after 1 hour)
- Handles container creation/validation for telematic data
- Retries failed API requests with exponential backoff
- Merges MQTT and API data intelligently (timestamp-based coherence)

## Acknowledgements

- Use at your own risk. I accept no responsibility for any damages caused by using this app.
- Reverse geo coding data is provided under ODbL and © OpenStreetMap contributors. Further details <https://www.openstreetmap.org/copyright>.

## Useful links

- [Source code](https://github.com/helloseyedjafari/bmw-cardata-homey)
- [Report a problem](https://github.com/helloseyedjafari/bmw-cardata-homey/issues)
- [Original app: BMW / Mini Connected](https://github.com/lsiddiquee/com.rexwel.bmwconnected)
