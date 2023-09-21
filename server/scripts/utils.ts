import {
  PrivateKey,
  NetworkId,
  RadixEngineToolkit,
  TransactionManifest,
  TransactionBuilder,
  TransactionHeader,
  generateRandomNonce,
  Convert,
} from "@radixdlt/radix-engine-toolkit";
import {
    GatewayApiClient,
  Status,
  Transaction,
  TransactionStatusResponse,
} from "@radixdlt/babylon-gateway-api-sdk";

export const getAddress = async (prvKey: PrivateKey) =>
  RadixEngineToolkit.Derive.virtualAccountAddressFromPublicKey(
    prvKey.publicKey(),
    NetworkId.Zabanet,
  );

export const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const waitUntilSuccessfull =
  (tx: Transaction) =>
  (txId: string): Promise<TransactionStatusResponse> =>
    tx.getStatus(txId).then((txStatus) => {
      if (txStatus.status == "Pending")
        return delay(1000).then(() => waitUntilSuccessfull(tx)(txId));
      if (
        txStatus.status == "CommittedFailure" ||
        txStatus.status == "Rejected"
      ) {
        console.error(txStatus);
        delay(10).then(() => Promise.reject(txStatus));
      }
      return txStatus;
    });

export const submitTxManifest =
  (gapi: GatewayApiClient) =>
  (prvKey: PrivateKey) =>
  async (manifest: TransactionManifest) => {
    const e = await getCurrentEpoch(gapi.status);
    const txHeader: TransactionHeader = {
      networkId: NetworkId.Zabanet,
      startEpochInclusive: e,
      endEpochExclusive: e + 10,
      nonce: generateRandomNonce(),
      notaryPublicKey: prvKey.publicKey(),
      notaryIsSignatory: true,
      tipPercentage: 0,
    };
    const tx = await TransactionBuilder.new().then((builder) =>
      builder
        .header(txHeader)
        .manifest(manifest)
        .sign(prvKey)
        .notarize(prvKey),
    );
    const txId = await RadixEngineToolkit.NotarizedTransaction.intentHash(tx);
    const compiledTx = await RadixEngineToolkit.NotarizedTransaction.compile(
      tx,
    );
    await submitTx(gapi.transaction)(compiledTx);
    return txId;
  };

export const getCurrentEpoch = (status: Status) =>
  status.getCurrent().then((o) => o.ledger_state.epoch);

export const faucetAddr = () =>
  RadixEngineToolkit.Utils.knownAddresses(NetworkId.Zabanet).then(
    (x) => x.componentAddresses.faucet,
  );

export const submitTx =
  (tx: Transaction) => (compiledTransaction: string | Uint8Array) =>
    tx.innerClient.transactionSubmit({
      transactionSubmitRequest: {
        notarized_transaction_hex:
          typeof compiledTransaction == "string"
            ? compiledTransaction
            : Convert.Uint8Array.toHexString(compiledTransaction),
      },
    });
