import React from "react";
import { format } from "timeago.js";

const TimeAgoComponent = ({
  timestamp,
  cap = false,
}: {
  timestamp: string;
  cap?: boolean;
}) => {
  const formattedTime = format(timestamp);

  if (cap) {
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
    const targetDate = new Date(timestamp);

    if (targetDate < sevenDaysAgo) {
      return <span>7 days ago</span>;
    }
  }

  return <span>{formattedTime}</span>;
};

export default TimeAgoComponent;
