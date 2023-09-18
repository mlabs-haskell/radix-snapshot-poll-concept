import { Router } from "express";
import { SnapshotPollingControllers } from "../loaders/controllers";
import { SignedChallenge } from "@radixdlt/radix-dapp-toolkit";

// TODO: This separation between routes and controllers is where authentication
// and body validation should be handled.
export const adminRoutes = (app: Router, controllers: SnapshotPollingControllers) => {
  app.post("/create-poll", controllers.createPoll);
  app.get("/update-poll/:id", controllers.updatePoll);
  app.get("/close-poll/:id", controllers.closePoll);
}

export const publicRoutes = (app: Router, controllers: SnapshotPollingControllers) => {
  app.get("/create-challenge", controllers.createChallenge);

  app.post<{}, { success: boolean; message?: string }, SignedChallenge>(
    "/verify-challenge", controllers.verifyChallenge);

  app.post<
    {},
    { success: boolean; message?: string },
    { pollId: string; vote: string; signedChallenge: SignedChallenge }
  >("/vote", controllers.vote);
}
