import React, { useState, useEffect } from 'react';
import { ViewMode, Merchant } from './types';
import { mockApi } from './services/mockApi';
import { ProductList } from './pages/dashboard/ProductList';
import { OrderList } from './pages/dashboard/OrderList';
import { Settings } from './pages/dashboard/Settings';
import { CheckoutFlow } from './pages/checkout/CheckoutFlow';
import { AuthPage } from './pages/auth/AuthPage';
import { OnboardingPage } from './pages/onboarding/OnboardingPage';
import { LayoutDashboard, ShoppingCart, Settings as SettingsIcon, LogOut, Globe, Terminal } from 'lucide-react';
// FIX: Import the Button component to resolve "Cannot find name 'Button'" errors.
import { Button } from './components/ui/Button';

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
        <div className="h-screen flex items-center justify-center flex-col gap-4 bg-black">
            <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-gray-400 font-medium">Loading session...</p>
        </div>
      );
  }

  if (appState === 'AUTH') {
      return <AuthPage onAuthSuccess={handleAuthSuccess} />;
  }

  if (appState === 'ONBOARDING' && merchant) {
      return <OnboardingPage merchant={merchant} onComplete={handleOnboardingComplete} />;
  }

  if (viewMode === ViewMode.CHECKOUT && merchant) {
    return (
      <>
        <CheckoutFlow merchant={merchant} onOrderComplete={() => {}} />
        <div className="fixed bottom-6 right-6 z-50">
          <button 
            onClick={() => setViewMode(ViewMode.DASHBOARD)}
            className="bg-gray-900 text-white px-4 py-3 rounded-full shadow-xl hover:scale-105 transition-transform flex items-center gap-2 font-medium text-sm border border-gray-700"
          >
            <LayoutDashboard size={18} /> Back to Dashboard
          </button>
        </div>
      </>
    );
  }

  if (!merchant) return null;

  return (
    <div className="min-h-screen bg-black flex">
      <aside className="w-64 bg-gray-950 border-r border-gray-800 hidden md:flex flex-col sticky top-0 h-screen">
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center gap-2">
             <Terminal className="text-orange-500" size={24} />
             <span className="font-bold text-lg text-white tracking-tighter">Achetele_</span>
          </div>
        </div>
        
        <nav className="flex-1 p-4 space-y-1">
          <button 
            onClick={() => setActiveTab('orders')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'orders' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
            }`}
          >
            <ShoppingCart size={20} /> Orders
          </button>
          <button 
            onClick={() => setActiveTab('products')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'products' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
            }`}
          >
            <LayoutDashboard size={20} /> Products
          </button>
          <button 
            onClick={() => setActiveTab('settings')}
            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-md text-sm font-medium transition-colors ${
              activeTab === 'settings' ? 'bg-gray-800 text-white' : 'text-gray-400 hover:bg-gray-800/50 hover:text-white'
            }`}
          >
            <SettingsIcon size={20} /> Settings
          </button>
        </nav>

        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center gap-3 px-2 py-2 text-sm font-medium text-gray-300">
             <div className="w-8 h-8 rounded-full bg-orange-500/20 flex items-center justify-center text-orange-400 font-bold uppercase">
                {merchant.companyName.charAt(0)}
             </div>
             <div className="flex-1 min-w-0">
                <p className="truncate text-white font-semibold">{merchant.companyName}</p>
                <p className="truncate text-xs text-gray-500">{merchant.email}</p>
             </div>
             <LogOut size={16} className="cursor-pointer text-gray-500 hover:text-red-500" onClick={handleLogout} />
          </div>
        </div>
      </aside>

      <main className="flex-1 min-w-0">
        <header className="bg-gray-950/80 backdrop-blur-sm border-b border-gray-800 px-6 py-4 flex items-center justify-between sticky top-0 z-10">
          <h1 className="text-xl font-bold text-white capitalize">
            {activeTab}
          </h1>
          
          <div className="flex gap-4">
            <Button 
              onClick={() => setViewMode(ViewMode.CHECKOUT)}
              variant="primary"
            >
              <Globe size={16} /> View Store
            </Button>
            
            <div className="md:hidden flex items-center gap-2">
                 <button onClick={() => setActiveTab('orders')} className={`p-2 rounded ${activeTab === 'orders' ? 'bg-gray-800 text-white' : 'text-gray-500'}`}><ShoppingCart size={20}/></button>
                 <button onClick={() => setActiveTab('products')} className={`p-2 rounded ${activeTab === 'products' ? 'bg-gray-800 text-white' : 'text-gray-500'}`}><LayoutDashboard size={20}/></button>
                 <button onClick={() => setActiveTab('settings')} className={`p-2 rounded ${activeTab === 'settings' ? 'bg-gray-800 text-white' : 'text-gray-500'}`}><SettingsIcon size={20}/></button>
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
