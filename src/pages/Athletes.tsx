import React, { useState, useEffect } from 'react';
import { Plus, Edit, Trash, Download, Search } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { fetchAthletes, createAthlete, updateAthlete, deleteAthlete, fetchTeams } from '../api';
import ConfirmationModal from '../components/ConfirmationModal';
import SummaryConfirmationModal from '../components/SummaryConfirmationModal';

export default function Athletes() {
  const [athletes, setAthletes] = useState([]);
  const [teams, setTeams] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [pendingData, setPendingData] = useState(null);

  const { register, handleSubmit, reset, setValue } = useForm();

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    const [athletesData, teamsData] = await Promise.all([
      fetchAthletes(),
      fetchTeams()
    ]);
    const sortedAthletes = athletesData.sort((a: any, b: any) => (a.surname || a.fullname || '').localeCompare(b.surname || b.fullname || ''));
    setAthletes(sortedAthletes);
    setTeams(teamsData);
  }

  function openAddModal() {
    setEditingItem(null);
    reset({
      id: '',
      fullname: '',
      surname: '',
      date_of_birth: '',
      team_id: ''
    });
    setIsModalOpen(true);
  }

  function openEditModal(item) {
    setEditingItem(item);
    setValue('id', item.id);
    setValue('fullname', item.fullname);
    setValue('surname', item.surname);
    setValue('date_of_birth', item.date_of_birth);
    setValue('team_id', item.team_id);
    setIsModalOpen(true);
  }

  async function onSubmit(data) {
    setPendingData(data);
    setSummaryModalOpen(true);
  }

  async function handleConfirmSave() {
    if (!pendingData) return;
    try {
      if (editingItem) {
        await updateAthlete(editingItem.id, pendingData);
      } else {
        await createAthlete(pendingData);
      }
      setIsModalOpen(false);
      reset();
      setEditingItem(null);
      loadData();
    } catch (error: any) {
      console.error("Error saving athlete:", error);
      alert(error.message || "Failed to save athlete. Please try again.");
    }
    setSummaryModalOpen(false);
    setPendingData(null);
  }

  function handleDeleteClick(id) {
    setItemToDelete(id);
    setDeleteModalOpen(true);
  }

  async function confirmDelete() {
    if (!itemToDelete) return;
    try {
      await deleteAthlete(itemToDelete);
      loadData();
    } catch (error: any) {
      console.error("Error deleting athlete:", error);
      alert("Failed to delete athlete: " + error.message);
    }
    setDeleteModalOpen(false);
    setItemToDelete(null);
  }

  const filteredAthletes = athletes.filter(athlete => 
    athlete.fullname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    athlete.surname.toLowerCase().includes(searchTerm.toLowerCase()) ||
    athlete.id.includes(searchTerm) ||
    (athlete.team_name && athlete.team_name.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const formatDate = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight">Athletes</h1>
          <p className="text-gray-400 mt-1">Manage player rosters and registrations.</p>
        </div>
        <button
          onClick={openAddModal}
          className="bg-orange-600 hover:bg-orange-500 text-white px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-orange-600/20 font-medium border border-orange-500/20"
        >
          <Plus size={20} />
          Add Athlete
        </button>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden shadow-2xl">
        <div className="p-4 border-b border-white/5 flex items-center gap-3 bg-white/5">
            <Search className="text-gray-400" size={20} />
            <input 
                type="text" 
                placeholder="Search athletes by name, ID or team..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-transparent border-none text-white placeholder-gray-500 focus:ring-0 w-full outline-none"
            />
        </div>
        <div className="overflow-x-auto">
            <table className="w-full text-left">
            <thead>
                <tr className="bg-white/5 border-b border-white/5 text-gray-400 text-xs uppercase tracking-wider font-medium">
                <th className="px-6 py-4">RG (ID)</th>
                <th className="px-6 py-4">Team</th>
                <th className="px-6 py-4">Surname</th>
                <th className="px-6 py-4">Full Name</th>
                <th className="px-6 py-4">Date of Birth</th>
                <th className="px-6 py-4 text-right">Actions</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
                {filteredAthletes.map((athlete) => (
                <tr key={athlete.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-6 py-4 font-mono text-gray-400 text-sm">{athlete.id}</td>
                    <td className="px-6 py-4">
                      {athlete.team_logotype ? (
                        <div className="w-10 h-10 rounded-lg bg-white/10 p-1 overflow-hidden" title={athlete.team_name}>
                            <img src={athlete.team_logotype} alt={athlete.team_name} className="w-full h-full object-cover rounded-md" />
                        </div>
                      ) : athlete.team_shortname ? (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-orange-500/10 text-orange-400 border border-orange-500/20">
                          {athlete.team_shortname}
                        </span>
                      ) : (
                        <span className="text-gray-600 text-sm">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 font-bold text-white">{athlete.surname}</td>
                    <td className="px-6 py-4 text-gray-300">{athlete.fullname}</td>
                    <td className="px-6 py-4 text-gray-400 text-sm">{formatDate(athlete.date_of_birth)}</td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => openEditModal(athlete)} className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors">
                        <Edit size={16} />
                    </button>
                    <button onClick={() => handleDeleteClick(athlete.id)} className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-500/10 transition-colors">
                        <Trash size={16} />
                    </button>
                    </td>
                </tr>
                ))}
                {filteredAthletes.length === 0 && (
                <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        <Search size={32} className="text-gray-700 mb-2" />
                        <p>No athletes found matching your search.</p>
                      </div>
                    </td>
                </tr>
                )}
            </tbody>
            </table>
        </div>
      </div>

      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="glass-panel rounded-2xl w-full max-w-md shadow-2xl relative flex flex-col max-h-[90vh]">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-orange-600 z-10" />
            
            <div className="p-8 overflow-y-auto custom-scrollbar">
              <h2 className="text-2xl font-bold mb-6 text-white">{editingItem ? 'Edit' : 'Add'} Athlete</h2>
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
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Date of Birth</label>
                  <input type="date" {...register('date_of_birth', { required: true })} className="w-full glass-input rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:ring-1 focus:ring-orange-500/50" />
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
        title="Delete Athlete"
        message="Are you sure you want to delete this athlete? This action cannot be undone."
        confirmText="Delete"
        isDestructive={true}
      />
      
      <SummaryConfirmationModal
        isOpen={summaryModalOpen}
        onClose={() => setSummaryModalOpen(false)}
        onConfirm={handleConfirmSave}
        title="Confirm Athlete Details"
        data={pendingData || {}}
      />
    </div>
  );
}
