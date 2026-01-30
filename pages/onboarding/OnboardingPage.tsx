import React, { useState, useEffect, useRef } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { mockApi } from '../../services/mockApi';
import { Merchant } from '../../types';
import { Store, Check, ArrowRight, CreditCard, ArrowLeft, Lock, Loader, AlertCircle } from 'lucide-react';
import { INITIAL_SHIPPING_METHODS } from '../../constants';

interface OnboardingPageProps {
  merchant: Merchant;
  onComplete: (updatedMerchant: Merchant) => void;
}

type SubdomainStatus = 'IDLE' | 'CHECKING' | 'AVAILABLE' | 'UNAVAILABLE';

export const OnboardingPage: React.FC<OnboardingPageProps> = ({ merchant, onComplete }) => {
  const [step, setStep] = useState(1);
  const [companyName, setCompanyName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [stripePublishableKey, setStripePublishableKey] = useState('');
  const [stripeSecretKey, setStripeSecretKey] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const [subdomainStatus, setSubdomainStatus] = useState<SubdomainStatus>('IDLE');
  const [subdomainError, setSubdomainError] = useState('');
  // FIX: Replaced NodeJS.Timeout with ReturnType<typeof setTimeout> for browser compatibility.
  const debounceTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (subdomain.length < 3) {
      setSubdomainStatus('IDLE');
      setSubdomainError('');
      return;
    }

    setSubdomainStatus('CHECKING');
    if (debounceTimeout.current) {
      clearTimeout(debounceTimeout.current);
    }

    debounceTimeout.current = setTimeout(async () => {
      const isAvailable = await mockApi.checkSubdomainAvailability(subdomain);
      if (isAvailable) {
        setSubdomainStatus('AVAILABLE');
        setSubdomainError('');
      } else {
        setSubdomainStatus('UNAVAILABLE');
        setSubdomainError('This subdomain is already taken.');
      }
    }, 500);

    return () => {
      if (debounceTimeout.current) {
        clearTimeout(debounceTimeout.current);
      }
    };
  }, [subdomain]);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setCompanyName(name);
    const generated = name.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/\s+/g, '-');
    setSubdomain(generated);
  };

  const handleSubdomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (subdomainStatus !== 'AVAILABLE') return;
    setIsLoading(true);
    try {
      const updatedMerchant = await mockApi.updateMerchant({
        companyName,
        subdomain,
        stripePublishableKey,
        stripeSecretKey,
        shippingMethods: INITIAL_SHIPPING_METHODS
      });
      onComplete(updatedMerchant);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const renderSubdomainStatus = () => {
    if (subdomain.length < 3) return null;

    switch (subdomainStatus) {
      case 'CHECKING':
        return (
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            <Loader className="animate-spin text-gray-500" size={18} />
          </div>
        );
      case 'AVAILABLE':
        return (
            <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 flex items-center gap-3 mt-3">
                <Check className="w-5 h-5 text-green-400" />
                <p className="text-green-300 text-sm font-medium">https://{subdomain}.achetele.com is available!</p>
            </div>
        );
      case 'UNAVAILABLE':
        return (
            <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-3 flex items-center gap-3 mt-3">
                <AlertCircle className="w-5 h-5 text-red-400" />
                <p className="text-red-300 text-sm font-medium">{subdomainError}</p>
            </div>
        );
      default:
        return null;
    }
  };


  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        <div className="bg-gray-900 border border-gray-800 rounded-2xl shadow-lg p-8 md:p-10 animate-fade-in">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-orange-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-orange-500/20">
               {step === 1 ? <Store className="w-8 h-8 text-orange-500" /> : <CreditCard className="w-8 h-8 text-orange-500" />}
            </div>
            <h1 className="text-2xl font-bold text-white">
              {step === 1 ? "Let's set up your store" : "Connect your Stripe account"}
            </h1>
            <p className="text-gray-400 mt-2">
              {step === 1 ? "This will only take a minute to launch your checkout." : "This is required to receive payments from your customers."}
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {step === 1 && (
              <div className="animate-fade-in">
                <div>
                  <Input 
                    label="What's the name of your store?" 
                    placeholder="e.g., My Awesome Store"
                    value={companyName}
                    onChange={handleNameChange}
                    required
                    className="text-lg p-3"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-2">Your web address (Subdomain)</label>
                  <div className="relative">
                    <div className="flex rounded-md shadow-sm border border-gray-700 focus-within:border-orange-500 focus-within:ring-1 focus-within:ring-orange-500">
                        <input
                            type="text"
                            className="flex-1 block w-full rounded-none rounded-l-md pl-4 sm:text-sm bg-gray-900 text-white border-0 focus:ring-0 py-3"
                            placeholder="my-awesome-store"
                            value={subdomain}
                            onChange={handleSubdomainChange}
                            required
                        />
                        <span className="inline-flex items-center px-4 rounded-r-md border-l border-gray-700 bg-gray-800 text-gray-400 font-medium sm:text-sm">
                        .achetele.com
                        </span>
                    </div>
                  </div>
                   {renderSubdomainStatus()}
                </div>
                
                 <Button type="button" onClick={() => setStep(2)} className="w-full text-lg py-3 mt-4" disabled={!companyName || subdomainStatus !== 'AVAILABLE'}>
                    Continue <ArrowRight className="w-5 h-5" />
                </Button>
              </div>
            )}
            
            {step === 2 && (
              <div className="animate-fade-in space-y-6">
                <div>
                  <Input 
                    label="Stripe Publishable Key"
                    placeholder="pk_test_..."
                    value={stripePublishableKey}
                    onChange={(e) => setStripePublishableKey(e.target.value)}
                    required
                  />
                </div>
                <div>
                    <Input 
                      label="Stripe Secret Key"
                      type="password"
                      placeholder="sk_test_..."
                      value={stripeSecretKey}
                      onChange={(e) => setStripeSecretKey(e.target.value)}
                      required
                    />
                </div>
                <div className="text-xs text-gray-500 bg-gray-800/50 p-3 rounded-lg flex items-start gap-2">
                    <Lock size={14} className="flex-shrink-0 mt-0.5" />
                    <span>Your secret key is stored securely and never exposed to the public. Find your keys in your <a href="https://dashboard.stripe.com/apikeys" target="_blank" rel="noopener noreferrer" className="text-orange-400 hover:underline">Stripe Dashboard</a>.</span>
                </div>
                <div className="flex gap-4">
                  <Button type="button" variant="secondary" onClick={() => setStep(1)} className="w-full text-lg py-3">
                    <ArrowLeft className="w-5 h-5" /> Back
                  </Button>
                  <Button type="submit" className="w-full text-lg py-3" isLoading={isLoading} disabled={!stripePublishableKey || !stripeSecretKey}>
                    Create My Store <Check className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};