import React, { useState } from 'react';
import BottomNav from './components/Sidebar';
import DashboardScreen from './screens/DashboardScreen';
import TransactionsScreen from './screens/TransactionsScreen';
import BudgetScreen from './screens/BudgetScreen';
import ReportsScreen from './screens/ReportsScreen';
import MembersScreen from './screens/MembersScreen';
import LoginScreen from './screens/LoginScreen';
import RegisterScreen from './screens/RegisterScreen';
import { ApiContextProvider, useApiContext } from './contexts/ApiContext';
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
      <main className="absolute top-0 right-0 bottom-20 left-0 overflow-y-auto scroll-smooth p-3 sm:p-4 md:p-6 lg:p-8 mobile-spacing">
        {renderView()}
      </main>
      <BottomNav currentView={currentView} setCurrentView={setCurrentView} />
    </div>
  );
};

const AppContent: React.FC = () => {
  const { currentUser, loading, error } = useApiContext();
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');

  if (loading) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-zinc-900 mx-auto mb-4"></div>
          <p className="text-slate-600">Cargando datos...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-100">
        <div className="text-center p-6 bg-white rounded-xl shadow-md max-w-md">
          <div className="text-red-600 text-6xl mb-4">⚠️</div>
          <h2 className="text-xl font-bold text-slate-800 mb-2">Error de Conexión</h2>
          <p className="text-slate-600 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-zinc-900 text-white rounded-lg hover:bg-zinc-800"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

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
      <ApiContextProvider>
        <AppContent />
      </ApiContextProvider>
    </ErrorBoundary>
  );
};

export default App;