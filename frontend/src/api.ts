export const API_BASE = import.meta.env.VITE_API_BASE || "http://127.0.0.1:8000";

export interface StudentFeeSummary {
  term_name: string;
  expected_amount: number;
  paid_amount: number;
  due_amount: number;
  payment_date?: string;
  status: "Paid" | "Due";
}

export interface StudentFeeOverview {
  terms_paid_count: number;
  terms_due_count: number;
  total_expected: number;
  total_paid: number;
  total_due: number;
  overall_status: string;
  due_status_label: string;
  term_details: StudentFeeSummary[];
}

export interface PocketMoneySummary {
  total_received: number;
  total_given: number;
  total_returned: number;
  current_balance: number;
  has_records: boolean;
}

export interface EnrollmentHistory {
  id: number;
  academic_year: string;
  standard: string;
  section: string;
  is_current: boolean;
}

export interface Student {
  id: number;
  admission_no: string;
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
  address?: string;
  city?: string;
  state?: string;
  pincode?: string;
  boarding_category: "DAY_SCHOLAR" | "HOSTEL_ORDINARY" | "HOSTEL_SPECIAL";
  status: "ACTIVE" | "TRANSFERRED" | "FINISHED" | "LEFT" | "GRADUATED";
  date_of_admission: string;
  academic_level?: string;
  current_standard?: string;
  current_section?: string;
  academic_year?: string;
  is_sponsored?: boolean;
  sponsor_type?: "GOVERNMENT" | "PRIVATE";
  sponsor_name?: string;
  scholarship_type?: "NONE" | "GOVERNMENT" | "PRIVATE";
  has_mismatch?: boolean;
  mismatch_amount?: number;
  amount_to_return_sponsor?: number;
  fee_overview?: StudentFeeOverview;
  pocket_money?: PocketMoneySummary;
  enrollment_history: EnrollmentHistory[];
}

export interface DashboardSummary {
  academic_year: string;
  students: {
    total_configured: number;
    active: number;
    transferred: number;
    finished: number;
    total_classes: number;
  };
  fee_summary: {
    total_expected: number;
    total_collected: number;
    total_outstanding: number;
    collection_percentage: number;
    terms: {
      term_1: { expected: number; collected: number; due: number };
      term_2: { expected: number; collected: number; due: number };
      term_3: { expected: number; collected: number; due: number };
    };
    status_counts: Record<string, number>;
  };
  pocket_money: {
    students_count: number;
    hostellers_count?: number;
    total_received: number;
    total_given: number;
    total_returned: number;
    currently_held: number;
  };
}

export interface PaymentTransaction {
  id: number;
  payment_no: string;
  student_id: number;
  student_name?: string;
  pay_id?: string;
  academic_level?: string;
  standard?: string;
  section?: string;
  boarding_category?: string;
  is_sponsored?: boolean;
  sponsor_name?: string;
  academic_year: string;
  payment_date: string;
  total_amount: number;
  expected_amount?: number;
  mismatch_amount?: number;
  amount_to_return_sponsor?: number;
  payment_method: string;
  receipt_no: string;
  remarks?: string;
  terms_covered: string[];
  allocations_breakdown?: Record<string, number>;
  deficit_cleared?: number;
  fee_excess_amount?: number;
  excess_decision?: string;
  excess_status?: string;
  sponsor_return_amount?: number;
  pocket_money_tx_id?: string;
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
  transaction_type: "RECEIVED_FROM_PARENT" | "GIVEN_TO_STUDENT" | "RETURNED_TO_PARENT";
  amount: number;
  source_or_recipient?: string;
  receipt_ref?: string;
  remarks?: string;
}

export interface StudentProfileData {
  student: Student;
  payment_history: PaymentTransaction[];
  pocket_transactions: PocketTransaction[];
}

export interface SectionDrilldownNode {
  expected: number;
  collected: number;
  due: number;
  student_count: number;
}

export interface StandardDrilldownNode {
  expected: number;
  collected: number;
  due: number;
  student_count: number;
  sections: Record<string, SectionDrilldownNode>;
}

export interface TermDrilldownNode {
  expected: number;
  collected: number;
  due: number;
  standards: Record<string, StandardDrilldownNode>;
}

export interface FeeDrillDownResponse {
  academic_year: string;
  terms: Record<string, TermDrilldownNode>;
}

export interface SystemOverview {
  is_register_locked: boolean;
  active_academic_year: string;
  total_students: number;
  total_classes: number;
}

export interface StudentFilterParams {
  [key: string]: any;
  standard?: string;
  section?: string;
  academic_level?: string;
  boarding_category?: string;
  admission_year?: number;
  is_sponsored?: boolean;
  sponsor_type?: string;
  sponsor_name?: string;
  fee_status?: string;
  term?: string;
  search?: string;
  status?: string;
}

export async function getOverview(): Promise<SystemOverview> {
  const res = await fetch(`${API_BASE}/settings/overview`);
  if (!res.ok) throw new Error("Failed to fetch settings overview");
  return res.json();
}

export async function getDashboardSummary(academicYear?: string): Promise<DashboardSummary> {
  let url = `${API_BASE}/reports/dashboard-summary`;
  if (academicYear) {
    url += `?academic_year=${encodeURIComponent(academicYear)}`;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch dashboard summary");
  return res.json();
}

export async function getFeeDrilldown(academicYear?: string): Promise<FeeDrillDownResponse> {
  let url = `${API_BASE}/reports/fee-drilldown`;
  if (academicYear) {
    url += `?academic_year=${encodeURIComponent(academicYear)}`;
  }
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch fee drilldown data");
  return res.json();
}

export async function getStudents(params: StudentFilterParams = {}): Promise<Student[]> {
  const query = new URLSearchParams();
  if (params.academic_level) query.append("academic_level", params.academic_level);
  if (params.standard) query.append("standard", params.standard);
  if (params.section) query.append("section", params.section);
  if (params.boarding_category) query.append("boarding_category", params.boarding_category);
  if (params.admission_year) query.append("admission_year", params.admission_year.toString());
  if (params.is_sponsored !== undefined && params.is_sponsored !== null) {
    query.append("is_sponsored", params.is_sponsored.toString());
  }
  if (params.sponsor_type) query.append("sponsor_type", params.sponsor_type);
  if (params.sponsor_name) query.append("sponsor_name", params.sponsor_name);
  if (params.fee_status) query.append("fee_status", params.fee_status);
  if (params.term) query.append("term", params.term);
  if (params.search) query.append("search", params.search);
  if (params.status) query.append("status", params.status);

  const res = await fetch(`${API_BASE}/students?${query.toString()}`);
  if (!res.ok) throw new Error("Failed to fetch students");
  return res.json();
}

export async function getStudentProfile(id: number): Promise<StudentProfileData> {
  const res = await fetch(`${API_BASE}/students/${id}`);
  if (!res.ok) throw new Error("Failed to fetch student profile");
  return res.json();
}

export async function getAllPaymentTransactions(): Promise<PaymentTransaction[]> {
  const res = await fetch(`${API_BASE}/fees/transactions`);
  if (!res.ok) throw new Error("Failed to fetch payment transactions");
  return res.json();
}

export async function deleteFeePayment(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/fees/payments/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete fee payment transaction");
}

export async function getAllPocketMoneyTransactions(): Promise<PocketTransaction[]> {
  const res = await fetch(`${API_BASE}/pocket-money/transactions/all`);
  if (!res.ok) throw new Error("Failed to fetch pocket money transactions");
  return res.json();
}

export async function deletePocketMoneyTransaction(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/pocket-money/transactions/${id}`, { method: "DELETE" });
  if (!res.ok) throw new Error("Failed to delete pocket money transaction");
}

export async function createStudent(data: any, adminPassword?: string): Promise<Student> {
  let url = `${API_BASE}/students`;
  if (adminPassword) {
    url += `?admin_password=${encodeURIComponent(adminPassword)}`;
  }
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to create student");
  }
  return res.json();
}

export async function updateStudent(id: number, data: any, adminPassword?: string): Promise<Student> {
  let url = `${API_BASE}/students/${id}`;
  if (adminPassword) {
    url += `?admin_password=${encodeURIComponent(adminPassword)}`;
  }
  const res = await fetch(url, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to update student");
  }
  return res.json();
}

export async function recordFeePayment(data: {
  student_id: number;
  academic_year: string;
  payment_date: string;
  terms_covered: string[];
  total_amount?: number;
  payment_method: string;
  receipt_no: string;
  remarks?: string;
}) {
  const res = await fetch(`${API_BASE}/fees/payments`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to record payment");
  }
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

export async function toggleRegisterLock(adminPassword: string, lock: boolean) {
  const res = await fetch(`${API_BASE}/auth/toggle-lock`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ admin_password: adminPassword, lock }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.detail || "Failed to toggle register lock");
  }
  return res.json();
}

export async function getFeeSummaryReport() {
  const res = await fetch(`${API_BASE}/reports/fee-summary`);
  if (!res.ok) throw new Error("Failed to fetch fee summary report");
  return res.json();
}

export async function getPocketMoneyReport() {
  const res = await fetch(`${API_BASE}/reports/pocket-money-summary`);
  if (!res.ok) throw new Error("Failed to fetch pocket money report");
  return res.json();
}
