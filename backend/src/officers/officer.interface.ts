export interface Officer {
  id: number;
  name: string;
}

export interface OfficerWithCounts extends Officer {
  assignedCount: number;
  verifiedCount: number;
}
