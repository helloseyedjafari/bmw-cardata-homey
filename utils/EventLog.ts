import { STORE_KEY_EVENT_LOG } from './StoreKeys';

/**
 * Maximum number of entries kept. The oldest entries are dropped first.
 */
export const EVENT_LOG_MAX_ENTRIES = 1500;

/**
 * Minimum time between writes to the device store (milliseconds). Entries are kept in memory in
 * between, so a burst of data while driving costs one write.
 */
export const EVENT_LOG_SAVE_INTERVAL_MS = 30 * 1000;

/**
 * One event: when it was recorded, what kind it is, and its details.
 */
export type EventLogEntry = { at: string; type: string } & Record<string, unknown>;

/**
 * The part of a Homey device the event log needs.
 */
export interface EventLogStore {
  getStoreValue(key: string): unknown;
  setStoreValue(key: string, value: unknown): Promise<unknown>;
}

/**
 * Persistent, bounded log of what happened to a vehicle: Flow triggers fired and the car data
 * received. Survives app restarts (device store) and needs no Flow to read: the app's
 * `getEventLog` API returns it. Meant for checking afterwards what the car sent and what fired.
 */
export class EventLog {
  private entries: EventLogEntry[];
  private saveTimer?: ReturnType<typeof setTimeout>;

  constructor(private readonly store: EventLogStore) {
    const saved = store.getStoreValue(STORE_KEY_EVENT_LOG);
    this.entries = Array.isArray(saved) ? (saved as EventLogEntry[]) : [];
  }

  /**
   * Add an entry stamped with the current time. Never throws.
   *
   * @param type - Kind of event, e.g. `trigger`, `data`, `stream`
   * @param details - Anything useful for debugging; must be JSON-serialisable
   */
  record(type: string, details: Record<string, unknown> = {}): void {
    this.entries.push({ at: new Date().toISOString(), type, ...details });
    if (this.entries.length > EVENT_LOG_MAX_ENTRIES) {
      this.entries.splice(0, this.entries.length - EVENT_LOG_MAX_ENTRIES);
    }
    this.scheduleSave();
  }

  /**
   * All entries, oldest first (a copy).
   */
  getEntries(): EventLogEntry[] {
    return [...this.entries];
  }

  /**
   * Write pending entries now (e.g. when the device is uninitialised). Never throws.
   */
  async flush(): Promise<void> {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
      this.saveTimer = undefined;
    }
    try {
      await this.store.setStoreValue(STORE_KEY_EVENT_LOG, this.entries);
    } catch {
      // Keeping the entries in memory is all we can do; the next save tries again
    }
  }

  private scheduleSave(): void {
    if (this.saveTimer) {
      return;
    }
    this.saveTimer = setTimeout(() => {
      this.saveTimer = undefined;
      void this.flush();
    }, EVENT_LOG_SAVE_INTERVAL_MS);
    this.saveTimer.unref?.();
  }
}

/**
 * Telemetry keys worth logging: locks, charging, battery, climate, movement, location and trips.
 * Everything else (tyres, windows, service counts, …) is left out to keep the log small.
 */
const LOGGED_KEYS = new Set<string>([
  'vehicle.cabin.door.status',
  'vehicle.body.flap.isLocked',
  'vehicle.body.chargingPort.status',
  'vehicle.body.chargingPort.statusClearText',
  'vehicle.drivetrain.electricEngine.charging.status',
  'vehicle.drivetrain.electricEngine.charging.timeToFullyCharged',
  'vehicle.drivetrain.batteryManagement.header',
  'vehicle.powertrain.electric.battery.stateOfCharge.target',
  'vehicle.drivetrain.electricEngine.kombiRemainingElectricRange',
  'vehicle.vehicle.preConditioning.activity',
  'vehicle.isMoving',
  'vehicle.drivetrain.engine.isActive',
  'vehicle.vehicle.travelledDistance',
  'vehicle.cabin.infotainment.navigation.currentLocation.latitude',
  'vehicle.cabin.infotainment.navigation.currentLocation.longitude',
]);

/**
 * Pick the telemetry worth logging from a set of data points, as `{ key: { v: value, t: time the
 * car measured it } }`. Trip keys (`vehicle.trip.…`) are always included.
 *
 * @param points - Data points keyed by telemetry key (stream message data or a poll result)
 */
export function pickLoggedValues(points: unknown): Record<string, { v: unknown; t: unknown }> {
  const picked: Record<string, { v: unknown; t: unknown }> = {};
  if (typeof points !== 'object' || points === null) {
    return picked;
  }
  for (const [key, point] of Object.entries(points as Record<string, unknown>)) {
    if (!LOGGED_KEYS.has(key) && !key.startsWith('vehicle.trip.')) {
      continue;
    }
    const p = (typeof point === 'object' && point !== null ? point : {}) as {
      value?: unknown;
      timestamp?: unknown;
    };
    picked[key] = { v: p.value, t: p.timestamp };
  }
  return picked;
}
