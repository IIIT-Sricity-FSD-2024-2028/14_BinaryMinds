import { Injectable } from '@nestjs/common';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { Application } from '../../applications/application.interface';
import { License } from '../../licenses/license.interface';
import { Payment } from '../../payments/payment.interface';
import { User } from '../../users/user.interface';

export interface PersistentData {
  users: User[];
  applications: Application[];
  payments: Payment[];
  licenses: License[];
  counters: { users: number; applications: number; payments: number; licenses: number };
}

const EMPTY_DATA: PersistentData = {
  users: [], applications: [], payments: [], licenses: [],
  counters: { users: 1, applications: 1, payments: 1, licenses: 1 },
};

@Injectable()
export class JsonStore {
  private readonly filePath = join(__dirname, '..', '..', '..', 'data', 'tradezo.json');
  private data: PersistentData;

  constructor() {
    this.data = this.read();
  }

  snapshot(): PersistentData {
    return this.data;
  }

  save(): void {
    mkdirSync(dirname(this.filePath), { recursive: true });
    const temporaryPath = this.filePath + '.tmp';
    writeFileSync(temporaryPath, JSON.stringify(this.data, null, 2) + '\n', 'utf8');
    renameSync(temporaryPath, this.filePath);
  }

  private read(): PersistentData {
    if (!existsSync(this.filePath)) return structuredClone(EMPTY_DATA);
    try {
      const parsed = JSON.parse(readFileSync(this.filePath, 'utf8'));
      return {
        users: Array.isArray(parsed.users) ? parsed.users : [],
        applications: Array.isArray(parsed.applications) ? parsed.applications : [],
        payments: Array.isArray(parsed.payments) ? parsed.payments : [],
        licenses: Array.isArray(parsed.licenses) ? parsed.licenses : [],
        counters: { ...EMPTY_DATA.counters, ...(parsed.counters || {}) },
      };
    } catch {
      throw new Error(`Unable to read persistent data store: ${this.filePath}`);
    }
  }
}
