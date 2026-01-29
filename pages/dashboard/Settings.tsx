import React, { useState, useEffect } from 'react';
import { mockApi } from '../../services/mockApi';
import { Merchant } from '../../types';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Truck, Check, AlertCircle, XCircle, ExternalLink, Info, Box } from 'lucide-react';

export const Settings: React.FC = () => {
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');

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
      if (user?.chronopostConfig) {
        setChronoEnabled(user.chronopostConfig.enabled);
        setChronoAccount(user.chronopostConfig.accountNumber);
        setChronoPassword(user.chronopostConfig.password);
        if (user.chronopostConfig.enabled && user.chronopostConfig.accountNumber) {
            setChronoStatus('connected');
        }
      }
      if (user?.mondialRelayConfig) {
          setMrEnabled(user.mondialRelayConfig.enabled);
          setMrEnseigne(user.mondialRelayConfig.enseigne);
          setMrPrivateKey(user.mondialRelayConfig.privateKey);
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

    const updatedMerchant = {
      ...merchant,
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

    await mockApi.updateMerchant(updatedMerchant);
    setMerchant(updatedMerchant);
    
    setIsLoading(false);
    setSuccessMsg('Paramètres mis à jour avec succès !');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  if (!merchant) return <div>Chargement...</div>;

  return (
    <div className="max-w-4xl pb-10">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Paramètres de la boutique</h1>
      
      <form onSubmit={handleSave} className="space-y-8">
        {/* Branding Section */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold mb-4 border-b pb-2">Identité visuelle</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Input 
              label="Nom de la boutique" 
              value={merchant.companyName} 
              onChange={e => setMerchant({...merchant, companyName: e.target.value})}
            />
            <Input 
              label="Sous-domaine" 
              value={merchant.subdomain} 
              disabled
              className="bg-gray-50 text-gray-500"
            />
            <Input 
              label="URL du Logo" 
              value={merchant.logoUrl} 
              onChange={e => setMerchant({...merchant, logoUrl: e.target.value})}
            />
            <div className="flex items-center gap-4">
              {merchant.logoUrl && (
                <img src={merchant.logoUrl} alt="Logo" className="h-12 w-auto object-contain" />
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Couleur principale</label>
                <div className="flex gap-2 items-center">
                  <input 
                    type="color" 
                    value={merchant.themeColorPrimary} 
                    onChange={e => setMerchant({...merchant, themeColorPrimary: e.target.value})}
                    className="h-10 w-10 rounded border p-1 cursor-pointer"
                  />
                  <span className="text-sm text-gray-500 uppercase">{merchant.themeColorPrimary}</span>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Couleur secondaire</label>
                <div className="flex gap-2 items-center">
                  <input 
                    type="color" 
                    value={merchant.themeColorSecondary} 
                    onChange={e => setMerchant({...merchant, themeColorSecondary: e.target.value})}
                    className="h-10 w-10 rounded border p-1 cursor-pointer"
                  />
                  <span className="text-sm text-gray-500 uppercase">{merchant.themeColorSecondary}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Shipping Methods List */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold mb-4 border-b pb-2">Modes de livraison proposés</h2>
          <div className="space-y-4">
            {merchant.shippingMethods.map((method, index) => (
              <div key={method.id} className="flex gap-4 items-end bg-gray-50 p-3 rounded-lg">
                <Input 
                  label="Nom affiché au client" 
                  value={method.name} 
                  onChange={e => {
                    const newMethods = [...merchant.shippingMethods];
                    newMethods[index].name = e.target.value;
                    setMerchant({...merchant, shippingMethods: newMethods});
                  }}
                  className="bg-white"
                />
                <Input 
                  label="Prix (€)" 
                  type="number"
                  step="0.01"
                  value={method.price} 
                  onChange={e => {
                    const newMethods = [...merchant.shippingMethods];
                    newMethods[index].price = parseFloat(e.target.value);
                    setMerchant({...merchant, shippingMethods: newMethods});
                  }}
                  className="bg-white w-32"
                />
                <div className="pb-3">
                    <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
                        <input 
                            type="checkbox" 
                            checked={method.isActive}
                            onChange={(e) => {
                                const newMethods = [...merchant.shippingMethods];
                                newMethods[index].isActive = e.target.checked;
                                setMerchant({...merchant, shippingMethods: newMethods});
                            }}
                            className="rounded text-indigo-600 focus:ring-indigo-500"
                        />
                        Actif
                    </label>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Chronopost Integration Module */}
            <div className="bg-white rounded-xl shadow-sm border border-blue-200 overflow-hidden">
                <div className="bg-blue-50 px-6 py-4 border-b border-blue-100 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Truck className="text-blue-700" size={24} />
                        <div>
                            <h2 className="text-lg font-bold text-blue-900">Chronopost</h2>
                            <p className="text-xs text-blue-600">Points relais & étiquettes</p>
                        </div>
                    </div>
                    
                    <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider ${
                        chronoStatus === 'connected' ? 'bg-green-100 text-green-700' : 
                        chronoStatus === 'error' ? 'bg-red-100 text-red-700' : 'bg-gray-200 text-gray-500'
                    }`}>
                        <div className={`w-2 h-2 rounded-full ${
                            chronoStatus === 'connected' ? 'bg-green-500' : 
                            chronoStatus === 'error' ? 'bg-red-500' : 'bg-gray-400'
                        }`}></div>
                        {chronoStatus === 'connected' ? 'Connecté' : chronoStatus === 'error' ? 'Erreur' : 'Déconnecté'}
                    </div>
                </div>
                
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input 
                                type="checkbox"
                                checked={chronoEnabled}
                                onChange={(e) => setChronoEnabled(e.target.checked)}
                                className="w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                            />
                            <span className="font-medium text-gray-900">Activer Chronopost</span>
                        </label>
                    </div>

                    {chronoEnabled && (
                        <div className="space-y-4 animate-fade-in">
                            <Input 
                                label="Numéro de compte" 
                                value={chronoAccount}
                                onChange={(e) => {
                                    setChronoAccount(e.target.value);
                                    setChronoStatus('disconnected');
                                }}
                            />
                            <Input 
                                label="Mot de passe API" 
                                type="password"
                                value={chronoPassword}
                                onChange={(e) => {
                                    setChronoPassword(e.target.value);
                                    setChronoStatus('disconnected');
                                }}
                            />
                            <Button 
                                type="button" 
                                variant="secondary" 
                                onClick={handleTestChronopost}
                                isLoading={isTestingChrono}
                                className="w-full mt-2"
                            >
                                Tester la connexion
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Mondial Relay Integration Module */}
            <div className="bg-white rounded-xl shadow-sm border border-purple-200 overflow-hidden">
                <div className="bg-purple-50 px-6 py-4 border-b border-purple-100 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <Box className="text-purple-700" size={24} />
                        <div>
                            <h2 className="text-lg font-bold text-purple-900">Mondial Relay</h2>
                            <p className="text-xs text-purple-600">Points relais & étiquettes</p>
                        </div>
                    </div>
                </div>
                
                <div className="p-6">
                    <div className="flex items-center justify-between mb-6">
                        <label className="flex items-center gap-3 cursor-pointer">
                            <input 
                                type="checkbox"
                                checked={mrEnabled}
                                onChange={(e) => setMrEnabled(e.target.checked)}
                                className="w-5 h-5 text-purple-600 rounded focus:ring-purple-500"
                            />
                            <span className="font-medium text-gray-900">Activer Mondial Relay</span>
                        </label>
                    </div>

                    {mrEnabled && (
                        <div className="space-y-4 animate-fade-in">
                            <Input 
                                label="Code Enseigne (Brand ID)" 
                                value={mrEnseigne}
                                onChange={(e) => setMrEnseigne(e.target.value)}
                                placeholder="BDTEST13"
                            />
                            <Input 
                                label="Clé Privée (Private Key)" 
                                type="password"
                                value={mrPrivateKey}
                                onChange={(e) => setMrPrivateKey(e.target.value)}
                            />
                            <div className="text-xs text-gray-500 bg-gray-50 p-2 rounded">
                                Mondial Relay n'offre pas d'API de test temps réel dans ce panneau. Vos identifiants seront utilisés lors du checkout.
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>

        {/* Stripe Config */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold mb-4 border-b pb-2">Paiement (Stripe)</h2>
          <div className="grid grid-cols-1 gap-4">
            <Input 
              label="Clé Publique Stripe" 
              value={merchant.stripePublishableKey} 
              onChange={e => setMerchant({...merchant, stripePublishableKey: e.target.value})}
              placeholder="pk_test_..."
            />
          </div>
        </div>

        <div className="flex items-center justify-between sticky bottom-0 bg-white p-4 border-t border-gray-200 shadow-lg rounded-xl z-10">
           <span className="text-green-600 font-medium flex items-center gap-2">
               {successMsg && <><Check size={18} /> {successMsg}</>}
           </span>
           <Button type="submit" isLoading={isLoading} customColor={merchant.themeColorPrimary}>
               Enregistrer les modifications
           </Button>
        </div>
      </form>
    </div>
  );
};