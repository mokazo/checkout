import React, { useState } from 'react';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { mockApi } from '../../services/mockApi';
import { Merchant } from '../../types';
import { Terminal } from 'lucide-react';

interface AuthPageProps {
  onAuthSuccess: (merchant: Merchant) => void;
}

export const AuthPage: React.FC<AuthPageProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    try {
      let merchant;
      if (isLogin) {
        merchant = await mockApi.login(email, password);
      } else {
        merchant = await mockApi.register(email, password);
      }
      onAuthSuccess(merchant);
    } catch (err) {
      console.error(err);
      setError(err instanceof Error ? err.message : "An error occurred.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-black p-4">
      <div className="max-w-md w-full bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        <div className="p-8 text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
             <Terminal className="text-orange-500" size={32} />
             <h1 className="text-3xl font-bold text-white tracking-tighter">Achetele_</h1>
          </div>
          <p className="text-gray-400">The checkout solution for creators.</p>
        </div>
        
        <div className="p-8 bg-black/50">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">
            {isLogin ? 'Welcome Back' : 'Create Account'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input 
              label="Email Address" 
              type="email" 
              required 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
            />
            <Input 
              label="Password" 
              type="password" 
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
            />

            {error && <p className="text-sm text-red-400 text-center bg-red-500/10 p-2 rounded-md">{error}</p>}
            
            <Button className="w-full mt-6 py-2.5 text-base" type="submit" isLoading={isLoading}>
              {isLogin ? 'Login' : "Sign Up"}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm text-gray-500">
            {isLogin ? "No account yet?" : "Already have an account?"}
            <button 
              onClick={() => setIsLogin(!isLogin)}
              className="ml-1 text-orange-500 font-medium hover:underline focus:outline-none"
            >
              {isLogin ? "Sign up for free" : "Login"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};