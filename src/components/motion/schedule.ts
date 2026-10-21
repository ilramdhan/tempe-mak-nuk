/**
 * Deferred init scheduling for the motion kit (P8.11).
 *
 * Animations are set up only when the browser is idle (`requestIdleCallback`,
 * with a timeout so they never wait forever) and — for `visible` — once the
 * element is close to the viewport (IntersectionObserver). This keeps GSAP
 * setup (SplitText measuring, ScrollTrigger layout reads) out of hydration,
 * which is what drove the beranda TBT.
 *
 * Framework-free and env-injectable so it can be unit tested in Node.
 */

export type InitWhen = "idle" | "visible";

export type ScheduleOptions = {
  when: InitWhen;
  /** IntersectionObserver rootMargin for `visible`. */
  rootMargin?: string;
  /** Max wait for idle (ms) before running anyway. */
  idleTimeout?: number;
};

type IdleHandle = number;

/** Subset of `window` this module uses (injectable for tests). */
export type ScheduleEnv = {
  requestIdleCallback?: (
    cb: () => void,
    opts?: { timeout?: number },
  ) => IdleHandle;
  cancelIdleCallback?: (handle: IdleHandle) => void;
  setTimeout: (cb: () => void, ms?: number) => unknown;
  clearTimeout: (handle: never) => void;
  IntersectionObserver?: new (
    cb: (entries: { isIntersecting: boolean }[]) => void,
    opts?: { rootMargin?: string },
  ) => { observe(el: Element): void; disconnect(): void };
};

/** Defaults: start a little before the element scrolls in. */
export const DEFAULT_ROOT_MARGIN = "0px 0px 25% 0px";
export const DEFAULT_IDLE_TIMEOUT = { idle: 1200, visible: 300 } as const;

/** Run `cb` when idle; returns a cancel function. Falls back to a timeout. */
export function whenIdle(
  cb: () => void,
  timeout: number,
  env: ScheduleEnv,
): () => void {
  if (typeof env.requestIdleCallback === "function") {
    const h = env.requestIdleCallback(cb, { timeout });
    return () => env.cancelIdleCallback?.(h);
  }
  // No rIC (Safari): yield past the current hydration task(s).
  const h = env.setTimeout(cb, Math.min(timeout, 200));
  return () => env.clearTimeout(h as never);
}

/**
 * Schedule `cb` once per `opts`. Returns a cancel function (safe to call
 * after `cb` ran). `cb` is guaranteed to run at most once.
 */
export function scheduleInit(
  el: Element,
  opts: ScheduleOptions,
  cb: () => void,
  env: ScheduleEnv = globalThis as unknown as ScheduleEnv,
): () => void {
  let done = false;
  let cancelIdle: (() => void) | undefined;
  const run = () => {
    if (done) return;
    done = true;
    cb();
  };
  const timeout = opts.idleTimeout ?? DEFAULT_IDLE_TIMEOUT[opts.when];

  if (opts.when === "idle" || typeof env.IntersectionObserver !== "function") {
    cancelIdle = whenIdle(run, timeout, env);
    return () => {
      done = true;
      cancelIdle?.();
    };
  }

  const io = new env.IntersectionObserver(
    (entries) => {
      if (!entries.some((e) => e.isIntersecting)) return;
      io.disconnect();
      cancelIdle = whenIdle(run, timeout, env);
    },
    { rootMargin: opts.rootMargin ?? DEFAULT_ROOT_MARGIN },
  );
  io.observe(el);
  return () => {
    done = true;
    io.disconnect();
    cancelIdle?.();
  };
}
