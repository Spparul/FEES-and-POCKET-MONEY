export const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8001";

export interface Student {
  id: number;
  pay_id: string;
  pupil_id?: string;
  first_name: string;
  last_name: string;
  name: string;
  dob: string;
  admission_year: number;
  father_name: string;
  mother_name?: string;
  contact_no: string;
  additional_contact?: string;
  boarding_category: "DAY_SCHOLAR" | "HOSTEL_ORDINARY" | "HOSTEL_SPECIAL";
  status: "ACTIVE" | "TRANSFERRED" | "FINISHED";
  date_of_admission: string;
  academic_level?: string;
  current_standard?: string;
  current_section?: string;
  academic_year?: string;
  is_sponsored: boolean;
  sponsor_name?: string;
  current_balance: number;
}

export interface PocketTransaction {
  id: number;
  student_id: number;
  student_name?: string;
  pay_id?: string;
  academic_level?: string;
  standard?: string;
  section?: string;
  transaction_date: string;
  created_at?: string;
  transaction_type: "RECEIVED_FROM_PARENT" | "GIVEN_TO_STUDENT" | "RETURNED_TO_PARENT" | "FEE_EXCESS_TRANSFER";
  amount: number;
  previous_balance?: number;
  new_balance?: number;
  source_or_recipient?: string;
  receipt_ref?: string;
  remarks?: string;
}

export interface PocketMoneySummary {
  student_id: number;
  total_received: number;
  total_given: number;
  total_returned: number;
  current_balance: number;
}

export interface StudentPocketProfileData {
  student: Student;
  summary: PocketMoneySummary;
  pocket_transactions: PocketTransaction[];
}

export interface DailyStatement {
  date: string;
  total_credited: number;
  students_credited: number;
  transactions_credited: number;
  total_debited: number;
  students_debited: number;
  transactions_debited: number;
  total_refunded: number;
  students_refunded: number;
  transactions_refunded: number;
  total_money_moved: number;
  unique_students_with_activity: number;
  total_transactions_count: number;
  net_change: number;
  currently_held_balance: number;
  transactions: PocketTransaction[];
}

export interface DayByDayBreakdown {
  date: string;
  credited: number;
  students_credited: number;
  debited: number;
  students_debited: number;
  refunded: number;
  students_refunded: number;
  unique_students: number;
  net_change: number;
}

export interface MonthlyStatement {
  year: number;
  month: number;
  month_label: string;
  total_credited: number;
  students_credited: number;
  transactions_credited: number;
  total_debited: number;
  students_debited: number;
  transactions_debited: number;
  total_refunded: number;
  students_refunded: number;
  transactions_refunded: number;
  total_money_moved: number;
  unique_students_with_activity: number;
  total_transactions_count: number;
  net_change: number;
  currently_held_balance: number;
  day_by_day: DayByDayBreakdown[];
  transactions: PocketTransaction[];
}

export async function getStudents(params?: {
  search?: string;
  boarding_category?: string;
  status?: string;
  academic_level?: string;
}): Promise<Student[]> {
  const query = new URLSearchParams();
  if (params?.search) query.append("search", params.search);
  if (params?.boarding_category) query.append("boarding_category", params.boarding_category);
  if (params?.status) query.append("status", params.status);
  if (params?.academic_level) query.append("academic_level", params.academic_level);

  const res = await fetch(`${API_BASE}/students?${query.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch hostellers");
  return res.json();
}

export async function getStudentPocketProfile(studentId: number): Promise<StudentPocketProfileData> {
  const res = await fetch(`${API_BASE}/students/${studentId}`);
  if (!res.ok) throw new Error("Failed to fetch student pocket money profile");
  return res.json();
}

export async function recordPocketMoneyTx(data: {
  student_id: number;
  transaction_date: string;
  transaction_type: string;
  amount: number;
  source_or_recipient?: string;
  receipt_ref?: string;
  remarks?: string;
}) {
  const res = await fetch(`${API_BASE}/pocket-money/transactions`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to record pocket money transaction");
  }
  return res.json();
}

export async function getAllPocketTransactions(): Promise<PocketTransaction[]> {
  const res = await fetch(`${API_BASE}/pocket-money/transactions/all`);
  if (!res.ok) throw new Error("Failed to fetch transaction records");
  return res.json();
}

export async function getDailyStatementApi(targetDate?: string): Promise<DailyStatement> {
  const query = targetDate ? `?date=${encodeURIComponent(targetDate)}` : '';
  const res = await fetch(`${API_BASE}/pocket-money/daily-statement${query}`);
  if (!res.ok) throw new Error("Failed to fetch daily pocket money statement");
  return res.json();
}

export async function getMonthlyStatementApi(year?: number, month?: number): Promise<MonthlyStatement> {
  const queryParams = new URLSearchParams();
  if (year) queryParams.append("year", year.toString());
  if (month) queryParams.append("month", month.toString());
  const query = queryParams.toString() ? `?${queryParams.toString()}` : '';
  const res = await fetch(`${API_BASE}/pocket-money/monthly-statement${query}`);
  if (!res.ok) throw new Error("Failed to fetch monthly pocket money statement");
  return res.json();
}

export async function deletePocketTx(txId: number): Promise<{ message: string }> {
  const res = await fetch(`${API_BASE}/pocket-money/transactions/${txId}`, {
    method: "DELETE",
  });
  if (!res.ok) throw new Error("Failed to delete transaction");
  return res.json();
}

export async function getOverallSummary() {
  const res = await fetch(`${API_BASE}/pocket-money/summary`);
  if (!res.ok) throw new Error("Failed to fetch overall summary");
  return res.json();
}
