import React from 'react';
import type { View } from '../App';
import { SummaryIcon, TransactionsIcon, BudgetIcon, ReportIcon, UsersIcon, LogoutIcon, SettingsIcon } from './Icons';
import { useAppContext } from '../contexts/AppContext';

interface BottomNavProps {
  currentView: View;
  setCurrentView: (view: View) => void;
}

const NavItem: React.FC<{
    icon: React.ReactNode;
    label: string;
    isActive: boolean;
    onClick: () => void;
}> = ({ icon, label, isActive, onClick }) => {
    const baseClasses = "relative flex flex-col items-center justify-center text-center w-full h-full p-2 min-h-[48px] touch-target transition-all duration-300 transform focus:outline-none focus-visible:ring-2 focus-visible:ring-white rounded-2xl";
    const activeClasses = "text-zinc-900 bg-white/95 scale-110 shadow-lg";
    const inactiveClasses = "text-gray-400 hover:text-white active:bg-white/20";

    return (
        <button
            onClick={onClick}
            className={`${baseClasses} ${isActive ? activeClasses : inactiveClasses}`}
            aria-label={label}
        >
            <div className="flex flex-col items-center">
                {icon}
                <span className="text-xs mt-1 leading-tight">{label}</span>
            </div>
        </button>
    );
};


const BottomNav: React.FC<BottomNavProps> = ({ currentView, setCurrentView }) => {
  const { currentUser, logout } = useAppContext();

  const navItems = [
    { id: 'summary', label: 'Resumen', icon: <SummaryIcon className="h-6 w-6"/>, show: true },
    { id: 'transactions', label: 'Transacciones', icon: <TransactionsIcon className="h-6 w-6"/>, show: true },
    { id: 'budgets', label: 'Presupuesto', icon: <BudgetIcon className="h-6 w-6"/>, show: true },
    { id: 'reports', label: 'Reportes', icon: <ReportIcon className="h-6 w-6"/>, show: true },
    { id: 'settings', label: 'Ajustes', icon: <SettingsIcon className="h-6 w-6"/>, show: true },
    { id: 'members', label: 'Miembros', icon: <UsersIcon className="h-6 w-6"/>, show: currentUser?.role === 'admin' },
  ];

  const visibleItems = navItems.filter(item => item.show);

  return (
    <nav className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-zinc-900 to-zinc-800 shadow-[0_-4px_16px_rgba(0,0,0,0.1)] rounded-t-3xl z-50">
        <div className="flex justify-around items-center h-full max-w-lg mx-auto px-4 gap-2">
            {visibleItems.map((item) => (
                <NavItem
                    key={item.id}
                    label={item.label}
                    icon={item.icon}
                    isActive={currentView === item.id}
                    onClick={() => setCurrentView(item.id as View)}
                />
            ))}
            <NavItem
                key="logout"
                label="Salir"
                icon={<LogoutIcon className="h-6 w-6" />}
                isActive={false}
                onClick={logout}
            />
        </div>
    </nav>
  );
};

export default BottomNav;