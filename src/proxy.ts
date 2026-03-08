import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

const ADMIN_SESSION_COOKIE = "journey_admin_session";
const ADMIN_FORCED_LOGOUT_COOKIE = "journey_admin_forced_logout";
const ADMIN_SESSION_MAX_AGE = 60 * 60 * 12;
const UNAUTHORIZED_HEADERS = {
  "WWW-Authenticate": 'Basic realm="Admin Area", charset="UTF-8"',
};

const unauthorized = () =>
  new NextResponse("Authentication required.", {
    status: 401,
    headers: UNAUTHORIZED_HEADERS,
  });

/**
 * Decodes a base64 Basic auth payload into username/password.
 * Returns null if the payload is malformed.
 */
const parseCredentials = (encoded: string) => {
  try {
    const decoded = atob(encoded);
    const separatorIndex = decoded.indexOf(":");
    if (separatorIndex < 0) return null;
    return {
      username: decoded.slice(0, separatorIndex),
      password: decoded.slice(separatorIndex + 1),
    };
  } catch {
    return null;
  }
};

/**
 * Protects /admin routes using env-based Basic auth and a secure session cookie.
 * Also enforces a forced-logout flow through a dedicated cookie flag.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const isForcedLogout =
    request.cookies.get(ADMIN_FORCED_LOGOUT_COOKIE)?.value === "1";
  if (isForcedLogout) {
    const redirectUrl = request.nextUrl.clone();
    redirectUrl.pathname = "/admin-signed-out";
    redirectUrl.search = "";
    if (pathname !== "/admin-signed-out") {
      return NextResponse.redirect(redirectUrl);
    }
    return NextResponse.next();
  }

  const expectedUser = process.env.ADMIN_ACCESS_USER || "admin";
  const expectedPassword = process.env.ADMIN_ACCESS_PASSWORD;

  if (!expectedPassword) {
    return new NextResponse("Admin password is not configured.", { status: 500 });
  }

  const existingSession = request.cookies.get(ADMIN_SESSION_COOKIE)?.value || "";
  if (existingSession.startsWith("basic:")) {
    const parsed = parseCredentials(existingSession.slice("basic:".length));
    if (parsed?.username === expectedUser && parsed.password === expectedPassword) {
      return NextResponse.next();
    }
  }

  const authHeader = request.headers.get("authorization");
  if (!authHeader?.startsWith("Basic ")) {
    return unauthorized();
  }

  const encoded = authHeader.slice("Basic ".length).trim();
  const parsed = parseCredentials(encoded);
  if (!parsed) {
    return unauthorized();
  }
  if (parsed.username !== expectedUser || parsed.password !== expectedPassword) {
    return unauthorized();
  }

  const response = NextResponse.next();
  response.cookies.set(ADMIN_SESSION_COOKIE, `basic:${encoded}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: ADMIN_SESSION_MAX_AGE,
  });
  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
