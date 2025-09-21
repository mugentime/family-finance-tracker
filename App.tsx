import React, { useState } from 'react';
import BottomNav from './components/Sidebar';
import DashboardScreen from './screens/DashboardScreen';
import TransactionsScreen from './screens/TransactionsScreen';
import BudgetScreen from './screens/BudgetScreen';
import ReportsScreen from './screens/ReportsScreen';
import MembersScreen from './screens/MembersScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import { AppContextProvider, useAppContext } from './contexts/AppContext';
import SettingsScreen from './screens/SettingsScreen';
import SummaryScreen from './screens/SummaryScreen';
import ErrorBoundary from './components/ErrorBoundary';

export type View = 'summary' | 'dashboard' | 'transactions' | 'budgets' | 'reports' | 'members' | 'settings';

const MainLayout: React.FC = () => {
  const [currentView, setCurrentView] = useState<View>('summary');

  const renderView = () => {
    switch (currentView) {
      case 'summary':
        return <SummaryScreen />;
      case 'dashboard':
        return <DashboardScreen />;
      case 'transactions':
        return <TransactionsScreen />;
      case 'budgets':
        return <BudgetScreen />;
      case 'reports':
        return <ReportsScreen />;
      case 'members':
        return <MembersScreen />;
      case 'settings':
        return <SettingsScreen />;
      default:
        return <SummaryScreen />;
    }
  };

  return (
    <div className="relative h-screen bg-gray-100/80 font-sans overflow-hidden">
      <main className="absolute top-0 right-0 bottom-20 left-0 overflow-y-auto p-4 sm:p-6 lg:p-8">
        {renderView()}
      </main>
      <BottomNav currentView={currentView} setCurrentView={setCurrentView} />
    </div>
  );
};

const AppContent: React.FC = () => {
  const { currentUser } = useAppContext();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  if (!currentUser) {
    if (authMode === 'login') {
      return <LoginScreen onSwitchToRegister={() => setAuthMode('register')} />;
    }
    return <RegisterScreen onSwitchToLogin={() => setAuthMode('login')} />;
  }

  return <MainLayout />;
};


const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <AppContextProvider>
        <AppContent />
      </AppContextProvider>
    </ErrorBoundary>
  );
};

export default App;