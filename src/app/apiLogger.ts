/**
 * Logs every failed API call, in one place.
 *
 * RTK Query already surfaces errors to components so they can render a
 * message. What it does not do is record them anywhere — so a request that
 * fails while the user is on another screen, or one whose error the UI
 * handles quietly, leaves no trace at all.
 *
 * A middleware catches all of them without a single try/catch in the pages,
 * and gives one place to forward to a reporting service later.
 */

import { isRejectedWithValue, type Middleware } from "@reduxjs/toolkit";
import { createLogger } from "@/lib/logger";

const log = createLogger("api");

/** Pull the backend's `{error: {code, message}}` envelope out, if present. */
function describe(payload: unknown): { code: string; message: string } {
  const status = (payload as { status?: unknown } | undefined)?.status;
  const data = (payload as { data?: { error?: { code?: string; message?: string } } } | undefined)
    ?.data;

  if (data?.error?.code) {
    return { code: data.error.code, message: data.error.message ?? "" };
  }
  if (status === "FETCH_ERROR") {
    return { code: "NETWORK", message: "Could not reach the API." };
  }
  if (status === "PARSING_ERROR") {
    return { code: "BAD_RESPONSE", message: "The API returned something unreadable." };
  }
  return { code: String(status ?? "UNKNOWN"), message: "" };
}

export const apiLogger: Middleware = () => (next) => (action) => {
  if (isRejectedWithValue(action)) {
    const { code, message } = describe(action.payload);
    const endpoint = (action.meta as { arg?: { endpointName?: string } })?.arg?.endpointName;

    // A 404 on a tenant-scoped read is routine (the record is in another
    // tenant, or was just deleted). A network or server failure is not.
    const routine = code === "NOT_FOUND" || code === "MISSING_TENANT";
    const write = routine ? log.info : log.error;

    write(`${endpoint ?? "request"} failed: ${code}`, message || undefined);
  }
  return next(action);
};
