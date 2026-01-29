import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { mockApi } from '../../services/mockApi';
import { Merchant } from '../../types';
import { Store, Check, ArrowRight, Globe } from 'lucide-react';
import { INITIAL_SHIPPING_METHODS } from '../../constants';

interface OnboardingPageProps {
  merchant: Merchant;
  onComplete: (updatedMerchant: Merchant) => void;
}

export const OnboardingPage: React.FC<OnboardingPageProps> = ({ merchant, onComplete }) => {
  const [step, setStep] = useState(1);
  const [companyName, setCompanyName] = useState('');
  const [subdomain, setSubdomain] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const name = e.target.value;
    setCompanyName(name);
    // Auto-generate subdomain from name
    const generated = name.toLowerCase().replace(/[^a-z0-9]/g, '');
    setSubdomain(generated);
  };

  const handleSubdomainChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSubdomain(e.target.value.toLowerCase().replace(/[^a-z0-9]/g, ''));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      // 1. Update merchant with shop details
      const updatedMerchant = await mockApi.updateMerchant({
        companyName,
        subdomain,
        // Set default shipping methods for new shops so checkout works immediately
        shippingMethods: INITIAL_SHIPPING_METHODS
      });
      
      // 2. Finish
      onComplete(updatedMerchant);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Progress */}
        <div className="flex justify-center mb-8">
            <div className="flex items-center gap-2">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step === 1 ? 'bg-indigo-600 text-white' : 'bg-green-500 text-white'}`}>1</span>
                <span className="text-gray-900 font-medium">Configuration</span>
            </div>
            <div className="w-16 h-0.5 bg-gray-300 mx-4 self-center"></div>
            <div className="flex items-center gap-2">
                <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold ${step === 2 ? 'bg-indigo-600 text-white' : 'bg-gray-200 text-gray-500'}`}>2</span>
                <span className={`${step === 2 ? 'text-gray-900 font-medium' : 'text-gray-400'}`}>Terminé</span>
            </div>
        </div>

        <div className="bg-white rounded-2xl shadow-lg p-8 md:p-10 animate-fade-in">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-4">
               <Store className="w-8 h-8 text-indigo-600" />
            </div>
            <h1 className="text-2xl font-bold text-gray-900">Bienvenue, configurons votre boutique</h1>
            <p className="text-gray-500 mt-2">Cela ne prendra qu'une minute pour lancer votre checkout.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Input 
                label="Nom de votre boutique" 
                placeholder="Ex: Ma Super Boutique"
                value={companyName}
                onChange={handleNameChange}
                required
                className="text-lg"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Votre adresse web (Sous-domaine)</label>
              <div className="flex rounded-lg shadow-sm">
                <div className="relative flex-grow focus-within:z-10">
                   <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <Globe className="h-5 w-5 text-gray-400" />
                   </div>
                   <input
                     type="text"
                     className="focus:ring-indigo-500 focus:border-indigo-500 block w-full rounded-none rounded-l-md pl-10 sm:text-sm border-gray-300 py-3"
                     placeholder="maboutique"
                     value={subdomain}
                     onChange={handleSubdomainChange}
                     required
                   />
                </div>
                <span className="inline-flex items-center px-4 rounded-r-md border border-l-0 border-gray-300 bg-gray-50 text-gray-500 font-medium sm:text-sm">
                  .achetele.com
                </span>
              </div>
              <p className="mt-2 text-sm text-gray-500">Votre checkout sera accessible à cette adresse.</p>
            </div>

            {subdomain && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-lg p-4 flex items-start gap-3">
                    <Check className="w-5 h-5 text-indigo-600 mt-0.5" />
                    <div>
                        <p className="text-indigo-900 font-medium">URL Disponible</p>
                        <p className="text-indigo-700 text-sm">https://{subdomain}.achetele.com</p>
                    </div>
                </div>
            )}

            <Button type="submit" className="w-full text-lg py-3" isLoading={isLoading}>
              Créer ma boutique <ArrowRight className="w-5 h-5" />
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
};