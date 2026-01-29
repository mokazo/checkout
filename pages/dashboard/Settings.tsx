import React, { useState, useEffect } from 'react';
import { mockApi } from '../../services/mockApi';
import { Merchant } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Truck, Check, Box, Palette, Settings as SettingsIcon, Lock } from 'lucide-react';

export const Settings: React.FC = () => {
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

  // Local state for sensitive fields to avoid re-rendering on every keystroke
  const [stripeSecretKey, setStripeSecretKey] = useState('');

  // Chronopost
  const [chronoEnabled, setChronoEnabled] = useState(false);
  const [chronoAccount, setChronoAccount] = useState('');
  const [chronoPassword, setChronoPassword] = useState('');
  const [isTestingChrono, setIsTestingChrono] = useState(false);
  const [chronoStatus, setChronoStatus] = useState<'disconnected' | 'connected' | 'error'>('disconnected');

  // Mondial Relay
  const [mrEnabled, setMrEnabled] = useState(false);
  const [mrEnseigne, setMrEnseigne] = useState('');
  const [mrPrivateKey, setMrPrivateKey] = useState('');

  useEffect(() => {
    mockApi.getCurrentUser().then(user => {
      setMerchant(user);
      if (user) {
        setStripeSecretKey(user.stripeSecretKey || '');
        if (user.chronopostConfig) {
          setChronoEnabled(user.chronopostConfig.enabled);
          setChronoAccount(user.chronopostConfig.accountNumber);
          setChronoPassword(user.chronopostConfig.password);
          if (user.chronopostConfig.enabled && user.chronopostConfig.accountNumber) {
              setChronoStatus('connected');
          }
        }
        if (user.mondialRelayConfig) {
            setMrEnabled(user.mondialRelayConfig.enabled);
            setMrEnseigne(user.mondialRelayConfig.enseigne);
            setMrPrivateKey(user.mondialRelayConfig.privateKey);
        }
      }
    });
  }, []);

  const handleTestChronopost = async () => {
    if (!chronoAccount || !chronoPassword) {
        alert("Veuillez saisir un numéro de compte et un mot de passe.");
        return;
    }
    
    setIsTestingChrono(true);
    setChronoStatus('disconnected');

    try {
        await mockApi.verifyChronopostConnection(chronoAccount, chronoPassword);
        setChronoStatus('connected');
        setSuccessMsg('Connexion Chronopost établie !');
    } catch (err) {
        setChronoStatus('error');
    } finally {
        setIsTestingChrono(false);
        setTimeout(() => setSuccessMsg(''), 3000);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!merchant) return;
    setIsLoading(true);

    const updatedMerchantData = {
      ...merchant,
      stripeSecretKey: stripeSecretKey,
      chronopostConfig: {
        enabled: chronoEnabled,
        accountNumber: chronoAccount,
        password: chronoPassword
      },
      mondialRelayConfig: {
        enabled: mrEnabled,
        enseigne: mrEnseigne,
        privateKey: mrPrivateKey
      }
    };

    const updatedMerchant = await mockApi.updateMerchant(updatedMerchantData);
    setMerchant(updatedMerchant);
    
    setIsLoading(false);
    setSuccessMsg('Settings updated successfully!');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  if (!merchant) return <div>Loading...</div>;

  return (
    <div className="max-w-4xl pb-10">
      <h1 className="text-2xl font-bold text-white mb-6">Store Settings</h1>
      
      <form onSubmit={handleSave} className="space-y-8">
        {/* Branding Section */}
        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
          <h2 className="text-lg font-semibold text-white mb-4 border-b border-gray-800 pb-3 flex items-center gap-2"><Palette size={20} /> Branding</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input 
              label="Store Name" 
              value={merchant.companyName} 
              onChange={e => setMerchant({...merchant, companyName: e.target.value})}
            />
            <Input 
              label="Subdomain" 
              value={merchant.subdomain} 
              disabled
              className="bg-gray-800 text-gray-500 cursor-not-allowed"
            />
            <Input 
              label="Logo URL" 
              value={merchant.logoUrl} 
              onChange={e => setMerchant({...merchant, logoUrl: e.target.value})}
            />
            <div className="flex items-center gap-4">
              {merchant.logoUrl && (
                <img src={merchant.logoUrl} alt="Logo" className="h-12 w-auto object-contain rounded bg-white/10 p-1" />
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Primary Color</label>
                <div className="flex gap-2 items-center">
                  <input 
                    type="color" 
                    value={merchant.themeColorPrimary} 
                    onChange={e => setMerchant({...merchant, themeColorPrimary: e.target.value})}
                    className="h-10 w-10 rounded border border-gray-700 p-1 cursor-pointer bg-transparent"
                  />
                  <span className="text-sm text-gray-400 uppercase font-mono">{merchant.themeColorPrimary}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-2">Secondary Color</label>
                <div className="flex gap-2 items-center">
                  <input 
                    type="color" 
                    value={merchant.themeColorSecondary} 
                    onChange={e => setMerchant({...merchant, themeColorSecondary: e.target.value})}
                    className="h-10 w-10 rounded border border-gray-700 p-1 cursor-pointer bg-transparent"
                  />
                  <span className="text-sm text-gray-400 uppercase font-mono">{merchant.themeColorSecondary}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Shipping Methods List */}
        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
          <h2 className="text-lg font-semibold text-white mb-4 border-b border-gray-800 pb-3 flex items-center gap-2"><Truck size={20}/> Shipping Methods</h2>
          <div className="space-y-4">
            {merchant.shippingMethods.map((method, index) => (
              <div key={method.id} className="flex gap-4 items-end bg-gray-950/50 p-3 rounded-lg border border-gray-800">
                <Input 
                  label="Name displayed to customer" 
                  value={method.name} 
                  onChange={e => {
                    const newMethods = [...merchant.shippingMethods];
                    newMethods[index].name = e.target.value;
                    setMerchant({...merchant, shippingMethods: newMethods});
                  }}
                />
                <Input 
                  label="Price (€)" 
                  type="number"
                  step="0.01"
                  value={method.price} 
                  onChange={e => {
                    const newMethods = [...merchant.shippingMethods];
                    newMethods[index].price = parseFloat(e.target.value);
                    setMerchant({...merchant, shippingMethods: newMethods});
                  }}
                  className="w-32"
                />
                <div className="pb-3">
                    <label className="flex items-center gap-2 text-sm text-gray-300 cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={method.isActive}
                            onChange={(e) => {
                                const newMethods = [...merchant.shippingMethods];
                                newMethods[index].isActive = e.target.checked;
                                setMerchant({...merchant, shippingMethods: newMethods});
                            }}
                            className="rounded text-orange-500 focus:ring-orange-500 bg-gray-700 border-gray-600"
                        />
                        Active
                    </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Chronopost Integration Module */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Truck className="text-orange-400" size={24} />
                        <div>
                            <h2 className="text-lg font-bold text-white">Chronopost</h2>
                        </div>
                    </div>
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        chronoStatus === 'connected' ? 'bg-green-500/10 text-green-400' : 
                        chronoStatus === 'error' ? 'bg-red-500/10 text-red-400' : 'bg-gray-700 text-gray-400'
                    }`}>
                        <div className={`w-2 h-2 rounded-full ${
                            chronoStatus === 'connected' ? 'bg-green-500' : 
                            chronoStatus === 'error' ? 'bg-red-500' : 'bg-gray-500'
                        }`}></div>
                        {chronoStatus}
                    </div>
                </div>
                <div className="p-6">
                    <label className="flex items-center gap-3 cursor-pointer mb-6">
                        <input type="checkbox" checked={chronoEnabled} onChange={(e) => setChronoEnabled(e.target.checked)} className="w-5 h-5 text-orange-500 rounded focus:ring-orange-500 bg-gray-700 border-gray-600"/>
                        <span className="font-medium text-white">Enable Chronopost</span>
                    </label>
                    {chronoEnabled && (
                        <div className="space-y-4 animate-fade-in">
                            <Input label="Account Number" value={chronoAccount} onChange={(e) => { setChronoAccount(e.target.value); setChronoStatus('disconnected'); }} />
                            <Input label="API Password" type="password" value={chronoPassword} onChange={(e) => { setChronoPassword(e.target.value); setChronoStatus('disconnected'); }} />
                            <Button type="button" variant="secondary" onClick={handleTestChronopost} isLoading={isTestingChrono} className="w-full mt-2">
                                Test Connection
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Mondial Relay Integration Module */}
            <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-800 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Box className="text-orange-400" size={24} />
                        <h2 className="text-lg font-bold text-white">Mondial Relay</h2>
                    </div>
                </div>
                <div className="p-6">
                    <label className="flex items-center gap-3 cursor-pointer mb-6">
                        <input type="checkbox" checked={mrEnabled} onChange={(e) => setMrEnabled(e.target.checked)} className="w-5 h-5 text-orange-500 rounded focus:ring-orange-500 bg-gray-700 border-gray-600" />
                        <span className="font-medium text-white">Enable Mondial Relay</span>
                    </label>
                    {mrEnabled && (
                        <div className="space-y-4 animate-fade-in">
                            <Input label="Brand ID (Enseigne)" value={mrEnseigne} onChange={(e) => setMrEnseigne(e.target.value)} placeholder="BDTEST13" />
                            <Input label="Private Key" type="password" value={mrPrivateKey} onChange={(e) => setMrPrivateKey(e.target.value)} />
                            <div className="text-xs text-gray-500 bg-gray-800/50 p-2 rounded">
                                Mondial Relay credentials will be used at checkout.
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Stripe Config */}
        <div className="bg-gray-900 p-6 rounded-xl border border-gray-800">
          <h2 className="text-lg font-semibold text-white mb-4 border-b border-gray-800 pb-3 flex items-center gap-2"><SettingsIcon size={20} /> API Keys</h2>
          <div className="grid grid-cols-1 gap-4">
            <Input 
              label="Stripe Publishable Key" 
              value={merchant.stripePublishableKey} 
              onChange={e => setMerchant({...merchant, stripePublishableKey: e.target.value})}
              placeholder="pk_test_..."
            />
            <Input 
              label="Stripe Secret Key" 
              type="password"
              value={stripeSecretKey} 
              onChange={e => setStripeSecretKey(e.target.value)}
              placeholder="sk_test_..."
            />
             <div className="text-xs text-gray-500 bg-gray-800/50 p-3 rounded-lg flex items-start gap-2">
                <Lock size={14} className="flex-shrink-0 mt-0.5" />
                <span>Your secret key is stored securely and is only used on the server to process payments. Never share it publicly.</span>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between sticky bottom-0 bg-gray-950/80 backdrop-blur-sm p-4 border-t border-gray-800 shadow-lg rounded-xl z-10 mt-4">
           <span className="text-green-500 font-medium flex items-center gap-2 text-sm">
               {successMsg && <><Check size={16} /> {successMsg}</>}
           </span>
           <Button type="submit" isLoading={isLoading}>
               Save Changes
           </Button>
        </div>
      </form>
    </div>
  );
};