/**
 * Proxy Auth Middleware
 *
 * Reads identity from a reverse-proxy forward-auth stack (e.g. nginx +
 * Authelia, or nginx + oauth2-proxy) via the standard identity headers
 * (Remote-User, Remote-Name, Remote-Email, Remote-Groups).
 *
 * This module does **not** handle credentials, sessions, passwords, or tokens.
 * The proxy is solely responsible for authentication; this code only reads the
 * resulting identity headers.
 *
 * Note: pic-map currently has no production HTTP server. This module
 * establishes the auth contract so any future preview server, web editor, or
 * upload endpoint inherits the correct behaviour.
 *
 * Header resolution order per request:
 *  1. Remote-User (preferred Authelia header)
 *  2. Remote-Email (fallback for oauth2-proxy deployments)
 *  3. DEV_STUB_USER env var (development only, ignored in production)
 *  4. Guest sentinel (unauthenticated requests)
 *
 * Development/local mode:
 *   Set DEV_STUB_USER="email:Display Name:group1,group2" to inject a fake
 *   identity without the full Authelia stack.
 *   DEV_STUB_USER is ignored when NODE_ENV=production or REQUIRE_PROXY_AUTH=true.
 *
 * Optional strict mode:
 *   requireProxyAuth() rejects requests without proxy headers when
 *   NODE_ENV=production or REQUIRE_PROXY_AUTH=true.
 */

import type { Request, Response, NextFunction } from 'express';

/**
 * Identity resolved from proxy headers for a single request.
 * Groups come directly from the Remote-Groups header and are not persisted.
 */
export type RuntimeUser = {
  id: string;
  email: string;
  name: string;
  groups: string[];
  isGuest: boolean;
};

/** Sentinel returned when no identity headers are present and no dev stub is configured. */
const GUEST_USER: RuntimeUser = {
  id: 'guest',
  email: 'guest@local',
  name: 'Guest',
  groups: [],
  isGuest: true,
};

const HEADER_REMOTE_USER = 'remote-user';
const HEADER_REMOTE_NAME = 'remote-name';
const HEADER_REMOTE_EMAIL = 'remote-email';
const HEADER_REMOTE_GROUPS = 'remote-groups';

/** Returns true when running in production proxy-auth mode. */
function proxyAuthRequired(): boolean {
  return (
    process.env['NODE_ENV'] === 'production' ||
    process.env['REQUIRE_PROXY_AUTH'] === 'true'
  );
}

/**
 * Parse DEV_STUB_USER into identity fields.
 * Format: "email:Display Name:group1,group2"
 * Groups are optional.
 * Returns null when the variable is unset, malformed, or proxy-auth is required.
 */
function parseDevStubUser(): { email: string; name: string; groups: string[] } | null {
  const raw = process.env['DEV_STUB_USER'];
  if (!raw || proxyAuthRequired()) return null;

  const firstColon = raw.indexOf(':');
  if (firstColon < 0) return null;

  const email = raw.slice(0, firstColon).trim();
  if (!email) return null;

  const rest = raw.slice(firstColon + 1);
  const secondColon = rest.indexOf(':');
  let name: string;
  let groupsStr: string;

  if (secondColon < 0) {
    name = rest.trim();
    groupsStr = '';
  } else {
    name = rest.slice(0, secondColon).trim();
    groupsStr = rest.slice(secondColon + 1).trim();
  }

  if (!name) name = email;
  const groups = groupsStr
    ? groupsStr
        .split(',')
        .map(g => g.trim())
        .filter(Boolean)
    : [];

  return { email, name, groups };
}

/**
 * Resolve a RuntimeUser from the supplied request headers.
 *
 * @param headers - An object of HTTP request headers (e.g. req.headers).
 * @returns The resolved RuntimeUser (never throws).
 */
export function resolveUserFromHeaders(
  headers: Record<string, string | string[] | undefined>,
): RuntimeUser {
  const rawEmail = headers[HEADER_REMOTE_USER] ?? headers[HEADER_REMOTE_EMAIL];
  const email =
    typeof rawEmail === 'string' ? rawEmail.trim().toLowerCase() : '';

  if (email !== '') {
    const rawName = headers[HEADER_REMOTE_NAME];
    const name =
      typeof rawName === 'string' && rawName.trim() !== ''
        ? rawName.trim()
        : email;

    const rawGroups = headers[HEADER_REMOTE_GROUPS];
    const groups: string[] =
      typeof rawGroups === 'string' && rawGroups.trim() !== ''
        ? rawGroups
            .split(',')
            .map(g => g.trim())
            .filter(Boolean)
        : [];

    return { id: email, email, name, groups, isGuest: false };
  }

  // No proxy headers — try dev stub
  const stub = parseDevStubUser();
  if (stub) {
    return {
      id: stub.email,
      email: stub.email,
      name: stub.name,
      groups: stub.groups,
      isGuest: false,
    };
  }

  // Fall back to guest sentinel
  return { ...GUEST_USER };
}

/**
 * Express middleware: resolves the caller's identity from proxy headers and
 * stores it on res.locals.user.  Logs "[auth] principal=<email>" once per
 * request.  Always calls next().
 */
export function loadUser(req: Request, res: Response, next: NextFunction): void {
  const user = resolveUserFromHeaders(req.headers);
  res.locals['user'] = user;
  console.log(`[auth] principal="${user.email}"`);
  next();
}

/**
 * Express middleware: returns 401 JSON when the resolved user is the guest
 * sentinel (i.e. no authenticated identity was present).
 */
export function requireAuth(_req: Request, res: Response, next: NextFunction): void {
  const user = res.locals['user'] as RuntimeUser | undefined;
  if (!user || user.isGuest) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  next();
}

/**
 * Express middleware: strict-mode guard.
 *
 * Returns 401 when Remote-User is absent AND the service is in
 * production/strict mode (NODE_ENV=production or REQUIRE_PROXY_AUTH=true).
 * Acts as a pass-through in development mode.
 *
 * This middleware is **not** registered globally — opt in explicitly in your
 * middleware stack when you want defense-in-depth rejection of unauthenticated
 * requests at the edge.
 */
export function requireProxyAuth(req: Request, res: Response, next: NextFunction): void {
  if (!proxyAuthRequired()) {
    next();
    return;
  }

  const remoteUser = req.headers[HEADER_REMOTE_USER];
  if (typeof remoteUser !== 'string' || remoteUser.trim() === '') {
    res.status(401).json({ error: 'Missing proxy authentication headers' });
    return;
  }

  next();
}
