import { writeFileSync } from "fs";
import {
  ManifestBuilder,
  PrivateKey,
  NetworkId,
  bool,
  address,
  decimal,
  expression,
  RadixEngineToolkit,
  str,
  enumeration,
  u8,
  map,
  tuple,
  ValueKind,
  bucket,
  SimpleTransactionBuilder,
} from "@radixdlt/radix-engine-toolkit";
import {
  GatewayApiClient,
  Status,
  Transaction,
  TransactionCommittedDetailsResponse,
  TransactionStatusResponse,
} from "@radixdlt/babylon-gateway-api-sdk";
import { RootAccount } from "./account";
import { faucetAddr, getAddress, getCurrentEpoch, submitTx, submitTxManifest, waitUntilSuccessfull } from "./utils";

const getTransactionStatus =
  (tx: Transaction) =>
  (transactionId: string): Promise<TransactionStatusResponse> =>
    tx.getStatus(transactionId);

const getTransactionDetails =
  (tx: Transaction) =>
  async (transactionId: string): Promise<TransactionCommittedDetailsResponse> =>
    tx.getCommittedDetails(transactionId);

const distributeGovTokens =
  (gapi: GatewayApiClient) =>
  (prvKey: PrivateKey) =>
  async (resourceAddress: string, supply: number, receivers: string[]) => {
    const myAddress = await getAddress(prvKey);
    const baseAmount = Math.floor(supply / receivers.length);
    const remainder = supply % receivers.length;
    const amounts = receivers.map((x, i) =>
      i < remainder
        ? { address: x, amount: baseAmount + 1 }
        : { address: x, amount: baseAmount },
    );
    const manifest = new ManifestBuilder()
      .callMethod(await faucetAddr(), "lock_fee", [decimal(30)])
      .callMethod(myAddress, "withdraw", [
        address(resourceAddress),
        decimal(supply),
      ]);
    amounts.forEach((x) =>
      manifest.takeFromWorktop(
        resourceAddress,
        decimal(x.amount).value,
        (b, bucketId) =>
          b.callMethod(x.address, "try_deposit_or_abort", [
            bucket(bucketId),
            enumeration(0),
          ]),
      ),
    );
    const builtManifest = manifest.build();
    return submitTxManifest(gapi)(prvKey)(builtManifest);
  };

const mintAndDistributeGovTokens =
  (gapi: GatewayApiClient) =>
  (prvKey: PrivateKey) =>
  async (
    tkName: string,
    tkSymbol: string,
    supply: number,
    receivers: string[],
  ) => {
    const myAddress = await getAddress(prvKey);
    const txRes = await createAndMintFungibleGovernanceToken(gapi)(prvKey)(
      tkName,
      tkSymbol,
      myAddress,
      supply,
    );
    await waitUntilSuccessfull(gapi.transaction)(txRes.id);
    const txDetails = await getTransactionDetails(gapi.transaction)(txRes.id);
    const newResourceAddress = (
      txDetails.transaction.receipt?.output as any[]
    )[1].programmatic_json.fields[0].value;
    // distribute
    return distributeGovTokens(gapi)(prvKey)(
      newResourceAddress,
      supply,
      receivers,
    );
  };


const createAndMintFungibleGovernanceToken =
  (gapi: GatewayApiClient) =>
  (prvKey: PrivateKey) =>
  async (
    tkName: string,
    tkSymbol: string,
    receiver: string,
    supply: number,
  ) => {
    const resourceManagerPkgAddr =
      await RadixEngineToolkit.Utils.knownAddresses(NetworkId.Zabanet).then(
        (x) => x.packageAddresses.resourcePackage,
      );
    const manifest = new ManifestBuilder()
      // schema from https://github.com/radixdlt/radixdlt-scrypto/blob/7eaf1ef0db106236eb050dcd47245bfdcf3c739f/radix-engine/src/blueprints/resource/fungible/fungible_resource_manager.rs#L471
      .callMethod(await faucetAddr(), "lock_fee", [decimal(25)])
      .callFunction(
        resourceManagerPkgAddr,
        "FungibleResourceManager",
        "create_with_initial_supply",
        [
          enumeration(0), // ownerrole
          bool(true),
          u8(0),
          decimal(supply),
          tuple(
            enumeration(
              1,
              tuple(
                enumeration(0), // minter (default is owner)
                enumeration(0), // mint updater defaults to denayall when none
              ),
            ), // mint roles some(owner)
            enumeration(0), // burn roles
            enumeration(0), // freeze roles
            enumeration(0), // recall roles
            enumeration(0), // withdraw roles
            enumeration(0), // deposit roles
          ),
          tuple(
            map(
              // metadata
              ValueKind.String,
              ValueKind.Tuple,
              [
                str("name"),
                tuple(enumeration(1, enumeration(0, str(tkName))), bool(true)),
              ],
              [
                str("symbol"),
                tuple(
                  enumeration(1, enumeration(0, str(tkSymbol))),
                  bool(true),
                ),
              ],
              [
                str("description"),
                tuple(
                  enumeration(1, enumeration(0, str("test description"))),
                  bool(true),
                ),
              ],
            ),
            map(
              // metadata roles
              ValueKind.String,
              ValueKind.Enum,
              // [str("metadata_setter"), enumeration(0)],
              // [str("metadata_setter_updater"), enumeration(0)],
              // [str("metadata_locker"), enumeration(0)],
              // [str("metadata_locker_updater"), enumeration(0)],
            ),
          ),
          enumeration(0), // no address reservation
        ],
      )
      .callMethod(receiver, "try_deposit_batch_or_abort", [
        expression("EntireWorktop"),
        enumeration(0),
      ])
      .build();

    return submitTxManifest(gapi)(prvKey)(manifest);
  };

const submitFaucetTransaction =
  (gapi: GatewayApiClient) =>
  (prvKey: PrivateKey) =>
  async (receiver?: string) => {
    const compiledTx = await SimpleTransactionBuilder.freeXrdFromFaucet({
      networkId: NetworkId.Zabanet,
      toAccount: await getAddress(prvKey),
      validFromEpoch: await getCurrentEpoch(gapi.status),
    })

    await submitTx(gapi.transaction)(compiledTx.toByteArray());
    return compiledTx.transactionId;

    // Manual implementation for reference
    // let pubKey = prvKey.publicKey();
    // let myAddress =
    //   await RadixEngineToolkit.Derive.virtualAccountAddressFromPublicKey(
    //     pubKey,
    //     NetworkId.Zabanet,
    //   );
    // receiver = receiver || myAddress;
    // const fundManifest = new ManifestBuilder()
    //   .callMethod(await faucetAddr(), "lock_fee", [decimal(25)])
    //   .callMethod(await faucetAddr(), "free", [])
    //   .callMethod(receiver, "try_deposit_batch_or_abort", [
    //     expression("EntireWorktop"),
    //     enumeration(0),
    //   ])
    //   .build();
    // return submitTxManifest(gapi)(prvKey)(fundManifest);
  };

const main = async () => {
  const gatewayBaseUrl = "https://rcnet-v3.radixdlt.com";
  const seed =
    "limb argue execute custom auto dinosaur bread convince shuffle sorry surprise peanut honey bird grocery nasty fury broom horse share tornado prize jaguar shoe";


  const gapi = GatewayApiClient.initialize({
    basePath: gatewayBaseUrl,
    applicationName: "Snapshot Polling Concept",
  });
   
  await getCurrentEpoch(gapi.status).then((e) => console.log(e));

  const r = await gapi.state.getEntityDetailsVaultAggregated('account_tdx_e_1295y4zwa9hp5w4ffk3642l24rk2ex23uhuzlrtcfmudy8ccqzw0thg')
  writeFileSync('response.json', JSON.stringify(r, null, 2))

  // const rootAccount = await RootAccount.fromSeed(seed, NetworkId.Zabanet);
  // const addresses = await rootAccount.deriveAddresses(10);
  // const mainPrvKey = await rootAccount.getPrivateKey(0);

  // const fr = await submitFaucetTransaction(gapi)(mainPrvKey)();
  // await waitUntilSuccessfull(gapi.transaction)(fr.id);
  // console.log(fr)


  // const cr = await createAndMintFungibleGovernanceToken(actors.admin, txApi, statusApi, "SnapshotGov1", "SG1", "account_tdx_e_1295y4zwa9hp5w4ffk3642l24rk2ex23uhuzlrtcfmudy8ccqzw0thg", 10)
  // console.log(cr)
  // await waitUntilSuccessfull(txApi, cr.id)
  // const res = await getTransactionDetails(txApi, "txid_tdx_e_1mvwnz03x7krxwpp3aywlkhhpfxkfkr875q2gq96zulutelwudups34ayt2")

  // console.log(addresses)

  // const txRes = await mintAndDistributeGovTokens(gapi)(actors.admin)(
  //   "SnapshotGov3",
  //   "SG3",
  //   10,
  //   addresses,
  // );
  // await waitUntilSuccessfull(gapi.transaction)(txRes.id).then(console.log);

};

main();
