import { BadRequestException, Injectable } from '@nestjs/common';
import { Payment } from '../payments/payment.interface';
import { PaymentStatus } from '../common/enums/payment-status.enum';
import { JsonStore, RevenueRecord } from '../common/persistence/json-store';

const roundMoney = (amount: number) => Math.round((amount + Number.EPSILON) * 100) / 100;

@Injectable()
export class PlatformAdminService {
  constructor(private readonly store: JsonStore) { this.backfillCompletedPayments(); }

  overview() {
    const data = this.store.snapshot();
    const completed = data.payments.filter((payment) => payment.payment_status === PaymentStatus.COMPLETED);
    const records = data.platform.revenue_records;
    return {
      total_municipal_corporations: data.platform.corporations.length,
      active_municipal_corporations: data.platform.corporations.filter((corporation) => corporation.status === 'active').length,
      total_applications: data.applications.length,
      completed_transactions: completed.length,
      total_gross_collection: roundMoney(records.reduce((sum, record) => sum + record.gross_amount, 0)),
      total_tradezo_revenue: roundMoney(records.reduce((sum, record) => sum + record.tradezo_revenue, 0)),
      current_revenue_percentage: data.platform.revenue_settings.tradezo_revenue_percentage,
    };
  }

  corporations() {
    const data = this.store.snapshot();
    return data.platform.corporations.map((corporation) => ({ ...corporation, ...this.corporationTotals(corporation.corporation_id) }));
  }

  revenue() {
    const records = this.store.snapshot().platform.revenue_records;
    return {
      ...this.overview(),
      total_municipal_share: roundMoney(records.reduce((sum, record) => sum + record.municipal_share, 0)),
      corporations: this.corporations(),
      records,
    };
  }

  settings() { return this.store.snapshot().platform.revenue_settings; }

  updateSettings(percentage: number) {
    if (!Number.isInteger(percentage) || percentage < 0 || percentage > 100) throw new BadRequestException('Revenue percentage must be a whole number from 0 to 100');
    this.store.snapshot().platform.revenue_settings.tradezo_revenue_percentage = percentage;
    this.store.save();
    return this.settings();
  }

  recordCompletedPayment(payment: Payment) {
    if (payment.payment_status !== PaymentStatus.COMPLETED) return;
    const records = this.store.snapshot().platform.revenue_records;
    if (records.some((record) => record.payment_id === payment.payment_id)) return;
    const percentage = this.settings().tradezo_revenue_percentage;
    const revenue = roundMoney((payment.amount * percentage) / 100);
    const record: RevenueRecord = {
      payment_id: payment.payment_id,
      transaction_id: payment.transaction_id,
      corporation_id: 'municipal-corporation',
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
          // These payments predate revenue tracking, so the currently configured
          // percentage is the only defensible historical rate available.
          record.backfilled = true;
          changed = true;
        }
      });
    if (changed) this.store.save();
  }
  private corporationTotals(corporationId: string) {
    const records = this.store.snapshot().platform.revenue_records.filter((record) => record.corporation_id === corporationId);
    return { applications: this.store.snapshot().applications.length, transactions: records.length, gross_collection: roundMoney(records.reduce((sum, record) => sum + record.gross_amount, 0)), tradezo_revenue: roundMoney(records.reduce((sum, record) => sum + record.tradezo_revenue, 0)), municipal_share: roundMoney(records.reduce((sum, record) => sum + record.municipal_share, 0)), revenue_percentage: this.settings().tradezo_revenue_percentage };
  }
}
