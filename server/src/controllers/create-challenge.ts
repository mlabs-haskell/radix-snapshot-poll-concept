import { SnapshotPollingServices } from "../loaders/services";

export default (challengeStore: SnapshotPollingServices["challengeStore"]) =>
  async () => {
    const challenge = challengeStore.create();
    return challenge;
  };
