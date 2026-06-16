import crypto from 'node:crypto';

export function createID(prefix: string = '', length: number = 16): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = crypto.randomBytes(length);
  const id = Array.from(values, v => charset[v % charset.length]).join('');
  return prefix ? `${prefix}-${id}` : id;
}