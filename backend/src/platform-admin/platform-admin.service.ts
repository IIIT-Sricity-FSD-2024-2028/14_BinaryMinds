import { BadRequestException, Injectable } from '@nestjs/common';
import { Payment } from '../payments/payment.interface';
import { PaymentStatus } from '../common/enums/payment-status.enum';
import { Role } from '../common/enums/role.enum';
import { JsonStore, RevenueRecord } from '../common/persistence/json-store';

const roundMoney = (amount: number) => Math.round((amount + Number.EPSILON) * 100) / 100;

@Injectable()
export class PlatformAdminService {
  constructor(private readonly store: JsonStore) { this.backfillCompletedPayments(); }

  overview() {
    const data = this.store.snapshot();
    const completed = data.payments.filter((payment) => payment.payment_status === PaymentStatus.COMPLETED);
    const munis = (data.municipalities && data.municipalities.length) ? data.municipalities : data.platform.corporations;
    const totalApps = (data.applications || []).length;
    const totalGross = roundMoney(totalApps * 1510);
    const totalPlatformRevenue = roundMoney(totalApps * 250);
    const totalMuniShare = roundMoney(totalApps * 1260);
    return {
      total_municipal_corporations: munis.length,
      active_municipal_corporations: munis.filter((m: any) => m.status === 'active').length,
      total_applications: totalApps,
      total_licenses: (data.licenses || []).length,
      completed_transactions: completed.length,
      total_gross_collection: totalGross,
      total_tradezo_revenue: totalPlatformRevenue,
      total_municipal_share: totalMuniShare,
      current_revenue_percentage: data.platform.revenue_settings.tradezo_revenue_percentage,
    };
  }

  corporations() {
    const data = this.store.snapshot();
    const configuredMunis = (data.municipalities && data.municipalities.length)
      ? data.municipalities
      : data.platform.corporations.map((c) => ({
          municipality_id: c.corporation_id,
          name: c.name,
          status: c.status,
          state: 'Telangana',
          district: 'Hyderabad',
          base_processing_fee: 1200,
          platform_fee: 250,
          service_tax_percentage: 5,
        }));

    // Dynamically include any additional municipality referenced in applications
    const existingIds = new Set(configuredMunis.map((m: any) => (m.municipality_id || m.corporation_id || '').toLowerCase()));
    const extraMunis: any[] = [];
    (data.applications || []).forEach((app: any) => {
      const appMuniId = (app.municipality_id || '').toLowerCase();
      if (appMuniId && !existingIds.has(appMuniId)) {
        existingIds.add(appMuniId);
        extraMunis.push({
          municipality_id: app.municipality_id,
          name: app.municipalityName || app.municipality_id,
          status: 'active',
          state: app.state || 'N/A',
          district: app.district || app.city || 'N/A',
          base_processing_fee: 1200,
          platform_fee: 250,
          service_tax_percentage: 5,
        });
      }
    });

    const allMunis = [...configuredMunis, ...extraMunis];

    return allMunis.map((m: any) => {
      const corpId = m.municipality_id || m.corporation_id;
      const headUser = (data.users || []).find((u) =>
        (u.role === Role.MUNICIPAL_COMMISSIONER || u.role === ('super_user' as any)) &&
        (u.municipality_id || '').toLowerCase() === corpId.toLowerCase()
      );

      const fieldOfficers = (data.users || []).filter((u) =>
        u.role === Role.FIELD_OFFICER &&
        (u.municipality_id || '').toLowerCase() === corpId.toLowerCase()
      );

      const departmentOfficers = (data.users || []).filter((u) =>
        u.role === Role.DEPARTMENT_OFFICER &&
        (u.municipality_id || '').toLowerCase() === corpId.toLowerCase()
      );

      const licenses = (data.licenses || []).filter((l) =>
        (l.municipality_id || '').toLowerCase() === corpId.toLowerCase()
      );

      return {
        corporation_id: corpId,
        municipality_id: corpId,
        name: m.name,
        status: m.status || 'active',
        state: m.state || 'N/A',
        district: m.district || 'N/A',
        base_processing_fee: m.base_processing_fee ?? 1200,
        platform_fee: m.platform_fee ?? 250,
        service_tax_percentage: m.service_tax_percentage ?? 5,
        municipal_head: headUser
          ? {
              name: headUser.full_name,
              email: headUser.email,
              phone: headUser.phone || '',
            }
          : null,
        field_officers_count: fieldOfficers.length,
        department_officers_count: departmentOfficers.length,
        licenses_count: licenses.length,
        ...this.corporationTotals(corpId, m),
      };
    });
  }

  revenue() {
    const records = this.store.snapshot().platform.revenue_records;
    const corps = this.corporations();
    const totalRevenue = roundMoney(corps.reduce((sum, c) => sum + (Number(c.tradezo_revenue) || 0), 0));
    const totalMuniShare = roundMoney(corps.reduce((sum, c) => sum + (Number(c.municipal_share) || 0), 0));
    const totalGross = roundMoney(corps.reduce((sum, c) => sum + (Number(c.gross_collection) || 0), 0));
    return {
      ...this.overview(),
      total_gross_collection: totalGross,
      total_tradezo_revenue: totalRevenue,
      total_municipal_share: totalMuniShare,
      corporations: corps,
      records,
    };
  }

  settings() {
    const raw = this.store.snapshot().platform.revenue_settings;
    return {
      tradezo_revenue_percentage: raw?.tradezo_revenue_percentage ?? 20,
      default_base_processing_fee: raw?.default_base_processing_fee ?? 1200,
      default_platform_fee: raw?.default_platform_fee ?? 250,
      default_service_tax_percentage: raw?.default_service_tax_percentage ?? 5,
    };
  }

  updateSettings(dto: number | { tradezo_revenue_percentage?: number; default_base_processing_fee?: number; default_platform_fee?: number; default_service_tax_percentage?: number }) {
    const current = this.store.snapshot().platform.revenue_settings;
    if (typeof dto === 'number') {
      if (!Number.isInteger(dto) || dto < 0 || dto > 100) throw new BadRequestException('Revenue percentage must be a whole number from 0 to 100');
      current.tradezo_revenue_percentage = dto;
    } else {
      if (dto.tradezo_revenue_percentage !== undefined) {
        if (!Number.isInteger(dto.tradezo_revenue_percentage) || dto.tradezo_revenue_percentage < 0 || dto.tradezo_revenue_percentage > 100) {
          throw new BadRequestException('Revenue percentage must be a whole number from 0 to 100');
        }
        current.tradezo_revenue_percentage = dto.tradezo_revenue_percentage;
      }
      if (dto.default_base_processing_fee !== undefined) {
        if (dto.default_base_processing_fee < 0) throw new BadRequestException('Base processing fee cannot be negative');
        current.default_base_processing_fee = dto.default_base_processing_fee;
      }
      if (dto.default_platform_fee !== undefined) {
        if (dto.default_platform_fee < 0) throw new BadRequestException('Platform fee cannot be negative');
        current.default_platform_fee = dto.default_platform_fee;
      }
      if (dto.default_service_tax_percentage !== undefined) {
        if (dto.default_service_tax_percentage < 0 || dto.default_service_tax_percentage > 100) {
          throw new BadRequestException('Service tax percentage must be between 0 and 100');
        }
        current.default_service_tax_percentage = dto.default_service_tax_percentage;
      }
    }
    this.store.save();
    return this.settings();
  }

  recordCompletedPayment(payment: Payment) {
    if (payment.payment_status !== PaymentStatus.COMPLETED) return;
    const records = this.store.snapshot().platform.revenue_records;
    if (records.some((record) => record.payment_id === payment.payment_id)) return;
    const percentage = this.settings().tradezo_revenue_percentage;
    const revenue = roundMoney((payment.amount * percentage) / 100);
    const corpId = payment.municipality_id;
    if (!corpId) return;
    const record: RevenueRecord = {
      payment_id: payment.payment_id,
      transaction_id: payment.transaction_id,
      corporation_id: corpId,
      gross_amount: roundMoney(payment.amount),
      revenue_percentage_used: percentage,
      tradezo_revenue: revenue,
      municipal_share: roundMoney(payment.amount - revenue),
      payment_status: payment.payment_status,
      created_at: payment.payment_date || new Date(),
      backfilled: false,
    };
    records.push(record);
    this.store.save();
  }

  private backfillCompletedPayments() {
    const records = this.store.snapshot().platform.revenue_records;
    let changed = false;
    this.store.snapshot().payments
      .filter((payment) => payment.payment_status === PaymentStatus.COMPLETED)
      .forEach((payment) => {
        if (records.some((record) => record.payment_id === payment.payment_id)) return;
        this.recordCompletedPayment(payment);
        const record = records.find((candidate) => candidate.payment_id === payment.payment_id);
        if (record) {
          record.backfilled = true;
          changed = true;
        }
      });
    if (changed) this.store.save();
  }

  private corporationTotals(corporationId: string, muni?: any) {
    const data = this.store.snapshot();
    const records = (data.platform.revenue_records || []).filter((record) =>
      (record.corporation_id || '').toLowerCase() === corporationId.toLowerCase()
    );
    const apps = (data.applications || []).filter((app) =>
      (app.municipality_id || '').toLowerCase() === corporationId.toLowerCase()
    );

    const platformFee = muni?.platform_fee ?? 250;
    const baseFee = muni?.base_processing_fee ?? 1200;
    const taxPct = muni?.service_tax_percentage ?? 5;
    const taxAmount = (baseFee * taxPct) / 100;
    const muniSharePerApp = baseFee + taxAmount; // 1260
    const grossPerApp = muniSharePerApp + platformFee; // 1510

    const grossCollection = roundMoney(apps.length * grossPerApp);
    const tradezoRevenue = roundMoney(apps.length * platformFee);
    const municipalShare = roundMoney(apps.length * muniSharePerApp);

    return {
      applications: apps.length,
      transactions: records.length,
      gross_collection: grossCollection,
      tradezo_revenue: tradezoRevenue,
      municipal_share: municipalShare,
      revenue_percentage: this.settings().tradezo_revenue_percentage,
    };
  }
}
