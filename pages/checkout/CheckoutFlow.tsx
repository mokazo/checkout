import React, { useState, useEffect, useMemo } from 'react';
import { Merchant, Product, ShippingMethod } from '../../types';
import { mockApi } from '../../services/mockApi';
import { chronopostService, ChronopostPoint } from '../../services/chronopost';
import { mondialRelayService, MondialRelayPoint } from '../../services/mondialRelay';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ShoppingBag, Truck, CreditCard, CheckCircle, ArrowLeft, Lock, Store, MapPin, Loader, Home, Box } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

interface CheckoutFlowProps {
  merchant: Merchant;
  onOrderComplete?: () => void;
}

interface DisplayPoint {
  id: string;
  name: string;
  address: string;
  city: string;
  zip: string;
  type: 'CHRONOPOST' | 'MONDIAL_RELAY';
}

const Step1Amount: React.FC<{ 
  onValidate: (amount: number) => void,
  merchant: Merchant 
}> = ({ onValidate, merchant }) => {
  const [customAmount, setCustomAmount] = useState<string>('');
  
  return (
    <div className="flex flex-col items-center justify-center py-10 animate-fade-in text-center">
      <div className="mb-4">
        <span className="inline-flex items-center gap-2 bg-gray-800 text-orange-400 text-xs font-bold px-3 py-1.5 rounded-full border border-gray-700">
          <div className="w-2 h-2 bg-orange-500 rounded-full animate-pulse"></div>
          LIVE STATUS: ONLINE
        </span>
      </div>

      <h1 className="text-5xl md:text-7xl font-black text-white uppercase tracking-tighter">
        Paiement <span className="text-gray-600">Simplifié.</span>
      </h1>
      <p className="text-gray-400 mt-4 max-w-xl mx-auto">
        Le checkout professionnel pour {merchant.companyName}. Entrez le montant de votre achat pour continuer.
      </p>

      <div className="w-full max-w-md bg-gray-900/50 border border-gray-800 p-6 rounded-xl mt-10">
        <label className="block text-center font-semibold text-gray-300 mb-4">
            Entrez le montant de votre commande
        </label>
        <div className="flex flex-col md:flex-row gap-4 items-stretch">
          <div className="relative flex-1">
            <input 
                type="number" 
                placeholder="0.00" 
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="w-full pl-4 pr-12 py-3 text-lg rounded-md bg-gray-900 border border-gray-700 text-white focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition-all"
            />
            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 font-bold text-xl">€</span>
          </div>
          <Button 
            disabled={!customAmount || parseFloat(customAmount) <= 0}
            onClick={() => onValidate(parseFloat(customAmount))}
            className="text-lg font-bold py-3 min-w-[150px]"
          >
            Continuer <ArrowLeft className="w-5 h-5 transition-transform transform -rotate-180" />
          </Button>
        </div>
      </div>
    </div>
  );
};

const Step2Details: React.FC<{
  onSubmit: (details: any) => void;
  onBack: () => void;
  merchant: Merchant;
  cartTotal: number;
}> = ({ onSubmit, onBack, merchant, cartTotal }) => {
  const [formData, setFormData] = useState({
    reference: '', pseudo: '', 
    firstName: '', lastName: '', 
    email: '', phone: '',
    address: '', city: '', zip: '', country: 'France'
  });
  const [shippingMethodId, setShippingMethodId] = useState<string>(merchant.shippingMethods.find(m => m.isActive)?.id || '');
  
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);
  const [relayPoints, setRelayPoints] = useState<DisplayPoint[]>([]);
  const [selectedRelayId, setSelectedRelayId] = useState<string>('');
  const [isLoadingRelays, setIsLoadingRelays] = useState(false);

  const selectedShipping = merchant.shippingMethods.find(m => m.id === shippingMethodId);
  
  const shippingType = useMemo<'CHRONOPOST' | 'MONDIAL_RELAY' | 'HOME' | null>(() => {
      const name = selectedShipping?.name.toLowerCase() || '';
      const id = selectedShipping?.id || '';
      if (name.includes('domicile')) return 'HOME';
      if (id === 'ship_mr' || name.includes('mondial')) return 'MONDIAL_RELAY';
      if (id === 'ship_relay' || name.includes('chronopost') || name.includes('relais')) return 'CHRONOPOST';
      return 'HOME';
  }, [selectedShipping]);

  const isRelayMethod = shippingType === 'CHRONOPOST' || shippingType === 'MONDIAL_RELAY';

  useEffect(() => {
    const fetchCities = async () => {
      if (formData.zip.length === 5 && !isNaN(Number(formData.zip))) {
        setIsLoadingCities(true);
        try {
          const response = await fetch(`https://geo.api.gouv.fr/communes?codePostal=${formData.zip}&fields=nom&format=json&geometry=centre`);
          if (response.ok) {
             const data = await response.json();
             const cityNames = data.map((c: any) => c.nom);
             setAvailableCities(cityNames);
             if (cityNames.length === 1) setFormData(prev => ({ ...prev, city: cityNames[0] }));
             else if (cityNames.length === 0) setFormData(prev => ({ ...prev, city: '' }));
          }
        } catch (e) { console.error("Error fetching cities", e); } 
        finally { setIsLoadingCities(false); }
      } else { setAvailableCities([]); }
    };
    const timer = setTimeout(fetchCities, 300);
    return () => clearTimeout(timer);
  }, [formData.zip]);

  useEffect(() => {
    const fetchRelays = async () => {
        if (isRelayMethod && formData.zip.length >= 5) {
            setIsLoadingRelays(true); setRelayPoints([]); setSelectedRelayId('');
            try {
                if (shippingType === 'CHRONOPOST' && merchant.chronopostConfig?.enabled) {
                    const points = await chronopostService.searchRelayPoints(formData.zip, merchant.chronopostConfig);
                    setRelayPoints(points.map(p => ({ id: p.identifiant, name: p.nom, address: p.adresse1, city: p.localite, zip: p.codePostal, type: 'CHRONOPOST' })));
                } else if (shippingType === 'MONDIAL_RELAY' && merchant.mondialRelayConfig?.enabled) {
                    const points = await mondialRelayService.searchPoints(formData.zip, merchant.mondialRelayConfig);
                    setRelayPoints(points.map(p => ({ id: p.id, name: p.name, address: p.address, city: p.city, zip: p.zipCode, type: 'MONDIAL_RELAY' })));
                }
            } catch (err) { console.error("Failed to fetch relays", err); } 
            finally { setIsLoadingRelays(false); }
        }
    };
    const timer = setTimeout(fetchRelays, 500);
    return () => clearTimeout(timer);
  }, [formData.zip, shippingType, merchant.chronopostConfig, merchant.mondialRelayConfig]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRelayMethod && !selectedRelayId) { alert("Veuillez sélectionner un point relais."); return; }
    let finalData = { ...formData, shippingMethodId };
    if (isRelayMethod && selectedRelayId) {
        const relay = relayPoints.find(r => r.id === selectedRelayId);
        if (relay) finalData = { ...finalData, address: `[${relay.type} ${relay.id}] ${relay.name} - ${relay.address}`, city: relay.city, zip: relay.zip };
    }
    onSubmit(finalData);
  };

  return (
    <div className="animate-fade-in">
      <div className="flex items-center justify-between mb-8 bg-gray-900 p-4 rounded-lg border border-gray-800">
        <div className="flex items-center gap-2">
            <button onClick={onBack} className="p-2 text-gray-400 hover:bg-gray-800 rounded-md"><ArrowLeft size={18} /></button>
            <span className="text-gray-400 font-medium">Montant</span>
        </div>
        <span className="text-2xl font-bold text-white">{cartTotal.toFixed(2)} €</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Informations de livraison</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input placeholder="Référence (Optionnel)" value={formData.reference} onChange={e => setFormData({...formData, reference: e.target.value})} />
                <Input placeholder="Pseudo (Optionnel)" value={formData.pseudo} onChange={e => setFormData({...formData, pseudo: e.target.value})} />
                <Input required placeholder="Prénom" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
                <Input required placeholder="Nom" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
                <Input required type="email" placeholder="Adresse e-mail" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                <Input required type="tel" placeholder="Numéro de téléphone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                <div className="md:col-span-2">
                    <select className="w-full px-3 py-2 border rounded-md bg-gray-900/50 border-gray-700 text-gray-200" value={formData.country} onChange={e => setFormData({...formData, country: e.target.value})}>
                        <option value="France">France</option><option value="Belgique">Belgique</option><option value="Suisse">Suisse</option><option value="Luxembourg">Luxembourg</option>
                    </select>
                </div>
                <div className="relative"><Input required placeholder="Code postal" value={formData.zip} onChange={e => setFormData({...formData, zip: e.target.value})} maxLength={5} /></div>
                <div className="relative">
                    {isLoadingCities && <div className="absolute right-3 top-3"><Loader className="animate-spin text-gray-500" size={16} /></div>}
                    {availableCities.length > 1 ? (
                         <select required className="w-full px-3 py-2 border rounded-md bg-gray-900/50 border-gray-700 text-gray-200" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})}>
                            <option value="">Sélectionnez une ville</option>{availableCities.map(city => (<option key={city} value={city}>{city}</option>))}
                         </select>
                    ) : ( <Input required placeholder="Ville" value={formData.city} onChange={e => setFormData({...formData, city: e.target.value})} readOnly={availableCities.length === 1} className={availableCities.length === 1 ? "bg-gray-800" : ""}/> )}
                </div>
                <div className="md:col-span-2"><Input required={!isRelayMethod} placeholder={isRelayMethod ? "L'adresse sera celle du point relais" : "N° et nom de rue"} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} disabled={isRelayMethod} className={isRelayMethod ? "bg-gray-800 text-gray-500 cursor-not-allowed" : ""}/></div>
            </div>
        </div>

        <div className="bg-gray-900 border border-gray-800 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-white mb-4">Mode de livraison</h3>
            <div className="space-y-3">
                {merchant.shippingMethods.filter(m => m.isActive).map(method => {
                    const isSelected = shippingMethodId === method.id; const name = method.name.toLowerCase();
                    const isMr = method.id === 'ship_mr' || name.includes('mondial'); const isChrono = (method.id === 'ship_relay' || name.includes('chronopost')) && !name.includes('domicile');
                    const isRelay = isMr || isChrono;
                    return (
                        <div key={method.id} className={`p-4 border rounded-lg cursor-pointer flex flex-col transition-all ${ isSelected ? 'bg-gray-800 border-orange-500' : 'bg-gray-950 hover:bg-gray-800/50 border-gray-700'}`} onClick={() => setShippingMethodId(method.id)}>
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'border-orange-500' : 'border-gray-600'}`}>{isSelected && <div className="w-2.5 h-2.5 rounded-full bg-orange-500" />}</div>
                                    <div className="flex items-center gap-2">{isMr ? (<Box className="text-orange-400" size={20} />) : isChrono ? (<Store className="text-orange-400" size={20} />) : (<Home className="text-gray-400" size={20} />)}<span className={`font-medium ${isSelected ? 'text-white' : 'text-gray-300'}`}>{method.name}</span></div>
                                </div><span className="font-bold text-white">{method.price.toFixed(2)} €</span>
                            </div>
                            {isSelected && isRelay && (
                                <div className="mt-4 pt-4 border-t border-gray-700 animate-fade-in">
                                     <label className="flex items-center gap-2 text-sm font-medium text-gray-300 mb-3"><MapPin size={16} /> Points relais à proximité :</label>
                                     {((shippingType === 'CHRONOPOST' && !merchant.chronopostConfig?.enabled) || (shippingType === 'MONDIAL_RELAY' && !merchant.mondialRelayConfig?.enabled)) ? (<p className="text-sm text-red-400">Service non configuré.</p>) : (
                                         <div className="relative">
                                            {isLoadingRelays && (<div className="flex items-center justify-center py-4 gap-2 text-gray-500"><Loader className="animate-spin" size={20} /> Chargement...</div>)}
                                            {formData.zip.length < 5 ? (<p className="text-sm text-orange-400 p-2 bg-orange-500/10 rounded border border-orange-500/20 flex items-center gap-2"><ArrowLeft size={16} /> Renseignez votre code postal.</p>) : (
                                                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                                                    {relayPoints.length === 0 && !isLoadingRelays && (<p className="text-sm text-gray-500 italic p-2">Aucun point disponible.</p>)}
                                                    {relayPoints.map(point => (<div key={point.id} onClick={(e) => { e.stopPropagation(); setSelectedRelayId(point.id); }} className={`p-3 rounded-md border cursor-pointer transition-colors flex items-start gap-3 ${ selectedRelayId === point.id ? 'bg-orange-500/10 border-orange-500/50' : 'bg-gray-900 border-gray-700 hover:bg-gray-800'}`}>
                                                            <div className={`mt-0.5 w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center ${ selectedRelayId === point.id ? 'border-orange-500' : 'border-gray-500'}`}>{selectedRelayId === point.id && <div className="w-2 h-2 rounded-full bg-orange-500" />}</div>
                                                            <div><p className="text-sm font-bold text-white">{point.name}</p><p className="text-xs text-gray-400">{point.address}, {point.city}</p></div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                         </div>
                                     )}
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>
        </div>

        <div className="pt-4">
            <Button type="submit" className="w-full py-3 text-lg font-bold">
                Procéder au paiement <CreditCard size={20} />
            </Button>
        </div>
        </form>
    </div>
  );
};

const StripePaymentForm: React.FC<{
    total: number;
    onSuccess: () => void;
    merchant: Merchant;
}> = ({ total, onSuccess, merchant }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        if (!stripe || !elements) return;
        setIsLoading(true); setErrorMsg('');
        const cardElement = elements.getElement(CardElement);
        if (!cardElement) { setIsLoading(false); return; }

        const { error, paymentMethod } = await stripe.createPaymentMethod({ type: 'card', card: cardElement });
        if (error) {
            setErrorMsg(error.message || 'Paiement échoué'); setIsLoading(false);
        } else { setTimeout(() => { onSuccess(); }, 1000); }
    };

    return (
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="bg-gray-800 border border-gray-700 rounded p-4">
                <CardElement options={{
                    style: { base: { fontSize: '16px', color: '#FFF', '::placeholder': { color: '#6b7280' } }, invalid: { color: '#ef4444' } },
                    hidePostalCode: true,
                }} />
            </div>
            {errorMsg && <div className="text-red-400 text-sm bg-red-500/10 p-2 rounded">{errorMsg}</div>}
            <Button type="submit" disabled={!stripe || isLoading} isLoading={isLoading} className="w-full py-3 mt-4 text-white font-bold rounded text-lg">
                Payer {total.toFixed(2)} €
            </Button>
        </form>
    );
}

const Step3PaymentModal: React.FC<{
  total: number;
  onPaySuccess: () => void;
  onBack: () => void;
  merchant: Merchant;
}> = ({ total, onPaySuccess, onBack, merchant }) => {
    const stripePromise = useMemo(() => {
        const key = merchant.stripePublishableKey || 'pk_test_12345'; return loadStripe(key);
    }, [merchant.stripePublishableKey]);

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
        <div className="bg-gray-900 rounded-lg shadow-2xl w-full max-w-sm overflow-hidden relative border border-gray-700">
            <div className="bg-gray-950 p-6 border-b border-gray-800 text-center">
                <h3 className="text-2xl font-bold text-white mb-1">{total.toFixed(2)} €</h3>
                <p className="font-semibold text-gray-400 uppercase text-sm">{merchant.companyName}</p>
            </div>
            <Elements stripe={stripePromise}>
                <StripePaymentForm total={total} onSuccess={onPaySuccess} merchant={merchant} />
            </Elements>
            <div className="bg-black p-3 text-center text-xs text-gray-500 flex justify-center items-center gap-2">
                <Lock size={12} /> Transaction sécurisée par Stripe
            </div>
            <button onClick={onBack} className="absolute top-2 right-2 text-gray-500 hover:text-white p-2">&times;</button>
        </div>
    </div>
  );
};

export const CheckoutFlow: React.FC<CheckoutFlowProps> = ({ merchant, onOrderComplete }) => {
  const [step, setStep] = useState(1);
  const [amount, setAmount] = useState<number>(0);
  const [shippingDetails, setShippingDetails] = useState<any>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);

  useEffect(() => {
    document.body.style.backgroundColor = '#000';
    return () => { document.body.style.backgroundColor = ''; };
  }, []);

  const handleAmountValidate = (customAmount: number) => { setAmount(customAmount); setStep(2); };
  const handleDetailsSubmit = (details: any) => { setShippingDetails(details); setShowPaymentModal(true); };
  const handlePaymentSuccess = async () => {
    const shippingMethod = merchant.shippingMethods.find(m => m.id === shippingDetails.shippingMethodId);
    const shippingCost = shippingMethod?.price || 0;
    const totalAmount = amount + shippingCost;
    try {
      await mockApi.createOrder({
        merchantId: merchant.id, productId: null, productName: 'Paiement Libre', amount: amount,
        shippingCost: shippingCost, totalAmount: totalAmount, customerName: `${shippingDetails.firstName} ${shippingDetails.lastName}`,
        customerEmail: shippingDetails.email, shippingAddress: shippingDetails.address, shippingCity: shippingDetails.city,
        shippingZip: shippingDetails.zip, shippingCountry: shippingDetails.country, shippingMethodId: shippingDetails.shippingMethodId,
        reference: shippingDetails.reference, pseudo: shippingDetails.pseudo
      });
      setStep(4); setShowPaymentModal(false); if (onOrderComplete) onOrderComplete();
    } catch (error) { console.error(error); alert("Erreur lors de la création de la commande"); }
  };

  if (step === 4) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-2xl p-8 text-center animate-scale-in">
          <div className="w-20 h-20 bg-green-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h2 className="text-2xl font-bold text-white mb-2">Paiement Réussi !</h2>
          <p className="text-gray-400 mb-8">Merci pour votre achat. Un email de confirmation a été envoyé à {shippingDetails?.email}.</p>
          <Button onClick={() => window.location.reload()} variant="secondary" className="w-full">Retourner à la boutique</Button>
        </div>
      </div>
    );
  }

  const currentShippingCost = merchant.shippingMethods.find(m => m.id === shippingDetails?.shippingMethodId)?.price || 0;
  const grandTotal = amount + currentShippingCost;

  return (
    <div className="min-h-screen bg-black flex flex-col font-sans">
      <header className="p-6 flex items-center justify-center">
         {merchant.logoUrl ? (
            <img src={merchant.logoUrl} className="h-8 w-auto object-contain" alt={merchant.companyName} />
          ) : (
            <span className="font-bold text-xl text-white">{merchant.companyName}</span>
          )}
      </header>
      <main className="flex-1 max-w-2xl mx-auto w-full p-4 md:py-8">
        {step === 1 && (<Step1Amount onValidate={handleAmountValidate} merchant={merchant} />)}
        {step === 2 && (<Step2Details onSubmit={handleDetailsSubmit} onBack={() => setStep(1)} merchant={merchant} cartTotal={amount} />)}
      </main>
      {showPaymentModal && (<Step3PaymentModal total={grandTotal} onPaySuccess={handlePaymentSuccess} onBack={() => setShowPaymentModal(false)} merchant={merchant}/>)}
      <footer className="py-6 text-center text-gray-600 text-xs">
         <p>Propulsé par Achetele.com</p>
      </footer>
    </div>
  );
};