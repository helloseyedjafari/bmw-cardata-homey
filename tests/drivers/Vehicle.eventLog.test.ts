import { Vehicle } from '../../drivers/Vehicle';
import { EventLog } from '../../utils/EventLog';
import { createMockedVehicle } from '../helpers/vehicleTestHelper';
import type { StreamMessage } from '../../lib/streaming/StreamMessage';

describe('Vehicle event log', () => {
  let vehicle: Vehicle;
  let store: Map<string, unknown>;

  beforeEach(() => {
    vehicle = createMockedVehicle().vehicle;
    store = new Map();
    vehicle.getStoreValue = jest.fn((key: string) => store.get(key));
    vehicle.setStoreValue = jest.fn((key: string, value: unknown) => {
      store.set(key, value);
      return Promise.resolve();
    });
    (vehicle as any).eventLog = new EventLog(vehicle);
  });

  it('should_recordEveryTriggerFired_with_itsTokens', async () => {
    await (vehicle as any).fireStateTriggers([
      { cardId: 'car_locked', tokens: {} },
      { cardId: 'battery_level_above', tokens: { battery: 81 }, state: { level: 81 } },
    ]);

    const entries = vehicle.getEventLog();
    expect(entries.map((e) => e.card)).toEqual(['car_locked', 'battery_level_above']);
    expect(entries[1]).toMatchObject({ type: 'trigger', tokens: { battery: 81 } });
    expect(vehicle.homey.flow.getDeviceTriggerCard).toHaveBeenCalledWith('car_locked');
  });

  it('should_recordInterestingStreamedValues', async () => {
    (vehicle as any).stateManager = { updateFromMqttMessage: jest.fn() };
    jest.spyOn(vehicle as any, 'checkAndDebounceTripCompletion').mockResolvedValue(undefined);
    jest.spyOn(vehicle as any, 'recordCarDataUpdate').mockResolvedValue(undefined);
    const message = {
      timestamp: '2026-11-04T17:00:02Z',
      data: {
        'vehicle.isMoving': { value: true, timestamp: '2026-11-04T17:00:00Z' },
        'vehicle.chassis.axle.row1.wheel.left.tire.pressure': {
          value: 250,
          timestamp: '2026-11-04T17:00:00Z',
        },
      },
    } as unknown as StreamMessage;

    await (vehicle as any).handleMqttMessage('gcid/TEST_VIN_123', message);

    const data = vehicle.getEventLog().filter((e) => e.type === 'data');
    expect(data).toHaveLength(1);
    expect(data[0]).toMatchObject({
      source: 'stream',
      values: { 'vehicle.isMoving': { v: true, t: '2026-11-04T17:00:00Z' } },
    });
  });

  it('should_returnAnEmptyLog_when_theDeviceWasNotInitialised', () => {
    (vehicle as any).eventLog = undefined;

    expect(vehicle.getEventLog()).toEqual([]);
  });
});
