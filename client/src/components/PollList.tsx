import {
  Button,
  Card,
  CardActions,
  CardContent,
  Typography,
} from "@mui/material";
import React from "react";

type PollData = {
  id: string;
  orgName: string;
  title: string;
  description: string;
  voteToken: { resourceAddress: string, weight: number },
  closes: number;
  closed: boolean;
  // you may wish to further type this depending on the vote structure
  votes: any[];
  /** It is possible to calculate final votes and power using "raw" data from
   * `verifiedVotes.votes` array of the response,
   * but during votes verification, backend traverses all votes anyway
   * and collecting aggregated data during this process do not introduce any significant overhead.
   * So already aggregated data was included into the backend response for easier integration.
   */
  verifiedVotes: AggregatedVotes;
};

type AggregatedVotes = { aggregatedVotes: { yes: AggregatedData, no: AggregatedData } };
type AggregatedData = { count: number, balance: number, power: number };

type Props = {
  data: PollData[];
  onClosePoll: (pollId: string) => void;
  onVote: (pollId: string, vote: "yes" | "no") => void;
};

const PollList: React.FC<Props> = ({ data, onClosePoll, onVote }) => {
  const handleClose = (pollId: string) => {
    onClosePoll(pollId);
  };

  const currentTime = Date.now();

  return (
    <div>
      {data.map((item) => (
        <Card key={item.id} className="w-full m-2 p-4 border rounded">
          <CardContent>
            <Typography variant="h6" className="text-lg font-bold">
              {item.title}
            </Typography>
            <Typography variant="subtitle1" className="text-gray-500 mt-2">
              By: {item.orgName}
            </Typography>
            <Typography variant="body2" className="mt-2">
              {item.description}
            </Typography>
            <div className="mt-2">
              <Typography
                variant="caption"
                className="text-gray-400 mt-2 break-all"
              >
                Vote Token: {item.voteToken.resourceAddress}
              </Typography>
            </div>
            <div className="mt-2">
              <Typography
                variant="caption"
                className="text-gray-400 mt-2"
              >
                Token Weight: {item.voteToken.weight}
              </Typography>
            </div>
            <div className="mt-2">
              <Typography variant="caption" className="text-gray-500">
                Closes At: {new Date(item.closes).toLocaleString()}
              </Typography>
            </div>
            <div className="mt-2">
              <Typography
                variant="caption"
                className={item.closed ? "text-red-500" : "text-green-500"}
              >
                Status: {item.closed ? "Closed" : "Open"}
              </Typography>
            </div>
            <div className="mt-2">
              <Typography variant="overline">
                Submitted votes:<br />
                Yes: {item.votes.filter((v) => v.vote === "yes").length}
                <br />
                No: {item.votes.filter((v) => v.vote === "no").length}
              </Typography>
            </div>
            {item.verifiedVotes && (
              <>
                <Typography variant="overline">
                  Verified votes:<br />
                </Typography>
                <Typography variant="overline">
                  Yes: count:{item.verifiedVotes.aggregatedVotes.yes.count},
                  tokens: {item.verifiedVotes.aggregatedVotes.yes.balance},
                  power: {item.verifiedVotes.aggregatedVotes.yes.power}
                  <br />
                  No: count:{item.verifiedVotes.aggregatedVotes.no.count},
                  tokens: {item.verifiedVotes.aggregatedVotes.no.balance},
                  power: {item.verifiedVotes.aggregatedVotes.no.power}
                </Typography>
              </>
            )}
          </CardContent>
          <CardActions>
            {!item.closed && (
              <>
                {item.closes < currentTime && (
                  <Button
                    variant="outlined"
                    color="secondary"
                    onClick={() => handleClose(item.id)}
                    className="mt-2"
                  >
                    Close
                  </Button>
                )}
                <div className="flex mt-2">
                  <Button
                    variant="outlined"
                    onClick={() => onVote(item.id, "yes")}
                    className="mr-2"
                  >
                    Yes
                  </Button>
                  <Button
                    variant="outlined"
                    onClick={() => onVote(item.id, "no")}
                    className="mr-2"
                  >
                    No
                  </Button>
                </div>
              </>
            )}
          </CardActions>
        </Card>
      ))}
    </div>
  );
};

export default PollList;
