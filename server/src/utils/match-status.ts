import { MATCH_STATUS } from "../validation/matches.js";

//Match status type derived from MATCH_STATUS constant

export type MatchStatus = (typeof MATCH_STATUS)[keyof typeof MATCH_STATUS];

// Match interface representing the minimum required fields
export interface Match {
  status: MatchStatus;
  startTime: Date | string;
  endTime: Date | string;
}

// Status update callback function type
export type UpdateStatusCallback = (status: MatchStatus) => Promise<void>;

// Determines the current status of a match based on start and end times

export function getMatchStatus(
  startTime: Date | string,
  endTime: Date | string,
  now: Date = new Date(),
): MatchStatus | null {
  const start = new Date(startTime);
  const end = new Date(endTime);

  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return null;
  }

  if (now < start) {
    return MATCH_STATUS.SCHEDULED;
  }

  if (now >= end) {
    return MATCH_STATUS.FINISHED;
  }

  return MATCH_STATUS.LIVE;
}

// Synchronizes a match's status based on current time and updates it if changed
export async function syncMatchStatus(
  match: Match,
  updateStatus: UpdateStatusCallback,
): Promise<MatchStatus> {
  const nextStatus = getMatchStatus(match.startTime, match.endTime);

  if (!nextStatus) {
    return match.status;
  }

  if (match.status !== nextStatus) {
    await updateStatus(nextStatus);
    match.status = nextStatus;
  }

  return match.status;
}
