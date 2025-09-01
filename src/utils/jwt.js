import jwt from 'jsonwebtoken';
import ms from 'ms';
import { v4 as uuidv4 } from 'uuid';

export function signAccessToken(payload, secret, expiresInStr) {
  return jwt.sign(payload, secret, { expiresIn: expiresInStr });
}

export function signRefreshToken(payload, secret, expiresInStr, jti) {
  return jwt.sign({ ...payload, jti }, secret, { expiresIn: expiresInStr });
}

export function verifyToken(token, secret) {
  return jwt.verify(token, secret);
}

export function expiresMs(expiresStr) {
  return ms(expiresStr);
}

export function newJti() {
  return uuidv4();
}