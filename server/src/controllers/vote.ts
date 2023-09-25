import { SignedChallenge } from "@radixdlt/radix-dapp-toolkit";
import { SnapshotPollingServices } from "../loaders/services";
import Logger from "../loaders/logger";
import { PollsRepo } from "../repositories/types";
import { addVote } from "../domain/types";

export default (
  pollsRepo: PollsRepo,
  rolaService: SnapshotPollingServices["rolaService"],
) =>
  async (pollParam: {
    pollId: string;
    vote: "yes" | "no";
    signedChallenge: SignedChallenge;
  }) => {
    const { challenge } = pollParam.signedChallenge;
    const r = await rolaService(pollParam.signedChallenge); // verify signed challenge, returns derived address of signer
    if (r.isErr()) {
      Logger.debug("error verifying", r);
      throw Error(r.error.reason);
    }
    const poll = pollsRepo.getById(pollParam.pollId);
    if (!poll) throw Error("Poll not found");
    if (poll.closed) throw Error("Poll is closed");
    if (poll.votes.find((v: any) => v.voter === r.value))
      throw Error("Already voted");

    const votedPoll = addVote(
      poll,
      {
        id: challenge,
        voter: r.value,
        vote: pollParam.vote
      });
    pollsRepo.update(votedPoll);
    return;
  };
