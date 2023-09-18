import { DbKeys } from "../services/db-store";
import { secureRandom } from "../helpers/crypto";
import { SnapshotPollingServices } from "./services";
import { Request, Response } from "express";
import Logger from "../loaders/logger";

export type SnapshotPollingControllers = ReturnType<typeof controllers>;

const controllers = (services: SnapshotPollingServices) => {
  const { dbStore, verifyVoters, challengeStore, rolaService} = services;

  const createPoll = (req: Request, res: Response) => {
    const { orgName, title, description, voteTokenResource, closes } = req.body;
    const id = secureRandom(32);
    const currentPolls = dbStore.get(DbKeys.Polls) || [];
    const newPoll = {
      id,
      orgName,
      title,
      description,
      voteTokenResource,
      closes,
      closed: false,
      votes: [],
    };
    dbStore.set(DbKeys.Polls, [...currentPolls, newPoll]);
    res.status(200).send(newPoll);
  }

  const updatePoll = (req: Request, res: Response) => {
    const { id } = req.params;
    const poll = dbStore.get(DbKeys.Polls).find((p: any) => p.id === id);
    if (poll.closed) {
      return res.send({ success: false, message: "Poll is closed" });
    }
    // const snapshoter = snap({ db: {
    //   db: "radixdlt_ledger",
    //   user: "db_dev_superuser",
    //   password: "db_dev_password",
    //   port: 5432,
    //   host: "127.0.0.1",
    // }})

    // snapshoter.v1("resource_tdx_e_1thmnph8gg88pmfethyy2s7k5pjz54fmfnlskd6a8y3qtwjter47nas", 5274713).andThen((r) =>  {
    //   console.log(r)
    //   return ok(null)
    // }).orElse((e) => {console.error(e); return ok(null)});
  }

  const closePoll = async (req: Request, res: Response) => {
    const { id } = req.params;
    const currentMillis = Date.now();
    const poll = dbStore.get(DbKeys.Polls).find((p: any) => p.id === id);
    if (poll && poll.closes < currentMillis) {
      const r = await verifyVoters(poll.voteTokenResource, poll.votes);
      if (r.isErr()) {
        return res.send({ success: false, message: r.error.reason });
      }
      poll.closed = true;
      // update poll's votes array by keeping only verified votes. Store original unverified votes in unverifiedVotes
      dbStore.set(
        DbKeys.Polls,
        dbStore
          .get(DbKeys.Polls)
          .map((p: any) =>
            p.id === id
              ? {
                  ...poll,
                  unverifiedVotes: p.votes,
                  votes: r.value.map((v: any) => ({
                    voter: v.voter,
                    vote: v.vote,
                    id: v.id,
                  })),
                }
              : p,
          ),
      );
      return res.send({ success: true });
    }
    return res.send({ success: false, message: "Poll can't be closed" });
  }

  const createChallenge = (_req: Request, res: Response) => {
    const challenge = challengeStore.create();
    res.send({ challenge });
  }

  const verifyChallenge = async (req: Request, res: Response) => {
      const r = await rolaService(req.body);
      if (r.isErr()) {
        res.send({ success: false, message: r.error.reason });
        Logger.debug("error verifying", r);
        Logger.silly(r);
        return;
      }
      res.send({ success: true });
    }
  
  const vote = async (req: Request, res: Response) => {
    const { pollId, vote, signedChallenge } = req.body;
    const { challenge } = signedChallenge;
    const r = await rolaService(signedChallenge); // verify signed challenge, returns derived address of signer
    if (r.isErr()) {
      res.send({ success: false, message: r.error.reason });
      Logger.debug("error verifying", r);
      return;
    }
    const poll = dbStore.get(DbKeys.Polls).find((p: any) => p.id === pollId);
    if (poll.closed)
      return res.send({ success: false, message: "Poll is closed" });
    if (poll.votes.find((v: any) => v.voter === r.value))
      return res.send({ success: false, message: "Already voted" });

    // push vote to poll
    dbStore.set(
      DbKeys.Polls,
      dbStore.get(DbKeys.Polls).map((p: any) =>
        p.id === pollId
          ? {
              ...p,
              votes: [
                ...p.votes,
                {
                  id: challenge,
                  voter: r.value,
                  vote,
                },
              ],
            }
          : p,
      ),
    );
    res.send({ success: true });
  }

  return {
    createPoll,
    updatePoll,
    closePoll,
    createChallenge,
    verifyChallenge,
    vote,
  }
}

export default controllers;
