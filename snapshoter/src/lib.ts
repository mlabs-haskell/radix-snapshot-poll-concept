import postgres, { Options } from "postgres";
import openConnection, { Db }  from "./db";
import { initDbSnapshots } from "./db_snapshotter";
import { ResultAsync } from "neverthrow";

type SnapshoterConfig = {
  db: Options<{}>,
}

const lib = (config: SnapshoterConfig) => {
  const conn = postgres(config.db);
  const snapshots = initDbSnapshots(conn)
  
  // const getLatestStateVersion = () => {
  //   const pendingQuery = conn`
  //       SELECT from_state_version FROM state_history ORDER BY from_state_version DESC LIMIT 1`
  //   const result = //TODO: maybe verify, that all rows have same `resource_entity_id`, which represents current token
  //     ResultAsync.fromPromise(pendingQuery, (e: unknown) => e as Error)
  //       // .map((rowList) => rowList.map(dbRowToBalanceInfo(tokenAddress)))
  //       // .map((bs) => Snapshot.fromBalances(stateVersion, bs))

  //   return result
  // }

  return {
    v1: snapshots.makeSnapshotV1,
    v2: snapshots.makeSnapshotV2,
    // getLatestState, 
  }
}

export default lib;
