import React, { useState, useEffect, useMemo } from 'react';
import { Merchant, Product, ShippingMethod } from '../../types';
import { mockApi } from '../../services/mockApi';
import { chronopostService, ChronopostPoint } from '../../services/chronopost';
import { mondialRelayService, MondialRelayPoint } from '../../services/mondialRelay';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { ShoppingBag, Truck, CreditCard, CheckCircle, ArrowLeft, ShieldCheck, Lock, Store, ShoppingBasket, MapPin, Loader, Home, Box } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, CardElement, useStripe, useElements } from '@stripe/react-stripe-js';

interface CheckoutFlowProps {
  merchant: Merchant;
  onOrderComplete?: () => void;
}

// Unified interface for display
interface DisplayPoint {
  id: string;
  name: string;
  address: string;
  city: string;
  zip: string;
  type: 'CHRONOPOST' | 'MONDIAL_RELAY';
}

// Step 1: Just the amount entry
const Step1Amount: React.FC<{ 
  onValidate: (amount: number) => void,
  merchant: Merchant 
}> = ({ onValidate, merchant }) => {
  const [customAmount, setCustomAmount] = useState<string>('');
  
  return (
    <div className="flex flex-col items-center justify-center py-10 animate-fade-in">
      
      {/* Shop Logo/Icon large */}
      <div className="mb-8 flex flex-col items-center">
          {merchant.logoUrl ? (
            <img src={merchant.logoUrl} className="h-24 w-auto object-contain mb-4" alt={merchant.companyName} />
          ) : (
            <div className="w-24 h-24 bg-[#C19A6B] rounded-xl flex items-center justify-center mb-4 text-white shadow-lg">
                <ShoppingBasket size={48} />
            </div>
          )}
          <h2 className="text-xl font-bold tracking-widest uppercase text-gray-500">LIVE SHOPPING</h2>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-8 text-center uppercase">
        Live {merchant.companyName}
      </h1>

      <div className="w-full max-w-2xl bg-white/50 p-6 rounded-xl">
        <label className="block text-center text-lg font-semibold text-gray-800 mb-4 uppercase tracking-wide">
            ⬇ Saisissez le montant ⬇
        </label>
        <div className="flex flex-col md:flex-row gap-4 items-stretch">
          <div className="relative flex-1">
            <input 
                type="number" 
                placeholder="0" 
                value={customAmount}
                onChange={(e) => setCustomAmount(e.target.value)}
                className="w-full pl-4 pr-8 py-3 text-lg border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
            />
            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 font-bold">€</span>
          </div>
          <Button 
            disabled={!customAmount || parseFloat(customAmount) <= 0}
            onClick={() => onValidate(parseFloat(customAmount))}
            style={{ backgroundColor: merchant.themeColorPrimary || '#A07045' }} // Fallback to a brownish color if no theme
            className="text-white px-8 py-3 text-lg font-bold rounded-md uppercase min-w-[150px]"
          >
            <CreditCard size={20} className="mr-2" /> Valider
          </Button>
        </div>
      </div>

      <div className="mt-12 text-center space-y-4">
          <a href="#" className="text-[#0088cc] hover:underline block">Voir mes commandes en cours</a>
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
  
  // City Autocomplete State
  const [availableCities, setAvailableCities] = useState<string[]>([]);
  const [isLoadingCities, setIsLoadingCities] = useState(false);

  // Relay State
  const [relayPoints, setRelayPoints] = useState<DisplayPoint[]>([]);
  const [selectedRelayId, setSelectedRelayId] = useState<string>('');
  const [isLoadingRelays, setIsLoadingRelays] = useState(false);

  const selectedShipping = merchant.shippingMethods.find(m => m.id === shippingMethodId);
  
  // Detection Logic
  const shippingType = useMemo<'CHRONOPOST' | 'MONDIAL_RELAY' | 'HOME' | null>(() => {
      const name = selectedShipping?.name.toLowerCase() || '';
      const id = selectedShipping?.id || '';
      
      if (name.includes('domicile')) return 'HOME';
      
      // Check ID first for robustness, fallback to name
      if (id === 'ship_mr' || name.includes('mondial')) return 'MONDIAL_RELAY';
      if (id === 'ship_relay' || name.includes('chronopost') || name.includes('relais')) return 'CHRONOPOST';
      
      return 'HOME'; // Default fallback
  }, [selectedShipping]);

  const isRelayMethod = shippingType === 'CHRONOPOST' || shippingType === 'MONDIAL_RELAY';

  // 1. Effect: Fetch Cities when Zip Code changes (France only)
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
             
             // Auto-select if only one city found
             if (cityNames.length === 1) {
                setFormData(prev => ({ ...prev, city: cityNames[0] }));
             } else if (cityNames.length === 0) {
                setFormData(prev => ({ ...prev, city: '' }));
             }
          }
        } catch (e) {
          console.error("Error fetching cities", e);
        } finally {
          setIsLoadingCities(false);
        }
      } else {
        setAvailableCities([]);
      }
    };
    
    // Simple debounce
    const timer = setTimeout(fetchCities, 300);
    return () => clearTimeout(timer);
  }, [formData.zip]);


  // 2. Effect: Fetch Relay Points when Zip Code changes AND Relay Method is selected
  useEffect(() => {
    const fetchRelays = async () => {
        if (isRelayMethod && formData.zip.length >= 5) {
            setIsLoadingRelays(true);
            setRelayPoints([]); // Reset points while loading
            setSelectedRelayId('');

            try {
                if (shippingType === 'CHRONOPOST' && merchant.chronopostConfig?.enabled) {
                    const points = await chronopostService.searchRelayPoints(formData.zip, merchant.chronopostConfig);
                    setRelayPoints(points.map(p => ({
                        id: p.identifiant,
                        name: p.nom,
                        address: p.adresse1,
                        city: p.localite,
                        zip: p.codePostal,
                        type: 'CHRONOPOST'
                    })));
                } else if (shippingType === 'MONDIAL_RELAY' && merchant.mondialRelayConfig?.enabled) {
                    const points = await mondialRelayService.searchPoints(formData.zip, merchant.mondialRelayConfig);
                    setRelayPoints(points.map(p => ({
                        id: p.id,
                        name: p.name,
                        address: p.address,
                        city: p.city,
                        zip: p.zipCode,
                        type: 'MONDIAL_RELAY'
                    })));
                }
            } catch (err) {
                console.error("Failed to fetch relays", err);
            } finally {
                setIsLoadingRelays(false);
            }
        }
    };

    const timer = setTimeout(fetchRelays, 500);
    return () => clearTimeout(timer);
  }, [formData.zip, shippingType, merchant.chronopostConfig, merchant.mondialRelayConfig]);


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (isRelayMethod && !selectedRelayId) {
        alert("Veuillez sélectionner un point relais dans la liste.");
        return;
    }
    
    // Add selected relay info to submission if applicable
    let finalData = { ...formData, shippingMethodId };
    
    if (isRelayMethod && selectedRelayId) {
        const relay = relayPoints.find(r => r.id === selectedRelayId);
        if (relay) {
            finalData = {
                ...finalData,
                address: `[${relay.type} ${relay.id}] ${relay.name} - ${relay.address}`,
                city: relay.city,
                zip: relay.zip
            };
        }
    }

    onSubmit(finalData);
  };

  return (
    <div className="animate-fade-in">
        <div className="flex items-center justify-between mb-6 bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
             <span className="text-gray-500 font-medium">Montant à payer</span>
             <div className="flex items-center gap-4">
                <span className="text-2xl font-bold text-gray-900">{cartTotal.toFixed(2)} €</span>
                <button onClick={onBack} className="text-sm text-gray-500 underline hover:text-gray-800">Modifier</button>
             </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
        <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Étape 2. Remplir les informations de livraison.</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Input placeholder="Référence (Optionnel)" value={formData.reference} onChange={e => setFormData({...formData, reference: e.target.value})} />
                <Input placeholder="Pseudo (Optionnel)" value={formData.pseudo} onChange={e => setFormData({...formData, pseudo: e.target.value})} />
                
                <Input required placeholder="Prénom" value={formData.firstName} onChange={e => setFormData({...formData, firstName: e.target.value})} />
                <Input required placeholder="Nom" value={formData.lastName} onChange={e => setFormData({...formData, lastName: e.target.value})} />
                
                <Input required type="email" placeholder="Adresse e-mail" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
                <Input required type="tel" placeholder="Numéro de téléphone" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} />
                
                <div className="md:col-span-2">
                    <select 
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                        value={formData.country}
                        onChange={e => setFormData({...formData, country: e.target.value})}
                    >
                        <option value="France">France</option>
                        <option value="Belgique">Belgique</option>
                        <option value="Suisse">Suisse</option>
                        <option value="Luxembourg">Luxembourg</option>
                    </select>
                </div>

                {/* ZIP CODE & CITY SELECTOR */}
                <div className="relative">
                     <Input 
                        required 
                        placeholder="Code postal" 
                        value={formData.zip} 
                        onChange={e => setFormData({...formData, zip: e.target.value})}
                        maxLength={5} 
                    />
                </div>

                <div className="relative">
                    {isLoadingCities ? (
                        <div className="absolute right-3 top-3">
                             <Loader className="animate-spin text-gray-400" size={16} />
                        </div>
                    ) : null}
                    
                    {availableCities.length > 1 ? (
                         <select 
                            required
                            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500/20 bg-white"
                            value={formData.city}
                            onChange={e => setFormData({...formData, city: e.target.value})}
                         >
                            <option value="">Sélectionnez une ville</option>
                            {availableCities.map(city => (
                                <option key={city} value={city}>{city}</option>
                            ))}
                         </select>
                    ) : (
                        <Input 
                            required 
                            placeholder="Ville" 
                            value={formData.city} 
                            onChange={e => setFormData({...formData, city: e.target.value})}
                            // If cities were found but only 1, it's auto-filled. If 0 found, allow typing manually.
                            readOnly={availableCities.length === 1}
                            className={availableCities.length === 1 ? "bg-gray-50" : ""}
                        />
                    )}
                </div>
                
                <div className="md:col-span-2">
                    <Input 
                        required={!isRelayMethod} 
                        placeholder={isRelayMethod ? "Adresse (Sera remplacée par l'adresse du point relais)" : "N° et nom de rue"} 
                        value={formData.address} 
                        onChange={e => setFormData({...formData, address: e.target.value})}
                        disabled={isRelayMethod} 
                        className={isRelayMethod ? "bg-gray-100 text-gray-500" : ""}
                    />
                </div>
            </div>
        </div>

        <div>
            <p className="text-center text-sm text-gray-600 mb-2">Choisissez votre mode de livraison</p>
            <div className="space-y-3">
                {merchant.shippingMethods.filter(m => m.isActive).map(method => {
                    const isSelected = shippingMethodId === method.id;
                    const name = method.name.toLowerCase();
                    const isMr = method.id === 'ship_mr' || name.includes('mondial');
                    const isChrono = (method.id === 'ship_relay' || name.includes('chronopost')) && !name.includes('domicile');
                    
                    const isRelay = isMr || isChrono;
                    
                    return (
                        <div 
                            key={method.id}
                            className={`p-4 border rounded-lg cursor-pointer flex flex-col transition-all ${
                                isSelected 
                                    ? 'bg-blue-50 border-blue-500 shadow-md ring-1 ring-blue-500' 
                                    : 'bg-white hover:bg-gray-50 border-gray-300'
                            }`}
                            onClick={() => setShippingMethodId(method.id)}
                        >
                            <div className="flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center ${isSelected ? 'border-blue-600' : 'border-gray-400'}`}>
                                        {isSelected && <div className="w-2.5 h-2.5 rounded-full bg-blue-600" />}
                                    </div>
                                    <div className="flex items-center gap-2">
                                        {isMr ? (
                                            <Box className="text-purple-600" size={20} />
                                        ) : isChrono ? (
                                            <Store className="text-blue-600" size={20} />
                                        ) : (
                                            <Home className="text-gray-600" size={20} />
                                        )}
                                        <span className={`font-medium ${isSelected ? 'text-blue-900' : 'text-gray-800'}`}>{method.name}</span>
                                    </div>
                                </div>
                                <span className="font-bold">{method.price.toFixed(2)} €</span>
                            </div>

                            {/* RELAY POINT SELECTOR (Only shows if this method IS selected and IS a relay method) */}
                            {isSelected && isRelay && (
                                <div className="mt-4 pt-4 border-t border-blue-100 animate-fade-in">
                                     <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-3">
                                         <MapPin size={16} /> 
                                         {shippingType === 'MONDIAL_RELAY' ? 'Points Mondial Relay à proximité :' : 'Points Chronopost à proximité :'}
                                     </label>
                                     
                                     {/* Check if service is enabled in merchant config */}
                                     {((shippingType === 'CHRONOPOST' && !merchant.chronopostConfig?.enabled) || 
                                       (shippingType === 'MONDIAL_RELAY' && !merchant.mondialRelayConfig?.enabled)) ? (
                                         <p className="text-sm text-red-500">Service de livraison non configuré par le vendeur.</p>
                                     ) : (
                                         <div className="relative">
                                            {isLoadingRelays && (
                                                <div className="flex items-center justify-center py-4 gap-2 text-gray-500">
                                                    <Loader className="animate-spin" size={20} /> Chargement des points...
                                                </div>
                                            )}
                                            
                                            {formData.zip.length < 5 ? (
                                                 <p className="text-sm text-orange-600 p-2 bg-orange-50 rounded border border-orange-100 flex items-center gap-2">
                                                     <ArrowLeft size={16} /> Renseignez votre code postal plus haut pour voir la liste.
                                                 </p>
                                            ) : (
                                                <div className="space-y-2 max-h-64 overflow-y-auto pr-1 custom-scrollbar">
                                                    {relayPoints.length === 0 && !isLoadingRelays && (
                                                        <p className="text-sm text-gray-500 italic p-2">Aucun point disponible pour {formData.zip}</p>
                                                    )}
                                                    
                                                    {relayPoints.map(point => (
                                                        <div 
                                                            key={point.id}
                                                            onClick={(e) => {
                                                                e.stopPropagation(); 
                                                                setSelectedRelayId(point.id);
                                                            }}
                                                            className={`p-3 rounded-md border cursor-pointer transition-colors flex items-start gap-3 ${
                                                                selectedRelayId === point.id 
                                                                    ? 'bg-blue-100 border-blue-500' 
                                                                    : 'bg-white border-gray-200 hover:bg-gray-50'
                                                            }`}
                                                        >
                                                            <div className={`mt-0.5 w-4 h-4 rounded-full border flex-shrink-0 flex items-center justify-center ${
                                                                selectedRelayId === point.id ? 'border-blue-600' : 'border-gray-400'
                                                            }`}>
                                                                {selectedRelayId === point.id && <div className="w-2 h-2 rounded-full bg-blue-600" />}
                                                            </div>
                                                            <div>
                                                                <p className="text-sm font-bold text-gray-800">{point.name}</p>
                                                                <p className="text-xs text-gray-500">{point.address}, {point.city}</p>
                                                            </div>
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

        <div className="pt-4 border-t border-gray-200">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Étape 3. Mode de paiement.</h3>
            
            <div className="flex justify-center gap-4 mb-6">
                 <div className="border rounded px-4 py-2 flex items-center bg-white shadow-sm">
                     <span className="font-bold text-blue-800 italic pr-1">VISA</span>
                     <span className="text-xs">Carte</span>
                 </div>
                 <div className="border rounded px-4 py-2 flex items-center bg-white shadow-sm">
                     <div className="flex flex-col leading-none">
                         <span className="text-[10px] uppercase font-bold">MasterCard</span>
                         <div className="flex">
                            <div className="w-4 h-4 rounded-full bg-red-500 opacity-80"></div>
                            <div className="w-4 h-4 rounded-full bg-yellow-500 opacity-80 -ml-2"></div>
                         </div>
                     </div>
                 </div>
            </div>

            <div className="space-y-3 mb-6">
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name="paymentType" checked readOnly className="text-indigo-600" />
                    <span className="text-sm text-gray-700">Carte de crédit</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" className="rounded text-indigo-600" />
                    <span className="text-sm text-gray-700">Sauvegarder la carte pour des commandes ultérieures</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                    <input type="checkbox" required className="rounded text-indigo-600" />
                    <span className="text-sm text-gray-700">J'accepte <a href="#" className="text-blue-500 hover:underline">conditions générales de ventes</a></span>
                </label>
            </div>

            <Button 
                type="submit" 
                style={{ backgroundColor: merchant.themeColorPrimary || '#A07045' }} 
                className="w-full text-white py-4 text-lg font-bold rounded shadow-lg uppercase"
            >
                Confirmer l'adresse de livraison et procéder au paiement
            </Button>
        </div>
        </form>
    </div>
  );
};

// STRIPE COMPONENT WRAPPER
const StripePaymentForm: React.FC<{
    total: number;
    onSuccess: () => void;
    onBack: () => void;
    merchant: Merchant;
}> = ({ total, onSuccess, onBack, merchant }) => {
    const stripe = useStripe();
    const elements = useElements();
    const [isLoading, setIsLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!stripe || !elements) {
            return;
        }

        setIsLoading(true);
        setErrorMsg('');

        const cardElement = elements.getElement(CardElement);

        if (!cardElement) {
            setIsLoading(false);
            return;
        }

        // 1. Create Payment Method (Client side tokenization)
        const { error, paymentMethod } = await stripe.createPaymentMethod({
            type: 'card',
            card: cardElement,
        });

        if (error) {
            console.error(error);
            setErrorMsg(error.message || 'Paiement échoué');
            setIsLoading(false);
        } else {
            console.log('[PaymentMethod]', paymentMethod);
            // 2. In a real app, you would now send paymentMethod.id to your backend
            // mockApi.processPayment(paymentMethod.id) ...
            // For this demo, we assume success if Stripe verified the card structure
            setTimeout(() => {
                onSuccess();
            }, 1000);
        }
    };

    return (
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div className="flex justify-between items-center text-sm text-gray-600 mb-2">
                <span>Votre carte</span>
                <div className="flex gap-1 opacity-60">
                        <CreditCard size={20} />
                        <span className="font-bold italic">CB</span>
                </div>
            </div>

            <div className="bg-white border border-gray-300 rounded p-4">
                <CardElement options={{
                    style: {
                        base: {
                            fontSize: '16px',
                            color: '#424770',
                            '::placeholder': {
                                color: '#aab7c4',
                            },
                        },
                        invalid: {
                            color: '#9e2146',
                        },
                    },
                    hidePostalCode: true,
                }} />
            </div>

            {errorMsg && (
                <div className="text-red-500 text-sm bg-red-50 p-2 rounded">
                    {errorMsg}
                </div>
            )}

            <label className="flex items-center gap-2 cursor-pointer mt-2">
                <input type="checkbox" className="rounded text-blue-600" defaultChecked />
                <span className="text-sm text-gray-500">Enregistrer ma carte bancaire</span>
            </label>

            <Button 
                type="submit"
                disabled={!stripe || isLoading}
                isLoading={isLoading} 
                className="w-full py-3 mt-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded text-lg"
                style={{ backgroundColor: '#0055CC' }} // Payplug blue
            >
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
    // Load Stripe with the merchant's key
    // useMemo ensures we don't recreate the object on every render
    const stripePromise = useMemo(() => {
        // Fallback to a demo key if the merchant doesn't have one configured
        const key = merchant.stripePublishableKey || 'pk_test_12345';
        return loadStripe(key);
    }, [merchant.stripePublishableKey]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4 animate-fade-in">
        <div className="bg-[#f5f5f5] rounded-lg shadow-2xl w-full max-w-sm overflow-hidden relative">
            <div className="bg-white p-6 border-b text-center">
                <h3 className="text-2xl font-bold text-blue-600 mb-1">{total.toFixed(2)} €</h3>
                <p className="font-semibold text-gray-800 uppercase text-sm">{merchant.companyName}</p>
            </div>
            
            <Elements stripe={stripePromise}>
                <StripePaymentForm 
                    total={total} 
                    onSuccess={onPaySuccess} 
                    onBack={onBack} 
                    merchant={merchant} 
                />
            </Elements>
            
            <div className="bg-[#e5e5e5] p-3 text-center text-xs text-gray-500 flex justify-center items-center gap-2">
                <Lock size={10} /> Transaction sécurisée par <span className="font-bold italic text-gray-700">Stripe</span>
            </div>
            
            <button onClick={onBack} className="absolute top-2 right-2 text-gray-400 hover:text-gray-600">
                ✕
            </button>
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
    document.body.style.backgroundColor = '#FDFBF7';
    return () => {
      document.body.style.backgroundColor = '';
    };
  }, []);

  const handleAmountValidate = (customAmount: number) => {
    setAmount(customAmount);
    setStep(2);
  };

  const handleDetailsSubmit = (details: any) => {
    setShippingDetails(details);
    setShowPaymentModal(true);
  };

  const handlePaymentSuccess = async () => {
    // Calculate final total
    const shippingMethod = merchant.shippingMethods.find(m => m.id === shippingDetails.shippingMethodId);
    const shippingCost = shippingMethod?.price || 0;
    const totalAmount = amount + shippingCost;

    try {
      await mockApi.createOrder({
        merchantId: merchant.id,
        productId: null,
        productName: 'Paiement Libre',
        amount: amount,
        shippingCost: shippingCost,
        totalAmount: totalAmount,
        customerName: `${shippingDetails.firstName} ${shippingDetails.lastName}`,
        customerEmail: shippingDetails.email,
        shippingAddress: shippingDetails.address,
        shippingCity: shippingDetails.city,
        shippingZip: shippingDetails.zip,
        shippingCountry: shippingDetails.country,
        shippingMethodId: shippingDetails.shippingMethodId,
        reference: shippingDetails.reference,
        pseudo: shippingDetails.pseudo
      });
      setStep(4); // Success
      setShowPaymentModal(false);
      if (onOrderComplete) onOrderComplete();
    } catch (error) {
      console.error(error);
      alert("Erreur lors de la création de la commande");
    }
  };

  if (step === 4) {
    return (
      <div className="min-h-screen bg-[#FDFBF7] flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center animate-scale-in">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Paiement Réussi !</h2>
          <p className="text-gray-500 mb-8">Merci pour votre achat. Un email de confirmation a été envoyé à {shippingDetails?.email}.</p>
          <Button onClick={() => window.location.reload()} variant="secondary" className="w-full">
            Retourner à la boutique
          </Button>
        </div>
      </div>
    );
  }

  // Calculate total for display in Step 2/Payment
  const currentShippingCost = merchant.shippingMethods.find(m => m.id === shippingDetails?.shippingMethodId)?.price || 0;
  const grandTotal = amount + currentShippingCost;

  return (
    <div className="min-h-screen bg-[#FDFBF7] flex flex-col font-sans">
      {/* SIMULATED BROWSER BAR */}
      <div className="bg-gray-100 border-b border-gray-300 p-2 flex items-center gap-3 sticky top-0 z-20">
         <div className="flex gap-1.5 ml-2">
            <div className="w-3 h-3 rounded-full bg-red-400"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
            <div className="w-3 h-3 rounded-full bg-green-400"></div>
         </div>
         <div className="flex-1 bg-white rounded-md border border-gray-300 px-3 py-1.5 text-sm text-gray-600 flex items-center gap-2 overflow-hidden whitespace-nowrap">
            <Lock size={12} className="text-green-600" />
            <span className="text-gray-400">https://</span>
            <span className="font-semibold text-gray-800">{merchant.subdomain || 'boutique'}.achetele.com</span>
            <span className="text-gray-400">/fr/checkout</span>
         </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 max-w-4xl mx-auto w-full p-4 md:py-8">
        
        {step === 1 && (
          <Step1Amount onValidate={handleAmountValidate} merchant={merchant} />
        )}
        
        {step === 2 && (
          <Step2Details 
            onSubmit={handleDetailsSubmit} 
            onBack={() => setStep(1)} 
            merchant={merchant} 
            cartTotal={amount} 
          />
        )}

      </div>

      {/* Payment Modal Overlay */}
      {showPaymentModal && (
        <Step3PaymentModal 
            total={grandTotal} 
            onPaySuccess={handlePaymentSuccess} 
            onBack={() => setShowPaymentModal(false)}
            merchant={merchant}
        />
      )}
      
      <div className="py-6 text-center text-gray-400 text-xs flex flex-col items-center gap-2 mt-auto">
         <p className="text-[#0088cc]">CGV | Confidentialité | Mentions légales</p>
         <p>Propulsé par Achetele.com</p>
      </div>
    </div>
  );
};