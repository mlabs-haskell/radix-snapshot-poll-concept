import snap from "snapshoter";
import { GatewayService } from "./gateway/gateway";
import { Result, ResultAsync, ok, okAsync } from "neverthrow";
import { SnapshotPollingServices, Snapshoter } from "../loaders/services";
import { LedgerState } from "snapshoter/build/types";

// checks only existence of voteTokenResource at the relevant address. Does not
// take into account number of tokens held.

type VerifiedVoters = {
  verifiedAt: LedgerState;
  votes: { voter: string; vote: "yes" | "no"; id: string; balance: string }[];
};

export const VerifyVoters =
  (snapshoter: Snapshoter) =>
  (
    voteToken: string,
    votes: { voter: string; vote: "yes" | "no"; id: string }[],
  ): ResultAsync<VerifiedVoters, { reason: string }> => {
    const voters = votes.map((v: any) => v.voter);
    return snapshoter
      .currentState()
      .andThen((state) =>
        snapshoter
          .snapshotResourceBalancesByAddress(
            voteToken,
            state.stateVersion,
            voters,
          )
          .map((balances) => {
            const verifiedVotes = votes
              .map((v: { voter: string; vote: "yes" | "no"; id: string }) => ({
                ...v,
                balance: "" + balances.getBalanceInfo(v.voter)?.balance,
              }))
              .filter((v: any) => v.balance && v.balance.slice(0, -18)); // Remove 18 decimals, 0 will result in emtpy string will get filtered out

            return {
              verifiedAt: state,
              votes: verifiedVotes,
            };
          }),
      )
      .mapErr((e) => ({ reason: e.message }));
  };
