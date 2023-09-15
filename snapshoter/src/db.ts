import postgres from "postgres";

export type Db = ReturnType<typeof openConnection>;

const openConnection = () =>
  postgres({
    database: "radixdlt_ledger",
    user: "db_dev_superuser",
    password: "db_dev_password",
    host: "127.0.0.1",
    port: 5432,
  });

export default openConnection;
