import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { mockApi } from '../../services/mockApi';
import { Merchant } from '../../types';

interface AuthPageProps {
  onAuthSuccess: (merchant: Merchant) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      let merchant;
      if (isLogin) {
        merchant = await mockApi.login(email);
      } else {
        merchant = await mockApi.register(email);
      }
      onAuthSuccess(merchant);
    } catch (error) {
      console.error(error);
      alert("Une erreur est survenue.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden">
        <div className="bg-indigo-600 p-8 text-center">
          <h1 className="text-3xl font-bold text-white mb-2">MonApp SaaS</h1>
          <p className="text-indigo-100">La solution checkout pour les créateurs.</p>
        </div>
        
        <div className="p-8">
          <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
            {isLogin ? 'Connexion' : 'Créer un compte'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input 
              label="Adresse e-mail" 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="votre@email.com"
            />
            <Input 
              label="Mot de passe" 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />
            
            <Button className="w-full mt-6" type="submit" isLoading={isLoading}>
              {isLogin ? 'Se connecter' : "S'inscrire"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-600">
            {isLogin ? "Pas encore de compte ?" : "Déjà un compte ?"}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="ml-1 text-indigo-600 font-medium hover:underline focus:outline-none"
            >
              {isLogin ? "S'inscrire gratuitement" : "Se connecter"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};