
import React, { useState } from 'react';
import { Lock, User, ArrowRight, LayoutDashboard, Mail, ArrowLeft, CheckCircle, AlertTriangle, ShieldAlert, Eye, EyeOff } from 'lucide-react';
import { getUsers, checkLicenseValidity } from '../utils';
import { User as UserType } from '../types';

interface LoginProps {
  onLogin: (user: UserType) => void;
}

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  // View state: 'login' or 'forgot'
  const [view, setView] = useState<'login' | 'forgot'>('login');

  // Login form state
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  // Forgot password form state
  const [resetEmail, setResetEmail] = useState('');
  const [resetStatus, setResetStatus] = useState<'idle' | 'loading' | 'success'>('idle');

  const handleLoginSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    // Simulação de delay de rede para realismo
    setTimeout(() => {
      const users = getUsers();
      const user = users.find(u => u.username.toLowerCase() === email.toLowerCase());

      if (user && user.password === password) {
          if (checkLicenseValidity(user)) {
             onLogin(user);
          } else {
             setError('Sua licença expirou. Contate o administrador para renovar o acesso.');
             setLoading(false);
          }
      } else {
        setError('Usuário ou senha incorretos.');
        setLoading(false);
      }
    }, 800);
  };

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setResetStatus('loading');
    
    // Simulate API call for password reset
    setTimeout(() => {
        setResetStatus('success');
    }, 1500);
  };

  const isLicenseError = error.toLowerCase().includes('licença');

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl overflow-hidden animate-fade-in-up">
        <div className="bg-slate-900 p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-indigo-500 via-slate-900 to-slate-900"></div>
          <div className="relative z-10">
            <div className="w-16 h-16 bg-indigo-600 rounded-2xl mx-auto flex items-center justify-center mb-4 shadow-lg shadow-indigo-900/50">
              <LayoutDashboard className="text-white" size={32} />
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Insight Sales</h1>
            <p className="text-slate-400 mt-2 text-sm">Acesse seu dashboard estratégico</p>
          </div>
        </div>

        <div className="p-8">
          {view === 'login' ? (
            <form onSubmit={handleLoginSubmit} className="space-y-6 animate-fade-in">
              {/* License Expired Clear Alert */}
              {error && isLicenseError && (
                <div className="p-4 bg-rose-600 border border-rose-700 text-white rounded-xl flex flex-col items-center text-center gap-3 animate-pulse shadow-lg">
                  <ShieldAlert size={32} className="text-rose-100" />
                  <div className="space-y-1">
                    <p className="font-bold text-sm uppercase tracking-wider">Acesso Bloqueado</p>
                    <p className="text-xs text-rose-100 font-medium">{error}</p>
                  </div>
                </div>
              )}

              {/* Standard Error */}
              {error && !isLicenseError && (
                <div className="p-3 bg-rose-50 border border-rose-100 text-rose-600 text-sm rounded-lg flex items-center gap-2">
                  <AlertTriangle size={18} />
                  {error}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Usuário</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <User size={18} className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  </div>
                  <input
                    type="text"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none bg-slate-50 focus:bg-white text-slate-900 font-medium"
                    placeholder="Seu usuário"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Senha</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <Lock size={18} className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                  </div>
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-10 pr-12 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none bg-slate-50 focus:bg-white text-slate-900 font-medium"
                    placeholder="Sua senha"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-indigo-600 transition-colors focus:outline-none"
                    aria-label={showPassword ? "Esconder senha" : "Mostrar senha"}
                  >
                    {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
                <div className="flex justify-end mt-2">
                  <button 
                    type="button"
                    onClick={() => {
                        setView('forgot');
                        setError('');
                        setResetStatus('idle');
                        setResetEmail('');
                    }}
                    className="text-sm text-indigo-600 hover:text-indigo-800 font-medium transition-colors"
                  >
                    Esqueceu a senha?
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg shadow-indigo-200"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Entrar no Sistema
                    <ArrowRight size={18} />
                  </>
                )}
              </button>
            </form>
          ) : (
            <div className="space-y-6 animate-fade-in">
                {resetStatus === 'success' ? (
                    <div className="text-center space-y-4">
                        <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce-short">
                            <CheckCircle size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-800">E-mail Enviado!</h3>
                        <p className="text-slate-600">
                            Instruções para redefinição de senha foram enviadas para seu e-mail.
                        </p>
                        <div className="bg-slate-50 p-3 rounded-lg border border-slate-200 text-sm text-slate-500">
                             Verifique sua caixa de entrada e spam.
                        </div>
                        <button
                            onClick={() => setView('login')}
                            className="w-full mt-4 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-3 px-4 rounded-lg transition-all shadow-md"
                        >
                            Voltar ao Login
                        </button>
                    </div>
                ) : (
                    <form onSubmit={handleResetSubmit} className="space-y-6">
                        <div className="text-center mb-6">
                            <div className="w-12 h-12 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3">
                                <Lock size={20} />
                            </div>
                            <h3 className="text-lg font-bold text-slate-800">Redefinir Senha</h3>
                            <p className="text-sm text-slate-500 mt-1">
                                Digite seu e-mail cadastrado para receber as instruções de recuperação.
                            </p>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-slate-700 mb-2">E-mail</label>
                            <div className="relative group">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <Mail size={18} className="text-slate-400 group-focus-within:text-indigo-500 transition-colors" />
                                </div>
                                <input
                                    type="email"
                                    value={resetEmail}
                                    onChange={(e) => setResetEmail(e.target.value)}
                                    className="block w-full pl-10 pr-3 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none bg-slate-50 focus:bg-white"
                                    placeholder="seu@email.com"
                                    required
                                />
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={resetStatus === 'loading'}
                            className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-3 px-4 rounded-lg transition-all transform active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed shadow-md hover:shadow-lg shadow-indigo-200"
                        >
                            {resetStatus === 'loading' ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                'Enviar Instruções'
                            )}
                        </button>
                        
                        <button 
                            type="button"
                            onClick={() => setView('login')}
                            className="w-full flex items-center justify-center gap-2 text-slate-500 hover:text-slate-700 font-medium py-2 transition-colors"
                        >
                            <ArrowLeft size={16} />
                            Voltar
                        </button>
                    </form>
                )}
            </div>
          )}

          <div className="mt-8 pt-6 border-t border-slate-100 text-center">
            <p className="text-xs text-slate-400">
              Ambiente Seguro • Versão 1.1.1
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
