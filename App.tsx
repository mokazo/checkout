import React, { useState, useEffect } from 'react';
import { ViewMode, Merchant } from './types';
import { mockApi } from './services/mockApi';
import { ProductList } from './pages/dashboard/ProductList';
import { OrderList } from './pages/dashboard/OrderList';
import { Settings } from './pages/dashboard/Settings';
import { CheckoutFlow } from './pages/checkout/CheckoutFlow';
import { AuthPage } from './pages/auth/AuthPage';
import { OnboardingPage } from './pages/onboarding/OnboardingPage';
import { LayoutDashboard, ShoppingCart, Settings as SettingsIcon, LogOut, Store, Globe } from 'lucide-react';

const App: React.FC = () => {
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>(ViewMode.DASHBOARD);
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'settings'>('orders');
  const [appState, setAppState] = useState<'LOADING' | 'AUTH' | 'ONBOARDING' | 'APP'>('LOADING');

  useEffect(() => {
    checkSession();
  }, []);

  const checkSession = async () => {
    const user = await mockApi.getCurrentUser();
    if (user) {
      setMerchant(user);
      if (!user.subdomain) {
        setAppState('ONBOARDING');
      } else {
        setAppState('APP');
      }
    } else {
      setAppState('AUTH');
    }
  };

  const handleAuthSuccess = (user: Merchant) => {
    setMerchant(user);
    if (!user.subdomain) {
      setAppState('ONBOARDING');
    } else {
      setAppState('APP');
    }
  };

  const handleOnboardingComplete = (updatedMerchant: Merchant) => {
    setMerchant(updatedMerchant);
    setAppState('APP');
  };

  const handleLogout = async () => {
    await mockApi.logout();
    setMerchant(null);
    setAppState('AUTH');
    setViewMode(ViewMode.DASHBOARD);
  };

  if (appState === 'LOADING') {
      return (
        <div className="h-screen flex items-center justify-center flex-col gap-4 bg-gray-50">
            <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-500 font-medium">Chargement...</p>
        </div>
      );
  }

  if (appState === 'AUTH') {
      return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  if (appState === 'ONBOARDING' && merchant) {
      return <OnboardingPage merchant={merchant} onComplete={handleOnboardingComplete} />;
  }

  // View: CHECKOUT (Simulated Subdomain)
  if (viewMode === ViewMode.CHECKOUT && merchant) {
    return (
      <>
        <CheckoutFlow merchant={merchant} onOrderComplete={() => {}} />
        
        {/* Simulator Toggle Floating Button */}
        <div className="fixed bottom-6 right-6 z-50">
          <button 
            onClick={() => setViewMode(ViewMode.DASHBOARD)}
            className="bg-gray-900 text-white px-4 py-3 rounded-full shadow-xl hover:scale-105 transition-transform flex items-center gap-2 font-medium text-sm border border-gray-700"
          >
            <LayoutDashboard size={18} /> Retour au Dashboard
          </button>
        </div>
      </>
    );
  }

  if (!merchant) return null; // Should not happen given appState logic

  // View: DASHBOARD (Merchant Side)
  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 hidden md:flex flex-col sticky top-0 h-screen">
        <div className="p-6 border-b border-gray-100">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white font-bold text-lg">A</div>
             <span className="font-bold text-lg text-gray-800">Achetele.com</span>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <button 
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'orders' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <ShoppingCart size={20} /> Commandes
          </button>
          <button 
            onClick={() => setActiveTab('products')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'products' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <LayoutDashboard size={20} /> Produits
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              activeTab === 'settings' ? 'bg-indigo-50 text-indigo-700' : 'text-gray-600 hover:bg-gray-50'
            }`}
          >
            <SettingsIcon size={20} /> Paramètres
          </button>
        </nav>

        <div className="p-4 border-t border-gray-100">
          <div className="flex items-center gap-3 px-4 py-3 text-sm font-medium text-gray-600">
             <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold uppercase">
                {merchant.companyName.charAt(0)}
             </div>
             <div className="flex-1 min-w-0">
                <p className="truncate text-gray-900">{merchant.companyName}</p>
                <p className="truncate text-xs text-gray-400">{merchant.email}</p>
             </div>
             <LogOut size={16} className="cursor-pointer hover:text-red-500" onClick={handleLogout} />
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 min-w-0">
        <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <h1 className="text-xl font-bold text-gray-800 capitalize">
            {activeTab === 'orders' ? 'Commandes' : activeTab === 'products' ? 'Produits' : 'Paramètres'}
          </h1>
          
          <div className="flex gap-4">
            <button 
              onClick={() => setViewMode(ViewMode.CHECKOUT)}
              className="flex items-center gap-2 bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium shadow-sm"
            >
              <Globe size={18} /> Voir ma boutique
            </button>
            
            {/* Mobile Menu Toggle (Simplified for demo) */}
            <div className="md:hidden flex items-center gap-2">
                 <button onClick={() => setActiveTab('orders')} className={`p-2 rounded ${activeTab === 'orders' ? 'bg-indigo-100' : ''}`}><ShoppingCart size={20}/></button>
                 <button onClick={() => setActiveTab('products')} className={`p-2 rounded ${activeTab === 'products' ? 'bg-indigo-100' : ''}`}><LayoutDashboard size={20}/></button>
                 <button onClick={() => setActiveTab('settings')} className={`p-2 rounded ${activeTab === 'settings' ? 'bg-indigo-100' : ''}`}><SettingsIcon size={20}/></button>
            </div>
          </div>
        </header>

        <div className="p-6">
          {activeTab === 'orders' && <OrderList />}
          {activeTab === 'products' && <ProductList />}
          {activeTab === 'settings' && <Settings />}
        </div>
      </main>
    </div>
  );
};

export default App;