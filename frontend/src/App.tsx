import { useEffect, useState } from 'react';
import type { Student, SystemOverview, StudentFilterParams } from './api';
import { getOverview, getStudents } from './api';
import type { ThemeId } from './theme';
import type { NavigationState } from './types/navigation';
import { TopBar } from './components/TopBar';
import { Sidebar } from './components/Sidebar';
import { Breadcrumbs } from './components/Breadcrumbs';
import { HomeView } from './components/HomeView';
import { StudentRegisterView } from './components/StudentRegisterView';
import { StandardsView } from './components/StandardsView';
import { FeeStatusView } from './components/FeeStatusView';
import { StudentProfileView } from './components/StudentProfileView';
import { AddStudentView } from './components/AddStudentView';
import { PocketMoneyView } from './components/PocketMoneyView';
import { ReportsModal } from './components/ReportsModal';
import { SettingsView } from './components/SettingsView';
import { TransactionRecordsView } from './components/TransactionRecordsView';
import { RecordPaymentScreen } from './components/RecordPaymentScreen';
import { FeeDeficitsView } from './components/FeeDeficitsView';
import { FeeExcessesView } from './components/FeeExcessesView';
import { QuickSearchView } from './components/QuickSearchView';
import { PocketMoneyModal } from './components/PocketMoneyModal';
import { LockRegisterModal } from './components/LockRegisterModal';

export function App() {
  const [currentTheme, setCurrentTheme] = useState<ThemeId>(() => {
    return (localStorage.getItem('school_ledger_theme') as ThemeId) || 'heritage';
  });

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [overview, setOverview] = useState<SystemOverview | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);

  // Multi-Screen Navigation State
  const [navState, setNavState] = useState<NavigationState>({
    screenId: 'home',
    title: 'Home',
    breadcrumbs: [{ label: 'Home', action: () => navigateToHome() }],
    filters: {},
  });

  // Modals state
  const [pocketStudent, setPocketStudent] = useState<Student | null>(null);
  const [showLockModal, setShowLockModal] = useState(false);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', currentTheme);
    localStorage.setItem('school_ledger_theme', currentTheme);
  }, [currentTheme]);

  const loadOverview = () => {
    getOverview().then(setOverview).catch(console.error);
  };

  const loadStudents = (filters?: StudentFilterParams) => {
    setLoading(true);
    getStudents(filters ?? navState.filters)
      .then(setStudents)
      .catch(console.error)
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadOverview();
  }, []);

  useEffect(() => {
    setLoading(true);
    getStudents(navState.filters)
      .then(setStudents)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [JSON.stringify(navState.filters)]);

  // NAVIGATION METHODS
  const navigateToHome = () => {
    setNavState({
      screenId: 'home',
      title: 'Home',
      breadcrumbs: [{ label: 'Home', action: () => navigateToHome() }],
      filters: {},
    });
  };

  const navigateToRegister = (filters: StudentFilterParams = {}) => {
    setNavState({
      screenId: 'register',
      title: 'Student Register',
      breadcrumbs: [
        { label: 'Home', action: () => navigateToHome() },
        { label: 'Student Register', action: () => navigateToRegister(filters) },
      ],
      filters,
    });
  };

  const navigateToStandards = () => {
    setNavState({
      screenId: 'standards',
      title: 'Standards & Classes',
      breadcrumbs: [
        { label: 'Home', action: () => navigateToHome() },
        { label: 'Standards & Classes', action: () => navigateToStandards() },
      ],
      filters: {},
    });
  };

  const navigateToStandardSection = (std: string, sec?: string) => {
    const filters: StudentFilterParams = { standard: std, section: sec };
    setNavState({
      screenId: 'register',
      title: `Standard ${std} ${sec ? `- Section ${sec}` : ''}`,
      breadcrumbs: [
        { label: 'Home', action: () => navigateToHome() },
        { label: 'Standards', action: () => navigateToStandards() },
        { label: `Standard ${std}`, action: () => navigateToStandardSection(std) },
        ...(sec ? [{ label: `Section ${sec}`, action: () => navigateToStandardSection(std, sec) }] : []),
      ],
      filters,
    });
  };

  const navigateToFeeStatus = (customFilters: Partial<StudentFilterParams> = {}) => {
    const breadcrumbs: { label: string; action: () => void }[] = [
      { label: 'Home', action: () => navigateToHome() },
      { label: 'Fees', action: () => navigateToFeeStatus() },
    ];

    if (customFilters.term) {
      breadcrumbs.push({ label: customFilters.term, action: () => navigateToFeeStatus({ term: customFilters.term }) });
    }
    if (customFilters.standard) {
      breadcrumbs.push({ label: customFilters.standard, action: () => navigateToFeeStatus({ term: customFilters.term, standard: customFilters.standard }) });
    }
    if (customFilters.section) {
      breadcrumbs.push({ label: customFilters.section, action: () => navigateToFeeStatus({ term: customFilters.term, standard: customFilters.standard, section: customFilters.section }) });
    }

    setNavState({
      screenId: 'fee-status',
      title: 'Fee Collection Ledger',
      breadcrumbs,
      filters: customFilters,
    });
  };

  const navigateToStudentProfile = (studentId: number) => {
    const found = students.find(s => s.id === studentId);
    const studentName = found?.name || 'Student Profile';
    setNavState(prev => ({
      ...prev,
      screenId: 'student-profile',
      selectedStudentId: studentId,
      breadcrumbs: [
        ...prev.breadcrumbs,
        { label: studentName, action: () => navigateToStudentProfile(studentId) },
      ],
    }));
  };

  const navigateToAddStudent = () => {
    setNavState({
      screenId: 'add-student',
      title: 'Enroll New Student Record',
      breadcrumbs: [
        { label: 'Home', action: () => navigateToHome() },
        { label: 'Student Register', action: () => navigateToRegister() },
        { label: 'Enroll New Student', action: () => navigateToAddStudent() },
      ],
      filters: {},
    });
  };

  const navigateToPocketMoney = () => {
    setNavState({
      screenId: 'pocket',
      title: 'Boarder Pocket Money',
      breadcrumbs: [
        { label: 'Home', action: () => navigateToHome() },
        { label: 'Boarder Pocket Money', action: () => navigateToPocketMoney() },
      ],
      filters: {},
    });
  };

  const navigateToTransactions = () => {
    setNavState({
      screenId: 'transactions',
      title: 'Transaction Records',
      breadcrumbs: [
        { label: 'Home', action: () => navigateToHome() },
        { label: 'Transaction Records', action: () => navigateToTransactions() },
      ],
      filters: {},
    });
  };

  const navigateToQuickSearch = (student?: Student) => {
    setNavState({
      screenId: 'quick-search',
      title: student ? `Quick Search & Fee Payment - ${student.name}` : 'Quick Search & Fee Payment',
      selectedStudent: student || null,
      breadcrumbs: [
        { label: 'Home', action: () => navigateToHome() },
        { label: 'Quick Search', action: () => navigateToQuickSearch() },
      ],
      filters: {},
    });
  };

  const navigateToRecordPayment = (student: Student) => {
    navigateToQuickSearch(student);
  };

  const navigateToReports = () => {
    setNavState({
      screenId: 'reports',
      title: 'Office Reports Center',
      breadcrumbs: [
        { label: 'Home', action: () => navigateToHome() },
        { label: 'Office Reports', action: () => navigateToReports() },
      ],
      filters: {},
    });
  };

  const navigateToSettings = () => {
    setNavState({
      screenId: 'settings',
      title: 'Appearance & Admin Settings',
      breadcrumbs: [
        { label: 'Home', action: () => navigateToHome() },
        { label: 'Settings', action: () => navigateToSettings() },
      ],
      filters: {},
    });
  };

  const navigateToDeficits = () => {
    setNavState({
      screenId: 'deficits',
      title: 'Fee Deficits Register',
      breadcrumbs: [
        { label: 'Home', action: () => navigateToHome() },
        { label: 'Fee Deficits', action: () => navigateToDeficits() },
      ],
      filters: {},
    });
  };

  const navigateToExcesses = () => {
    setNavState({
      screenId: 'excesses',
      title: 'Fee Excesses & Decisions',
      breadcrumbs: [
        { label: 'Home', action: () => navigateToHome() },
        { label: 'Fee Excesses', action: () => navigateToExcesses() },
      ],
      filters: {},
    });
  };

  const activeSidebarView = navState.screenId === 'pocket'
    ? 'pocket'
    : navState.screenId === 'reports'
      ? 'reports'
      : navState.screenId === 'settings'
        ? 'settings'
        : navState.screenId === 'transactions'
          ? 'transactions'
          : navState.screenId === 'quick-search'
            ? 'quick-search'
            : navState.screenId === 'deficits'
              ? 'deficits'
              : navState.screenId === 'excesses'
                ? 'excesses'
                : navState.screenId === 'fee-status'
                  ? 'fees'
                  : 'register';

  return (
    <div className="min-h-screen bg-[var(--bg-page)] text-[var(--text-primary)] font-sans flex flex-col transition-colors duration-200">

      {/* Top Bar */}
      <TopBar
        overview={overview}
        currentTheme={currentTheme}
        onThemeChange={setCurrentTheme}
        searchQuery={navState.filters.search || ''}
        onSearchChange={(q) => {
          setNavState(prev => {
            const shouldSwitchToRegister = prev.screenId !== 'register' && prev.screenId !== 'fee-status' && prev.screenId !== 'quick-search';
            return {
              ...prev,
              screenId: shouldSwitchToRegister ? 'register' : prev.screenId,
              title: shouldSwitchToRegister ? 'Student Register' : prev.title,
              breadcrumbs: shouldSwitchToRegister ? [
                { label: 'Home', action: () => navigateToHome() },
                { label: 'Student Register', action: () => navigateToRegister() },
              ] : prev.breadcrumbs,
              filters: { ...prev.filters, search: q },
            };
          });
        }}
        onOpenLockModal={() => setShowLockModal(true)}
        onOpenAddStudentModal={navigateToAddStudent}
        isSidebarCollapsed={isSidebarCollapsed}
        onToggleSidebar={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        onNavigateHome={navigateToHome}
      />

      {/* Application Shell Layout (Collapsible Sidebar + Content Area) */}
      <div className="flex-1 flex w-full">

        {/* Index-Style Persistent Collapsible Sidebar */}
        <Sidebar
          currentFilters={navState.filters}
          activeView={activeSidebarView}
          onNavigate={(view, filters) => {
            if (view === 'pocket') navigateToPocketMoney();
            else if (view === 'reports') navigateToReports();
            else if (view === 'settings') navigateToSettings();
            else if (view === 'fees') navigateToFeeStatus();
            else if (view === 'quick-search') navigateToQuickSearch();
            else if (view === 'deficits') navigateToDeficits();
            else if (view === 'excesses') navigateToExcesses();
            else if (view === 'transactions') navigateToTransactions();
            else navigateToRegister(filters);
          }}
          isCollapsed={isSidebarCollapsed}
          onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        />

        {/* Main Content Area */}
        <main className="flex-1 p-6 overflow-x-auto w-full">

          {/* Breadcrumb Trail */}
          <Breadcrumbs
            breadcrumbs={navState.breadcrumbs}
            onBack={navState.breadcrumbs.length > 1 ? () => {
              const previousCrumb = navState.breadcrumbs[navState.breadcrumbs.length - 2];
              if (previousCrumb) previousCrumb.action();
            } : undefined}
          />

          {/* SCREEN 1: HOME LANDING SCREEN */}
          {navState.screenId === 'home' && (
            <HomeView
              overview={overview}
              onNavigateToRegister={navigateToRegister}
              onNavigateToFeeStatus={navigateToFeeStatus}
              onNavigateToPocketMoney={navigateToPocketMoney}
              onNavigateToExcesses={navigateToExcesses}
            />
          )}

          {/* SCREEN 2: STUDENT REGISTER */}
          {navState.screenId === 'register' && (
            <StudentRegisterView
              students={students}
              loading={loading}
              filters={navState.filters}
              onFilterChange={(newFilters) => {
                setNavState(prev => ({
                  ...prev,
                  filters: { ...prev.filters, ...newFilters },
                }));
              }}
              onResetFilters={() => navigateToRegister({})}
              onSelectStudent={(s) => navigateToStudentProfile(s.id)}
              onPayFee={(s) => navigateToRecordPayment(s)}
              onPocketMoney={(s) => setPocketStudent(s)}
            />
          )}

          {/* SCREEN 3: STANDARDS LANDING SCREEN */}
          {navState.screenId === 'standards' && (
            <StandardsView
              onSelectStandardSection={navigateToStandardSection}
            />
          )}

          {/* SCREEN 4: FEE COLLECTION LEDGER */}
          {navState.screenId === 'fee-status' && (
            <FeeStatusView
              students={students}
              loading={loading}
              filters={navState.filters}
              onFilterChange={(newFilters) => {
                setNavState(prev => ({
                  ...prev,
                  filters: { ...prev.filters, ...newFilters },
                }));
              }}
              onResetFilters={() => navigateToFeeStatus()}
              onSelectStudent={(s) => navigateToStudentProfile(s.id)}
              onPayFee={(s) => navigateToRecordPayment(s)}
            />
          )}

          {/* SCREEN 4B: DEDICATED QUICK SEARCH & FEE ALLOCATION PAGE */}
          {navState.screenId === 'quick-search' && (
            <QuickSearchView
              initialStudent={navState.selectedStudent}
              onSelectStudentProfile={(studentId) => navigateToStudentProfile(studentId)}
            />
          )}

          {/* SCREEN 5: TRANSACTION RECORDS LEDGER */}
          {navState.screenId === 'transactions' && (
            <TransactionRecordsView
              onSelectStudent={(studentId) => navigateToStudentProfile(studentId)}
            />
          )}

          {/* SCREEN 5B: FEE DEFICITS REGISTER */}
          {navState.screenId === 'deficits' && (
            <FeeDeficitsView />
          )}

          {/* SCREEN 5C: FEE EXCESSES & DECISIONS */}
          {navState.screenId === 'excesses' && (
            <FeeExcessesView />
          )}

          {/* SCREEN 6: FULL-SCREEN RECORD FEE PAYMENT VIEW */}
          {navState.screenId === 'record_payment' && navState.selectedStudent && (
            <RecordPaymentScreen
              student={navState.selectedStudent}
              onBack={() => {
                const previousCrumb = navState.breadcrumbs[navState.breadcrumbs.length - 2];
                if (previousCrumb) previousCrumb.action();
                else navigateToRegister();
              }}
              onPaymentRecorded={() => {
                loadStudents();
                navigateToTransactions();
              }}
            />
          )}

          {/* SCREEN 7: DEDICATED FULL-PAGE STUDENT PROFILE SCREEN */}
          {navState.screenId === 'student-profile' && navState.selectedStudentId && (
            <StudentProfileView
              studentId={navState.selectedStudentId}
              onBack={() => {
                const previousCrumb = navState.breadcrumbs[navState.breadcrumbs.length - 2];
                if (previousCrumb) previousCrumb.action();
                else navigateToRegister();
              }}
              onPayFee={(s) => navigateToRecordPayment(s)}
              onPocketMoney={(s) => setPocketStudent(s)}
            />
          )}

          {/* SCREEN 6: DEDICATED FULL-PAGE NEW STUDENT MASTER ENROLLMENT VIEW */}
          {navState.screenId === 'add-student' && (
            <AddStudentView
              isLocked={overview?.is_register_locked || false}
              onBack={navigateToRegister}
              onSuccess={() => {
                loadOverview();
                navigateToRegister();
              }}
            />
          )}

          {/* SCREEN 7: BOARDER POCKET MONEY */}
          {navState.screenId === 'pocket' && (
            <PocketMoneyView
              students={students}
              onSelectStudent={(s) => navigateToStudentProfile(s.id)}
              onOpenPocketMoneyModal={(s) => setPocketStudent(s)}
            />
          )}

          {/* SCREEN 8: REPORTS */}
          {navState.screenId === 'reports' && (
            <ReportsModal onClose={navigateToHome} />
          )}

          {/* SCREEN 9: SETTINGS & APPEARANCE THEME PACKS */}
          {navState.screenId === 'settings' && (
            <SettingsView
              currentTheme={currentTheme}
              onThemeChange={setCurrentTheme}
              isLocked={overview?.is_register_locked || false}
              onOpenLockModal={() => setShowLockModal(true)}
            />
          )}

        </main>

      </div>

      {/* POCKET MONEY MODAL */}
      {pocketStudent && (
        <PocketMoneyModal
          student={pocketStudent}
          onClose={() => setPocketStudent(null)}
          onSuccess={() => {
            loadStudents();
          }}
        />
      )}

      {/* LOCK REGISTER MODAL */}
      {showLockModal && (
        <LockRegisterModal
          isCurrentlyLocked={overview?.is_register_locked || false}
          onClose={() => setShowLockModal(false)}
          onSuccess={() => {
            loadOverview();
          }}
        />
      )}

    </div>
  );
}
export default App;
