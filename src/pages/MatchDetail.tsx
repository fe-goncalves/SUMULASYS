import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Download, Edit, Trash } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { fetchMatch, updateMatch, deleteMatch, fetchTeams, fetchTournaments } from '../api';
import { generateMatchesPDF } from '../utils/pdfGenerator';
import ConfirmationModal from '../components/ConfirmationModal';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAuth } from '../contexts/AuthContext';

export default function MatchDetail() {
  usePageTitle('Match Detail');
  const { user } = useAuth();
  const { id } = useParams();
  const navigate = useNavigate();
  const [match, setMatch] = useState<any>(null);
  const [teams, setTeams] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  
  const { register, handleSubmit, reset, setValue } = useForm();

  useEffect(() => {
    if (user?.id) {
      loadData();
    }
  }, [id, user?.id]);

  async function loadData() {
    if (!user?.id) return;
    const [matchData, teamsData, tournamentsData] = await Promise.all([
        fetchMatch(id!),
        fetchTeams(user.id),
        fetchTournaments(user.id)
    ]);
    setMatch(matchData);
    setTeams(teamsData);
    setTournaments(tournamentsData);
  }

  const generatePDF = () => {
    if (!match) return;
    const doc = generateMatchesPDF([match]);
    doc.save(`sumula_${match.id}.pdf`);
  };

  function openEditModal() {
    setValue('tournament_id', match.tournament_id);
    setValue('date', match.date);
    setValue('phase', match.phase);
    setValue('round', match.round);
    setValue('team_a_id', match.team_a_id);
    setValue('team_b_id', match.team_b_id);
    setIsEditModalOpen(true);
  }

  async function onEditSubmit(data) {
    try {
        await updateMatch(match.id, data);
        setIsEditModalOpen(false);
        loadData();
    } catch (error) {
        console.error("Error updating match:", error);
        alert("Failed to update match.");
    }
  }

  async function confirmDelete() {
    try {
        await deleteMatch(match.id);
        navigate('/matches');
    } catch (error) {
        console.error("Error deleting match:", error);
        alert("Failed to delete match.");
    }
  }

  if (!match) return <div className="text-white">Loading...</div>;

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <button onClick={() => navigate('/matches')} className="flex items-center text-gray-400 hover:text-white transition group">
            <ArrowLeft size={20} className="mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Matches
        </button>
        <div className="flex gap-3">
            <button
                onClick={openEditModal}
                className="bg-dark-800 hover:bg-dark-700 text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all border border-white/10"
            >
                <Edit size={18} />
                Edit Match
            </button>
            <button
                onClick={() => setDeleteModalOpen(true)}
                className="bg-red-500/10 hover:bg-red-500/20 text-red-500 px-4 py-2 rounded-xl flex items-center gap-2 transition-all border border-red-500/20"
            >
                <Trash size={18} />
                Delete Match
            </button>
        </div>
      </div>

      <div className="glass-panel p-8 rounded-2xl shadow-lg border border-white/5 relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-orange-600 opacity-50" />
        
        <div className="flex justify-between items-start relative z-10">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 tracking-tight">{match.code}</h1>
            <div className="flex items-center gap-3 text-gray-400">
                <span className="font-medium text-white">{new Date(match.date).toLocaleDateString()}</span>
                <span>•</span>
                <span>{match.tournament_name}</span>
            </div>
            <div className="mt-2 inline-flex items-center px-3 py-1 rounded-full bg-white/5 border border-white/10 text-orange-400 text-sm font-medium">
                {match.phase} - {match.round}
            </div>
          </div>
          <button
            onClick={generatePDF}
            className="bg-orange-600 hover:bg-orange-500 text-white px-6 py-3 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-orange-600/20 font-medium border border-orange-500/20"
          >
            <Download size={20} />
            Export PDF
          </button>
        </div>

        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
          <div className="text-center p-8 glass-panel rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors group">
            <div className="w-32 h-32 bg-dark-800 rounded-full mx-auto mb-6 flex items-center justify-center shadow-xl overflow-hidden ring-4 ring-white/5 group-hover:ring-orange-500/20 transition-all">
              {match.team_a_logotype ? (
                <img src={match.team_a_logotype} alt={match.team_a_name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-bold text-gray-600">{match.team_a_shortname?.[0]}</span>
              )}
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">{match.team_a_name}</h2>
            <p className="text-gray-400 font-medium">{match.team_a_shortname}</p>
          </div>

          <div className="text-center relative">
            <div className="text-6xl font-black text-white/10 select-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">VS</div>
            <div className="text-2xl font-bold text-orange-500 relative z-10">VS</div>
          </div>

          <div className="text-center p-8 glass-panel rounded-2xl border border-white/5 bg-white/5 hover:bg-white/10 transition-colors group">
            <div className="w-32 h-32 bg-dark-800 rounded-full mx-auto mb-6 flex items-center justify-center shadow-xl overflow-hidden ring-4 ring-white/5 group-hover:ring-orange-500/20 transition-all">
              {match.team_b_logotype ? (
                <img src={match.team_b_logotype} alt={match.team_b_name} className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-bold text-gray-600">{match.team_b_shortname?.[0]}</span>
              )}
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">{match.team_b_name}</h2>
            <p className="text-gray-400 font-medium">{match.team_b_shortname}</p>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="glass-panel p-8 rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-orange-600" />
            
            <h2 className="text-2xl font-bold mb-6 text-white">Edit Match</h2>
            <form onSubmit={handleSubmit(onEditSubmit)} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Tournament</label>
                <div className="relative">
                  <select {...register('tournament_id', { required: true })} className="w-full glass-input rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:ring-1 focus:ring-orange-500/50 appearance-none">
                    <option value="" className="bg-dark-900 text-gray-400">Select Tournament</option>
                    {tournaments.map((t: any) => <option key={t.id} value={t.id} className="bg-dark-900">{t.fullname}</option>)}
                  </select>
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Date</label>
                  <input type="date" {...register('date', { required: true })} className="w-full glass-input rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:ring-1 focus:ring-orange-500/50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Phase</label>
                  <input {...register('phase', { required: true })} className="w-full glass-input rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:ring-1 focus:ring-orange-500/50" />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Round</label>
                <input {...register('round', { required: true })} className="w-full glass-input rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:ring-1 focus:ring-orange-500/50" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Team A</label>
                  <div className="relative">
                    <select {...register('team_a_id', { required: true })} className="w-full glass-input rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:ring-1 focus:ring-orange-500/50 appearance-none">
                      <option value="" className="bg-dark-900 text-gray-400">Select Team</option>
                      {teams.map((t: any) => <option key={t.id} value={t.id} className="bg-dark-900">{t.fullname}</option>)}
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Team B</label>
                  <div className="relative">
                    <select {...register('team_b_id', { required: true })} className="w-full glass-input rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:ring-1 focus:ring-orange-500/50 appearance-none">
                      <option value="" className="bg-dark-900 text-gray-400">Select Team</option>
                      {teams.map((t: any) => <option key={t.id} value={t.id} className="bg-dark-900">{t.fullname}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-white/5">
                <button type="button" onClick={() => setIsEditModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg transition-all shadow-lg shadow-orange-600/20 font-medium">Save Changes</button>
              </div>
            </form>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Match"
        message="Are you sure you want to delete this match? This action cannot be undone."
        confirmText="Delete Match"
        isDestructive={true}
      />
    </div>
  );
}
