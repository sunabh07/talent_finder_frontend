/**
 * Minimal leveled logger.
 *
 * Deliberately thin. A browser app should not narrate itself to the console —
 * noisy logs train people to ignore the console, which is where real errors
 * appear. So:
 *
 * - `debug` and `info` are **silenced in production builds**. They exist for
 *   local diagnosis, not for shipping.
 * - `warn` and `error` always fire, in every build, because those are the
 *   lines someone actually needs when a user reports a problem.
 *
 * In a real deployment `error` is also the single place to forward to Sentry
 * or similar — one call site to change rather than scattered console.error.
 */

type Level = "debug" | "info" | "warn" | "error";

const isDev = import.meta.env.DEV;

function emit(level: Level, scope: string, message: string, detail?: unknown): void {
  if (!isDev && (level === "debug" || level === "info")) return;

  const prefix = `[${scope}]`;
  if (detail === undefined) {
    console[level](prefix, message);
  } else {
    console[level](prefix, message, detail);
  }
}

export function createLogger(scope: string) {
  return {
    debug: (message: string, detail?: unknown) => emit("debug", scope, message, detail),
    info: (message: string, detail?: unknown) => emit("info", scope, message, detail),
    warn: (message: string, detail?: unknown) => emit("warn", scope, message, detail),
    error: (message: string, detail?: unknown) => emit("error", scope, message, detail),
  };
}

export const logger = createLogger("app");
