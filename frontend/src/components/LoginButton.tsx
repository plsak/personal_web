import React from 'react';
import { useInternetIdentity } from '../hooks/useInternetIdentity';
import { useQueryClient } from '@tanstack/react-query';
import { LogIn, LogOut, Loader2 } from 'lucide-react';

export default function LoginButton() {
  const { login, clear, loginStatus, identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  const isAuthenticated = !!identity;
  const disabled = loginStatus === 'logging-in';

  const handleAuth = async () => {
    if (isAuthenticated) {
      await clear();
      queryClient.clear();
    } else {
      try {
        await login();
      } catch (error: any) {
        console.error('Login error:', error);
        if (error.message === 'User is already authenticated') {
          await clear();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  return (
    <button
      onClick={handleAuth}
      disabled={disabled}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-colors font-medium ${
        isAuthenticated
          ? 'bg-slate-700 hover:bg-slate-600 text-slate-200'
          : 'bg-blue-600 hover:bg-blue-700 text-white'
      } disabled:opacity-50 disabled:cursor-not-allowed`}
    >
      {loginStatus === 'logging-in' ? (
        <Loader2 className="w-4 h-4 animate-spin" />
      ) : isAuthenticated ? (
        <LogOut className="w-4 h-4" />
      ) : (
        <LogIn className="w-4 h-4" />
      )}
      {loginStatus === 'logging-in' ? 'Logging in...' : isAuthenticated ? 'Logout' : 'Admin'}
    </button>
  );
}
