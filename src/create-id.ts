import { randomUUID } from 'node:crypto';

export function createID(): string {
  return randomUUID();
}
