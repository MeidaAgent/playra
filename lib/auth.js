import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "playra_admin";
const SESSION_TTL_SECONDS = 8 * 60 * 60;
const DEFAULT_PASSWORD = "playra#991";
const DEFAULT_SECRET = "playra-session-secret-key-32chars-min-length-super-safe";

export function getAuthConfigurationError() {
  const password = process.env.ADMIN_PASSWORD || DEFAULT_PASSWORD;
  const secret = process.env.SESSION_SECRET || DEFAULT_SECRET;
  if (!password || password.length < 1) {
    return "ADMIN_PASSWORD must be set.";
  }
  if (!secret || secret.length < 16) {
    return "SESSION_SECRET must contain at least 16 characters.";
  }
  return null;
}

function getSessionSecret() {
  return process.env.SESSION_SECRET || DEFAULT_SECRET;
}

function getAdminPassword() {
  return process.env.ADMIN_PASSWORD || DEFAULT_PASSWORD;
}

function sign(payload) {
  return createHmac("sha256", getSessionSecret())
    .update(payload)
    .digest("base64url");
}

export function createSessionCookie() {
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_TTL_SECONDS;
  const payload = `${expiresAt}.${randomBytes(16).toString("base64url")}`;
  const signature = sign(payload);
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE_NAME}=${payload}.${signature}; Path=/; HttpOnly; SameSite=Strict; Max-Age=${SESSION_TTL_SECONDS}${secure}`;
}

export function clearSessionCookie() {
  const secure = process.env.NODE_ENV === "production" ? "; Secure" : "";
  return `${COOKIE_NAME}=; Path=/; HttpOnly; SameSite=Strict; Max-Age=0${secure}`;
}

export function isAuthenticated(req) {
  const cookieHeader = req.headers?.cookie || "";
  const cookie = cookieHeader
    .split(";")
    .map((part) => part.trim())
    .find((part) => part.startsWith(`${COOKIE_NAME}=`));

  if (!cookie || getAuthConfigurationError()) {
    return false;
  }

  const value = cookie.slice(COOKIE_NAME.length + 1);
  const lastDot = value.lastIndexOf(".");
  if (lastDot < 1) {
    return false;
  }

  const payload = value.slice(0, lastDot);
  const suppliedSignature = value.slice(lastDot + 1);
  const expectedSignature = sign(payload);
  const supplied = Buffer.from(suppliedSignature);
  const expected = Buffer.from(expectedSignature);

  if (
    supplied.length !== expected.length ||
    !timingSafeEqual(supplied, expected)
  ) {
    return false;
  }

  const expiresAt = Number(payload.split(".", 1)[0]);
  return Number.isSafeInteger(expiresAt) && expiresAt > Date.now() / 1000;
}

export function verifyPassword(password) {
  const expected = Buffer.from(getAdminPassword());
  const supplied = Buffer.from(typeof password === "string" ? password : "");
  return (
    supplied.length === expected.length &&
    expected.length > 0 &&
    timingSafeEqual(supplied, expected)
  );
}

export function hasSameOrigin(req) {
  const origin = req.headers?.origin;
  const host = req.headers?.["x-forwarded-host"] || req.headers?.host;
  if (!origin) {
    return true;
  }
  if (typeof origin !== "string" || typeof host !== "string") {
    return false;
  }
  try {
    return new URL(origin).host.toLowerCase() === host.toLowerCase();
  } catch {
    return false;
  }
}

