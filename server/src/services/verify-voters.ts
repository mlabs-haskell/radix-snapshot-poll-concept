import { ResultAsync } from "neverthrow";
import { Snapshoter } from "../loaders/services";
import { LedgerState, Snapshot } from "snapshoter/build/types";
import { VoteToken, VerifiedVote, VerifiedVoters, Vote, makeVerified, VoteAggregator, AggregatedVotes } from "../domain/types";

export const BALANCE_DECIMALS = 10 ** 18;

export const VerifyVoters =
  (snapshoter: Snapshoter) =>
    (
      voteToken: VoteToken,
      votes: Vote[],
    ): ResultAsync<VerifiedVoters, { reason: string }> => {
      const voters = votes.map((v: any) => v.voter);
      return snapshoter
        .currentState()
        .andThen(state =>
          snapshoter
            .snapshotResourceBalancesByAddress(
              voteToken.resourceAddress,
              state.stateVersion,
              voters,
            )
            .map(snapshot => {
              const [verifiedVotes, aggregatedVotes] = processVotes(votes, snapshot, voteToken);
              return {
                verifiedAt: state,
                aggregatedVotes: aggregatedVotes,
                votes: verifiedVotes,
              };
            }),
        )
        .mapErr((e) => ({ reason: e.message }));
    };

/**
 * - Filter out votes that do not have governance tokens on balance
 * - Count voting power according to the vote token weight
 */
const processVotes = (
  votes: Vote[],
  snapshot: Snapshot,
  voteToken: VoteToken
): [VerifiedVote[], AggregatedVotes] => {
  const result: VerifiedVote[] = [];
  const aggregator = new VoteAggregator();
  for (const vote of votes) {
    const balance = snapshot.getBalanceInfo(vote.voter)?.balance;
    if (!balance) continue;
    const verifiedBalance = Math.trunc(balance / BALANCE_DECIMALS);
    if (verifiedBalance <= 0) continue;
    const verifiedVote = makeVerified(vote, verifiedBalance, voteToken.weight);
    result.push(verifiedVote);
    aggregator.add(verifiedVote)
  }
  return [result, aggregator.getAggregated()];
};

