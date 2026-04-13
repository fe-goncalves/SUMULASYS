
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Calendar, ArrowRight, Trash, Edit, Download, CheckSquare, Square, Trophy } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { fetchMatches, createMatch, fetchTeams, fetchTournaments, deleteMatch, updateMatch, fetchMatch } from '../api';
import { generateMatchesPDF } from '../utils/pdfGenerator';
import ConfirmationModal from '../components/ConfirmationModal';

export default function Matches() {
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [tournaments, setTournaments] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingMatch, setEditingMatch] = useState(null);
  const [selectedMatches, setSelectedMatches] = useState<Set<string>>(new Set());
  const [isExporting, setIsExporting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [filterDate, setFilterDate] = useState('');
  const [filterTournament, setFilterTournament] = useState('');
  
  const { register, handleSubmit, reset, setValue } = useForm();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [matchesData, teamsData, tournamentsData] = await Promise.all([
      fetchMatches(),
      fetchTeams(),
      fetchTournaments()
    ]);
    
    const sortedTeams = teamsData.sort((a: any, b: any) => (a.fullname || '').localeCompare(b.fullname || ''));
    const sortedTournaments = tournamentsData.sort((a: any, b: any) => (a.fullname || '').localeCompare(b.fullname || ''));
    
    setMatches(matchesData);
    setTeams(sortedTeams);
    setTournaments(sortedTournaments);
  }

  const filteredMatches = matches
    .filter((match: any) => {
      if (filterDate && match.date !== filterDate) return false;
      if (filterTournament && match.tournament_id !== filterTournament) return false;
      return true;
    })
    .sort((a: any, b: any) => {
      const dateDiff = new Date(b.date).getTime() - new Date(a.date).getTime();
      if (dateDiff !== 0) return dateDiff;
      return (a.phase || '').localeCompare(b.phase || '');
    });

  function openAddModal() {
    setEditingMatch(null);
    reset({
      tournament_id: '',
      date: '',
      phase: '',
      round: '',
      team_a_id: '',
      team_b_id: ''
    });
    setIsModalOpen(true);
  }

  function openEditModal(match) {
    setEditingMatch(match);
    setValue('tournament_id', match.tournament_id);
    setValue('date', match.date);
    setValue('phase', match.phase);
    setValue('round', match.round);
    setValue('team_a_id', match.team_a_id);
    setValue('team_b_id', match.team_b_id);
    setIsModalOpen(true);
  }

  async function onSubmit(data) {
    if (editingMatch) {
        await updateMatch(editingMatch.id, data);
    } else {
        await createMatch(data);
    }
    setIsModalOpen(false);
    reset();
    setEditingMatch(null);
    loadData();
  }

  function handleDeleteClick(id) {
    setItemToDelete(id);
    setDeleteModalOpen(true);
  }

  async function confirmDelete() {
    if (!itemToDelete) return;
    try {
      await deleteMatch(itemToDelete);
      loadData();
      // Remove from selection if selected
      if (selectedMatches.has(itemToDelete)) {
          const newSelection = new Set(selectedMatches);
          newSelection.delete(itemToDelete);
          setSelectedMatches(newSelection);
      }
    } catch (error: any) {
      console.error(error);
      alert('Failed to delete match: ' + error.message);
    }
    setDeleteModalOpen(false);
    setItemToDelete(null);
  }

  function toggleSelectMatch(id) {
      const newSelection = new Set(selectedMatches);
      if (newSelection.has(id)) {
          newSelection.delete(id);
      } else {
          newSelection.add(id);
      }
      setSelectedMatches(newSelection);
  }

  function toggleSelectAll() {
      if (selectedMatches.size === filteredMatches.length) {
          setSelectedMatches(new Set());
      } else {
          setSelectedMatches(new Set(filteredMatches.map((m: any) => m.id)));
      }
  }

  async function handleBatchExport() {
      if (selectedMatches.size === 0) return;
      setIsExporting(true);
      
      try {
          const fullMatches = [];
          // Fetch full details for each match sequentially to avoid overwhelming server
          for (const id of selectedMatches) {
              const fullMatch = await fetchMatch(id);
              if (fullMatch) {
                  fullMatches.push(fullMatch);
              }
          }
          
          if (fullMatches.length > 0) {
              const doc = generateMatchesPDF(fullMatches);
              doc.save("sumulas_export.pdf");
          }
          
      } catch (error) {
          console.error("Error exporting batch:", error);
          alert("Failed to export matches.");
      } finally {
          setIsExporting(false);
          setSelectedMatches(new Set()); // Clear selection after export
      }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Matches</h1>
          <p className="text-gray-400 mt-1">Schedule and manage game fixtures.</p>
        </div>
        <div className="flex flex-wrap gap-3 items-center">
            <div className="flex gap-2">
              <input 
                type="date" 
                value={filterDate}
                onChange={(e) => setFilterDate(e.target.value)}
                className="glass-input rounded-xl px-3 py-2 text-sm text-white placeholder-gray-600 focus:ring-1 focus:ring-orange-500/50"
              />
              <select 
                value={filterTournament}
                onChange={(e) => setFilterTournament(e.target.value)}
                className="glass-input rounded-xl px-3 py-2 text-sm text-white focus:ring-1 focus:ring-orange-500/50"
              >
                <option value="">All Competitions</option>
                {tournaments.map((t: any) => (
                  <option key={t.id} value={t.id}>{t.fullname}</option>
                ))}
              </select>
            </div>
            {selectedMatches.size > 0 && (
                <button
                    onClick={handleBatchExport}
                    disabled={isExporting}
                    className="bg-green-600 hover:bg-green-500 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all disabled:opacity-50 shadow-lg shadow-green-600/20 font-medium border border-green-500/20"
                >
                    <Download size={20} />
                    {isExporting ? 'Exporting...' : `Export Selected (${selectedMatches.size})`}
                </button>
            )}
            <button
            onClick={openAddModal}
            className="bg-orange-500 hover:bg-orange-600 text-black px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-orange-500/20 font-bold border border-orange-500/20"
            >
            <Plus size={20} />
            NEW MATCH
            </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4">
        {filteredMatches.map((match: any) => (
          <div 
            key={match.id} 
            className={`bg-dark-800 p-4 rounded-2xl flex items-center gap-6 group hover:bg-dark-700 transition-all relative overflow-hidden border ${selectedMatches.has(match.id) ? 'border-orange-500/50 bg-orange-500/5' : 'border-white/5'}`}
          >
            {/* Selection Overlay/Indicator */}
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500 opacity-0 transition-opacity group-hover:opacity-100" />
            {selectedMatches.has(match.id) && <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-500" />}

            {/* Checkbox */}
            <button 
                onClick={() => toggleSelectMatch(match.id)} 
                className={`shrink-0 text-gray-500 hover:text-white transition-colors z-10 ${selectedMatches.has(match.id) ? 'text-orange-500' : ''}`}
            >
                {selectedMatches.has(match.id) ? <CheckSquare size={20} /> : <Square size={20} />}
            </button>

            {/* Date */}
            <div className="flex flex-col items-center justify-center w-16 shrink-0 border-r border-white/5 pr-6">
                <span className="text-2xl font-bold text-white leading-none">{new Date(match.date).getDate()}</span>
                <span className="text-xs font-bold text-gray-500 uppercase mt-1">{new Date(match.date).toLocaleString('default', { month: 'short' })}</span>
            </div>

            {/* Matchup - Center Stage */}
            <div className="flex-1 flex items-center justify-center gap-8 md:gap-16">
                {/* Team A */}
                <div className="flex flex-col items-center gap-2 group/team">
                    <div className="w-16 h-16 bg-dark-900 rounded-full flex items-center justify-center overflow-hidden border-2 border-white/5 shadow-lg group-hover/team:border-orange-500/50 transition-all relative">
                        {match.team_a_logotype ? (
                            <img src={match.team_a_logotype} alt={match.team_a_name} className="w-full h-full object-cover" title={match.team_a_name} />
                        ) : (
                            <span className="text-xl font-bold text-gray-600">{match.team_a_shortname?.[0]}</span>
                        )}
                    </div>
                </div>

                {/* VS */}
                <div className="flex flex-col items-center">
                    <span className="text-2xl font-black text-white/10">VS</span>
                    <span className="text-[10px] font-medium text-gray-600 uppercase tracking-widest mt-1">{match.code}</span>
                </div>

                {/* Team B */}
                <div className="flex flex-col items-center gap-2 group/team">
                    <div className="w-16 h-16 bg-dark-900 rounded-full flex items-center justify-center overflow-hidden border-2 border-white/5 shadow-lg group-hover/team:border-orange-500/50 transition-all relative">
                        {match.team_b_logotype ? (
                            <img src={match.team_b_logotype} alt={match.team_b_name} className="w-full h-full object-cover" title={match.team_b_name} />
                        ) : (
                            <span className="text-xl font-bold text-gray-600">{match.team_b_shortname?.[0]}</span>
                        )}
                    </div>
                </div>
            </div>

            {/* Tournament & Info */}
            <div className="flex flex-col items-end justify-center w-32 shrink-0 border-l border-white/5 pl-6 gap-2">
                <div className="w-8 h-8 rounded-lg bg-dark-900 flex items-center justify-center overflow-hidden border border-white/10" title={match.tournament_name}>
                    {match.tournament_logotype ? (
                        <img src={match.tournament_logotype} alt={match.tournament_name} className="w-full h-full object-cover" />
                    ) : (
                        <Trophy size={14} className="text-gray-500" />
                    )}
                </div>
                <div className="text-right">
                    <p className="text-xs font-medium text-gray-400">{match.phase}</p>
                    <p className="text-[10px] text-gray-600 uppercase tracking-wider">{match.round}</p>
                </div>
            </div>

            {/* Actions (Hover) */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-all translate-x-4 group-hover:translate-x-0 bg-dark-900/90 backdrop-blur-sm p-1.5 rounded-xl border border-white/10 shadow-xl z-20">
                <Link to={`/matches/${match.id}`} className="p-2 text-orange-500 hover:text-white hover:bg-orange-500/20 rounded-lg transition-colors" title="View Details">
                    <ArrowRight size={18} />
                </Link>
                <button 
                    onClick={async (e) => {
                        e.preventDefault();
                        const fullMatch = await fetchMatch(match.id);
                        if (fullMatch) {
                            const doc = generateMatchesPDF([fullMatch]);
                            doc.save(`sumula_${match.id}.pdf`);
                        }
                    }} 
                    className="p-2 text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-lg transition-colors" 
                    title="Print Sumula"
                >
                    <Download size={18} />
                </button>
            </div>
          </div>
        ))}

        {filteredMatches.length === 0 && (
          <div className="glass-panel rounded-2xl p-12 text-center flex flex-col items-center justify-center border border-dashed border-white/10">
            <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4">
                <Calendar size={32} className="text-gray-600" />
            </div>
            <h3 className="text-lg font-medium text-white mb-1">No matches found</h3>
            <p className="text-gray-500 text-sm">Adjust filters or create a new match to get started.</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="glass-panel rounded-2xl w-full max-w-md shadow-2xl relative flex flex-col max-h-[90vh]">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-orange-600 z-10" />
            
            <div className="p-8 overflow-y-auto custom-scrollbar">
              <h2 className="text-2xl font-bold mb-6 text-white">{editingMatch ? 'Edit' : 'Create New'} Match</h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Tournament</label>
                  <div className="relative">
                    <select {...register('tournament_id', { required: true })} className="w-full glass-input rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:ring-1 focus:ring-orange-500/50 appearance-none">
                      <option value="" className="bg-dark-900 text-gray-400">Select Tournament</option>
                      {tournaments.map(t => <option key={t.id} value={t.id} className="bg-dark-900">{t.fullname}</option>)}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Date</label>
                    <input type="date" {...register('date', { required: true })} className="w-full glass-input rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:ring-1 focus:ring-orange-500/50" />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Phase</label>
                    <input {...register('phase', { required: true })} className="w-full glass-input rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:ring-1 focus:ring-orange-500/50" placeholder="Group Stage" />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Round</label>
                  <input {...register('round', { required: true })} className="w-full glass-input rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:ring-1 focus:ring-orange-500/50" placeholder="Round 1" />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Team A</label>
                    <div className="relative">
                      <select {...register('team_a_id', { required: true })} className="w-full glass-input rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:ring-1 focus:ring-orange-500/50 appearance-none">
                        <option value="" className="bg-dark-900 text-gray-400">Select Team</option>
                        {teams.map(t => <option key={t.id} value={t.id} className="bg-dark-900">{t.fullname}</option>)}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Team B</label>
                    <div className="relative">
                      <select {...register('team_b_id', { required: true })} className="w-full glass-input rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:ring-1 focus:ring-orange-500/50 appearance-none">
                        <option value="" className="bg-dark-900 text-gray-400">Select Team</option>
                        {teams.map(t => <option key={t.id} value={t.id} className="bg-dark-900">{t.fullname}</option>)}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-white/5">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">Cancel</button>
                  <button type="submit" className="px-6 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg transition-all shadow-lg shadow-orange-600/20 font-medium">Save</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Delete Match"
        message="Are you sure you want to delete this match? This action cannot be undone."
        confirmText="Delete"
        isDestructive={true}
      />
    </div>
  );
}
