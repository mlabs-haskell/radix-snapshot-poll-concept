"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var fs_1 = require("fs");
var bip_1 = require("./bip");
var radix_engine_toolkit_1 = require("@radixdlt/radix-engine-toolkit");
var babylon_core_api_sdk_1 = require("@radixdlt/babylon-core-api-sdk");
var babylon_gateway_api_sdk_1 = require("@radixdlt/babylon-gateway-api-sdk");
var gatewayBaseUrl = "https://rcnet-v2.radixdlt.com";
var votePackageAddr = "package_tdx_d_1p4dfl5futstan4685698g9czuc6x9qwk7042rvuykz6fh04z7danm3";
var voteComponentAddr = "component_tdx_d_1czp3kwtwjpkcj0m6umyh6xuzm48ycp97f483szz4nft7q8cxwtj56e";
var adminVoteResourceAddr = "resource_tdx_d_1t564wm6t9tnvg2h448yz66wvwz8lu34r976a4s4qz5ncsasjde365j";
var actors = {
    admin: new radix_engine_toolkit_1.PrivateKey.Secp256k1("1e98ffa135c23318e461b682eaae8c8312ce154b3cf2ac068a12d8646eea5429"),
    user1: new radix_engine_toolkit_1.PrivateKey.Secp256k1("aead13499d1c8c030af68400bd1ec1a6f95e3e0a48d145bbf0a350952b24d467"),
    user2: new radix_engine_toolkit_1.PrivateKey.Secp256k1("cda4e10bd9505b9849a999cbea4832c378647d97fd355c4392f2ea701d434c26"),
    test: new radix_engine_toolkit_1.PrivateKey.Ed25519("174e1e288d72d81eba48482a6559761c64d5bf702edd902b9f2bc2e689717062")
};
var voteCode = (function () {
    var fileBuffer = (0, fs_1.readFileSync)("./simple_vote.wasm");
    return new Uint8Array(fileBuffer);
})();
var voteSchema = (function () {
    var fileBuffer = (0, fs_1.readFileSync)("./simple_vote.rpd");
    return new Uint8Array(fileBuffer);
})();
var faucet = "component_tdx_d_1cptxxxxxxxxxfaucetxxxxxxxxx000527798379xxxxxxxxxdrq597";
var getCurrentEpoch = function (statusApi) {
    return statusApi.gatewayStatus().then(function (o) { return o.ledger_state.epoch; });
};
var submitTransaction = function (transactionApi, compiledTransaction) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, transactionApi.transactionSubmit({
                transactionSubmitRequest: {
                    notarized_transaction_hex: radix_engine_toolkit_1.Convert.Uint8Array.toHexString(compiledTransaction),
                },
            })];
    });
}); };
var getTransactionStatus = function (transactionApi, transactionId) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, transactionApi.transactionStatus({
                transactionStatusRequest: {
                    intent_hash_hex: radix_engine_toolkit_1.Convert.Uint8Array.toHexString(transactionId),
                },
            })];
    });
}); };
var getTransactionResult = function (transactionApi, transactionId) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, transactionApi.transactionCommittedDetails({
                transactionCommittedDetailsRequest: {
                    intent_hash_hex: radix_engine_toolkit_1.Convert.Uint8Array.toHexString(transactionId),
                },
            })];
    });
}); };
var createFungibleResource = function (prvKey, txApi, statusApi, tkName, tkSymbol, receiver) { return __awaiter(void 0, void 0, void 0, function () {
    var manifest, currentEpoch, txHeader, tx, txCompiled;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                manifest = new radix_engine_toolkit_1.ManifestBuilder()
                    .createFungibleResourceWithInitialSupply(new radix_engine_toolkit_1.ManifestAstValue.Bool(true), new radix_engine_toolkit_1.ManifestAstValue.U8(1), new radix_engine_toolkit_1.ManifestAstValue.Map(radix_engine_toolkit_1.ManifestAstValue.Kind.String, radix_engine_toolkit_1.ManifestAstValue.Kind.String, [
                    [new radix_engine_toolkit_1.ManifestAstValue.String("name"), new radix_engine_toolkit_1.ManifestAstValue.String(tkName)],
                    [new radix_engine_toolkit_1.ManifestAstValue.String("symbol"), new radix_engine_toolkit_1.ManifestAstValue.String(tkSymbol)],
                ]), new radix_engine_toolkit_1.ManifestAstValue.Map(radix_engine_toolkit_1.ManifestAstValue.Kind.Enum, radix_engine_toolkit_1.ManifestAstValue.Kind.Tuple, []), new radix_engine_toolkit_1.ManifestAstValue.Decimal(50))
                    .callMethod(receiver, "try_deposit_batch_or_abort", [
                    radix_engine_toolkit_1.ManifestAstValue.Expression.entireWorktop()
                ])
                    .build();
                return [4 /*yield*/, getCurrentEpoch(statusApi)];
            case 1:
                currentEpoch = _a.sent();
                txHeader = new radix_engine_toolkit_1.TransactionHeader(radix_engine_toolkit_1.NetworkId.Ansharnet, currentEpoch, currentEpoch + 50, (0, radix_engine_toolkit_1.generateRandomNonce)(), prvKey.publicKey(), false, 0);
                return [4 /*yield*/, radix_engine_toolkit_1.TransactionBuilder.new().then(function (builder) {
                        return builder.header(txHeader).manifest(manifest).notarize(prvKey);
                    })];
            case 2:
                tx = _a.sent();
                return [4 /*yield*/, tx.compile()];
            case 3:
                txCompiled = _a.sent();
                return [4 /*yield*/, submitTransaction(txApi, txCompiled)];
            case 4:
                _a.sent();
                return [4 /*yield*/, tx.transactionId()];
            case 5: return [2 /*return*/, _a.sent()];
        }
    });
}); };
var submitFaucetTransaction = function (prvKey, txApi, statusApi) { return __awaiter(void 0, void 0, void 0, function () {
    var pubKey, myAddress, faucetComponentAddress, fundManifest, currentEpoch, txHeader, tx, txCompiled;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                pubKey = prvKey.publicKey();
                return [4 /*yield*/, radix_engine_toolkit_1.ManifestAstValue.Address.virtualAccountAddress(pubKey, radix_engine_toolkit_1.NetworkId.Ansharnet)];
            case 1:
                myAddress = _a.sent();
                return [4 /*yield*/, radix_engine_toolkit_1.ManifestAstValue.Address.faucetComponentAddress(radix_engine_toolkit_1.NetworkId.Ansharnet)];
            case 2:
                faucetComponentAddress = _a.sent();
                fundManifest = new radix_engine_toolkit_1.ManifestBuilder()
                    .callMethod(faucet, "lock_fee", [new radix_engine_toolkit_1.ManifestAstValue.Decimal(25)])
                    .callMethod(faucet, "free", [])
                    .callMethod(myAddress, "try_deposit_batch_or_abort", [
                    radix_engine_toolkit_1.ManifestAstValue.Expression.entireWorktop(),
                ])
                    .build();
                return [4 /*yield*/, getCurrentEpoch(statusApi)];
            case 3:
                currentEpoch = _a.sent();
                txHeader = new radix_engine_toolkit_1.TransactionHeader(radix_engine_toolkit_1.NetworkId.Ansharnet, currentEpoch, currentEpoch + 50, (0, radix_engine_toolkit_1.generateRandomNonce)(), pubKey, false, 0);
                return [4 /*yield*/, radix_engine_toolkit_1.TransactionBuilder.new().then(function (builder) {
                        return builder.header(txHeader).manifest(fundManifest).notarize(prvKey);
                    })];
            case 4:
                tx = _a.sent();
                return [4 /*yield*/, tx.compile()];
            case 5:
                txCompiled = _a.sent();
                return [4 /*yield*/, submitTransaction(txApi, txCompiled)];
            case 6:
                _a.sent();
                return [4 /*yield*/, tx.transactionId()];
            case 7: return [2 /*return*/, _a.sent()];
        }
    });
}); };
var getAddress = function (prvKey) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, radix_engine_toolkit_1.ManifestAstValue.Address.virtualAccountAddress(prvKey.publicKey(), radix_engine_toolkit_1.NetworkId.Ansharnet)];
            case 1: return [2 /*return*/, _a.sent()];
        }
    });
}); };
var printAddresses = function () { return __awaiter(void 0, void 0, void 0, function () {
    var _a, _b;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _b = (_a = console).log;
                return [4 /*yield*/, (function () { return Promise.all(Object.entries(actors).map(function (_a) {
                        var key = _a[0], value = _a[1];
                        return getAddress(value).then(function (a) { return [key, a]; });
                    })); }
                    //   ({
                    //   admin: await getAddress(actors.admin),
                    //   user1: await getAddress(actors.user1),
                    //   user2: await getAddress(actors.user2),
                    // })
                    )()];
            case 1: return [2 /*return*/, _b.apply(_a, [_c.sent()])];
        }
    });
}); };
var delay = function (ms) { return new Promise(function (resolve) { return setTimeout(resolve, ms); }); };
var waitUntilSuccessfull = function (txApi, txId) { return __awaiter(void 0, void 0, void 0, function () {
    return __generator(this, function (_a) {
        return [2 /*return*/, getTransactionStatus(txApi, txId).then(function (txStatus) {
                return txStatus.status == "Pending"
                    ? delay(1000).then(function () {
                        console.log(txStatus);
                        return waitUntilSuccessfull(txApi, txId);
                    })
                    : txStatus;
            })];
    });
}); };
var publishVote = function (prvKey, txApi, statusApi, voteCode, voteSchema) { return __awaiter(void 0, void 0, void 0, function () {
    var pubKey, myAddress, manifest, currentEpoch, txHeader, tx, txCompiled;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                pubKey = prvKey.publicKey();
                return [4 /*yield*/, radix_engine_toolkit_1.ManifestAstValue.Address.virtualAccountAddress(pubKey, radix_engine_toolkit_1.NetworkId.Ansharnet)];
            case 1:
                myAddress = _a.sent();
                manifest = new radix_engine_toolkit_1.ManifestBuilder()
                    .callMethod(myAddress, "lock_fee", [new radix_engine_toolkit_1.ManifestAstValue.Decimal(25)])
                    .publishPackage(voteCode, voteSchema, new radix_engine_toolkit_1.ManifestAstValue.Map(radix_engine_toolkit_1.ManifestAstValue.Kind.String, radix_engine_toolkit_1.ManifestAstValue.Kind.Tuple))
                    .callMethod(myAddress, "try_deposit_batch_or_abort", [
                    radix_engine_toolkit_1.ManifestAstValue.Expression.entireWorktop(),
                ])
                    .build();
                return [4 /*yield*/, getCurrentEpoch(statusApi)];
            case 2:
                currentEpoch = _a.sent();
                txHeader = new radix_engine_toolkit_1.TransactionHeader(radix_engine_toolkit_1.NetworkId.Ansharnet, currentEpoch, currentEpoch + 50, (0, radix_engine_toolkit_1.generateRandomNonce)(), pubKey, false, 0);
                return [4 /*yield*/, radix_engine_toolkit_1.TransactionBuilder.new().then(function (builder) {
                        return builder.header(txHeader).manifest(manifest).notarize(prvKey);
                    })];
            case 3:
                tx = _a.sent();
                return [4 /*yield*/, tx.compile()];
            case 4:
                txCompiled = _a.sent();
                return [4 /*yield*/, submitTransaction(txApi, txCompiled)];
            case 5:
                _a.sent();
                return [4 /*yield*/, tx.transactionId()];
            case 6: return [2 /*return*/, _a.sent()];
        }
    });
}); };
var submitInitVote = function (prvKey, txApi, statusApi, votePackageAddr) { return __awaiter(void 0, void 0, void 0, function () {
    var pubKey, myAddress, manifest, currentEpoch, txHeader, tx, txCompiled;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                pubKey = prvKey.publicKey();
                return [4 /*yield*/, radix_engine_toolkit_1.ManifestAstValue.Address.virtualAccountAddress(pubKey, radix_engine_toolkit_1.NetworkId.Ansharnet)];
            case 1:
                myAddress = _a.sent();
                manifest = new radix_engine_toolkit_1.ManifestBuilder()
                    .callMethod(myAddress, "lock_fee", [new radix_engine_toolkit_1.ManifestAstValue.Decimal(25)])
                    .callFunction(votePackageAddr, "Vote", "instantiate_vote", [
                    new radix_engine_toolkit_1.ManifestAstValue.String("Test Org 1"),
                ])
                    .callMethod(myAddress, "try_deposit_batch_or_abort", [
                    radix_engine_toolkit_1.ManifestAstValue.Expression.entireWorktop(),
                ])
                    .build();
                return [4 /*yield*/, getCurrentEpoch(statusApi)];
            case 2:
                currentEpoch = _a.sent();
                txHeader = new radix_engine_toolkit_1.TransactionHeader(radix_engine_toolkit_1.NetworkId.Ansharnet, currentEpoch, currentEpoch + 50, (0, radix_engine_toolkit_1.generateRandomNonce)(), pubKey, false, 0);
                return [4 /*yield*/, radix_engine_toolkit_1.TransactionBuilder.new().then(function (builder) {
                        return builder
                            .header(txHeader)
                            .manifest(manifest)
                            // admin needs to be a signer for the Account to allow 'lock_fee'
                            .sign(prvKey)
                            .notarize(prvKey);
                    })];
            case 3:
                tx = _a.sent();
                return [4 /*yield*/, tx.compile()];
            case 4:
                txCompiled = _a.sent();
                return [4 /*yield*/, submitTransaction(txApi, txCompiled)];
            case 5:
                _a.sent();
                return [4 /*yield*/, tx.transactionId()];
            case 6: return [2 /*return*/, _a.sent()];
        }
    });
}); };
var becomeMember = function (prvKey, txApi, statusApi, voteComponentAddr, adminResourceAddr, userAddr) { return __awaiter(void 0, void 0, void 0, function () {
    var pubKey, myAddress, manifest, currentEpoch, txHeader, tx, txCompiled;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                pubKey = prvKey.publicKey();
                return [4 /*yield*/, radix_engine_toolkit_1.ManifestAstValue.Address.virtualAccountAddress(pubKey, radix_engine_toolkit_1.NetworkId.Ansharnet)];
            case 1:
                myAddress = _a.sent();
                manifest = new radix_engine_toolkit_1.ManifestBuilder()
                    .callMethod(faucet, "lock_fee", [new radix_engine_toolkit_1.ManifestAstValue.Decimal(25)])
                    .callMethod(myAddress, "create_proof_of_amount", [
                    new radix_engine_toolkit_1.ManifestAstValue.Address(adminResourceAddr),
                    new radix_engine_toolkit_1.ManifestAstValue.Decimal(1),
                ])
                    .callMethod(voteComponentAddr, "become_member", [])
                    .callMethod(userAddr, "try_deposit_batch_or_abort", [
                    radix_engine_toolkit_1.ManifestAstValue.Expression.entireWorktop(),
                ])
                    .build();
                return [4 /*yield*/, getCurrentEpoch(statusApi)];
            case 2:
                currentEpoch = _a.sent();
                txHeader = new radix_engine_toolkit_1.TransactionHeader(radix_engine_toolkit_1.NetworkId.Ansharnet, currentEpoch, currentEpoch + 50, (0, radix_engine_toolkit_1.generateRandomNonce)(), pubKey, false, 0);
                return [4 /*yield*/, radix_engine_toolkit_1.TransactionBuilder.new().then(function (builder) {
                        return builder
                            .header(txHeader)
                            .manifest(manifest)
                            // admin needs to be a signer for the Account to allow 'lock_fee'
                            .sign(prvKey)
                            .notarize(prvKey);
                    })];
            case 3:
                tx = _a.sent();
                return [4 /*yield*/, tx.compile()];
            case 4:
                txCompiled = _a.sent();
                return [4 /*yield*/, submitTransaction(txApi, txCompiled)];
            case 5:
                _a.sent();
                return [4 /*yield*/, tx.transactionId()];
            case 6: return [2 /*return*/, _a.sent()];
        }
    });
}); };
var main = function () { return __awaiter(void 0, void 0, void 0, function () {
    var apiCfg, statusApi, txApi, streamApi, stateApi, coreClient, _a, _b, r, _c, _d, _e, cr;
    var _f, _g;
    return __generator(this, function (_h) {
        switch (_h.label) {
            case 0:
                apiCfg = new babylon_gateway_api_sdk_1.Configuration({
                    basePath: gatewayBaseUrl,
                });
                statusApi = new babylon_gateway_api_sdk_1.StatusApi(apiCfg);
                txApi = new babylon_gateway_api_sdk_1.TransactionApi(apiCfg);
                streamApi = new babylon_gateway_api_sdk_1.StreamApi(apiCfg);
                stateApi = new babylon_gateway_api_sdk_1.StateApi(apiCfg);
                return [4 /*yield*/, babylon_core_api_sdk_1.CoreApiClient.initialize({
                        basePath: "http://127.0.0.1:3333/core",
                        logicalNetworkName: "ansharnet",
                    })];
            case 1:
                coreClient = _h.sent();
                printAddresses();
                // const r = await coreClient.state.innerClient.stateAccountPost({
                //   stateAccountRequest: {
                //     network: "ansharnet",
                //     account_address:(await getAddress(actors.user1)).value,
                //   }
                // })
                _b = (_a = console).log;
                return [4 /*yield*/, getCurrentEpoch(statusApi)];
            case 2:
                // const r = await coreClient.state.innerClient.stateAccountPost({
                //   stateAccountRequest: {
                //     network: "ansharnet",
                //     account_address:(await getAddress(actors.user1)).value,
                //   }
                // })
                _b.apply(_a, [_h.sent()]);
                _d = (_c = stateApi).stateEntityDetails;
                _f = {};
                _g = {};
                _e = [
                    // "resource_tdx_d_1n2p5gq2f7g00ag2ndug0983s2xy7kq8esdvumf3mvelt5kn7jehr8v",
                    "account_tdx_d_12xs46zcft32snejqeh5q3kudppna7vx4eu6rjqdnk70sazgrx3nppp"];
                return [4 /*yield*/, getAddress(actors.user1)];
            case 3:
                _e = _e.concat([
                    (_h.sent()).value
                ]);
                return [4 /*yield*/, getAddress(actors.user2)];
            case 4:
                _e = _e.concat([
                    (_h.sent()).value
                ]);
                return [4 /*yield*/, getAddress(actors.admin)];
            case 5: return [4 /*yield*/, _d.apply(_c, [(_f.stateEntityDetailsRequest = (_g.addresses = _e.concat([
                        (_h.sent()).value
                    ]),
                        _g),
                        _f)])];
            case 6:
                r = _h.sent();
                return [4 /*yield*/, createFungibleResource(actors.admin, txApi, statusApi, "SnapshotGov1", "SG1", "account_tdx_d_12yy5c6um2nlhnkp504ul3dq62ecv29g3tmpzj2l56w7lfdhcgwqf35")];
            case 7:
                cr = _h.sent();
                console.log(cr);
                // const r = await stateApi.entityNonFungiblesPage({
                //   stateEntityNonFungiblesPageRequest: {
                //     address: (await getAddress(actors.user1)).value,
                //   },
                // });
                // const r = await stateApi.nonFungibleIds({
                //   stateNonFungibleIdsRequest: {
                //     resource_address: "resource_tdx_d_1n2p5gq2f7g00ag2ndug0983s2xy7kq8esdvumf3mvelt5kn7jehr8v",
                //   }
                // })
                // const r = await stateApi.nonFungibleData({
                //   stateNonFungibleDataRequest: {
                //     resource_address: "resource_tdx_d_1n2p5gq2f7g00ag2ndug0983s2xy7kq8esdvumf3mvelt5kn7jehr8v",
                //     non_fungible_ids: [
                //       "{7e8bdbd2cf231059-7ba24f1c2b6ff067-89c58903e50e160b-e0f6b57e292d90b7}"
                //     ]
                //   }
                // })
                (0, fs_1.writeFileSync)("response.json", JSON.stringify(r, null, 2));
                return [2 /*return*/];
        }
    });
}); };
// console.log(((await getTransactionResult(txApi, Convert.Uint8Array.from("3b0f5ab144ff554e9c304f984b3c18f150935367b6d4f780ae9d579b482f1c39"))).transaction.receipt?.output as any[])[1].programmatic_json.fields)
// let manifest = new ManifestBuilder()
//   .callMethod(
//     "account_sim1q3cztnp4h232hsfmu0j63f7f7mz5wxhd0n0hqax6smjqznhzrp",
//     "withdraw",
//     [
//       new ManifestAstValue.Address(
//         "resource_sim1qf7mtmy9a6eczv9km4j4ul38cfvap0zy6juuj8m8xnxqlla6pd"
//       ),
//       new ManifestAstValue.Decimal(10),
//     ]
//   )
//   .takeAllFromWorktop(
//     "resource_sim1qf7mtmy9a6eczv9km4j4ul38cfvap0zy6juuj8m8xnxqlla6pd",
//     (builder, bucket) =>
//       builder.callMethod(
//         "account_sim1qs5mg6tcehg95mugc9d3lpl90clnl787zmhc92cf04wqvqvztr",
//         "try_deposit_or_abort",
//         [bucket]
//       )
//   )
//   .build();
//
// console.log(manifest.toString());
var findPath = function () { return __awaiter(void 0, void 0, void 0, function () {
    var coinIds, extras, accounts, changes, ks, target, kStr, prv, addr;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                coinIds = ["0", "1", "1022"];
                extras = [0, 2000];
                accounts = ["0"];
                changes = ["0"];
                ks = ["0"];
                target = "account_tdx_d_12xs46zcft32snejqeh5q3kudppna7vx4eu6rjqdnk70sazgrx3nppp";
                return [4 /*yield*/, (0, bip_1.testDerive)()
                    // const k = testDeriveOld(`m/44'/1022'/0'/0'/0'`)
                    // console.log(n.privateKey?.toString())
                ];
            case 1:
                kStr = _a.sent();
                // const k = testDeriveOld(`m/44'/1022'/0'/0'/0'`)
                // console.log(n.privateKey?.toString())
                console.log(kStr);
                if (!kStr) return [3 /*break*/, 3];
                prv = new radix_engine_toolkit_1.PrivateKey.Ed25519(kStr.slice(2));
                return [4 /*yield*/, getAddress(prv)];
            case 2:
                addr = _a.sent();
                console.log(addr.value);
                _a.label = 3;
            case 3: return [2 /*return*/];
        }
    });
}); };
// findPath()
// main()
