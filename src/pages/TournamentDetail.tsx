import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, Trophy, Calendar, ArrowRight, Edit, Trash } from 'lucide-react';
import { fetchTournament } from '../api';
import { motion } from 'framer-motion';

export default function TournamentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState<any>(null);

  useEffect(() => {
    loadTournament();
  }, [id]);

  async function loadTournament() {
    try {
        const data = await fetchTournament(id!);
        setTournament(data);
    } catch (error) {
        console.error("Error fetching tournament:", error);
        alert("Failed to load tournament.");
        navigate('/tournaments');
    }
  }

  if (!tournament) return <div className="text-white">Loading...</div>;

  return (
    <div className="space-y-8" style={{ '--tournament-color': tournament.main_color || '#f97316' } as React.CSSProperties}>
      <button onClick={() => navigate('/tournaments')} className="flex items-center text-gray-400 hover:text-white transition group">
        <ArrowLeft size={20} className="mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Tournaments
      </button>

      <div className="glass-panel p-8 rounded-2xl shadow-lg border border-white/5 flex items-center justify-between relative overflow-hidden">
        <div 
            className="absolute top-0 left-0 w-full h-1 opacity-50" 
            style={{ background: `linear-gradient(to right, var(--tournament-color), transparent)` }}
        />
        <div 
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{ background: `radial-gradient(circle at 10% 50%, var(--tournament-color), transparent 50%)` }}
        />

        <div className="flex items-center gap-8 relative z-10">
            <div className="w-32 h-32 bg-dark-800 rounded-full flex items-center justify-center overflow-hidden border-4 border-dark-800 shadow-xl ring-4 ring-white/5" style={{ borderColor: 'var(--tournament-color)' }}>
            {tournament.logotype ? (
                <img src={tournament.logotype} alt={tournament.fullname} className="w-full h-full object-cover" />
            ) : (
                <Trophy size={48} style={{ color: 'var(--tournament-color)' }} />
            )}
            </div>
            <div>
            <h1 className="text-4xl font-bold text-white tracking-tight mb-2">{tournament.fullname}</h1>
            <div className="flex items-center gap-3">
                <span 
                    className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 font-mono text-sm font-medium"
                    style={{ color: 'var(--tournament-color)', borderColor: 'var(--tournament-color)' }}
                >
                    {tournament.shortname}
                </span>
                <span className="text-gray-500 text-sm">•</span>
                <span className="text-gray-400 font-mono text-sm">Season: <span className="text-white">{tournament.season}</span></span>
            </div>
            </div>
        </div>
      </div>

      <div className="space-y-4">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Calendar size={24} style={{ color: 'var(--tournament-color)' }} />
            Matches
        </h2>
        
        {tournament.matches && tournament.matches.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
                {tournament.matches.map((match: any) => (
                    <div 
                        key={match.id} 
                        className="bg-dark-800 p-4 rounded-2xl flex items-center gap-6 group hover:bg-dark-700 transition-all relative overflow-hidden border border-white/5"
                    >
                        {/* Date */}
                        <div className="flex flex-col items-center justify-center w-16 shrink-0 border-r border-white/5 pr-6">
                            <span className="text-2xl font-bold text-white leading-none">{new Date(match.date).getDate()}</span>
                            <span className="text-xs font-bold text-gray-500 uppercase mt-1">{new Date(match.date).toLocaleString('default', { month: 'short' })}</span>
                        </div>

                        {/* Matchup */}
                        <div className="flex-1 flex items-center justify-center gap-8 md:gap-16">
                            {/* Team A */}
                            <div className="flex flex-col items-center gap-2 group/team">
                                <div className="w-16 h-16 bg-dark-900 rounded-full flex items-center justify-center overflow-hidden border-2 border-white/5 shadow-lg relative">
                                    {match.team_a_logotype ? (
                                        <img src={match.team_a_logotype} alt={match.team_a_name} className="w-full h-full object-cover" title={match.team_a_name} />
                                    ) : (
                                        <span className="text-xl font-bold text-gray-600">{match.team_a_shortname?.[0]}</span>
                                    )}
                                </div>
                                <span className="text-sm font-medium text-gray-400">{match.team_a_shortname}</span>
                            </div>

                            {/* VS */}
                            <div className="flex flex-col items-center">
                                <span className="text-2xl font-black text-white/10">VS</span>
                                <span className="text-[10px] font-medium text-gray-600 uppercase tracking-widest mt-1">{match.code}</span>
                            </div>

                            {/* Team B */}
                            <div className="flex flex-col items-center gap-2 group/team">
                                <div className="w-16 h-16 bg-dark-900 rounded-full flex items-center justify-center overflow-hidden border-2 border-white/5 shadow-lg relative">
                                    {match.team_b_logotype ? (
                                        <img src={match.team_b_logotype} alt={match.team_b_name} className="w-full h-full object-cover" title={match.team_b_name} />
                                    ) : (
                                        <span className="text-xl font-bold text-gray-600">{match.team_b_shortname?.[0]}</span>
                                    )}
                                </div>
                                <span className="text-sm font-medium text-gray-400">{match.team_b_shortname}</span>
                            </div>
                        </div>

                        {/* Info */}
                        <div className="flex flex-col items-end justify-center w-32 shrink-0 border-l border-white/5 pl-6 gap-1">
                            <p className="text-xs font-medium text-gray-400">{match.phase}</p>
                            <p className="text-[10px] text-gray-600 uppercase tracking-wider">{match.round}</p>
                        </div>

                        {/* Actions (Hover) */}
                        <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 bg-dark-900/90 backdrop-blur-sm p-1.5 rounded-xl border border-white/10 shadow-xl z-20">
                            <Link to={`/matches/${match.id}`} className="p-2 text-orange-500 hover:text-white hover:bg-orange-500/20 rounded-lg transition-colors" title="View Details">
                                <ArrowRight size={18} />
                            </Link>
                        </div>
                    </div>
                ))}
            </div>
        ) : (
            <div className="glass-panel rounded-2xl p-12 text-center flex flex-col items-center justify-center border border-dashed border-white/10">
                <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                    <Calendar size={32} className="text-gray-600" />
                </div>
                <h3 className="text-lg font-medium text-white mb-1">No matches scheduled</h3>
                <p className="text-gray-500 text-sm">Create a new match in the Matches section.</p>
            </div>
        )}
      </div>
    </div>
  );
}
