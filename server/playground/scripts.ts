import { writeFileSync } from "fs";
import {
  ManifestBuilder,
  PrivateKey,
  NetworkId,
  TransactionBuilder,
  TransactionHeader,
  generateRandomNonce,
  Convert,
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
  TransactionManifest,
} from "@radixdlt/radix-engine-toolkit";
import {
  GatewayApiClient,
  Status,
  Transaction,
  TransactionCommittedDetailsResponse,
  TransactionStatusResponse,
} from "@radixdlt/babylon-gateway-api-sdk";

let gatewayBaseUrl = "https://rcnet-v3.radixdlt.com";

let actors = {
  admin: new PrivateKey.Secp256k1(
    "1e98ffa135c23318e461b682eaae8c8312ce154b3cf2ac068a12d8646eea5429",
  ),
  user1: new PrivateKey.Secp256k1(
    "aead13499d1c8c030af68400bd1ec1a6f95e3e0a48d145bbf0a350952b24d467",
  ),
  user2: new PrivateKey.Secp256k1(
    "cda4e10bd9505b9849a999cbea4832c378647d97fd355c4392f2ea701d434c26",
  ),
  test: new PrivateKey.Ed25519(
    "174e1e288d72d81eba48482a6559761c64d5bf702edd902b9f2bc2e689717062",
  ),
};

const getCurrentEpoch = (status: Status) =>
  status.getCurrent().then((o) => o.ledger_state.epoch);

const faucetAddr = () =>
  RadixEngineToolkit.Utils.knownAddresses(NetworkId.Zabanet).then(
    (x) => x.componentAddresses.faucet,
  );

const submitTx =
  (tx: Transaction) => (compiledTransaction: string | Uint8Array) =>
    tx.innerClient.transactionSubmit({
      transactionSubmitRequest: {
        notarized_transaction_hex:
          typeof compiledTransaction == "string"
            ? compiledTransaction
            : Convert.Uint8Array.toHexString(compiledTransaction),
      },
    });

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
    const myAddress = await getAddress(actors.admin);
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
    const myAddress = await getAddress(actors.admin);
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

const submitTxManifest =
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
        .sign(actors.admin)
        .notarize(prvKey),
    );
    const txId = await RadixEngineToolkit.NotarizedTransaction.intentHash(tx);
    const compiledTx = await RadixEngineToolkit.NotarizedTransaction.compile(
      tx,
    );
    await submitTx(gapi.transaction)(compiledTx);
    return txId;
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
    // const compiledTx = await SimpleTransactionBuilder.freeXrdFromFaucet({
    //   networkId: NetworkId.Zabanet,
    //   toAccount: await getAddress(prvKey),
    //   validFromEpoch: await getCurrentEpoch(statusApi),
    // })

    // await submitTransaction(txApi, compiledTx.toByteArray());
    // return compiledTx.transactionId;

    // Manual implementation for reference
    let pubKey = prvKey.publicKey();
    let myAddress =
      await RadixEngineToolkit.Derive.virtualAccountAddressFromPublicKey(
        pubKey,
        NetworkId.Zabanet,
      );
    receiver = receiver || myAddress;
    const fundManifest = new ManifestBuilder()
      .callMethod(await faucetAddr(), "lock_fee", [decimal(25)])
      .callMethod(await faucetAddr(), "free", [])
      .callMethod(receiver, "try_deposit_batch_or_abort", [
        expression("EntireWorktop"),
        enumeration(0),
      ])
      .build();
    return submitTxManifest(gapi)(prvKey)(fundManifest);
  };

const getAddress = async (prvKey: PrivateKey) =>
  RadixEngineToolkit.Derive.virtualAccountAddressFromPublicKey(
    prvKey.publicKey(),
    NetworkId.Zabanet,
  );

const printAddresses = async () =>
  console.log(
    await (() =>
      Promise.all(
        Object.entries(actors).map(([key, value]) =>
          getAddress(value).then((a) => [key, a]),
        ),
      ))(),
  );

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const waitUntilSuccessfull =
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

// const publishVote = async (
//   prvKey: PrivateKey,
//   txApi: TransactionApi,
//   statusApi: StatusApi,
//   voteCode: Uint8Array,
//   voteSchema: Uint8Array,
// ) => {
//   let pubKey = prvKey.publicKey();
//   let myAddress = await getAddress(prvKey);
//
//   // let ins: Instructions[] = [
//   //   { kind: "String"
//   //     value:
//   //   }
//   // ]
//
//   // let x = RadixEngineToolkit.Instructions.convert()
//
//   const manifest = new ManifestBuilder()
//     .callMethod(myAddress, "lock_fee", [decimal(25)])
//     .publishPackage(
//       voteCode,
//       voteSchema,
//       new ManifestAstValue.Map(
//         ManifestAstValue.Kind.String,
//         ManifestAstValue.Kind.Tuple,
//       ),
//     )
//     .callMethod(myAddress, "try_deposit_batch_or_abort", [
//       ManifestAstValue.Expression.entireWorktop(),
//     ])
//     .build();
//   let currentEpoch = await getCurrentEpoch(statusApi);
//   let txHeader = new TransactionHeader(
//     NetworkId.Zabanet,
//     currentEpoch,
//     currentEpoch + 50,
//     generateRandomNonce(),
//     pubKey,
//     false,
//     0,
//   );
//   let tx = await TransactionBuilder.new().then((builder) =>
//     builder.header(txHeader).manifest(manifest).notarize(prvKey),
//   );
//   let txCompiled = await tx.compile();
//   await submitTransaction(txApi, txCompiled);
//   return await tx.transactionId();
// };

const submitInitVote =
  (gapi: GatewayApiClient) =>
  (prvKey: PrivateKey) =>
  async (votePackageAddr: string) => {
    let pubKey = prvKey.publicKey();
    let myAddress = await getAddress(prvKey);
    const manifest = new ManifestBuilder()
      .callMethod(myAddress, "lock_fee", [decimal(25)])
      .callFunction(votePackageAddr, "Vote", "instantiate_vote", [
        str("Test Org 1"),
      ])
      .callMethod(myAddress, "try_deposit_batch_or_abort", [
        expression("EntireWorktop"),
      ])
      .build();
    return submitTxManifest(gapi)(prvKey)(manifest);
  };

const becomeMember =
  (gapi: GatewayApiClient) =>
  (prvKey: PrivateKey) =>
  async (
    voteComponentAddr: string,
    adminResourceAddr: string,
    userAddr: string,
  ) => {
    let pubKey = prvKey.publicKey();
    let myAddress = await getAddress(prvKey);
    let faucetComponentAddress = await RadixEngineToolkit.Utils.knownAddresses(
      NetworkId.Zabanet,
    ).then((x) => x.componentAddresses.faucet);
    const manifest = new ManifestBuilder()
      .callMethod(await faucetAddr(), "lock_fee", [decimal(25)])
      .callMethod(myAddress, "create_proof_of_amount", [
        address(adminResourceAddr),
        decimal(1),
      ])
      .callMethod(voteComponentAddr, "become_member", [])
      .callMethod(userAddr, "try_deposit_batch_or_abort", [
        expression("EntireWorktop"),
      ])
      .build();
    return submitTxManifest(gapi)(prvKey)(manifest);
  };

const main = async () => {
  const gapi = GatewayApiClient.initialize({
    basePath: gatewayBaseUrl,
    applicationName: "Snapshot Polling Concept",
  });

  printAddresses();

  // const fr = await submitFaucetTransaction(actors.admin, txApi, statusApi, "account_tdx_e_1295y4zwa9hp5w4ffk3642l24rk2ex23uhuzlrtcfmudy8ccqzw0thg");
  // console.log(fr)

  await getCurrentEpoch(gapi.status).then((e) => console.log(e));

  // const cr = await createAndMintFungibleGovernanceToken(actors.admin, txApi, statusApi, "SnapshotGov1", "SG1", "account_tdx_e_1295y4zwa9hp5w4ffk3642l24rk2ex23uhuzlrtcfmudy8ccqzw0thg", 10)
  // console.log(cr)
  // await waitUntilSuccessfull(txApi, cr.id)
  // const res = await getTransactionDetails(txApi, "txid_tdx_e_1mvwnz03x7krxwpp3aywlkhhpfxkfkr875q2gq96zulutelwudups34ayt2")

  const txRes = await mintAndDistributeGovTokens(gapi)(actors.admin)(
    "SnapshotGov3",
    "SG3",
    10,
    [
      "account_tdx_e_1295y4zwa9hp5w4ffk3642l24rk2ex23uhuzlrtcfmudy8ccqzw0thg",
      "account_tdx_e_1299achkker3qzu362xlcry7h364955sakre0xvu9tv9gpu6x5ewzxj",
      "account_tdx_e_128emjdx9ctkjyc3d8qs50am2w6x6gc2d6yu6cwjwgfmnl8z26zaf25",
      "account_tdx_e_12xh6phmj4ngshz9nwncteqxjpslval00g32rxz2fhc6ce2v8t48200",
      "account_tdx_e_12x8tszjk2m96xjtlgksnan0nv0wtefgvuepsn0rau49hxww7gpnl55",
      "account_tdx_e_12y6mkylr8wudflrva8yeqwcn0lyv9q5ff8kcyr4rjw5wnl0kday5jp",
      "account_tdx_e_12xfav2w2z4073wj9fenppt3n9sfq5v7u3dxcd522xsk3d5sk8hmydt",
      "account_tdx_e_129kv7n4dlc0lhnuwpxsvdkccy9zgqy4j650tugel9gulhrs39ctcxf",
      "account_tdx_e_12yfrc35qy5vwcy5rtlaadcdg8vy29h2ktaqlqw8e9gql8ac0fua6j5",
      "account_tdx_e_12yeunuhfaullfugazu0lkyfrlj3neqssh0jyn4tucz4w6a9ym5zdnd",
    ],
  );
  await waitUntilSuccessfull(gapi.transaction)(txRes.id).then(console.log);

};

main();
