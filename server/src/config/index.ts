import { NetworkId } from "@radixdlt/radix-engine-toolkit";

export type SnapshotPollingConfig = ReturnType<typeof getConfig>;

export const getConfig = () => {
  const logLevel = process.env.LOG_LEVEL || 'silly';
  const port = process.env.PORT || 4000;

  const dbUser = process.env.DB_USER || "db_dev_superuser";
  const dbPassword = process.env.DB_PASSWORD || "db_dev_password";
  const db = process.env.DB || "radixdlt_ledger";
  const dbHost = process.env.DB_HOST || "127.0.0.1";
  const dbPort = process.env.DB_PORT ? parseInt(process.env.DB_PORT) : 5432;

  const expectedOrigin = process.env.DAPP_EXPECTED_ORIGIN || "http://localhost:3000" // This is the url that the extension sends to the wallet to sign alongside ROLA challenge.
  const dAppDefinitionAddress = process.env.DAPP_DEFINITION_ADDRESS || "account_tdx_d_128656c7vqkww07ytfudjacjh2snf9z8t6slfrz2n7p9kwaz2ewnjyv" // setup in Manage dApp definition of rcnet-v3-dashboard
  const networkId = process.env.NETWORK_ID ? parseInt(process.env.NETWORK_ID) : NetworkId.Zabanet;

  return {
    logLevel,
    port,
    db: {
      user: dbUser,
      password: dbPassword,
      db,
      host: dbHost,
      port: dbPort,
    },
    radix: {
      expectedOrigin,
      dAppDefinitionAddress,
      networkId
    }
  }
}
