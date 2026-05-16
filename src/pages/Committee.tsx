import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Plus, Edit, Trash, Download, Search } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { fetchCommittee, createCommittee, updateCommittee, deleteCommittee, fetchTeams } from '../api';
import ConfirmationModal from '../components/ConfirmationModal';
import SummaryConfirmationModal from '../components/SummaryConfirmationModal';
import { usePageTitle } from '../hooks/usePageTitle';
import { useCache } from '../contexts/CacheContext';

const ITEMS_PER_PAGE = 100;

export default function Committee() {
  usePageTitle('Committee');
  const [committee, setCommittee] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const observerTarget = useRef<HTMLDivElement>(null);
  
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [pendingData, setPendingData] = useState<any>(null);

  const { register, handleSubmit, reset, setValue } = useForm();

  const { setCacheData, getCacheData, isCacheFresh, invalidateCache } = useCache();

  useEffect(() => {
    loadInitialData();
  }, []);

  // Intersection Observer for lazy loading
  useEffect(() => {
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          loadMoreCommittee();
        }
      },
      { threshold: 0.1 }
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => observer.disconnect();
  }, [hasMore, loadingMore]);

  async function loadInitialData() {
    try {
      setLoading(true);
      
      let committeeData = getCacheData('committee');
      if (!committeeData || !isCacheFresh('committee')) {
        // Load all committee, assuming not too many, set high limit
        committeeData = await fetchCommittee(10000, 0);
        setCacheData('committee', committeeData || []);
      }
      
      let teamsData = getCacheData('teams');
      if (!teamsData || !isCacheFresh('teams')) {
        teamsData = await fetchTeams();
        setCacheData('teams', teamsData || []);
      }
      
      const sortedTeams = (teamsData || []).sort((a: any, b: any) => (a.fullname || '').localeCompare(b.fullname || ''));
      setCommittee(committeeData || []);
      setTeams(sortedTeams);
      setPage(1);
      setHasMore(false); // Since we load all at once
    } catch (error: any) {
      console.error("Failed to load committee:", error);
      alert("Failed to load committee: " + error.message);
    } finally {
      setLoading(false);
    }
  }

  async function loadMoreCommittee() {
    // Since we load all at once, no need for more loading
    // But to keep the code, perhaps remove or adjust
    // For now, since we have all, set hasMore to false
  }

  function openAddModal() {
    setEditingItem(null);
    reset({
      id: '',
      fullname: '',
      surname: '',
      role: '',
      team_id: ''
    });
    setIsModalOpen(true);
  }

  function openEditModal(item: any) {
    setEditingItem(item);
    setValue('id', item.id);
    setValue('fullname', item.fullname);
    setValue('surname', item.surname);
    setValue('role', item.role);
    setValue('team_id', item.team_id);
    setIsModalOpen(true);
  }

  async function onSubmit(data: any) {
    setPendingData(data);
    setSummaryModalOpen(true);
  }

  async function handleConfirmSave() {
    if (!pendingData) return;
    try {
      if (editingItem) {
        await updateCommittee(editingItem.id, pendingData);
      } else {
        await createCommittee(pendingData);
      }
      invalidateCache('committee');
      setIsModalOpen(false);
      reset();
      setEditingItem(null);
      // Reset and reload
      setPage(0);
      setCommittee([]);
      loadInitialData();
    } catch (error: any) {
      console.error("Error saving member:", error);
      alert(error.message || "Failed to save member. Please try again.");
    }
    setSummaryModalOpen(false);
    setPendingData(null);
  }

  function handleDeleteClick(id: string) {
    setItemToDelete(id);
    setDeleteModalOpen(true);
  }

  async function confirmDelete() {
    if (!itemToDelete) return;
    try {
      await deleteCommittee(itemToDelete);
      invalidateCache('committee');
      // Reset and reload
      setPage(0);
      setCommittee([]);
      loadInitialData();
    } catch (error: any) {
      console.error("Error deleting member:", error);
      alert("Failed to delete member: " + error.message);
    }
    setDeleteModalOpen(false);
    setItemToDelete(null);
  }

  const filteredCommittee = useMemo(() => committee.filter(member => 
    member.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.id.includes(searchTerm) ||
    (member.team_name && member.team_name.toLowerCase().includes(searchTerm.toLowerCase()))
  ), [committee, searchTerm]);

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Technical Committee</h1>
          <p className="text-gray-400 mt-1">Manage technical staff and coaches.</p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-orange-600 hover:bg-orange-500 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-orange-600/20 font-medium border border-orange-500/20"
        >
          <Plus size={20} />
          Add Member
        </button>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-white/5 flex items-center gap-3 bg-white/5">
            <Search className="text-gray-400" size={20} />
            <input 
                type="text" 
                placeholder="Search committee members..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none text-white placeholder-gray-500 focus:ring-0 w-full outline-none"
            />
        </div>
        {loading ? (
          <div className="p-12 text-center text-gray-500">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-500 mx-auto mb-4"></div>
            Loading committee members...
          </div>
        ) : (
        <div className="overflow-x-auto">
            <table className="w-full text-left">
            <thead>
                <tr className="bg-white/5 border-b border-white/5 text-gray-400 text-xs uppercase tracking-wider font-medium">
                <th className="px-6 py-4">RG (ID)</th>
                <th className="px-6 py-4">Team</th>
                <th className="px-6 py-4">Surname</th>
                <th className="px-6 py-4">Full Name</th>
                <th className="px-6 py-4 text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
                {filteredCommittee.map((member) => (
                <tr key={member.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4 font-mono text-gray-400 text-sm">{member.id}</td>
                    <td className="px-6 py-4">
                      {member.team_logotype ? (
                        <div className="w-10 h-10 rounded-lg bg-white/10 p-1 overflow-hidden" title={member.team_name}>
                            <img src={member.team_logotype} alt={member.team_name} className="w-full h-full object-cover rounded-md" />
                        </div>
                      ) : member.team_shortname ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-500/10 text-orange-400 border border-orange-500/20">
                          {member.team_shortname}
                        </span>
                      ) : (
                        <span className="text-gray-600 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-bold text-white">{member.surname}</td>
                    <td className="px-6 py-4 text-gray-300">{member.fullname}</td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEditModal(member)} className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors">
                        <Edit size={16} />
                    </button>
                    <button onClick={() => handleDeleteClick(member.id)} className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-500/10 transition-colors">
                        <Trash size={16} />
                    </button>
                    </td>
                </tr>
                ))}
                {filteredCommittee.length === 0 && (
                <tr>
                    <td colSpan={4} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <Search size={32} className="text-gray-700 mb-2" />
                        <p>No committee members found matching your search.</p>
                      </div>
                    </td>
                </tr>
                )}
            </tbody>
            </table>
            
            {/* Lazy load trigger */}
            {hasMore && filteredCommittee.length > 0 && (
              <div ref={observerTarget} className="p-4 text-center">
                {loadingMore && (
                  <div className="flex items-center justify-center gap-2 text-gray-500">
                    <div className="animate-spin rounded-full h-4 w-4 border-b border-orange-500"></div>
                    <span>Loading more...</span>
                  </div>
                )}
              </div>
            )}
        </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="glass-panel rounded-2xl w-full max-w-md shadow-2xl relative flex flex-col max-h-[90vh]">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-orange-600 z-10" />
            
            <div className="p-8 overflow-y-auto custom-scrollbar">
              <h2 className="text-2xl font-bold mb-6 text-white">{editingItem ? 'Edit' : 'Add'} Member</h2>
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Full Name</label>
                  <input {...register('fullname', { required: true })} className="w-full glass-input rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:ring-1 focus:ring-orange-500/50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Surname</label>
                  <input {...register('surname', { required: true })} className="w-full glass-input rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:ring-1 focus:ring-orange-500/50" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">RG (ID - Numbers Only)</label>
                  <input {...register('id', { required: true, pattern: /^[0-9]+$/ })} className="w-full glass-input rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:ring-1 focus:ring-orange-500/50 font-mono" placeholder="123456789" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Team</label>
                  <div className="relative">
                    <select {...register('team_id')} className="w-full glass-input rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:ring-1 focus:ring-orange-500/50 appearance-none">
                        <option value="" className="bg-dark-900 text-gray-400">No Team (Free Agent)</option>
                        {teams.map(t => (
                            <option key={t.id} value={t.id} className="bg-dark-900">{t.fullname}</option>
                        ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
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
        title="Delete Member"
        message="Are you sure you want to delete this committee member? This action cannot be undone."
        confirmText="Delete"
        isDestructive={true}
      />
      
      <SummaryConfirmationModal
        isOpen={summaryModalOpen}
        onClose={() => setSummaryModalOpen(false)}
        onConfirm={handleConfirmSave}
        title="Confirm Member Details"
        data={pendingData || {}}
      />
    </div>
  );
}
