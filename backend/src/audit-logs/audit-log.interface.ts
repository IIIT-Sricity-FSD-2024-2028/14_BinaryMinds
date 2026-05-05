export interface AuditLogEntry {
  audit_id: number;
  timestamp: Date;
  user_name: string;
  role: string;
  action: string;
  module: string;
  description: string;
  ip_address: string;
  source: 'frontend' | 'backend';
}
