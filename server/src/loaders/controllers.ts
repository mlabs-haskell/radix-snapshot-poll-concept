import { SnapshotPollingServices } from "./services";
import { Request, Response } from "express";
import createPollController from "../controllers/create-poll";
import refreshPollController from "../controllers/refresh-poll";
import closePollController from "../controllers/close-poll";
import createChallengeController from "../controllers/create-challenge";
import verifyChallengeController from "../controllers/verify-challenge";
import voteController from "../controllers/vote";
import Logger from "./logger";
import { DbKeys } from "../services/db-store";

export type SnapshotPollingControllers = ReturnType<typeof controllers>;

const controllers = (services: SnapshotPollingServices) => {
  const { verifyVoters, challengeStore, rolaService, pollsRepo } = services;

  const getPolls = async (req: Request, res: Response) => {
    Logger.silly("get polls");
    const polls = pollsRepo.getAll();
    res.status(200).send(polls);
  };

  const createPoll = async (req: Request, res: Response) => {
    Logger.debug("create poll", req.body);
    const newPoll = createPollController(pollsRepo)(req.body);
    res.status(200).send(newPoll);
  };

  const refreshPoll = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const verifiedPoll = await refreshPollController(
        pollsRepo,
        verifyVoters,
      )(id);
      res.status(200).send(verifiedPoll);
    } catch (e: unknown) {
      res.status(400).send({ success: false, message: (e as Error).message });
    }
  };

  const closePoll = async (req: Request, res: Response) => {
    const { id } = req.params;
    try {
      const closedPoll = closePollController(pollsRepo, verifyVoters)(id);
      res.status(200).send(closedPoll);
    } catch (e: unknown) {
      res.status(400).send({ success: false, message: (e as Error).message });
    }
  };

  const createChallenge = async (_req: Request, res: Response) => {
    res.send({ challenge: await createChallengeController(challengeStore)() });
  };

  const verifyChallenge = async (req: Request, res: Response) => {
    const challenge = req.body;
    try {
      await verifyChallengeController(rolaService)(challenge);
      res.send({ success: true });
    } catch (e: unknown) {
      res.status(400).send({ success: false, message: (e as Error).message });
    }
  };

  const vote = async (req: Request, res: Response) => {
    try {
      await voteController(pollsRepo, rolaService)(req.body);
    } catch (e: unknown) {
      res.status(400).send({ success: false, message: (e as Error).message });
    }
  };

  return {
    getPolls,
    createPoll,
    refreshPoll,
    closePoll,
    createChallenge,
    verifyChallenge,
    vote,
  };
};

export default controllers;
