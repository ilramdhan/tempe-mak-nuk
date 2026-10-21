import { describe, expect, it, vi } from "vitest";

import {
  DEFAULT_ROOT_MARGIN,
  scheduleInit,
  whenIdle,
  type ScheduleEnv,
} from "../schedule";

type IoCb = (entries: { isIntersecting: boolean }[]) => void;

function makeEnv({ ric = true, io = true } = {}) {
  const idle: { cb: () => void; timeout?: number; id: number }[] = [];
  const timers: { cb: () => void; ms?: number; id: number }[] = [];
  const observers: {
    cb: IoCb;
    rootMargin?: string;
    observed: Element[];
    disconnected: boolean;
  }[] = [];
  let next = 1;
  const env: ScheduleEnv = {
    setTimeout: (cb, ms) => {
      const id = next++;
      timers.push({ cb, ms, id });
      return id;
    },
    clearTimeout: ((id: number) => {
      const i = timers.findIndex((t) => t.id === id);
      if (i >= 0) timers.splice(i, 1);
    }) as ScheduleEnv["clearTimeout"],
  };
  if (ric) {
    env.requestIdleCallback = (cb, opts) => {
      const id = next++;
      idle.push({ cb, timeout: opts?.timeout, id });
      return id;
    };
    env.cancelIdleCallback = (id) => {
      const i = idle.findIndex((t) => t.id === id);
      if (i >= 0) idle.splice(i, 1);
    };
  }
  if (io) {
    env.IntersectionObserver = class {
      private o;
      constructor(cb: IoCb, opts?: { rootMargin?: string }) {
        this.o = {
          cb,
          rootMargin: opts?.rootMargin,
          observed: [] as Element[],
          disconnected: false,
        };
        observers.push(this.o);
      }
      observe(el: Element) {
        this.o.observed.push(el);
      }
      disconnect() {
        this.o.disconnected = true;
      }
    };
  }
  const flushIdle = () => idle.splice(0).forEach((t) => t.cb());
  const flushTimers = () => timers.splice(0).forEach((t) => t.cb());
  return { env, idle, timers, observers, flushIdle, flushTimers };
}

const el = {} as Element;

describe("whenIdle", () => {
  it("uses requestIdleCallback with the timeout", () => {
    const { env, idle, flushIdle } = makeEnv();
    const cb = vi.fn();
    whenIdle(cb, 900, env);
    expect(idle[0]?.timeout).toBe(900);
    expect(cb).not.toHaveBeenCalled();
    flushIdle();
    expect(cb).toHaveBeenCalledOnce();
  });

  it("falls back to a short setTimeout without rIC (Safari)", () => {
    const { env, timers, flushTimers } = makeEnv({ ric: false });
    const cb = vi.fn();
    whenIdle(cb, 1200, env);
    expect(timers[0]?.ms).toBe(200);
    flushTimers();
    expect(cb).toHaveBeenCalledOnce();
  });

  it("cancel prevents the callback", () => {
    const { env, idle } = makeEnv();
    const cb = vi.fn();
    whenIdle(cb, 100, env)();
    expect(idle).toHaveLength(0);
  });
});

describe("scheduleInit", () => {
  it("idle: runs once when idle, no observer", () => {
    const { env, observers, flushIdle } = makeEnv();
    const cb = vi.fn();
    scheduleInit(el, { when: "idle" }, cb, env);
    expect(observers).toHaveLength(0);
    flushIdle();
    expect(cb).toHaveBeenCalledOnce();
  });

  it("visible: waits for intersection, then idle", () => {
    const { env, idle, observers, flushIdle } = makeEnv();
    const cb = vi.fn();
    scheduleInit(el, { when: "visible" }, cb, env);
    const o = observers[0]!;
    expect(o.observed).toEqual([el]);
    expect(o.rootMargin).toBe(DEFAULT_ROOT_MARGIN);
    expect(idle).toHaveLength(0);

    o.cb([{ isIntersecting: false }]);
    expect(idle).toHaveLength(0);

    o.cb([{ isIntersecting: true }]);
    expect(o.disconnected).toBe(true);
    expect(cb).not.toHaveBeenCalled();
    flushIdle();
    expect(cb).toHaveBeenCalledOnce();
  });

  it("visible: passes a custom rootMargin", () => {
    const { env, observers } = makeEnv();
    scheduleInit(el, { when: "visible", rootMargin: "100px" }, vi.fn(), env);
    expect(observers[0]?.rootMargin).toBe("100px");
  });

  it("visible without IntersectionObserver degrades to idle", () => {
    const { env, flushIdle } = makeEnv({ io: false });
    const cb = vi.fn();
    scheduleInit(el, { when: "visible" }, cb, env);
    flushIdle();
    expect(cb).toHaveBeenCalledOnce();
  });

  it("cancel before intersection disconnects and never runs", () => {
    const { env, idle, observers } = makeEnv();
    const cb = vi.fn();
    const cancel = scheduleInit(el, { when: "visible" }, cb, env);
    cancel();
    expect(observers[0]?.disconnected).toBe(true);
    observers[0]?.cb([{ isIntersecting: true }]);
    idle.splice(0).forEach((t) => t.cb());
    expect(cb).not.toHaveBeenCalled();
  });

  it("cancel after scheduling idle prevents the run", () => {
    const { env, idle, observers } = makeEnv();
    const cb = vi.fn();
    const cancel = scheduleInit(el, { when: "visible" }, cb, env);
    observers[0]?.cb([{ isIntersecting: true }]);
    expect(idle).toHaveLength(1);
    cancel();
    expect(idle).toHaveLength(0);
    expect(cb).not.toHaveBeenCalled();
  });
});
