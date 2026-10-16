import { describe, expect, it } from "vitest";

import {
  AUTH_MESSAGES,
  authErrorMessage,
  classifyAuthError,
  loginNotice,
} from "@/lib/auth/messages";
import { hasRole, isAdminRole } from "@/lib/auth/roles";
import { magicLinkSchema, passwordLoginSchema } from "@/lib/auth/schema";

describe("hasRole", () => {
  it("owner ⊇ editor", () => {
    expect(hasRole("owner", "owner")).toBe(true);
    expect(hasRole("owner", "editor")).toBe(true);
    expect(hasRole("editor", "editor")).toBe(true);
    expect(hasRole("editor", "owner")).toBe(false);
  });
  it("rejects missing / unknown roles", () => {
    expect(hasRole(null, "editor")).toBe(false);
    expect(hasRole(undefined, "editor")).toBe(false);
    expect(hasRole("admin" as never, "editor")).toBe(false);
    expect(hasRole("toString" as never, "editor")).toBe(false);
    expect(isAdminRole("__proto__")).toBe(false);
  });
});

describe("auth error messages (no user enumeration)", () => {
  it("collapses credential-ish errors into one message", () => {
    for (const code of [
      "invalid_credentials",
      "email_not_confirmed",
      "user_not_found",
      "signup_disabled",
      "user_banned",
    ]) {
      expect(authErrorMessage({ code, status: 400 })).toBe(
        AUTH_MESSAGES.invalidCredentials,
      );
    }
  });
  it("surfaces rate limits and network errors", () => {
    expect(
      classifyAuthError({ code: "over_email_send_rate_limit", status: 429 }),
    ).toBe("rate_limited");
    expect(classifyAuthError({ status: 429 })).toBe("rate_limited");
    expect(
      classifyAuthError({ name: "AuthRetryableFetchError", status: 0 }),
    ).toBe("network");
    expect(classifyAuthError({ code: "otp_expired", status: 403 })).toBe(
      "link_invalid",
    );
    expect(classifyAuthError({ status: 500 })).toBe("generic");
    expect(classifyAuthError(null)).toBe("generic");
  });
  it("only renders known notice codes", () => {
    expect(loginNotice("link")?.message).toBe(AUTH_MESSAGES.linkInvalid);
    expect(loginNotice("<script>")).toBeNull();
    expect(loginNotice("constructor")).toBeNull();
    expect(loginNotice(undefined)).toBeNull();
  });
});

describe("login schemas", () => {
  it("normalises email and requires a password", () => {
    const ok = passwordLoginSchema.safeParse({
      email: "  Mak@Example.COM ",
      password: "x",
    });
    expect(ok.success && ok.data.email).toBe("mak@example.com");
    expect(
      passwordLoginSchema.safeParse({ email: "mak@example.com", password: "" })
        .success,
    ).toBe(false);
    expect(magicLinkSchema.safeParse({ email: "bukan-email" }).success).toBe(
      false,
    );
  });
});
