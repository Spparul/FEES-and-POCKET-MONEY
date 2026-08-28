import React from 'react';
import { ArrowDownLeft, ArrowUpRight, RotateCcw, Wallet } from 'lucide-react';

interface HeaderProps {
  activeTab: 'quickdesk' | 'register' | 'history' | 'daily' | 'monthly' | 'yearly';
  totalHostellers: number;
  totalHeldBalance: number;
  totalReceived?: number;
  totalGiven?: number;
  totalReturned?: number;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  totalHostellers,
  totalHeldBalance,
  totalReceived = 0,
  totalGiven = 0,
  totalReturned = 0,
}) => {
  const tabTitles = {
    quickdesk: "Quick Counter Desk",
    register: "All Hostellers Register",
    history: "Master Transaction Ledger",
    daily: "Daily Activity Statement",
    monthly: "Monthly Statement",
    yearly: "Yearly Financial Analytics",
  };

  return (
    <header className="top-bar">
      {/* Page Title & Count in One Single Horizontal Line */}
      <div className="flex items-center gap-2 flex-shrink-0" style={{ whiteSpace: 'nowrap' }}>
        <h1 style={{ fontSize: '15px', fontWeight: 800, color: '#2c1f14', margin: 0 }}>
          {tabTitles[activeTab]}
        </h1>
        <span style={{ fontSize: '12px', color: '#7c6a58', fontWeight: 600 }}>
          ({totalHostellers} Boarders)
        </span>
      </div>

      {/* Financial Summary Stat Pills in One Single Horizontal Row */}
      <div className="flex items-center gap-2 flex-nowrap" style={{ whiteSpace: 'nowrap' }}>
        
        {/* Total Received (Soft Sage) */}
        <div style={{ backgroundColor: '#d9e5d6', border: '1px solid #b7cca4', borderRadius: '6px', padding: '3px 10px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
          <ArrowDownLeft size={13} color="#1e3b22" />
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#1e3b22', textTransform: 'uppercase' }}>Received:</span>
          <span style={{ fontSize: '13px', fontWeight: 800, fontFamily: 'JetBrains Mono', color: '#1e3b22' }}>
            K {Math.round(totalReceived).toLocaleString('en-IN')}
          </span>
        </div>

        {/* Total Issued (Soft Terracotta) */}
        <div style={{ backgroundColor: '#eddcd0', border: '1px solid #d9bfae', borderRadius: '6px', padding: '3px 10px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
          <ArrowUpRight size={13} color="#4a2511" />
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#4a2511', textTransform: 'uppercase' }}>Issued:</span>
          <span style={{ fontSize: '13px', fontWeight: 800, fontFamily: 'JetBrains Mono', color: '#4a2511' }}>
            K {Math.round(totalGiven).toLocaleString('en-IN')}
          </span>
        </div>

        {/* Total Refunded (Soft Plum) */}
        <div style={{ backgroundColor: '#e3d7e8', border: '1px solid #c7b3ce', borderRadius: '6px', padding: '3px 10px', display: 'inline-flex', alignItems: 'center', gap: '5px' }}>
          <RotateCcw size={13} color="#3a1c42" />
          <span style={{ fontSize: '11px', fontWeight: 700, color: '#3a1c42', textTransform: 'uppercase' }}>Refunded:</span>
          <span style={{ fontSize: '13px', fontWeight: 800, fontFamily: 'JetBrains Mono', color: '#3a1c42' }}>
            K {Math.round(totalReturned).toLocaleString('en-IN')}
          </span>
        </div>

        {/* HELD BALANCE BADGE (Muted Gold) */}
        <div style={{ backgroundColor: '#ebd8ab', border: '2px solid #cbb27a', borderRadius: '6px', padding: '4px 12px', display: 'inline-flex', alignItems: 'center', gap: '6px', boxShadow: '0 1px 3px rgba(77, 55, 14, 0.12)' }}>
          <Wallet size={15} color="#4d370e" />
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#4d370e', textTransform: 'uppercase', letterSpacing: '0.5px' }}>HELD BALANCE:</span>
          <span style={{ fontSize: '15px', fontWeight: 900, fontFamily: 'JetBrains Mono', color: '#4d370e' }}>
            K {Math.round(totalHeldBalance || 0).toLocaleString('en-IN')}
          </span>
        </div>

      </div>
    </header>
  );
};
