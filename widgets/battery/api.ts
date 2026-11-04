import type { Driver } from 'homey';
import type { BMWConnectedDrive } from '../../app';
import type { BatteryWidgetState } from '../../utils/BatteryWidgetState';

type Homey = Driver['homey'];

export default {
  /**
   * The state of the "Car battery" widget: the battery level, charging state and range of the car
   * picked in the widget settings.
   *
   * @param query.deviceId - The data id of the car. The first car is used when it is missing or unknown
   * @returns The state, null when the app has no cars
   */
  async getState({
    homey,
    query,
  }: {
    homey: Homey;
    query: { deviceId?: string };
  }): Promise<{ state: BatteryWidgetState | null }> {
    await Promise.resolve(); // Ensure async context

    return { state: (homey.app as BMWConnectedDrive).getBatteryWidgetState(query.deviceId) };
  },
};
