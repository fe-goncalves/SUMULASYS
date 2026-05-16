import React, { useState, useEffect } from 'react';
import { Plus, Trophy, Edit, Trash } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { fetchTournaments, createTournament, updateTournament, deleteTournament } from '../api';
import ConfirmationModal from '../components/ConfirmationModal';
import SummaryConfirmationModal from '../components/SummaryConfirmationModal';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

export default function Tournaments() {
  usePageTitle('Tournaments');
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTournament, setEditingTournament] = useState(null);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [pendingData, setPendingData] = useState(null);

  const { register, handleSubmit, reset, setValue } = useForm();

  useEffect(() => {
    if (user?.id) {
      loadTournaments();
    }
  }, [user?.id]);

  async function loadTournaments() {
    if (!user?.id) return;
    try {
      const data = await fetchTournaments(user.id);
      const sortedTournaments = data.sort((a: any, b: any) => (a.fullname || '').localeCompare(b.fullname || ''));
      setTournaments(sortedTournaments);
    } catch (error: any) {
      console.error("Failed to load tournaments:", error);
      alert("Failed to load tournaments: " + error.message);
    }
  }

  function openAddModal() {
    setEditingTournament(null);
    reset({
      fullname: '',
      shortname: '',
      season: '',
      main_color: '#000000',
      logotype: null
    });
    setIsModalOpen(true);
  }

  function openEditModal(tournament, e) {
    e.preventDefault();
    e.stopPropagation();
    setEditingTournament(tournament);
    setValue('fullname', tournament.fullname);
    setValue('shortname', tournament.shortname);
    setValue('season', tournament.season);
    setValue('main_color', tournament.main_color);
    setIsModalOpen(true);
  }

  function handleDeleteClick(id, e) {
    e.preventDefault();
    e.stopPropagation();
    setItemToDelete(id);
    setDeleteModalOpen(true);
  }

  async function confirmDelete() {
    if (!itemToDelete) return;
    try {
      await deleteTournament(itemToDelete);
      loadTournaments();
    } catch (error: any) {
      console.error(error);
      alert('Failed to delete tournament: ' + error.message);
    }
    setDeleteModalOpen(false);
    setItemToDelete(null);
  }

  async function onSubmit(data) {
    // Generate ID for new tournaments if not present
    if (!editingTournament) {
        data.id = `${data.fullname} ${data.season}`.toUpperCase();
    }

    const file = data.logotype[0];
    
    const prepareSummary = (finalData) => {
        setPendingData(finalData);
        setSummaryModalOpen(true);
    };

    if (file) {
        const reader = new FileReader();
        reader.onloadend = () => {
            const processedData = { ...data, logotype: reader.result };
            prepareSummary(processedData);
        };
        reader.readAsDataURL(file);
    } else {
        if (editingTournament) {
            data.logotype = editingTournament.logotype; // Keep existing logo
        } else {
            data.logotype = null;
        }
        prepareSummary(data);
    }
  }

  async function handleConfirmSave() {
    if (!pendingData) return;
    try {
        if (editingTournament) {
            await updateTournament(editingTournament.id, pendingData);
        } else {
            await createTournament(pendingData);
        }
        setIsModalOpen(false);
        reset();
        setEditingTournament(null);
        loadTournaments();
    } catch (error: any) {
        console.error(error);
        alert('Failed to save tournament: ' + error.message);
    }
    setSummaryModalOpen(false);
    setPendingData(null);
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Tournaments</h1>
          <p className="text-gray-400 mt-1">Manage leagues, cups, and seasons.</p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-orange-500 hover:bg-orange-600 text-black px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-orange-500/20 font-bold border border-orange-500/20"
        >
          <Plus size={20} />
          ADD TOURNAMENT
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tournaments.map((tournament) => (
          <Link to={`/tournaments/${tournament.id}`} key={tournament.id}>
            <motion.div 
                whileHover={{ scale: 1.02 }}
                className="bg-dark-800 p-6 rounded-2xl shadow-lg border border-white/5 transition-all duration-300 flex flex-col items-center text-center relative group overflow-hidden h-full"
                style={{
                    '--hover-color': tournament.main_color || '#f97316',
                } as React.CSSProperties}
            >
                {/* Dynamic Hover Border & Glow */}
                <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-[var(--hover-color)] transition-colors duration-300 pointer-events-none" />
                <div className="absolute inset-0 bg-[var(--hover-color)] opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none" />

                <div className="absolute top-4 right-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
                    <button onClick={(e) => openEditModal(tournament, e)} className="p-2 text-orange-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors">
                        <Edit size={16} />
                    </button>
                    <button onClick={(e) => handleDeleteClick(tournament.id, e)} className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors">
                        <Trash size={16} />
                    </button>
                </div>
                
                <div className="w-24 h-24 bg-dark-900 rounded-full mb-5 flex items-center justify-center overflow-hidden ring-4 ring-dark-900 group-hover:ring-[var(--hover-color)] transition-all shadow-inner relative z-10 group-hover:shadow-[0_0_20px_var(--hover-color)]">
                {tournament.logotype ? (
                    <img src={tournament.logotype} alt={tournament.fullname} className="w-full h-full object-cover" />
                ) : (
                    <Trophy size={40} className="text-gray-600 group-hover:text-[var(--hover-color)] transition-colors" />
                )}
                </div>
                
                <div className="relative z-10">
                    <h3 className="text-xl font-bold text-white group-hover:text-[var(--hover-color)] transition-colors mb-1">{tournament.fullname}</h3>
                    <p className="text-gray-400 text-sm font-medium">{tournament.shortname} • <span className="text-orange-500">{tournament.season}</span></p>
                </div>
                
                <div className="mt-6 w-full pt-4 border-t border-white/5 flex justify-between items-center relative z-10">
                <div className="flex items-center gap-2">
                    <div className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: tournament.main_color }}></div>
                    <span className="text-xs text-gray-500 uppercase tracking-wider font-medium">Color</span>
                </div>
                <div className="px-2.5 py-1 bg-dark-900 rounded-lg text-xs font-mono text-gray-400 border border-white/5">
                    {tournament.id}
                </div>
                </div>
            </motion.div>
          </Link>
        ))}
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="glass-panel rounded-2xl w-full max-w-md shadow-2xl relative flex flex-col max-h-[90vh]">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-orange-600 z-10" />
            
            <div className="p-8 overflow-y-auto custom-scrollbar">
              <h2 className="text-2xl font-bold mb-6 text-white">{editingTournament ? 'Edit' : 'Add'} Tournament</h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Full Name</label>
                  <input {...register('fullname', { required: true })} className="w-full glass-input rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:ring-1 focus:ring-orange-500/50" placeholder="Champions League" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Short Name</label>
                  <input {...register('shortname', { required: true })} className="w-full glass-input rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:ring-1 focus:ring-orange-500/50" placeholder="UCL" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Season (e.g., 26')</label>
                  <input {...register('season', { required: true })} className="w-full glass-input rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:ring-1 focus:ring-orange-500/50" placeholder="26'" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Main Color</label>
                  <div className="flex items-center gap-3">
                      <input type="color" {...register('main_color')} className="w-12 h-12 bg-transparent border-none rounded-xl cursor-pointer" />
                      <input 
                          type="text" 
                          {...register('main_color')} 
                          className="glass-input rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:ring-1 focus:ring-orange-500/50 uppercase font-mono w-32" 
                          placeholder="#000000"
                      />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Logotype (PNG)</label>
                  <div className="relative group">
                      <input type="file" accept="image/png" {...register('logotype')} className="w-full glass-input rounded-xl px-4 py-3 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-500/10 file:text-orange-400 hover:file:bg-orange-500/20 transition-all cursor-pointer" />
                  </div>
                  {editingTournament && <p className="text-xs text-gray-500 mt-2 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block"></span> Leave empty to keep current logo</p>}
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
        title="Delete Tournament"
        message="Are you sure you want to delete this tournament? This will also delete all associated matches. This action cannot be undone."
        confirmText="Delete"
        isDestructive={true}
      />
      
      <SummaryConfirmationModal
        isOpen={summaryModalOpen}
        onClose={() => setSummaryModalOpen(false)}
        onConfirm={handleConfirmSave}
        title="Confirm Tournament Details"
        data={pendingData || {}}
      />
    </div>
  );
}
