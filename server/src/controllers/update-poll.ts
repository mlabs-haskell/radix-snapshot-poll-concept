import { SnapshotPollingServices } from "../loaders/services";
import { DbKeys } from "../services/db-store";

export default (dbStore: SnapshotPollingServices['dbStore']) => async (id: string) => {
    const poll = dbStore.get(DbKeys.Polls).find((p: any) => p.id === id);
    if (poll.closed) {
      throw Error("Poll is closed");
    }

    // const snapshoter = snap({ db: {
    //   db: "radixdlt_ledger",
    //   user: "db_dev_superuser",
    //   password: "db_dev_password",
    //   port: 5432,
    //   host: "127.0.0.1",
    // }})

    // snapshoter.v1("resource_tdx_e_1thmnph8gg88pmfethyy2s7k5pjz54fmfnlskd6a8y3qtwjter47nas", 5274713).andThen((r) =>  {
    //   console.log(r)
    //   return ok(null)
    // }).orElse((e) => {console.error(e); return ok(null)});
  return [];
}
