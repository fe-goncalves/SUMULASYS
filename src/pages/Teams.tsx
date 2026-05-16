import React, { useState, useEffect } from 'react';
import { Plus } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { fetchTeams, createTeam, deleteTeam } from '../api';
import ConfirmationModal from '../components/ConfirmationModal';
import SummaryConfirmationModal from '../components/SummaryConfirmationModal';
import { motion } from 'framer-motion';
import TeamCard from '../components/TeamCard';
import { getDominantColor } from '../utils/colorExtractor';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAuth } from '../contexts/AuthContext';

export default function Teams() {
  usePageTitle('Teams');
  const { user } = useAuth();
  const [teams, setTeams] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [teamToDelete, setTeamToDelete] = useState(null);
  
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [pendingData, setPendingData] = useState(null);

  const { register, handleSubmit, reset } = useForm();
  const { setCacheData, getCacheData, isCacheFresh, invalidateCache } = useCache();

  useEffect(() => {
    if (user?.id) {
      loadTeams();
    }
  }, [user?.id]);

  async function loadTeams() {
    if (!user?.id) return;
    let data = getCacheData('teams');
    if (!data || !isCacheFresh('teams')) {
      data = await fetchTeams(user.id);
      setCacheData('teams', data);
    }
    const sortedTeams = data.sort((a: any, b: any) => (a.fullname || '').localeCompare(b.fullname || ''));
    setTeams(sortedTeams);
  }

  function handleDeleteClick(id, e) {
    e.preventDefault();
    e.stopPropagation();
    setTeamToDelete(id);
    setDeleteModalOpen(true);
  }

  async function confirmDelete() {
    if (!teamToDelete) return;
    try {
        await deleteTeam(teamToDelete);
        invalidateCache('teams');
        loadTeams();
    } catch (error: any) {
        console.error(error);
        alert('Failed to delete team: ' + error.message);
    }
    setDeleteModalOpen(false);
    setTeamToDelete(null);
  }

  async function onSubmit(data) {
    const file = data.logotype[0];
    if (file) {
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64Image = reader.result as string;
            const main_color = await getDominantColor(base64Image);
            const processedData = { ...data, logotype: base64Image, main_color };
            setPendingData(processedData);
            setSummaryModalOpen(true);
        };
        reader.readAsDataURL(file);
    } else {
        // If no file, ensure logotype is null or empty string if API expects it
        const processedData = { ...data, logotype: null, main_color: '#f97316' };
        setPendingData(processedData);
        setSummaryModalOpen(true);
    }
  }

  async function handleConfirmSave() {
    if (!pendingData || !user?.id) return;
    try {
        await createTeam(user.id, pendingData);
        invalidateCache('teams');
        setIsModalOpen(false);
        reset();
        loadTeams();
    } catch (error: any) {
        console.error(error);
        alert('Failed to create team: ' + error.message);
    }
    setSummaryModalOpen(false);
    setPendingData(null);
  }

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Teams</h1>
          <p className="text-gray-400 mt-1">Manage your teams and their identities.</p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-orange-500 hover:bg-orange-600 text-black px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-orange-500/20 font-bold border border-orange-500/20"
        >
          <Plus size={20} />
          ADD TEAM
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {teams.map((team: any) => (
          <TeamCard key={team.id} team={team} onDelete={handleDeleteClick} />
        ))}
        
        {/* Add New Placeholder Card */}
        <motion.button
          whileHover={{ scale: 1.02 }}
          onClick={() => setIsModalOpen(true)}
          className="p-6 rounded-2xl border border-dashed border-white/10 hover:border-orange-500/50 hover:bg-white/5 transition-all duration-300 flex flex-col items-center justify-center text-center group min-h-[200px]"
        >
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
            <Plus size={24} className="text-gray-500 group-hover:text-orange-500 transition-colors" />
          </div>
          <h3 className="text-lg font-medium text-gray-400 group-hover:text-white transition-colors">Create New Team</h3>
        </motion.button>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="glass-panel rounded-2xl w-full max-w-md shadow-2xl relative flex flex-col max-h-[90vh]">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-orange-600 z-10" />
            
            <div className="p-8 overflow-y-auto custom-scrollbar">
              <h2 className="text-2xl font-bold mb-6 text-white">Add New Team</h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Full Name</label>
                  <input 
                    {...register('fullname', { required: true })} 
                    className="w-full glass-input rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:ring-1 focus:ring-orange-500/50" 
                    placeholder="e.g. Los Angeles Lakers"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Short Name</label>
                  <input 
                    {...register('shortname', { required: true })} 
                    className="w-full glass-input rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:ring-1 focus:ring-orange-500/50" 
                    placeholder="e.g. Lakers"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Acronym (ID - 3 chars)</label>
                  <input 
                    {...register('id', { required: true, maxLength: 3, minLength: 3 })} 
                    className="w-full glass-input rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:ring-1 focus:ring-orange-500/50 uppercase font-mono" 
                    placeholder="LAL" 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Logotype (PNG)</label>
                  <div className="relative group">
                    <input 
                      type="file" 
                      accept="image/png" 
                      {...register('logotype')} 
                      className="w-full glass-input rounded-xl px-4 py-3 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-orange-500/10 file:text-orange-400 hover:file:bg-orange-500/20 transition-all cursor-pointer" 
                    />
                  </div>
                  <p className="text-xs text-gray-500 mt-2 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block"></span> Recommended size: 500x500px</p>
                </div>
                <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-white/5">
                  <button 
                    type="button" 
                    onClick={() => setIsModalOpen(false)} 
                    className="px-4 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                  >
                    Cancel
                  </button>
                  <button 
                    type="submit" 
                    className="px-6 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg transition-all shadow-lg shadow-orange-600/20 font-medium"
                  >
                    Save Team
                  </button>
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
        title="Delete Team"
        message="Are you sure you want to delete this team? This will also delete all associated athletes, committee members, and matches. This action cannot be undone."
        confirmText="Delete Team"
        isDestructive={true}
      />
      
      <SummaryConfirmationModal
        isOpen={summaryModalOpen}
        onClose={() => setSummaryModalOpen(false)}
        onConfirm={handleConfirmSave}
        title="Confirm Team Details"
        data={pendingData || {}}
      />
    </div>
  );
}
