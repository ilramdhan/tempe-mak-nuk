/**
 * Supabase Auth error → Indonesian, enumeration-safe message.
 * Never reveal whether an email exists or is confirmed: all credential-ish failures
 * collapse into one generic message. Rate limits get their own (non-revealing) text.
 */

export type AuthErrorLike = {
  code?: string | null;
  status?: number | null;
  message?: string | null;
  name?: string | null;
};

export const AUTH_MESSAGES = {
  invalidCredentials: "Email atau kata sandi tidak cocok.",
  rateLimited:
    "Terlalu banyak percobaan. Tunggu beberapa menit, lalu coba lagi.",
  network:
    "Tidak bisa terhubung ke server. Periksa koneksi Anda, lalu coba lagi.",
  generic: "Belum bisa masuk. Coba lagi sebentar lagi.",
  magicLinkSent:
    "Jika email tersebut terdaftar sebagai admin, tautan masuk sudah kami kirim. Periksa kotak masuk (dan folder spam).",
  linkInvalid:
    "Tautan masuk tidak valid atau sudah kedaluwarsa. Minta tautan baru.",
  notConfigured: "Supabase belum dikonfigurasi.",
  noAccess: "Akun ini belum punya akses admin.",
  signedOut: "Anda sudah keluar.",
} as const;

const RATE_LIMIT_CODES = new Set([
  "over_request_rate_limit",
  "over_email_send_rate_limit",
  "over_sms_send_rate_limit",
]);

const LINK_CODES = new Set([
  "otp_expired",
  "flow_state_not_found",
  "flow_state_expired",
  "bad_code_verifier",
  "bad_oauth_state",
]);

export type AuthErrorKind =
  | "invalid_credentials"
  | "rate_limited"
  | "network"
  | "link_invalid"
  | "generic";

export function classifyAuthError(
  error: AuthErrorLike | null | undefined,
): AuthErrorKind {
  if (!error) return "generic";
  const code = error.code ?? "";
  if (RATE_LIMIT_CODES.has(code) || error.status === 429) return "rate_limited";
  if (LINK_CODES.has(code)) return "link_invalid";
  if (error.name === "AuthRetryableFetchError" || error.status === 0)
    return "network";
  // invalid_credentials, email_not_confirmed, user_not_found, signup_disabled, user_banned,
  // email_address_not_authorized, otp_disabled, validation_failed… → generic credential message.
  if (code || (error.status && error.status >= 400 && error.status < 500)) {
    return "invalid_credentials";
  }
  return "generic";
}

const KIND_MESSAGE: Record<AuthErrorKind, string> = {
  invalid_credentials: AUTH_MESSAGES.invalidCredentials,
  rate_limited: AUTH_MESSAGES.rateLimited,
  network: AUTH_MESSAGES.network,
  link_invalid: AUTH_MESSAGES.linkInvalid,
  generic: AUTH_MESSAGES.generic,
};

export function authErrorMessage(
  error: AuthErrorLike | null | undefined,
): string {
  return KIND_MESSAGE[classifyAuthError(error)];
}

/**
 * `?pesan=` codes the login page understands (set by /auth/callback, requireRole, logout).
 * Only known codes render — arbitrary text from the URL is never shown.
 */
export const LOGIN_NOTICE = {
  link: AUTH_MESSAGES.linkInvalid,
  config: AUTH_MESSAGES.notConfigured,
  akses: AUTH_MESSAGES.noAccess,
  keluar: AUTH_MESSAGES.signedOut,
} as const;

export type LoginNoticeCode = keyof typeof LOGIN_NOTICE;

export function loginNotice(
  code: unknown,
): { code: LoginNoticeCode; message: string } | null {
  if (typeof code !== "string" || !Object.hasOwn(LOGIN_NOTICE, code))
    return null;
  const c = code as LoginNoticeCode;
  return { code: c, message: LOGIN_NOTICE[c] };
}
