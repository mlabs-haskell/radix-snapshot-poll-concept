import { ResultAsync } from "neverthrow";
import { Snapshoter } from "../loaders/services";
import { Snapshot } from "snapshoter/build/types";
import {
  VerifiedVote,
  VerifiedVoters,
  makeVerified,
  VoteAggregator,
  AggregatedVotes,
  Poll
} from "../domain/types";

export const BALANCE_DECIMALS = 10 ** 18;

export const VerifyVoters =
  (snapshoter: Snapshoter) =>
    (
      poll: Poll,
    ): ResultAsync<VerifiedVoters, { reason: string }> => {
      const voters = poll.votes.map((v: any) => v.voter);
      return snapshoter
        .currentState()
        .andThen(state =>
          snapshoter
            .snapshotResourceBalancesByAddress(
              poll.voteToken.resourceAddress,
              state.stateVersion,
              voters,
            )
            .map(snapshot => {
              const [verifiedVotes, aggregatedVotes] = processVotes(poll, snapshot);
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
  poll: Poll,
  snapshot: Snapshot,
): [VerifiedVote[], AggregatedVotes] => {
  const tokenWeight = poll.voteToken.weight;
  const result: VerifiedVote[] = [];
  const aggregator = new VoteAggregator();
  for (const vote of poll.votes) {
    const balance = snapshot.getBalanceInfo(vote.voter)?.balance;
    if (!balance) continue;
    const verifiedBalance = Math.trunc(balance / BALANCE_DECIMALS);
    if (verifiedBalance <= 0) continue;
    const verifiedVote = makeVerified(vote, verifiedBalance, poll.voteToken);
    result.push(verifiedVote);
    aggregator.add(verifiedVote)
  }
  return [result, aggregator.getAggregated()];
};
