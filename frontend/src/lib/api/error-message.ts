export const NETWORK_ERROR_MESSAGE =
  "Cannot reach server. Please make sure the backend is running and try again.";

export const GENERIC_ERROR_MESSAGE = "Something went wrong. Please try again.";

const technicalMessagePatterns = [
  /fetch failed/i,
  /failed to fetch/i,
  /load failed/i,
  /networkerror/i,
  /econnrefused/i,
  /econnreset/i,
  /enotfound/i,
  /etimeout/i,
  /socket hang up/i,
  /cannot reach server/i
];

export function isTechnicalNetworkMessage(message?: string | null) {
  return technicalMessagePatterns.some((pattern) => pattern.test(message ?? ""));
}

export function toUserErrorMessage(error: unknown, fallback = GENERIC_ERROR_MESSAGE) {
  if (error instanceof Error) {
    return isTechnicalNetworkMessage(error.message) ? NETWORK_ERROR_MESSAGE : error.message;
  }

  if (typeof error === "string") {
    return isTechnicalNetworkMessage(error) ? NETWORK_ERROR_MESSAGE : error;
  }

  return fallback;
}
