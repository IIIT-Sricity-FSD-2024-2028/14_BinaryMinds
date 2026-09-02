import { Injectable } from '@nestjs/common';
import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { Application } from '../../applications/application.interface';
import { License } from '../../licenses/license.interface';
import { Payment } from '../../payments/payment.interface';
import { User } from '../../users/user.interface';
import { Municipality } from '../../municipalities/municipality.interface';
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
  revenue_settings: {
    tradezo_revenue_percentage: number;
    default_base_processing_fee?: number;
    default_platform_fee?: number;
    default_service_tax_percentage?: number;
  };
  revenue_records: RevenueRecord[];
}

export interface PersistentData {
  municipalities: Municipality[];
  users: User[];
  applications: Application[];
  payments: Payment[];
  licenses: License[];
  platform: PlatformData;
  counters: { users: number; applications: number; payments: number; licenses: number };
}

const DEFAULT_MUNICIPALITIES: Municipality[] = [
  {
    municipality_id: 'muni-hyd',
    name: 'Greater Hyderabad Municipal Corporation (GHMC)',
    state: 'Telangana',
    district: 'Hyderabad',
    status: 'active',
    base_processing_fee: 1200,
    platform_fee: 250,
    service_tax_percentage: 5,
    created_at: '2026-01-01T00:00:00.000Z',
  },
  {
    municipality_id: 'muni-blr',
    name: 'Bruhat Bengaluru Mahanagara Palike (BBMP)',
    state: 'Karnataka',
    district: 'Bengaluru',
    status: 'active',
    base_processing_fee: 1200,
    platform_fee: 250,
    service_tax_percentage: 5,
    created_at: '2026-01-01T00:00:00.000Z',
  },
];

const EMPTY_DATA: PersistentData = {
  municipalities: DEFAULT_MUNICIPALITIES,
  users: [
    {
      user_id: 0,
      full_name: 'TradeZo Platform Admin',
      email: 'superadmin@tradezo.gov.in',
      phone: '9999999999',
      password_hash: 'admin123',
      role: Role.PLATFORM_ADMIN,
      created_at: new Date('2026-01-01T00:00:00.000Z'),
    },
    {
      user_id: 1,
      full_name: 'Ramesh',
      email: 'ramesh@tradezo.gov.in',
      phone: '9876500001',
      password_hash: 'TradeZo@123',
      role: Role.MUNICIPAL_COMMISSIONER,
      municipality_id: 'muni-hyd',
      created_at: new Date('2026-01-01T00:00:00.000Z'),
    },
    {
      user_id: 2,
      full_name: 'Ravi',
      email: 'ravi@tradezo.gov.in',
      phone: '9876500002',
      password_hash: 'TradeZo@123',
      role: Role.FIELD_OFFICER,
      municipality_id: 'muni-hyd',
      created_at: new Date('2026-01-01T00:00:00.000Z'),
    },
    {
      user_id: 3,
      full_name: 'Kumar',
      email: 'kumar@tradezo.gov.in',
      phone: '9876500003',
      password_hash: 'TradeZo@123',
      role: Role.DEPARTMENT_OFFICER,
      municipality_id: 'muni-hyd',
      created_at: new Date('2026-01-01T00:00:00.000Z'),
    },
    {
      user_id: 4,
      full_name: 'Suraj',
      email: 'suraj@tradezo.gov.in',
      phone: '9876500004',
      password_hash: 'TradeZo@123',
      role: Role.MUNICIPAL_COMMISSIONER,
      municipality_id: 'muni-blr',
      created_at: new Date('2026-01-01T00:00:00.000Z'),
    },
    {
      user_id: 5,
      full_name: 'Arjun',
      email: 'arjun@tradezo.gov.in',
      phone: '9876500005',
      password_hash: 'TradeZo@123',
      role: Role.FIELD_OFFICER,
      municipality_id: 'muni-blr',
      created_at: new Date('2026-01-01T00:00:00.000Z'),
    },
    {
      user_id: 6,
      full_name: 'Naveen',
      email: 'naveen@tradezo.gov.in',
      phone: '9876500006',
      password_hash: 'TradeZo@123',
      role: Role.DEPARTMENT_OFFICER,
      municipality_id: 'muni-blr',
      created_at: new Date('2026-01-01T00:00:00.000Z'),
    },
  ],
  applications: [],
  payments: [],
  licenses: [],
  platform: {
    corporations: [
      { corporation_id: 'muni-hyd', name: 'Greater Hyderabad Municipal Corporation (GHMC)', status: 'active' },
      { corporation_id: 'muni-blr', name: 'Bruhat Bengaluru Mahanagara Palike (BBMP)', status: 'active' },
    ],
    revenue_settings: {
      tradezo_revenue_percentage: 20,
      default_base_processing_fee: 1200,
      default_platform_fee: 250,
      default_service_tax_percentage: 5,
    },
    revenue_records: [],
  },
  counters: { users: 7, applications: 1, payments: 1, licenses: 1 },
};

@Injectable()
export class JsonStore {
  private readonly filePath =
    process.env.TRADEZO_DATA_FILE ||
    join(__dirname, '..', '..', '..', 'data', 'tradezo.json');
  private data: PersistentData;

  constructor() {
    this.data = this.read();
  }

  snapshot(): PersistentData {
    return this.data;
  }

  save(): void {
    mkdirSync(dirname(this.filePath), { recursive: true });
    writeFileSync(this.filePath, JSON.stringify(this.data, null, 2) + '\n', 'utf8');
  }

  private read(): PersistentData {
    if (!existsSync(this.filePath)) return structuredClone(EMPTY_DATA);
    try {
      const parsed = JSON.parse(readFileSync(this.filePath, 'utf8'));
      const loadedMunicipalities = Array.isArray(parsed.municipalities) && parsed.municipalities.length
        ? parsed.municipalities
        : structuredClone(DEFAULT_MUNICIPALITIES);

      return {
        municipalities: loadedMunicipalities,
        users: Array.isArray(parsed.users) ? parsed.users.map((user: User) => ({
          ...user,
          municipality_id: user.municipality_id,
          role: user.role === ('super_user' as Role) ? ('municipal_commissioner' as Role) : user.role,
        })) : [],
        applications: Array.isArray(parsed.applications) ? parsed.applications.map((app: Application) => ({
          ...app,
          municipality_id: app.municipality_id,
        })) : [],
        payments: Array.isArray(parsed.payments) ? parsed.payments.map((p: Payment) => ({
          ...p,
          municipality_id: p.municipality_id,
        })) : [],
        licenses: Array.isArray(parsed.licenses) ? parsed.licenses.map((l: License) => ({
          ...l,
          municipality_id: l.municipality_id,
        })) : [],
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
