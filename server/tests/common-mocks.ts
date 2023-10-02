import { ResultAsync, okAsync } from "neverthrow";
import { Snapshoter } from "../src/loaders/services";
import { Snapshot } from "snapshoter/build/types";
import { BALANCE_DECIMALS } from "../src/services/verify-voters";
import { Poll, Vote, addVote, newPoll } from "../src/domain/types";

const testVotes: Vote[] = [
  { id: "0", voter: "a0", vote: 'yes' },
  { id: "1", voter: "a1", vote: 'yes' },
  { id: "2", voter: "a2", vote: 'no' },
  { id: "3", voter: "a3", vote: 'no' },
  { id: "4", voter: "a4", vote: 'yes' },
  { id: "5", voter: "a5", vote: 'yes' },
];

export const mkEmptyPoll = (closingTime: number) => newPoll(
  "Org",
  "Title",
  "Description",
  { resourceAddress: "resource_address", weight: 1, powerFormula: 'linear' },
  closingTime
);

export const mkTestPoll =  (closingTime: number) => 
  testVotes.reduce((poll, vote) => addVote(poll, vote), mkEmptyPoll(closingTime));

export const testState = { epoch: 11, roundInEpoch: 12, stateVersion: 13 };

export const testShapshoter: Snapshoter = {
  currentState: () => okAsync(testState),
  snapshotResourceBalancesByAddress: function (_: string, __: number, ___: string[]): ResultAsync<Snapshot, Error> {
    return okAsync(testSnapshot);
  },
  snapshotResourceBalances: function (_: string, __: number): ResultAsync<Snapshot, Error> {
    throw new Error("Function not implemented.");
  },
  ownerKeys: function (_: string): ResultAsync<Uint8Array, Error> {
    throw new Error("Function not implemented.");
  }
}

const testSnapshot: Snapshot = Snapshot.fromBalances(1,
  [{
    fromStateVersion: 1,
    ownerAddress: "a0",
    tokenAddress: "doesNotMatterMock",
    balance: 1 * BALANCE_DECIMALS
  },
  {
    fromStateVersion: 1,
    ownerAddress: "a1",
    tokenAddress: "doesNotMatterMock",
    balance: 1
  },
  {
    fromStateVersion: 1,
    ownerAddress: "a2",
    tokenAddress: "doesNotMatterMock",
    balance: 0
  },
  {
    fromStateVersion: 1,
    ownerAddress: "a3",
    tokenAddress: "doesNotMatterMock",
    balance: 13000 * BALANCE_DECIMALS
  },
  {
    fromStateVersion: 1,
    ownerAddress: "a4",
    tokenAddress: "doesNotMatterMock",
    balance: -1
  },
  ]
);