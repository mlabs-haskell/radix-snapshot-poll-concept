import {
  HardenedSLIP10Node,
  SLIP10Node,
} from "@metamask/key-tree";
import {
  NetworkId,
  PrivateKey,
  PublicKey,
  RadixEngineToolkit,
} from "@radixdlt/radix-engine-toolkit";

const getZabanetAddress = (pub: PublicKey) => RadixEngineToolkit.Derive.virtualAccountAddressFromPublicKey(pub, NetworkId.Zabanet);

export class RootAccount {

  constructor(private rootNode: SLIP10Node, private networkId = NetworkId.Zabanet) {}

  static async fromSeed(seed: string, networkId: number) {
    const ed25519Node = await SLIP10Node.fromDerivationPath({
      curve: "ed25519",
      derivationPath: [`bip39:${seed}`],
    });
    return new RootAccount(ed25519Node, networkId);
  }

  deriveChild(finalPath: number) {
    // m/44H/1022H/14H/525H/1460H/2H
    // path corresponds to samples taken from the preview wallet.
    const finalNode: HardenedSLIP10Node = `slip10:${finalPath}'`;
    return this.rootNode.derive([
      `slip10:44'`, // purpose
      `slip10:1022'`, // coin id
      `slip10:14'`, // probably network id
      `slip10:525'`, // unsure
      `slip10:1460'`, // unsure
      finalNode, // account index
    ]);
  }
  
  async getPrivateKey(accountIndex: number) {
    const prv = (await this.deriveChild(accountIndex)).privateKey;
    if (!prv) throw new Error("no private key");
    return new PrivateKey.Ed25519(prv.slice(2));
  }

  async getBech32Address(accountIndex :number) {
    const pub = (await this.getPrivateKey(accountIndex)).publicKey();
    return await RadixEngineToolkit.Derive.virtualAccountAddressFromPublicKey(pub, this.networkId);
  }
  
  async deriveAccountKeys(n: number) {
    return Promise.all(Array.from(Array(n).keys()).map((i) => this.getPrivateKey(i)));
  }

  async deriveAddresses(n: number) {
    return Promise.all(Array.from(Array(n).keys()).map((i) => this.getBech32Address(i)));
  }
}
