import React, { useState } from 'react';
import { supabase } from '../supabase';
import { LogIn, Trophy } from 'lucide-react';
import { usePageTitle } from '../hooks/usePageTitle';

export default function Login() {
  usePageTitle('Login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro durante a autenticação.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen bg-dark-950 text-white overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,140,0,0.16),_transparent_20%),radial-gradient(circle_at_80%_10%,_rgba(255,95,0,0.08),_transparent_25%)] pointer-events-none" />
      <div className="relative z-10 flex min-h-screen items-center justify-center px-4 py-12">
        <div className="relative w-full max-w-md">
          <div className="absolute -right-16 -top-16 w-56 h-56 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />
          <div className="absolute -left-16 bottom-10 w-72 h-72 rounded-full bg-orange-500/10 blur-3xl pointer-events-none" />

          <div className="glass-panel rounded-[32px] border border-white/10 shadow-2xl shadow-orange-500/10 overflow-hidden">
            <div className="p-10 space-y-8">
              <div className="space-y-4 text-center">
                <div className="inline-flex items-center justify-center gap-2 rounded-full bg-white/5 px-4 py-2 text-sm font-semibold tracking-wide text-orange-300 ring-1 ring-white/10">
                  <Trophy className="w-4 h-4 text-orange-400" />
                  SUMULA<span className="text-orange-500">SYS</span>
                </div>
                <div>
                  <h2 className="text-3xl font-extrabold tracking-tight text-white">
                    {isLogin ? 'Entrar no Sistema' : 'Criar Nova Conta'}
                  </h2>
                  <p className="mt-2 text-sm text-gray-400">
                    Acesse o painel principal para gerenciar equipes, atletas e partidas.
                  </p>
                </div>
              </div>

              <form className="space-y-6" onSubmit={handleAuth}>
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-300" htmlFor="email">
                    E-mail
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    className="glass-input w-full rounded-2xl px-4 py-3 text-white placeholder-gray-500 focus:ring-1 focus:ring-orange-500/50"
                    placeholder="seu@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </div>

                <div className="space-y-4">
                  <label className="block text-sm font-medium text-gray-300" htmlFor="password">
                    Senha
                  </label>
                  <input
                    id="password"
                    type="password"
                    required
                    className="glass-input w-full rounded-2xl px-4 py-3 text-white placeholder-gray-500 focus:ring-1 focus:ring-orange-500/50"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>

                {error && <div className="text-center text-sm text-red-300">{error}</div>}

                <button
                  type="submit"
                  disabled={loading}
                  className="group relative w-full inline-flex items-center justify-center rounded-2xl bg-orange-500 px-4 py-3 text-sm font-semibold text-black transition duration-200 hover:bg-orange-400 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? 'Aguarde...' : (
                    <><LogIn className="w-5 h-5 mr-2" /> Entrar</>
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
