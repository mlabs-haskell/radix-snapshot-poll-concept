import postgres, { Options } from "postgres";
import { initDbSnapshots } from "./db_snapshoter";

type SnapshoterConfig = {
  db: Options<{}>,
}

const lib = (config: SnapshoterConfig) => {
  const conn = postgres(config.db);
  const snapshots = initDbSnapshots(conn)

  return {
    snapshotResourceBalances: snapshots.makeSnapshotV1,
    snapshotResourceBalancesByAddress: snapshots.makeSnapshotV2,
    currentState: snapshots.currentState,
    ownerKeys: snapshots.ownerKeys,
  }
}

export default lib;
