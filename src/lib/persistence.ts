import { Dexie, liveQuery, type EntityTable } from "dexie";
import * as v from "valibot";

import { MAX_WRAP_WIDTH, MIN_WRAP_WIDTH } from "./rewrap";

class RewrapDatabase extends Dexie {
  static readonly NAME = "rewrap";
  static readonly VERSION = 1;
  static readonly SNAPSHOT_ID = "main";
  static readonly WRITE_THROTTLE_MS = 50;

  snapshot!: EntityTable<RewrapSnapshot, "id">;
  private pendingSnapshot: RewrapSnapshot | null = null;
  private saveTimeout: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    super(RewrapDatabase.NAME);

    this.version(RewrapDatabase.VERSION).stores({
      snapshot: "id",
    });
  }

  toSnapshot(text: string, wrapWidth: number) {
    return v.parse(RewrapSnapshotSchema, {
      id: RewrapDatabase.SNAPSHOT_ID,
      text,
      wrapWidth,
      updatedAt: Date.now(),
    });
  }

  async loadSnapshot(options: LoadSnapshotOptions = {}) {
    const snapshot = await this.snapshot.get(RewrapDatabase.SNAPSHOT_ID);

    if (snapshot === undefined) {
      return null;
    }

    if (options.strict === false) {
      const result = v.safeParse(RewrapSnapshotSchema, snapshot);

      return result.success ? result.output : null;
    }

    return v.parse(RewrapSnapshotSchema, snapshot);
  }

  watchSnapshot(observer: {
    next: (snapshot: RewrapSnapshot | null) => void;
    error: (error: unknown) => void;
  }) {
    return liveQuery(() => this.loadSnapshot()).subscribe(observer);
  }

  saveSnapshot(text: string, wrapWidth: number, options?: SaveSnapshotOptions) {
    const snapshot = this.toSnapshot(text, wrapWidth);
    this.pendingSnapshot = snapshot;

    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }

    const flush = () => {
      void this.flushPendingSnapshot()
        .then(() => options?.onSuccess?.())
        .catch((error: unknown) => options?.onError?.(error));
    };

    if (options?.immediate) {
      flush();
      return snapshot;
    }

    this.saveTimeout = setTimeout(flush, RewrapDatabase.WRITE_THROTTLE_MS);

    return snapshot;
  }

  async flushPendingSnapshot() {
    if (this.saveTimeout) {
      clearTimeout(this.saveTimeout);
      this.saveTimeout = null;
    }

    const snapshot = this.pendingSnapshot;

    if (snapshot === null) {
      return;
    }

    await this.transaction("rw", this.snapshot, async () => {
      const currentSnapshot = await this.loadSnapshot({ strict: false });

      if (currentSnapshot && currentSnapshot.updatedAt > snapshot.updatedAt) {
        return;
      }

      await this.snapshot.put(snapshot);
    });

    if (this.pendingSnapshot === snapshot) {
      this.pendingSnapshot = null;
    }
  }
}

type SaveSnapshotOptions = {
  immediate?: boolean;
  onError?: (error: unknown) => void;
  onSuccess?: () => void;
};

type LoadSnapshotOptions = {
  strict?: boolean;
};

const RewrapSnapshotSchema = v.object({
  id: v.literal(RewrapDatabase.SNAPSHOT_ID),
  text: v.string(),
  wrapWidth: v.pipe(
    v.number(),
    v.integer(),
    v.minValue(MIN_WRAP_WIDTH),
    v.maxValue(MAX_WRAP_WIDTH),
  ),
  updatedAt: v.pipe(v.number(), v.integer(), v.minValue(0)),
});

type RewrapSnapshot = v.InferOutput<typeof RewrapSnapshotSchema>;

export const rewrapDatabase = new RewrapDatabase();
export type { RewrapSnapshot };
