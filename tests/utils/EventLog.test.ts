import {
  EventLog,
  EventLogStore,
  EVENT_LOG_MAX_ENTRIES,
  pickLoggedValues,
} from '../../utils/EventLog';

type TestStore = EventLogStore & {
  value: unknown;
  getStoreValue: jest.Mock<unknown, [string]>;
  setStoreValue: jest.Mock<Promise<void>, [string, unknown]>;
};

function createStore(initial?: unknown): TestStore {
  const store: TestStore = {
    value: initial,
    getStoreValue: jest.fn((_key: string): unknown => store.value),
    setStoreValue: jest.fn((_key: string, value: unknown): Promise<void> => {
      store.value = value;
      return Promise.resolve();
    }),
  };
  return store;
}

describe('EventLog', () => {
  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2026-11-04T17:00:00Z'));
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('should_recordEntriesWithTimestampAndType', () => {
    const log = new EventLog(createStore());

    log.record('trigger', { card: 'car_locked' });

    expect(log.getEntries()).toEqual([
      { at: '2026-11-04T17:00:00.000Z', type: 'trigger', card: 'car_locked' },
    ]);
  });

  it('should_loadEntriesSavedBeforeARestart', () => {
    const saved = [{ at: '2026-11-04T16:00:00.000Z', type: 'trigger', card: 'car_unlocked' }];

    const log = new EventLog(createStore(saved));

    expect(log.getEntries()).toEqual(saved);
  });

  it('should_ignoreAStoredValueThatIsNotAList', () => {
    const log = new EventLog(createStore({ broken: true }));

    expect(log.getEntries()).toEqual([]);
  });

  it('should_keepOnlyTheNewestEntries_when_full', () => {
    const log = new EventLog(createStore());

    for (let i = 0; i < EVENT_LOG_MAX_ENTRIES + 5; i++) {
      log.record('data', { n: i });
    }

    const entries = log.getEntries();
    expect(entries).toHaveLength(EVENT_LOG_MAX_ENTRIES);
    expect(entries[0]).toMatchObject({ n: 5 });
    expect(entries[entries.length - 1]).toMatchObject({ n: EVENT_LOG_MAX_ENTRIES + 4 });
  });

  it('should_saveAtMostOncePerWindow_when_manyEntriesArrive', async () => {
    const store = createStore();
    const log = new EventLog(store);

    log.record('data', { n: 1 });
    log.record('data', { n: 2 });
    log.record('data', { n: 3 });
    expect(store.setStoreValue).not.toHaveBeenCalled();

    await jest.advanceTimersByTimeAsync(30_000);

    expect(store.setStoreValue).toHaveBeenCalledTimes(1);
    expect(store.value).toHaveLength(3);
  });

  it('should_saveImmediately_when_flushed', async () => {
    const store = createStore();
    const log = new EventLog(store);
    log.record('trigger', { card: 'car_locked' });

    await log.flush();

    expect(store.value).toHaveLength(1);
    await jest.advanceTimersByTimeAsync(30_000);
    expect(store.setStoreValue).toHaveBeenCalledTimes(1);
  });

  it('should_notThrow_when_savingFails', async () => {
    const store = createStore();
    store.setStoreValue.mockRejectedValueOnce(new Error('disk full'));
    const log = new EventLog(store);
    log.record('trigger', { card: 'car_locked' });

    await expect(log.flush()).resolves.toBeUndefined();
    expect(log.getEntries()).toHaveLength(1);
  });

  it('should_returnACopy_so_callersCannotChangeTheLog', () => {
    const log = new EventLog(createStore());
    log.record('trigger', { card: 'car_locked' });

    log.getEntries().pop();

    expect(log.getEntries()).toHaveLength(1);
  });
});

describe('pickLoggedValues', () => {
  it('should_keepInterestingKeysAndTripKeys_and_dropTheRest', () => {
    const picked = pickLoggedValues({
      'vehicle.cabin.door.status': { value: 'SECURED', timestamp: '2026-11-04T17:00:00Z' },
      'vehicle.trip.segment.end.time': {
        value: '2026-11-04T17:30',
        timestamp: '2026-11-04T17:30:00Z',
      },
      'vehicle.chassis.axle.row1.wheel.left.tire.pressure': { value: 250, timestamp: 'x' },
    });

    expect(picked).toEqual({
      'vehicle.cabin.door.status': { v: 'SECURED', t: '2026-11-04T17:00:00Z' },
      'vehicle.trip.segment.end.time': { v: '2026-11-04T17:30', t: '2026-11-04T17:30:00Z' },
    });
  });

  it('should_returnNothing_for_inputThatIsNotAnObject', () => {
    expect(pickLoggedValues(undefined)).toEqual({});
    expect(pickLoggedValues('nope')).toEqual({});
  });
});
