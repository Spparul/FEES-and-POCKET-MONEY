import React, { useEffect, useState } from 'react';
import type { Student, PocketTransaction } from './api';
import {
  getStudents,
  getAllPocketTransactions,
  getOverallSummary,
} from './api';

import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { QuickDeskView } from './components/QuickDeskView';
import { BoarderRegisterView } from './components/BoarderRegisterView';
import { TransactionLedgerView } from './components/TransactionLedgerView';
import { DailyStatementView } from './components/DailyStatementView';
import { MonthlyStatementView } from './components/MonthlyStatementView';
import { YearlyAnalyticsView } from './components/YearlyAnalyticsView';

export const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'quickdesk' | 'register' | 'history' | 'daily' | 'monthly' | 'yearly'>('quickdesk');
  const [students, setStudents] = useState<Student[]>([]);
  const [transactions, setTransactions] = useState<PocketTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDeskStudent, setSelectedDeskStudent] = useState<Student | null>(null);

  const [summary, setSummary] = useState({
    hostellers_count: 0,
    total_received: 0,
    total_given: 0,
    total_returned: 0,
    currently_held_balance: 0,
  });

  const loadAllData = async () => {
    setLoading(true);
    try {
      const [stList, txList, sumData] = await Promise.all([
        getStudents(),
        getAllPocketTransactions(),
        getOverallSummary(),
      ]);
      setStudents(stList);
      setTransactions(txList);
      setSummary(sumData);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAllData();
  }, []);


  return (
    <div className="app-layout">
      {/* Permanent Thinner Left Sidebar Navigation (210px) */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        totalHostellers={summary.hostellers_count}
        totalHeldBalance={summary.currently_held_balance}
      />

      {/* Main Content Area */}
      <main className="main-content">
        <Header
          activeTab={activeTab}
          totalHostellers={summary.hostellers_count}
          totalHeldBalance={summary.currently_held_balance}
          totalReceived={summary.total_received}
          totalGiven={summary.total_given}
          totalReturned={summary.total_returned}
        />

        <div className="content-workspace">
          {activeTab === 'quickdesk' ? (
            <QuickDeskView
              students={students}
              onTransactionComplete={loadAllData}
              selectedDeskStudent={selectedDeskStudent}
              onClearDeskStudent={() => setSelectedDeskStudent(null)}
            />
          ) : activeTab === 'register' ? (
            <BoarderRegisterView
              students={students}
              loading={loading}
              onOpenCounterDesk={(student) => {
                setSelectedDeskStudent(student);
                setActiveTab('quickdesk');
              }}
            />
          ) : activeTab === 'daily' ? (
            <DailyStatementView />
          ) : activeTab === 'monthly' ? (
            <MonthlyStatementView />
          ) : activeTab === 'yearly' ? (
            <YearlyAnalyticsView
              students={students}
              transactions={transactions as any}
              loading={loading}
            />
          ) : (
            <TransactionLedgerView
              transactions={transactions}
              loading={loading}
              totalHostellers={summary.hostellers_count}
              currentlyHeldBalance={summary.currently_held_balance}
            />
          )}
        </div>
      </main>
    </div>
  );
};
