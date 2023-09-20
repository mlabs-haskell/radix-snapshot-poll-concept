import { ResultAsync } from "neverthrow";

export type TokenAddress = string;
export type OwnerAddress = string;
export type StateVersion = number;

export interface LedgerState {
  stateVersion: number,
  epoch: number,
  roundInEpoch: number
}

export interface BalanceInfo {
  tokenAddress: TokenAddress,
  ownerAddress: OwnerAddress,
  fromStateVersion: StateVersion,
  balance: number
}

export class Snapshot {
  readonly stateVersion: number;
  accountsInfo: Map<OwnerAddress, BalanceInfo>;
  private knownOwners = new Set();

  private constructor(stateVersion: number) {
    this.stateVersion = stateVersion;
    this.accountsInfo = new Map();
  }

  size(): number {
    return this.accountsInfo.size
  }

  addBalance(balance: BalanceInfo): this {
    this.checkConsistency(balance);
    this.knownOwners.add(balance.ownerAddress);
    this.accountsInfo.set(balance.ownerAddress, balance);
    return this;
  }

  static fromBalances(stateVersion: number, balances: BalanceInfo[]): Snapshot {
    return balances.reduce(
      (s, balanceInfo) => s.addBalance(balanceInfo),
      new Snapshot(stateVersion)
    );
  }

  getBalanceInfo(ownerAddress: OwnerAddress): BalanceInfo | undefined {
    return this.accountsInfo.get(ownerAddress);
  }
  balanceOf(ownerAddress: OwnerAddress): number | undefined {
    return this.getBalanceInfo(ownerAddress)?.balance;
  }

  private checkConsistency(balance: BalanceInfo) {
    // check that all queried balances have correct state version
    if (balance.fromStateVersion > this.stateVersion) {
      throw new Error(`Balance info has higher state version than snapshot: ${balance.fromStateVersion} vs. ${this.stateVersion}.
      Something went very wrong.`);
    }

    // check there are no duplicate accounts in the snapshot - should not happen
    if (this.knownOwners.has(balance.ownerAddress)) {
      throw new Error(`Duplicated token owner address in the snapshot: ${balance.ownerAddress}`)
    }
  }
}

export interface Snapshots {

  makeSnapshotV1(tokenAddress: string, stateVersion: number): ResultAsync<Snapshot, Error>

  /** Accepts list of addresses */
  makeSnapshotV2(tokenAddress: string, stateVersion: number, owners: OwnerAddress[]): ResultAsync<Snapshot, Error>

  currentState(): ResultAsync<LedgerState, Error>

  ownerKeys(ownerAddress: OwnerAddress): ResultAsync<Uint8Array, Error>
}
