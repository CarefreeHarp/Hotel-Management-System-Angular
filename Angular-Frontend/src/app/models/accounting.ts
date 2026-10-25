export interface AccountingFilters {
  from: string;
  to: string;
}
export interface FinancialSummary {
  payments: number;
  refunds: number;
  netCollected: number;
  outstanding: number;
}
export interface AccountingDashboard extends AccountingFilters {
  financial: FinancialSummary;
  stays: { averageNights: number; averageGuests: number };
  statuses: { status: string; reservations: number; percentage: number }[];
  trend: { date: string; reservations: number }[];
  roomTypes: { name: string; reservations: number; nights: number }[];
  services: { name: string; quantity: number; value: number }[];
}
