import { Injectable } from '@nestjs/common';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { Application } from '../../applications/application.interface';
import { License } from '../../licenses/license.interface';
import { Payment } from '../../payments/payment.interface';
import { User } from '../../users/user.interface';
import { Role } from '../enums/role.enum';

export interface RevenueRecord {
  payment_id: number;
  transaction_id?: string;
  corporation_id: string;
  gross_amount: number;
  revenue_percentage_used: number;
  tradezo_revenue: number;
  municipal_share: number;
  payment_status: string;
  created_at: Date;
  backfilled?: boolean;
}

export interface PlatformData {
  corporations: Array<{ corporation_id: string; name: string; status: 'active' | 'inactive' }>;
  revenue_settings: { tradezo_revenue_percentage: number };
  revenue_records: RevenueRecord[];
}

export interface PersistentData {
  users: User[];
  applications: Application[];
  payments: Payment[];
  licenses: License[];
  platform: PlatformData;
  counters: { users: number; applications: number; payments: number; licenses: number };
}

const EMPTY_DATA: PersistentData = {
  users: [], applications: [], payments: [], licenses: [],
  platform: {
    corporations: [{ corporation_id: 'municipal-corporation', name: 'Municipal Corporation', status: 'active' }],
    revenue_settings: { tradezo_revenue_percentage: 20 },
    revenue_records: [],
  },
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
        users: Array.isArray(parsed.users) ? parsed.users.map((user: User) => ({
          ...user,
          role: user.role === ('super_user' as Role) ? ('municipal_commissioner' as Role) : user.role,
        })) : [],
        applications: Array.isArray(parsed.applications) ? parsed.applications : [],
        payments: Array.isArray(parsed.payments) ? parsed.payments : [],
        licenses: Array.isArray(parsed.licenses) ? parsed.licenses : [],
        platform: {
          corporations: Array.isArray(parsed.platform?.corporations) && parsed.platform.corporations.length
            ? parsed.platform.corporations : structuredClone(EMPTY_DATA.platform.corporations),
          revenue_settings: { ...EMPTY_DATA.platform.revenue_settings, ...(parsed.platform?.revenue_settings || {}) },
          revenue_records: Array.isArray(parsed.platform?.revenue_records) ? parsed.platform.revenue_records : [],
        },
        counters: { ...EMPTY_DATA.counters, ...(parsed.counters || {}) },
      };
    } catch {
      throw new Error(`Unable to read persistent data store: ${this.filePath}`);
    }
  }
}
