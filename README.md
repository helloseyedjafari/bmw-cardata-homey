# CarData for BMW & MINI

Follow your BMW or MINI in Homey Pro: battery level, charging, range, location, doors, windows, locks and climate, live. The app reads your car's data from BMW Group's official **CarData** service. That service is read-only, so the app can't lock or unlock the car, start the climate control or change charging.

- **Live updates.** BMW's data stream sends changes to Homey within seconds. Polling every 30 minutes (BMW allows 50 requests a day) fills in the rest.
- **Flow cards** for locking, charging, climate, location, geofences and drive sessions.
- **A "Car battery" dashboard widget** that shows the charge level, charging state and range.

Built and tested on a BMW iX3. MINI uses exactly the same CarData service (MINI owners use the MINI website), so it should work the same way, but it hasn't been tested with a MINI yet. If you try one, please [tell me how it went](https://github.com/helloseyedjafari/bmw-cardata-homey/issues).

## Requirements

- A My BMW (or My MINI) account with your car added, and you as its **primary driver** (main user).
- Active BMW ConnectedDrive services, in a country where BMW CarData is offered (most European countries, including the UK).
- A Homey Pro on software 12.9.0 or later.

## Setup

Setting up has four steps. Steps 1 and 2 happen on the BMW or MINI website, step 3 in the Homey app, and step 4 checks the result.

### Step 1: Create a CarData client

You do this once per account.

1. Sign in on the My BMW website for your country and open your vehicle overview. For example:
   - UK: <https://www.bmw.co.uk/en-gb/mybmw/vehicle-overview>
   - Germany: <https://www.bmw.de/de-de/mybmw/vehicle-overview>
   - MINI UK: <https://www.mini.co.uk/en-gb/mymini/vehicle-overview>
   - MINI Germany: <https://www.mini.de/de-de/mymini/vehicle-overview>
2. Select your car and open the **BMW CarData** tile (on MINI: **MINI CarData**).
3. Press **Create CarData Client**.
4. Switch on both **CarData API** and **CarData Stream** (the scopes `cardata:api:read` and `cardata:streaming:read`). If the portal shows a scope error, reload the page, add one of the two, wait about 30 seconds, then add the other.
5. Copy the **Client ID**. It is a UUID in the format `xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx`.

### Step 2: Choose the data the stream sends

This step matters. The live stream only sends the items you tick here. Anything you leave out only updates on the half-hourly poll, and drive sessions never finish without the trip items.

In the same CarData tile, under **CarData Stream**, open **Change data selection**, tick the items below and save.

| Powers                       | Data item                                                         | What it is                                                      |
| ---------------------------- | ----------------------------------------------------------------- | --------------------------------------------------------------- |
| **Battery and charging**     | `vehicle.drivetrain.batteryManagement.header`                     | Battery level                                                   |
|                              | `vehicle.drivetrain.electricEngine.charging.status`               | Charging status                                                 |
|                              | `vehicle.drivetrain.electricEngine.charging.timeToFullyCharged`   | Time until fully charged (shown on the widget)                  |
|                              | `vehicle.drivetrain.electricEngine.kombiRemainingElectricRange`   | Electric range                                                  |
|                              | `vehicle.drivetrain.lastRemainingRange`                           | Total range                                                     |
|                              | `vehicle.powertrain.electric.battery.stateOfCharge.target`        | Charge target                                                   |
|                              | `vehicle.body.chargingPort.status`                                | Charging cable plugged in                                       |
|                              | `vehicle.body.flap.isLocked`                                      | Charging flap locked                                            |
| **Location and mileage**     | `vehicle.cabin.infotainment.navigation.currentLocation.latitude`  | Location (latitude)                                             |
|                              | `vehicle.cabin.infotainment.navigation.currentLocation.longitude` | Location (longitude)                                            |
|                              | `vehicle.cabin.infotainment.navigation.currentLocation.heading`   | Direction of travel                                             |
|                              | `vehicle.vehicle.travelledDistance`                               | Mileage                                                         |
| **Drive sessions**           | `vehicle.trip.segment.end.time`                                   | When a trip ended                                               |
|                              | `vehicle.trip.segment.end.travelledDistance`                      | Mileage at the end of a trip                                    |
| **Doors, locks and windows** | `vehicle.cabin.door.status`                                       | Locked or unlocked                                              |
|                              | `vehicle.cabin.door.row1.driver.isOpen`                           | Front driver's door open                                        |
|                              | `vehicle.cabin.door.row1.passenger.isOpen`                        | Front passenger's door open                                     |
|                              | `vehicle.cabin.door.row2.driver.isOpen`                           | Rear door behind the driver open                                |
|                              | `vehicle.cabin.door.row2.passenger.isOpen`                        | Rear door behind the passenger open                             |
|                              | `vehicle.body.hood.isOpen`                                        | Hood open                                                       |
|                              | `vehicle.body.trunk.isOpen`                                       | Trunk open                                                      |
|                              | `vehicle.cabin.window.row1.driver.status`                         | Front driver's window                                           |
|                              | `vehicle.cabin.window.row1.passenger.status`                      | Front passenger's window                                        |
|                              | `vehicle.cabin.window.row2.driver.status`                         | Rear window behind the driver                                   |
|                              | `vehicle.cabin.window.row2.passenger.status`                      | Rear window behind the passenger                                |
| **Climate**                  | `vehicle.vehicle.preConditioning.activity`                        | Climate heating, cooling, ventilating or off                    |
|                              | `vehicle.cabin.hvac.preconditioning.status.comfortState`          | Climate comfort state                                           |
| **Tyres**                    | `vehicle.chassis.axle.row1.wheel.left.tire.pressure`              | Front left tyre pressure                                        |
|                              | `vehicle.chassis.axle.row1.wheel.right.tire.pressure`             | Front right tyre pressure                                       |
|                              | `vehicle.chassis.axle.row2.wheel.left.tire.pressure`              | Rear left tyre pressure                                         |
|                              | `vehicle.chassis.axle.row2.wheel.right.tire.pressure`             | Rear right tyre pressure                                        |
|                              | `vehicle.chassis.axle.row1.wheel.left.tire.pressureTarget`        | Front left target pressure                                      |
|                              | `vehicle.chassis.axle.row1.wheel.right.tire.pressureTarget`       | Front right target pressure                                     |
|                              | `vehicle.chassis.axle.row2.wheel.left.tire.pressureTarget`        | Rear left target pressure                                       |
|                              | `vehicle.chassis.axle.row2.wheel.right.tire.pressureTarget`       | Rear right target pressure                                      |
| **Fuel**                     | `vehicle.drivetrain.fuelSystem.level`                             | Fuel level (plug-in hybrids and petrol or diesel cars only)     |
|                              | `vehicle.drivetrain.fuelSystem.remainingFuel`                     | Remaining fuel (plug-in hybrids and petrol or diesel cars only) |
| **Service**                  | `vehicle.status.conditionBasedServicesCount`                      | Number of services due                                          |

The app reads the tyre, charge target, heading, climate comfort state and service items but doesn't show them in Homey yet. Ticking them is harmless, and they are ready for when the app does.

If you change the data selection later, the change takes effect after a minute or two. The app reconnects by itself.

### Step 3: Add the car in Homey

1. In the Homey app, go to **Devices**, press **+** and choose **CarData for BMW & MINI**.
2. Choose **BMW** or **MINI**.
3. Paste the **Client ID** from step 1. Leave **Container ID** empty. The app creates the data container it needs.
4. Homey shows a code and a link (<https://customer.bmwgroup.com/oneid/#/link>). Open the link on any phone or computer, sign in with your My BMW or My MINI account, enter the code and approve.
5. Back in Homey, choose your car.

### Step 4: Check that it works

The new device should show **Car data stream: Live**. **Last car data** shows when the car last sent data.

A parked car sends very little, so that time can be hours old. To see it work, lock or unlock the car, or switch the climate on in the My BMW app. The values should update within seconds.

## What you get in Homey

### On the device

| Value                          | Notes                                                                                                         |
| ------------------------------ | ------------------------------------------------------------------------------------------------------------- |
| Battery level                  | Electric and plug-in hybrid cars                                                                              |
| Charging state                 | Uses the cable sensor as well as the charging status, so "plugged in" and "plugged in, paused" show correctly |
| Range                          | Total range. Plug-in hybrids also show the electric range                                                     |
| Fuel level and remaining fuel  | Plug-in hybrids and petrol or diesel cars                                                                     |
| Mileage                        | In the distance unit of the device settings                                                                   |
| Doors and windows              | Open or closed (doors include the hood and trunk; windows can also be partly open)                            |
| Lock state                     | Shown as the alarm indicator, which is on while the car is unlocked                                           |
| Climate status                 | Heating, cooling, ventilation or inactive                                                                     |
| Car data stream, Last car data | See [Stream health and polling](#stream-health-and-polling)                                                   |

The car's location isn't a device value. It reaches your Flows through the location, geofence and drive session cards below, with the street address as a tag.

### Flow cards

Triggers fire only when a value really changes between two known states: never on the first data after the app starts, and never because a value is missing. Most cards depend on specific data items from [step 2](#step-2-choose-the-data-the-stream-sends). The right-hand column says which ones to tick. "The location items" are the three `currentLocation` items, and "the fuel items" are the two `fuelSystem` items.

| Trigger                                     | Fires when                                                                                                 | Needs these data items                                                        |
| ------------------------------------------- | ---------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| The car was locked / unlocked               | the car's lock state changes (BMW sends it only now and then, so it can lag)                               | `vehicle.cabin.door.status`                                                   |
| The charging flap was locked / unlocked     | the charging flap lock changes                                                                             | `vehicle.body.flap.isLocked`                                                  |
| A charging cable was plugged in / unplugged | the cable is connected or disconnected                                                                     | `vehicle.body.chargingPort.status`                                            |
| Charging status changed                     | charging starts, pauses, ends, errors and so on (the new status is a tag)                                  | `vehicle.drivetrain.electricEngine.charging.status`                           |
| Battery level changed and is above ...      | every change of the battery level while it is above X (with 80: at 81, again at 82, and so on; not at 80)  | `vehicle.drivetrain.batteryManagement.header`                                 |
| Climate started / stopped / status changed  | climate preconditioning starts, stops or changes mode                                                      | `vehicle.vehicle.preConditioning.activity`                                    |
| Location changed                            | the car has moved more than 50 m, or entered or left a geofence (label, coordinates and address are tags)  | the location items                                                            |
| Geofence entered / exited                   | the car enters or leaves a geofence you set up in the app settings                                         | the location items                                                            |
| Drive session started                       | the car first moves more than 50 m after being parked (start location and mileage are tags)                | the location items, `vehicle.trip.segment.end.*`                              |
| Drive session completed                     | a trip ends (start and end location and mileage are tags)                                                  | `vehicle.trip.segment.end.time`, `vehicle.trip.segment.end.travelledDistance` |
| Refuelled                                   | the fuel level rises by more than the threshold in the device settings (petrol, diesel and plug-in hybrid) | the fuel items                                                                |
| Car data stream changed                     | the stream goes Live, Reconnecting, Off or Unavailable (the new state is a tag)                            | none                                                                          |

| Condition                                             | True when                                                                         | Needs these data items                              |
| ----------------------------------------------------- | --------------------------------------------------------------------------------- | --------------------------------------------------- |
| The car is / isn't locked                             | the car is locked                                                                 | `vehicle.cabin.door.status`                         |
| A charging cable is / isn't plugged in                | a charging cable is plugged in                                                    | `vehicle.body.chargingPort.status`                  |
| Charging status is / is not ...                       | the charging status matches the one you pick                                      | `vehicle.drivetrain.electricEngine.charging.status` |
| Battery charge is less than ...                       | the battery level is below the percentage you enter (or at or above, if inverted) | `vehicle.drivetrain.batteryManagement.header`       |
| Inside / outside of geofence ...                      | the car is inside or outside the geofence you pick                                | the location items                                  |
| Car data stream is / isn't live                       | changes reach Homey within seconds                                                | none                                                |
| Car data was / wasn't updated in the last ... minutes | the car measured new data within that time                                        | none                                                |

When the data a condition needs isn't known yet, the flow stops with an error that says so, instead of guessing.

There are no action cards, because CarData is read-only.

### Dashboard widget

**Car battery** shows a car's battery level on a Homey dashboard. When you add it, pick the car, a style (Battery, Circle or Large number) and a light or dark background. Besides the level it shows:

- the charging state: Charging, Plugged in, Low battery (under 20%) or Parked
- when charging will finish, or otherwise how long ago the car last sent data
- the remaining range, in the distance unit of the car's device settings

The colour follows the level: blue from 50%, amber from 20% and red below that. The widget updates within seconds of new car data and whenever the dashboard is opened.

## Stream health and polling

The live stream recovers by itself. If it can't start, or a login renewal or the network fails, it retries after 30 seconds, then 1, 2, 4 and 8 minutes, then every 15 minutes until it's back. It renews its BMW login shortly before the hourly token expires instead of waiting to be rejected, and a once-a-minute check restarts it if it's ever found stopped with no retry planned.

Each car shows two extra values in Homey:

- **Car data stream**: Live, Connecting, Reconnecting, Off (turned off in the device settings) or Unavailable (the app can't start the stream at all, for example after a failed sign-in).
- **Last car data**: when the car measured the newest data received, by stream or by poll. It uses the car's own timestamps, so old data replayed after a reconnect doesn't look fresh.

A parked car can stay silent for hours while the stream is perfectly fine. Use the **Car data stream is live** condition to decide whether a battery level read earlier is still current.

**Polling is the fallback.** The app also asks BMW for the car's data every 30 minutes. That covers anything the stream doesn't send and fills the gaps when the stream is down. BMW allows 50 requests a day, so the interval can't be set below 30 minutes.

## Settings

Device settings (open the device in the Homey app, then its settings):

- **Distance unit** and **Fuel unit**: kilometres or miles, and litres or US or UK gallons.
- **Enable MQTT streaming**: the live stream. On by default.
- **Enable API polling** and **API polling interval (minutes)**: the polling fallback. On by default, every 30 minutes (30 to 1440).
- **Refuelled trigger threshold (litre)**: how much the fuel level must rise to count as refuelling. 5 by default.

App settings (Apps, CarData for BMW & MINI, Configure): your **geofences** for the geofence cards, and logging options for troubleshooting.

## Troubleshooting

- **A value only updates every half hour, not live.** That data item isn't ticked under **Change data selection**. Tick it in [step 2](#step-2-choose-the-data-the-stream-sends). The change takes effect after a minute or two.
- **Drive sessions never end.** Tick the two trip items, `vehicle.trip.segment.end.time` and `vehicle.trip.segment.end.travelledDistance`.
- **Scope error when creating the CarData client.** See step 1, point 4: reload the page, add one scope, wait about 30 seconds, then add the other.
- **The stream keeps disconnecting and reconnecting.** BMW allows **one** live stream per account. If another client streams from the same account, the two disconnect each other. Examples are the original "BMW / Mini Connected" Homey app with streaming on, Home Assistant BMW CarData integrations and evcc. Turn the stream off in all but one of them.
- **Last car data is hours old.** That's normal for a parked car. Lock or unlock the car, or start the climate in the My BMW app, and it should update within seconds.
- **Car data stream says Unavailable.** The app can't start the stream, for example after a failed sign-in. Use the device's **Repair** option to sign in again.
- **The code in Homey expired.** The code is valid for a few minutes. Press **Try Again** to get a new one.
- **The lock state arrives late.** BMW sends the lock state only now and then, so lock and unlock Flows can run late.

Still stuck? [Open an issue](https://github.com/helloseyedjafari/bmw-cardata-homey/issues) and say which car, which items you ticked and what the device shows for **Car data stream**.

## Privacy

The app talks only to BMW Group's CarData servers and, to turn the car's coordinates into a street address, to OpenStreetMap (which only receives the coordinates). Your car data, sign-in and settings stay on your Homey. There is no other server and no analytics. The only exception is the optional Grafana Loki log address in the app settings: logs go there only if you enter one yourself.

## Credits

This app is based on [BMW / Mini Connected](https://github.com/lsiddiquee/com.rexwel.bmwconnected) by Likhan Siddiquee and its contributors, and is released under the same [GPL-3.0 licence](LICENSE). It runs as a separate app with its own app ID (`com.seyedjafari.bmwconnected`), so it can be installed alongside the original. Don't stream with both at once, because BMW allows one CarData stream per account.

Source code and support: <https://github.com/helloseyedjafari/bmw-cardata-homey>.

The store banner photo is by [Martin Katler](https://unsplash.com/@martinkatler) on Unsplash.

## Disclaimer

This app is not made or endorsed by BMW Group or MINI. BMW, MINI, My BMW and ConnectedDrive are trademarks of their owners. Use it at your own risk: I accept no responsibility for any damage caused by using this app.

Street addresses come from OpenStreetMap, data © OpenStreetMap contributors, available under the [ODbL](https://www.openstreetmap.org/copyright).
