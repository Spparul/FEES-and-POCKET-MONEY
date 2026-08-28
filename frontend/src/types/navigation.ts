import type { StudentFilterParams } from '../api';

export type ScreenId =
  | 'home'
  | 'register'
  | 'standards'
  | 'class-view'
  | 'section-view'
  | 'fee-status'
  | 'quick-search'
  | 'deficits'
  | 'excesses'
  | 'verification'
  | 'fee-status-results'
  | 'categories'
  | 'category-results'
  | 'admission-years'
  | 'admission-year-results'
  | 'transactions'
  | 'record_payment'
  | 'pocket'
  | 'reports'
  | 'settings'
  | 'student-profile'
  | 'add-student';

export interface NavigationState {
  screenId: ScreenId;
  title: string;
  breadcrumbs: { label: string; action: () => void }[];
  filters: StudentFilterParams;
  selectedStandard?: string;
  selectedSection?: string;
  selectedCategory?: string;
  selectedYear?: number;
  selectedFeeStatus?: string;
  selectedStudentId?: number;
  selectedStudent?: any;
}
