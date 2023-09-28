import { ResultAsync, okAsync } from "neverthrow";
import { Vote, VoteToken } from "../src/domain/types";
import { Snapshoter } from "../src/loaders/services";
import { Snapshot } from "snapshoter/build/types";
import { BALANCE_DECIMALS, VerifyVoters } from "../src/services/verify-voters";

describe('Verify voters tests', () => {

  test('Verify voters', async () => {
    const verifyVoters = VerifyVoters(MOCK_SNAPSHOTER);
    const result = await verifyVoters(voteToken, VOTES);
    expect(result.isOk()).toBe(true);
    const verifiedVotes = result._unsafeUnwrap();
    expect(verifiedVotes.verifiedAt).toBe(EXPECTED_STATE);
    expect(verifiedVotes.votes[0].voter).toBe('a0');
    expect(verifiedVotes.votes[0].balance).toBe(1);
    expect(verifiedVotes.votes[1].voter).toBe('a3');
    expect(verifiedVotes.votes[1].balance).toBe(13000);
  });
});

const voteToken = VoteToken.new("doesNotMatterMock", 1);

const VOTES: Vote[] = [
  { id: "0", voter: "a0", vote: 'yes' },
  { id: "1", voter: "a1", vote: 'yes' },
  { id: "2", voter: "a2", vote: 'no' },
  { id: "3", voter: "a3", vote: 'no' },
  { id: "4", voter: "a4", vote: 'yes' },
  { id: "5", voter: "a5", vote: 'yes' },
]

const EXPECTED_STATE = { epoch: 11, roundInEpoch: 12, stateVersion: 13 };

const MOCK_SNAPSHOTER: Snapshoter = {
  currentState: () => okAsync(EXPECTED_STATE),
  snapshotResourceBalancesByAddress: function (_: string, __: number, ___: string[]): ResultAsync<Snapshot, Error> {
    return okAsync(MOCK_SNAPSHOT);
  },
  snapshotResourceBalances: function (_: string, __: number): ResultAsync<Snapshot, Error> {
    throw new Error("Function not implemented.");
  },
  ownerKeys: function (_: string): ResultAsync<Uint8Array, Error> {
    throw new Error("Function not implemented.");
  }
}

const MOCK_SNAPSHOT: Snapshot = Snapshot.fromBalances(1,
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