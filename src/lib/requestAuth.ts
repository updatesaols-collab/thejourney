import crypto from "crypto";
import { NextRequest, NextResponse } from "next/server";

const ADMIN_REALM = 'Basic realm="Admin Area", charset="UTF-8"';
const ADMIN_SESSION_COOKIE = "journey_admin_session";
const ADMIN_FORCED_LOGOUT_COOKIE = "journey_admin_forced_logout";
const USER_SESSION_COOKIE = "journey_user_session";
const ADMIN_SESSION_MAX_AGE = 60 * 60 * 12;
const USER_SESSION_MAX_AGE = 60 * 60 * 24 * 30;

type SignedSession = {
  sub: string;
  iat: number;
};

type GuardResult =
  | { ok: true; subject: string }
  | { ok: false; response: NextResponse };

const normalizeEmail = (value: string) => value.trim().toLowerCase();

const timingSafeEqual = (left: string, right: string) => {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);
  if (leftBuffer.length !== rightBuffer.length) return false;
  return crypto.timingSafeEqual(leftBuffer, rightBuffer);
};

const toBase64Url = (value: string) => Buffer.from(value, "utf8").toString("base64url");

const fromBase64Url = (value: string) => Buffer.from(value, "base64url").toString("utf8");

const sign = (payload: string, secret: string) =>
  crypto.createHmac("sha256", secret).update(payload).digest("base64url");

const encodeSession = (session: SignedSession, secret: string) => {
  const payload = toBase64Url(JSON.stringify(session));
  const signature = sign(payload, secret);
  return `${payload}.${signature}`;
};

const decodeSession = (token: string, secret: string): SignedSession | null => {
  const [payload, signature] = token.split(".");
  if (!payload || !signature) return null;
  const expected = sign(payload, secret);
  if (!timingSafeEqual(signature, expected)) return null;
  try {
    const parsed = JSON.parse(fromBase64Url(payload)) as SignedSession;
    if (!parsed || typeof parsed.sub !== "string" || typeof parsed.iat !== "number") {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

const isExpired = (session: SignedSession, maxAgeSeconds: number) => {
  const ageMs = Date.now() - session.iat;
  return ageMs > maxAgeSeconds * 1000 || ageMs < 0;
};

const parseCookies = (cookieHeader: string) => {
  const cookies = new Map<string, string>();
  for (const part of cookieHeader.split(";")) {
    const [name, ...rest] = part.trim().split("=");
    if (!name) continue;
    cookies.set(name, rest.join("="));
  }
  return cookies;
};

const getCookie = (request: NextRequest | Request, name: string) => {
  if ("cookies" in request) {
    const cookieValue = (request as NextRequest).cookies.get(name)?.value;
    if (cookieValue) return cookieValue;
  }
  const cookieHeader = request.headers.get("cookie") || "";
  if (!cookieHeader) return "";
  return parseCookies(cookieHeader).get(name) || "";
};

const parseBasicAuth = (request: NextRequest | Request) => {
  const header = request.headers.get("authorization");
  if (!header?.startsWith("Basic ")) return null;
  const encoded = header.slice("Basic ".length).trim();
  return parseEncodedCredentials(encoded);
};

const parseEncodedCredentials = (encoded: string) => {
  let decoded = "";
  try {
    decoded = Buffer.from(encoded, "base64").toString("utf8");
  } catch {
    return null;
  }
  const separatorIndex = decoded.indexOf(":");
  if (separatorIndex < 0) return null;
  const username = decoded.slice(0, separatorIndex);
  const password = decoded.slice(separatorIndex + 1);
  return { username, password };
};

const getAdminUser = () => process.env.ADMIN_ACCESS_USER || "admin";

const getAdminPassword = () => process.env.ADMIN_ACCESS_PASSWORD || "";

const getAdminSessionSecret = () =>
  process.env.ADMIN_SESSION_SECRET || process.env.SESSION_SECRET || getAdminPassword();

const getUserSessionSecret = () =>
  process.env.USER_SESSION_SECRET || process.env.SESSION_SECRET || getAdminPassword();

const isSecureCookie = () => process.env.NODE_ENV === "production";

const adminAuthHeaders = {
  "WWW-Authenticate": ADMIN_REALM,
};

export const adminUnauthorizedText = () =>
  new NextResponse("Authentication required.", {
    status: 401,
    headers: adminAuthHeaders,
  });

export const adminUnauthorizedJson = () =>
  NextResponse.json(
    { message: "Admin authentication required." },
    { status: 401, headers: adminAuthHeaders }
  );

export const adminMisconfiguredResponse = (json = false) =>
  json
    ? NextResponse.json({ message: "Admin password is not configured." }, { status: 500 })
    : new NextResponse("Admin password is not configured.", { status: 500 });

export const attachAdminSession = (response: NextResponse, username = getAdminUser()) => {
  const token = encodeSession({ sub: username, iat: Date.now() }, getAdminSessionSecret());
  response.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecureCookie(),
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE,
  });
};

export const clearAdminSession = (response: NextResponse) => {
  response.cookies.set(ADMIN_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecureCookie(),
    path: "/",
    maxAge: 0,
  });
};

export const setAdminForcedLogout = (response: NextResponse) => {
  response.cookies.set(ADMIN_FORCED_LOGOUT_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecureCookie(),
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE,
  });
};

export const clearAdminForcedLogout = (response: NextResponse) => {
  response.cookies.set(ADMIN_FORCED_LOGOUT_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecureCookie(),
    path: "/",
    maxAge: 0,
  });
};

export const isAdminForcedLoggedOut = (request: NextRequest | Request) =>
  getCookie(request, ADMIN_FORCED_LOGOUT_COOKIE) === "1";

const readAdminSession = (request: NextRequest | Request) => {
  const token = getCookie(request, ADMIN_SESSION_COOKIE);
  if (!token) return null;
  if (token.startsWith("basic:")) {
    const parsed = parseEncodedCredentials(token.slice("basic:".length));
    if (!parsed) return null;
    return { sub: parsed.username, iat: Date.now(), password: parsed.password };
  }
  const parsed = decodeSession(token, getAdminSessionSecret());
  if (!parsed || isExpired(parsed, ADMIN_SESSION_MAX_AGE)) return null;
  return { ...parsed, password: "" };
};

export const isAdminRequestAuthorized = (request: NextRequest | Request) => {
  const expectedUser = getAdminUser();
  const expectedPassword = getAdminPassword();
  if (!expectedPassword) {
    return { ok: false as const, reason: "misconfigured" as const };
  }

  const adminSession = readAdminSession(request);
  if (
    adminSession?.sub === expectedUser &&
    (!adminSession.password || timingSafeEqual(adminSession.password, expectedPassword))
  ) {
    return { ok: true as const, via: "session" as const, username: expectedUser };
  }

  const basic = parseBasicAuth(request);
  if (!basic) {
    return { ok: false as const, reason: "unauthorized" as const };
  }

  const isValid =
    basic.username === expectedUser && timingSafeEqual(basic.password, expectedPassword);
  if (!isValid) {
    return { ok: false as const, reason: "unauthorized" as const };
  }

  return { ok: true as const, via: "basic" as const, username: expectedUser };
};

export const requireAdmin = (request: NextRequest | Request): GuardResult => {
  if (isAdminForcedLoggedOut(request)) {
    return {
      ok: false,
      response: NextResponse.json({ message: "Admin signed out." }, { status: 401 }),
    };
  }

  const result = isAdminRequestAuthorized(request);
  if (!result.ok) {
    if (result.reason === "misconfigured") {
      return { ok: false, response: adminMisconfiguredResponse(true) };
    }
    return { ok: false, response: adminUnauthorizedJson() };
  }
  return { ok: true, subject: result.username };
};

export const attachUserSession = (response: NextResponse, email: string) => {
  const cleanEmail = normalizeEmail(email);
  const token = encodeSession({ sub: cleanEmail, iat: Date.now() }, getUserSessionSecret());
  response.cookies.set(USER_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecureCookie(),
    path: "/",
    maxAge: USER_SESSION_MAX_AGE,
  });
};

export const clearUserSession = (response: NextResponse) => {
  response.cookies.set(USER_SESSION_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: isSecureCookie(),
    path: "/",
    maxAge: 0,
  });
};

const readUserSession = (request: NextRequest | Request) => {
  const token = getCookie(request, USER_SESSION_COOKIE);
  if (!token) return null;
  const parsed = decodeSession(token, getUserSessionSecret());
  if (!parsed?.sub || isExpired(parsed, USER_SESSION_MAX_AGE)) return null;
  return {
    email: normalizeEmail(parsed.sub),
  };
};

export const getUserSessionSubject = (request: NextRequest | Request) =>
  readUserSession(request)?.email || null;

export const requireUser = (request: NextRequest | Request): GuardResult => {
  const session = readUserSession(request);
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json({ message: "Please log in to continue." }, { status: 401 }),
    };
  }
  return { ok: true, subject: session.email };
};
