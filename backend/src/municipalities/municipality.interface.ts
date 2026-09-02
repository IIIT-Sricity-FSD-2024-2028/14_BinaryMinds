export interface Municipality {
  municipality_id: string;
  name: string;
  state: string;
  district: string;
  status: 'active' | 'inactive';
  base_processing_fee: number;
  platform_fee: number;
  service_tax_percentage: number;
  created_at?: Date | string;
}
