import postgres, { Options } from "postgres";
import { initDbSnapshots } from "./db_snapshoter";

type SnapshoterConfig = {
  db: Options<{}>,
}

const lib = (config: SnapshoterConfig) => {
  const conn = postgres(config.db);
  const snapshots = initDbSnapshots(conn)

  return {
    v1: snapshots.makeSnapshotV1,
    v2: snapshots.makeSnapshotV2,
    currentState: snapshots.currentState
  }
}

export default lib;
