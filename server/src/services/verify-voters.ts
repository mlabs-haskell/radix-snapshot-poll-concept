import snap from "snapshoter";
import { GatewayService } from "./gateway/gateway";
import { Result, ResultAsync, ok, okAsync } from "neverthrow";
import { SnapshotPollingServices, Snapshoter } from "../loaders/services";

// checks only existence of voteTokenResource at the relevant address. Does not
// take into account number of tokens held.
export const VerifyVoters =
  (snapshoter: Snapshoter) =>
  (
    voteToken: string,
    votes: { voter: string; vote: "yes" | "no"; id: string }[],
  ): ResultAsync<any[], { reason: string }> => {
    return okAsync([]);


    // return gatewayService
    //   .getEntityResources(votes.map((x) => x.voter))
    //   .andThen((resources) => {
    //     console.log(resources)
    //     // Map the resources to votes
    //     const combinedData = resources.map((y, i) => ({
    //       id: votes[i].id,
    //       voter: votes[i].voter,
    //       vote: votes[i].vote,
    //       resources: y,
    //     }));
    //     return ok(combinedData);
    //   })
    //  .map((combinedData) => combinedData.filter(v => 
    //     v.resources.some((r: any) => 
    //       r.resource_address === voteToken && 
    //       r.vaults.items.some((vault: any) => vault.amount !== "0")
    //     )
    //   ))
    //   .mapErr(() => ({ reason: "couldNotVerifyPublicKeyOnLedger" }));
  };

