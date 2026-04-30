import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { resolveUserFromHeaders, loadUser, requireAuth, requireProxyAuth } from './proxyAuth';
import type { RuntimeUser } from './proxyAuth';
import type { Request, Response, NextFunction } from 'express';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeRes(): Response & { _status: number; _body: unknown } {
  const state = { _status: 200, _body: undefined as unknown };
  const locals: Record<string, unknown> = {};
  const res = {
    locals,
    status(code: number) {
      state._status = code;
      return res;
    },
    json(body: unknown) {
      state._body = body;
      return res;
    },
    get _status() {
      return state._status;
    },
    get _body() {
      return state._body;
    },
  };
  return res as unknown as Response & { _status: number; _body: unknown };
}

function makeReq(headers: Record<string, string> = {}): Request {
  return { headers } as unknown as Request;
}

// ---------------------------------------------------------------------------
// resolveUserFromHeaders
// ---------------------------------------------------------------------------

describe('resolveUserFromHeaders', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env['DEV_STUB_USER'];
    delete process.env['NODE_ENV'];
    delete process.env['REQUIRE_PROXY_AUTH'];
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('returns user from Remote-User header', () => {
    const user = resolveUserFromHeaders({
      'remote-user': 'alice@example.com',
      'remote-name': 'Alice',
      'remote-groups': 'admins,editors',
    });
    expect(user.email).toBe('alice@example.com');
    expect(user.name).toBe('Alice');
    expect(user.groups).toEqual(['admins', 'editors']);
    expect(user.isGuest).toBe(false);
    expect(user.id).toBe('alice@example.com');
  });

  it('normalises email to lowercase from Remote-User', () => {
    const user = resolveUserFromHeaders({ 'remote-user': '  Alice@Example.COM  ' });
    expect(user.email).toBe('alice@example.com');
    expect(user.isGuest).toBe(false);
  });

  it('falls back to Remote-Email when Remote-User is absent', () => {
    const user = resolveUserFromHeaders({ 'remote-email': 'Bob@Example.com' });
    expect(user.email).toBe('bob@example.com');
    expect(user.isGuest).toBe(false);
  });

  it('normalises email to lowercase from Remote-Email fallback', () => {
    const user = resolveUserFromHeaders({ 'remote-email': 'BOB@EXAMPLE.COM' });
    expect(user.email).toBe('bob@example.com');
  });

  it('defaults name to email when Remote-Name is absent', () => {
    const user = resolveUserFromHeaders({ 'remote-user': 'carol@example.com' });
    expect(user.name).toBe('carol@example.com');
  });

  it('returns empty groups when Remote-Groups is absent', () => {
    const user = resolveUserFromHeaders({ 'remote-user': 'dan@example.com' });
    expect(user.groups).toEqual([]);
  });

  it('parses comma-separated Remote-Groups correctly', () => {
    const user = resolveUserFromHeaders({
      'remote-user': 'dan@example.com',
      'remote-groups': ' admins , editors , viewers ',
    });
    expect(user.groups).toEqual(['admins', 'editors', 'viewers']);
  });

  it('accepts Remote-User as a string array (takes first element)', () => {
    const user = resolveUserFromHeaders({
      'remote-user': ['Alice@Example.com', 'other@example.com'],
    });
    expect(user.email).toBe('alice@example.com');
    expect(user.isGuest).toBe(false);
  });

  it('accepts Remote-Groups as a string array (takes first element)', () => {
    const user = resolveUserFromHeaders({
      'remote-user': 'alice@example.com',
      'remote-groups': ['admins,editors', 'ignored'],
    });
    expect(user.groups).toEqual(['admins', 'editors']);
  });

  // DEV_STUB_USER
  describe('DEV_STUB_USER', () => {
    it('uses DEV_STUB_USER when no proxy headers are present (dev mode)', () => {
      process.env['DEV_STUB_USER'] = 'dev@example.com:Developer:admins,editors';
      const user = resolveUserFromHeaders({});
      expect(user.email).toBe('dev@example.com');
      expect(user.name).toBe('Developer');
      expect(user.groups).toEqual(['admins', 'editors']);
      expect(user.isGuest).toBe(false);
    });

    it('parses DEV_STUB_USER without groups', () => {
      process.env['DEV_STUB_USER'] = 'dev@example.com:Developer';
      const user = resolveUserFromHeaders({});
      expect(user.email).toBe('dev@example.com');
      expect(user.name).toBe('Developer');
      expect(user.groups).toEqual([]);
    });

    it('lowercases the email from DEV_STUB_USER', () => {
      process.env['DEV_STUB_USER'] = 'Dev@Example.COM:Developer:admins';
      const user = resolveUserFromHeaders({});
      expect(user.email).toBe('dev@example.com');
      expect(user.id).toBe('dev@example.com');
      expect(user.isGuest).toBe(false);
    });

    it('ignores DEV_STUB_USER when NODE_ENV=production', () => {
      process.env['DEV_STUB_USER'] = 'dev@example.com:Developer:admins';
      process.env['NODE_ENV'] = 'production';
      const user = resolveUserFromHeaders({});
      expect(user.isGuest).toBe(true);
    });

    it('ignores DEV_STUB_USER when REQUIRE_PROXY_AUTH=true', () => {
      process.env['DEV_STUB_USER'] = 'dev@example.com:Developer:admins';
      process.env['REQUIRE_PROXY_AUTH'] = 'true';
      const user = resolveUserFromHeaders({});
      expect(user.isGuest).toBe(true);
    });
  });

  // Guest fallback
  it('returns guest sentinel when no headers and no dev stub', () => {
    const user = resolveUserFromHeaders({});
    expect(user.isGuest).toBe(true);
    expect(user.id).toBe('guest');
    expect(user.email).toBe('guest@local');
    expect(user.name).toBe('Guest');
    expect(user.groups).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// loadUser middleware
// ---------------------------------------------------------------------------

describe('loadUser', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env['DEV_STUB_USER'];
    delete process.env['NODE_ENV'];
    delete process.env['REQUIRE_PROXY_AUTH'];
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('stores resolved user in res.locals.user and calls next', () => {
    const req = makeReq({ 'remote-user': 'alice@example.com', 'remote-name': 'Alice' });
    const res = makeRes();
    const next = vi.fn() as NextFunction;

    loadUser(req, res, next);

    const user = res.locals['user'] as RuntimeUser;
    expect(user.email).toBe('alice@example.com');
    expect(user.name).toBe('Alice');
    expect(user.isGuest).toBe(false);
    expect(next).toHaveBeenCalledOnce();
  });

  it('logs [auth] principal with the resolved email', () => {
    const consoleSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    const req = makeReq({ 'remote-user': 'alice@example.com' });
    const res = makeRes();
    const next = vi.fn() as NextFunction;

    loadUser(req, res, next);

    expect(consoleSpy).toHaveBeenCalledWith('[auth] principal="alice@example.com"');
    consoleSpy.mockRestore();
  });

  it('sets guest user when no headers present', () => {
    const req = makeReq();
    const res = makeRes();
    const next = vi.fn() as NextFunction;

    loadUser(req, res, next);

    const user = res.locals['user'] as RuntimeUser;
    expect(user.isGuest).toBe(true);
    expect(next).toHaveBeenCalledOnce();
  });
});

// ---------------------------------------------------------------------------
// requireAuth middleware
// ---------------------------------------------------------------------------

describe('requireAuth', () => {
  it('calls next for authenticated user', () => {
    const req = makeReq();
    const res = makeRes();
    res.locals['user'] = {
      id: 'alice@example.com',
      email: 'alice@example.com',
      name: 'Alice',
      groups: [],
      isGuest: false,
    } satisfies RuntimeUser;
    const next = vi.fn() as NextFunction;

    requireAuth(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res._status).toBe(200);
  });

  it('returns 401 for guest user', () => {
    const req = makeReq();
    const res = makeRes();
    res.locals['user'] = {
      id: 'guest',
      email: 'guest@local',
      name: 'Guest',
      groups: [],
      isGuest: true,
    } satisfies RuntimeUser;
    const next = vi.fn() as NextFunction;

    requireAuth(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(401);
  });

  it('returns 401 when user is not set in res.locals', () => {
    const req = makeReq();
    const res = makeRes();
    const next = vi.fn() as NextFunction;

    requireAuth(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(401);
  });
});

// ---------------------------------------------------------------------------
// requireProxyAuth middleware
// ---------------------------------------------------------------------------

describe('requireProxyAuth', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env['NODE_ENV'];
    delete process.env['REQUIRE_PROXY_AUTH'];
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('passes through in development mode even without Remote-User', () => {
    const req = makeReq();
    const res = makeRes();
    const next = vi.fn() as NextFunction;

    requireProxyAuth(req, res, next);

    expect(next).toHaveBeenCalledOnce();
    expect(res._status).toBe(200);
  });

  it('returns 401 in production mode when Remote-User is absent', () => {
    process.env['NODE_ENV'] = 'production';
    const req = makeReq();
    const res = makeRes();
    const next = vi.fn() as NextFunction;

    requireProxyAuth(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(401);
  });

  it('passes through in production mode when Remote-User is present', () => {
    process.env['NODE_ENV'] = 'production';
    const req = makeReq({ 'remote-user': 'alice@example.com' });
    const res = makeRes();
    const next = vi.fn() as NextFunction;

    requireProxyAuth(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('returns 401 when REQUIRE_PROXY_AUTH=true without Remote-User', () => {
    process.env['REQUIRE_PROXY_AUTH'] = 'true';
    const req = makeReq();
    const res = makeRes();
    const next = vi.fn() as NextFunction;

    requireProxyAuth(req, res, next);

    expect(next).not.toHaveBeenCalled();
    expect(res._status).toBe(401);
  });

  it('passes through when REQUIRE_PROXY_AUTH=true and Remote-User is present', () => {
    process.env['REQUIRE_PROXY_AUTH'] = 'true';
    const req = makeReq({ 'remote-user': 'bob@example.com' });
    const res = makeRes();
    const next = vi.fn() as NextFunction;

    requireProxyAuth(req, res, next);

    expect(next).toHaveBeenCalledOnce();
  });

  it('passes in production when Remote-User is a string array', () => {
    process.env['NODE_ENV'] = 'production';
    const reqWithArray = {
      headers: { 'remote-user': ['alice@example.com', 'other'] },
    } as unknown as Request;
    const res = makeRes();
    const next = vi.fn() as NextFunction;

    requireProxyAuth(reqWithArray, res, next);

    expect(next).toHaveBeenCalledOnce();
  });
});
