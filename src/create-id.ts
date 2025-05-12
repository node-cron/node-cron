import crypto from 'node:crypto';

export function createID(prefix: string = '', length: number = 16): string {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const values = new Uint8Array(length);
  crypto.getRandomValues(values);
  const id = Array.from(values, v => charset[v % charset.length]).join('');
  if(prefix) return `${prefix}-${id}`;
  return id;
}