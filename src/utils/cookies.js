import { expiresMs } from './jwt.js';

export function tokenCookies({ accessToken, refreshToken, accessTtl, refreshTtl, isProd, domain }) {
  const common = {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    ...(domain ? { domain } : {}),
    path: '/',
  };
  const cookies = [];
  if (accessToken) {
    cookies.push(['accessToken', accessToken, { ...common, maxAge: accessTtl }]);
  }
  if (refreshToken) {
    cookies.push(['refreshToken', refreshToken, { ...common, maxAge: refreshTtl }]);
  }
  return cookies;
}

export function clearAuthCookies(isProd, domain) {
  const common = {
    httpOnly: true,
    sameSite: 'lax',
    secure: isProd,
    ...(domain ? { domain } : {}),
    path: '/',
    maxAge: 0,
  };
  return [
    ['accessToken', '', common],
    ['refreshToken', '', common],
  ];
}