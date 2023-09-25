import { ResultAsync } from "neverthrow";
import { Snapshoter } from "../loaders/services";
import { LedgerState, Snapshot } from "snapshoter/build/types";
import { VerifiedVote, VerifiedVoters, Vote } from "../domain/types";

export const BALANCE_DECIMALS = 10 ** 18;

export const VerifyVoters =
  (snapshoter: Snapshoter) =>
    (
      voteToken: string,
      votes: Vote[],
    ): ResultAsync<VerifiedVoters, { reason: string }> => {
      const voters = votes.map((v: any) => v.voter);
      return snapshoter
        .currentState()
        .andThen(state =>
          snapshoter
            .snapshotResourceBalancesByAddress(
              voteToken,
              state.stateVersion,
              voters,
            )
            .map(snapshot => {
              const verifiedVotes = filterByBalances(votes, snapshot);
              return {
                verifiedAt: state,
                votes: verifiedVotes,
              };
            }),
        )
        .mapErr((e) => ({ reason: e.message }));
    };

const filterByBalances = (votes: Vote[], snapshot: Snapshot): VerifiedVote[] => {
  const result: VerifiedVote[] = [];
  for (const vote of votes) {
    const balance = snapshot.getBalanceInfo(vote.voter)?.balance;
    if (!balance) continue;
    const verifiedBalance = Math.trunc(balance / BALANCE_DECIMALS);
    if (verifiedBalance <= 0) continue;
    result.push({ ...vote, balance: verifiedBalance })
  }
  return result;
};
