export interface Officer {
  id: number;
  employee_id?: string;
  name: string;
  municipality_id?: string;
  email?: string;
  phone?: string;
  role?: string;
}

export interface OfficerWithCounts extends Officer {
  assignedCount: number;
  verifiedCount: number;
}
