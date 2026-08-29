import React from 'react';
import { Search, Users, History, Calendar, FileText, Shield, TrendingUp } from 'lucide-react';

interface SidebarProps {
  activeTab: 'quickdesk' | 'register' | 'history' | 'daily' | 'monthly' | 'yearly';
  setActiveTab: (tab: 'quickdesk' | 'register' | 'history' | 'daily' | 'monthly' | 'yearly') => void;
  totalStudents: number;
  totalHeldBalance: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  setActiveTab,
  totalStudents,
  totalHeldBalance,
}) => {
  return (
    <aside className="sidebar">
      <div>
        {/* Top Header Branding */}
        <div style={{ padding: '14px 12px', borderBottom: '1px solid #2e241c' }}>
          <div className="flex items-center gap-2">
            <div style={{ width: '28px', height: '28px', borderRadius: '6px', backgroundColor: '#422b1b', color: '#f4efe0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Shield size={16} />
            </div>
            <div>
              <h2 style={{ fontSize: '13px', fontWeight: 800, color: '#f4efe0', lineHeight: 1.1, margin: 0 }}>
                CANISIUS SECONDARY
              </h2>
              <span style={{ fontSize: '11px', color: '#a89876', fontWeight: 600 }}>
                Pocket Money System
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Categories */}
        <div style={{ padding: '10px 6px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
          
          {/* Section 1: COUNTER DESK */}
          <div className="sidebar-section">
            Counter Desk
          </div>
          <button
            onClick={() => setActiveTab('quickdesk')}
            className={`sidebar-link ${activeTab === 'quickdesk' ? 'active' : ''}`}
          >
            <Search size={15} />
            <span>Quick Counter Desk</span>
          </button>

          <button
            onClick={() => setActiveTab('register')}
            className={`sidebar-link ${activeTab === 'register' ? 'active' : ''}`}
          >
            <Users size={15} />
            <span>Student Register ({totalStudents})</span>
          </button>

          {/* Section 2: STATEMENTS & AUDIT */}
          <div className="sidebar-section" style={{ marginTop: '6px' }}>
            Financial Statements
          </div>

          <button
            onClick={() => setActiveTab('daily')}
            className={`sidebar-link ${activeTab === 'daily' ? 'active' : ''}`}
          >
            <Calendar size={15} />
            <span>Daily Activity Statement</span>
          </button>

          <button
            onClick={() => setActiveTab('monthly')}
            className={`sidebar-link ${activeTab === 'monthly' ? 'active' : ''}`}
          >
            <FileText size={15} />
            <span>Monthly Statement</span>
          </button>

          <button
            onClick={() => setActiveTab('yearly')}
            className={`sidebar-link ${activeTab === 'yearly' ? 'active' : ''}`}
          >
            <TrendingUp size={15} />
            <span>Yearly Analytics</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`sidebar-link ${activeTab === 'history' ? 'active' : ''}`}
          >
            <History size={15} />
            <span>Master Transaction Ledger</span>
          </button>

        </div>
      </div>

      {/* Footer Branding */}
      <div style={{ padding: '12px', borderTop: '1px solid #2e241c', backgroundColor: '#140e0b' }}>
        <div style={{ fontSize: '10px', fontWeight: 700, color: '#a89876', textTransform: 'uppercase', marginBottom: '2px' }}>
          Total Held Balance
        </div>
        <div style={{ fontSize: '16px', fontWeight: 800, fontFamily: 'JetBrains Mono', color: '#b38b46' }}>
          K {Math.round(totalHeldBalance || 0).toLocaleString('en-IN')}
        </div>
        <div style={{ fontSize: '10px', color: '#7c6a58', marginTop: '2px' }}>
          {totalStudents} Active Student Accounts
        </div>
      </div>
    </aside>
  );
};
