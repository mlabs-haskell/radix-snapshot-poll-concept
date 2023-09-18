import { secureRandom } from "../helpers/crypto";
import { SnapshotPollingServices } from "../loaders/services";
import { DbKeys } from "../services/db-store";

export default (dbStore: SnapshotPollingServices["dbStore"]) =>
  ({
    orgName,
    title,
    description,
    voteTokenResource,
    closes,
  }: {
    orgName: string;
    title: string;
    description: string;
    voteTokenResource: string;
    closes: number;
  }) => {
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
    return newPoll;
  };
