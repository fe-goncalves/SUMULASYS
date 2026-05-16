import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Plus, Trash, User, Briefcase, Edit } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { fetchTeam, updateTeam, createAthlete, updateAthlete, deleteAthlete, createCommittee, updateCommittee, deleteCommittee, fetchTeams } from '../api';
import ConfirmationModal from '../components/ConfirmationModal';
import SummaryConfirmationModal from '../components/SummaryConfirmationModal';
import { useDominantColor } from '../hooks/useDominantColor';
import { usePageTitle } from '../hooks/usePageTitle';

export default function TeamDetail() {
  usePageTitle('Team Detail');
  const { id } = useParams();
  const navigate = useNavigate();
  const [team, setTeam] = useState(null);
  const [allTeams, setAllTeams] = useState([]);
  const [activeTab, setActiveTab] = useState('athletes'); // 'athletes' or 'committee'
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditTeamModalOpen, setIsEditTeamModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null); // For editing athlete/committee
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [itemToDelete, setItemToDelete] = useState(null);
  const [deleteType, setDeleteType] = useState(null); // 'athlete' or 'committee'
  
  const [summaryModalOpen, setSummaryModalOpen] = useState(false);
  const [pendingData, setPendingData] = useState(null);
  const [pendingAction, setPendingAction] = useState(null); // 'saveItem' | 'saveTeam'
  
  const { register, handleSubmit, reset, setValue } = useForm();
  const { register: registerEdit, handleSubmit: handleSubmitEdit, reset: resetEdit, setValue: setValueEdit } = useForm();

  const dominantColor = useDominantColor(team?.logotype, team?.main_color || '#f97316');

  useEffect(() => {
    loadTeam();
    loadAllTeams();
  }, [id]);

  async function loadTeam() {
    const data = await fetchTeam(id);
    if (data) {
        if (data.athletes) {
            data.athletes.sort((a: any, b: any) => (a.surname || a.fullname || '').localeCompare(b.surname || b.fullname || ''));
        }
        if (data.committee) {
            data.committee.sort((a: any, b: any) => (a.surname || a.fullname || '').localeCompare(b.surname || b.fullname || ''));
        }
        setTeam(data);
        // Pre-fill edit form
        setValueEdit('fullname', data.fullname);
        setValueEdit('shortname', data.shortname);
    }
  }

  async function loadAllTeams() {
      const data = await fetchTeams();
      const sortedTeams = data.sort((a: any, b: any) => (a.fullname || '').localeCompare(b.fullname || ''));
      setAllTeams(sortedTeams);
  }

  function openAddModal() {
      setEditingItem(null);
      reset({
          fullname: '',
          surname: '',
          id: '',
          date_of_birth: '',
          team_id: id
      });
      setIsModalOpen(true);
  }

  function openEditModal(item) {
      setEditingItem(item);
      setValue('fullname', item.fullname);
      setValue('surname', item.surname);
      setValue('id', item.id);
      
      if (activeTab === 'athletes' && item.date_of_birth) {
        const [year, month, day] = item.date_of_birth.split('-');
        setValue('date_of_birth', `${day}/${month}/${year}`);
      } else {
        setValue('date_of_birth', '');
      }
      
      setValue('team_id', id); // Default to current team, but user can change
      setIsModalOpen(true);
  }

  async function onSubmit(data) {
    let formattedData = { ...data };
    // Only format date for athletes
    if (activeTab === 'athletes' && data.date_of_birth) {
      const parts = data.date_of_birth.split('/');
      if (parts.length === 3) {
        const [day, month, year] = parts;
        formattedData.date_of_birth = `${year}-${month}-${day}`;
      }
    }
    setPendingData(formattedData);
    setPendingAction('saveItem');
    setSummaryModalOpen(true);
  }

  async function handleConfirmSaveItem() {
    try {
        if (editingItem) {
            // Update
            if (activeTab === 'athletes') {
                await updateAthlete(editingItem.id, { ...pendingData });
            } else {
                await updateCommittee(editingItem.id, { ...pendingData });
            }
        } else {
            // Create
            if (activeTab === 'athletes') {
                await createAthlete({ ...pendingData, team_id: id });
            } else {
                await createCommittee({ ...pendingData, team_id: id });
            }
        }
        setIsModalOpen(false);
        reset();
        setEditingItem(null);
        loadTeam();
    } catch (error: any) {
        console.error("Error saving item:", error);
        alert(error.message || "Failed to save item.");
    }
  }

  async function onEditTeamSubmit(data) {
      const file = data.logotype[0];
      
      const prepareSummary = (finalData) => {
          setPendingData(finalData);
          setPendingAction('saveTeam');
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
          // Keep existing logotype if not changed
          const processedData = { ...data, logotype: team.logotype };
          prepareSummary(processedData);
      }
  }

  async function handleConfirmSaveTeam() {
      try {
          await updateTeam(id, pendingData);
          setIsEditTeamModalOpen(false);
          loadTeam();
      } catch (error) {
          console.error("Error updating team:", error);
          alert("Failed to update team.");
      }
  }

  async function handleConfirmSummary() {
      if (!pendingData) return;
      
      if (pendingAction === 'saveItem') {
          await handleConfirmSaveItem();
      } else if (pendingAction === 'saveTeam') {
          await handleConfirmSaveTeam();
      }
      
      setSummaryModalOpen(false);
      setPendingData(null);
      setPendingAction(null);
  }

  function handleDeleteClick(itemId, type) {
      setItemToDelete(itemId);
      setDeleteType(type);
      setDeleteModalOpen(true);
  }

  async function confirmDelete() {
      if (!itemToDelete || !deleteType) return;
      try {
        if (deleteType === 'athlete') {
            await deleteAthlete(itemToDelete);
        } else {
            await deleteCommittee(itemToDelete);
        }
        loadTeam();
      } catch (error: any) {
        console.error("Error deleting item:", error);
        alert("Failed to delete item: " + error.message);
      }
      setDeleteModalOpen(false);
      setItemToDelete(null);
      setDeleteType(null);
  }

  if (!team) return <div className="text-white">Loading...</div>;

  function formatDate(dateStr) {
      if (!dateStr) return '';
      // Assuming dateStr is YYYY-MM-DD
      const parts = dateStr.split('-');
      if (parts.length === 3) {
          return `${parts[2]}/${parts[1]}/${parts[0]}`;
      }
      return dateStr;
  }

  return (
    <div className="space-y-8" style={{ '--team-color': dominantColor } as React.CSSProperties}>
      <button onClick={() => navigate('/teams')} className="flex items-center text-gray-400 hover:text-white transition group">
        <ArrowLeft size={20} className="mr-2 group-hover:-translate-x-1 transition-transform" /> Back to Teams
      </button>

      <div className="glass-panel p-8 rounded-2xl shadow-lg border border-white/5 flex items-center justify-between relative overflow-hidden">
        <div 
            className="absolute top-0 left-0 w-full h-1 opacity-50" 
            style={{ background: `linear-gradient(to right, var(--team-color), transparent)` }}
        />
        <div 
            className="absolute inset-0 opacity-10 pointer-events-none"
            style={{ background: `radial-gradient(circle at 10% 50%, var(--team-color), transparent 50%)` }}
        />

        <div className="flex items-center gap-8 relative z-10">
            <div className="w-32 h-32 bg-dark-800 rounded-full flex items-center justify-center overflow-hidden border-4 border-dark-800 shadow-xl ring-4 ring-white/5" style={{ borderColor: 'var(--team-color)' }}>
            {team.logotype ? (
                <img src={team.logotype} alt={team.fullname} className="w-full h-full object-cover" />
            ) : (
                <span className="text-4xl font-bold text-gray-600" style={{ color: 'var(--team-color)' }}>{team.shortname?.[0]}</span>
            )}
            </div>
            <div>
            <h1 className="text-4xl font-bold text-white tracking-tight mb-2">{team.fullname}</h1>
            <div className="flex items-center gap-3">
                <span 
                    className="px-3 py-1 rounded-lg bg-white/5 border border-white/10 font-mono text-sm font-medium"
                    style={{ color: 'var(--team-color)', borderColor: 'var(--team-color)' }}
                >
                    {team.shortname}
                </span>
                <span className="text-gray-500 text-sm">•</span>
                <span className="text-gray-400 font-mono text-sm">ID: {team.id}</span>
            </div>
            </div>
        </div>
        <button 
            onClick={() => setIsEditTeamModalOpen(true)}
            className="text-gray-400 hover:text-white p-3 rounded-xl hover:bg-white/10 transition-colors border border-transparent hover:border-white/10"
        >
            <Edit size={24} />
        </button>
      </div>

      <div className="glass-panel rounded-2xl shadow-lg border border-white/5 overflow-hidden">
        <div className="flex border-b border-white/5">
          <button
            onClick={() => setActiveTab('athletes')}
            className={`flex-1 py-4 text-center font-medium transition-all relative ${activeTab === 'athletes' ? 'bg-white/5' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            style={{ color: activeTab === 'athletes' ? 'var(--team-color)' : undefined }}
          >
            Athletes ({team.athletes?.length || 0})
            {activeTab === 'athletes' && <div className="absolute bottom-0 left-0 w-full h-0.5 shadow-[0_-2px_10px_rgba(0,0,0,0.5)]" style={{ backgroundColor: 'var(--team-color)' }} />}
          </button>
          <button
            onClick={() => setActiveTab('committee')}
            className={`flex-1 py-4 text-center font-medium transition-all relative ${activeTab === 'committee' ? 'bg-white/5' : 'text-gray-400 hover:text-white hover:bg-white/5'}`}
            style={{ color: activeTab === 'committee' ? 'var(--team-color)' : undefined }}
          >
            Technical Committee ({team.committee?.length || 0})
            {activeTab === 'committee' && <div className="absolute bottom-0 left-0 w-full h-0.5 shadow-[0_-2px_10px_rgba(0,0,0,0.5)]" style={{ backgroundColor: 'var(--team-color)' }} />}
          </button>
        </div>

        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              {activeTab === 'athletes' ? <User size={20} style={{ color: 'var(--team-color)' }} /> : <Briefcase size={20} style={{ color: 'var(--team-color)' }} />}
              {activeTab === 'athletes' ? 'Roster' : 'Staff Members'}
            </h2>
            <button
              onClick={openAddModal}
              className="text-white px-4 py-2 rounded-xl flex items-center gap-2 transition-all shadow-lg font-medium border border-white/10"
              style={{ backgroundColor: 'var(--team-color)', borderColor: 'var(--team-color)' }}
            >
              <Plus size={18} />
              Add {activeTab === 'athletes' ? 'Athlete' : 'Member'}
            </button>
          </div>

          <div className="overfloactiveTab === 'athletes' ? 5 : w-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-white/5 text-gray-400 text-xs uppercase tracking-wider font-medium">
                  <th className="px-4 py-3">RG (ID)</th>
                  <th className="px-4 py-3">Full Name</th>
                  <th className="px-4 py-3">Surname</th>
                  {activeTab === 'athletes' && <th className="px-4 py-3">Date of Birth</th>}
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {(activeTab === 'athletes' ? team.athletes : team.committee).map((item) => (
                  <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                    <td className="px-4 py-4 font-mono text-gray-400 text-sm">{item.id}</td>
                    <td className="px-4 py-4 font-medium text-white">{item.fullname}</td>
                    <td className="px-4 py-4 text-gray-400">{item.surname}</td>
                    {activeTab === 'athletes' && <td className="px-4 py-4 text-gray-400 text-sm">{formatDate(item.date_of_birth)}</td>}
                    <td className="px-4 py-4 text-right flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditModal(item)} className="text-gray-400 hover:text-white p-2 rounded-lg hover:bg-white/10 transition-colors">
                        <Edit size={16} />
                      </button>
                      <button onClick={() => handleDeleteClick(item.id, activeTab === 'athletes' ? 'athlete' : 'committee')} className="text-red-400 hover:text-red-300 p-2 rounded-lg hover:bg-red-500/10 transition-colors">
                        <Trash size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                {(activeTab === 'athletes' ? team.athletes : team.committee).length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-gray-500">
                      <div className="flex flex-col items-center gap-2">
                        {activeTab === 'athletes' ? <User size={32} className="text-gray-700 mb-2" /> : <Briefcase size={32} className="text-gray-700 mb-2" />}
                        <p>No {activeTab === 'athletes' ? 'athletes' : 'members'} added yet.</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add/Edit Athlete/Committee Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="glass-panel p-8 rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-orange-600" />
            
            <h2 className="text-2xl font-bold mb-6 text-white">{editingItem ? 'Edit' : 'Add'} {activeTab === 'athletes' ? 'Athlete' : 'Member'}</h2>
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
              {activeTab === 'athletes' && (
                <div>
                  <label className="block text-sm font-medium text-gray-400 mb-1.5">Date of Birth</label>
                  <input 
                    type="text" 
                    placeholder="DD/MM/YYYY"
                    {...register('date_of_birth', { 
                        required: activeTab === 'athletes' ? 'Date of birth is required for athletes' : false,
                        pattern: activeTab === 'athletes' ? { value: /^(0[1-9]|[12][0-9]|3[01])\/(0[1-9]|1[012])\/(19|20)\d\d$/, message: 'Invalid date format' } : undefined
                    })} 
                    className="w-full glass-input rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:ring-1 focus:ring-orange-500/50" 
                  />
                </div>
              )}
              
              {editingItem && (
                  <div>
                    <label className="block text-sm font-medium text-gray-400 mb-1.5">Team (Transfer)</label>
                    <div className="relative">
                      <select {...register('team_id', { required: true })} className="w-full glass-input rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:ring-1 focus:ring-orange-500/50 appearance-none">
                          {allTeams.map(t => (
                              <option key={t.id} value={t.id} className="bg-dark-900">{t.fullname}</option>
                          ))}
                      </select>
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500">
                        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2.5 4.5L6 8L9.5 4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      </div>
                    </div>
                  </div>
              )}

              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-white/5">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">Cancel</button>
                <button type="submit" className="px-6 py-2 bg-orange-600 hover:bg-orange-500 text-white rounded-lg transition-all shadow-lg shadow-orange-600/20 font-medium">Save</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Team Modal */}
      {isEditTeamModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-50 p-4">
          <div className="glass-panel p-8 rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-orange-600" />
            
            <h2 className="text-2xl font-bold mb-6 text-white">Edit Team</h2>
            <form onSubmit={handleSubmitEdit(onEditTeamSubmit)} className="space-y-5">
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Full Name</label>
                <input {...registerEdit('fullname', { required: true })} className="w-full glass-input rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:ring-1 focus:ring-orange-500/50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Short Name</label>
                <input {...registerEdit('shortname', { required: true })} className="w-full glass-input rounded-xl px-4 py-3 text-white placeholder-gray-600 focus:ring-1 focus:ring-orange-500/50" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-400 mb-1.5">Logotype (PNG)</label>
                <div className="relative group">
                    <input type="file" accept="image/png" {...registerEdit('logotype')} className="w-full glass-input rounded-xl px-4 py-3 text-white file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-orange-500/10 file:text-orange-400 hover:file:bg-orange-500/20 transition-all cursor-pointer" />
                </div>
                <p className="text-xs text-gray-500 mt-2 flex items-center gap-1"><span className="w-1.5 h-1.5 rounded-full bg-orange-500 inline-block"></span> Leave empty to keep current logo</p>
              </div>
              <div className="flex justify-end gap-3 mt-8 pt-4 border-t border-white/5">
                <button type="button" onClick={() => setIsEditTeamModalOpen(false)} className="px-4 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors">Cancel</button>
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
        title={`Delete ${deleteType === 'athlete' ? 'Athlete' : 'Member'}`}
        message={`Are you sure you want to delete this ${deleteType === 'athlete' ? 'athlete' : 'member'}? This action cannot be undone.`}
        confirmText="Delete"
        isDestructive={true}
      />
      
      <SummaryConfirmationModal
        isOpen={summaryModalOpen}
        onClose={() => setSummaryModalOpen(false)}
        onConfirm={handleConfirmSummary}
        title={`Confirm ${pendingAction === 'saveTeam' ? 'Team' : (activeTab === 'athletes' ? 'Athlete' : 'Member')} Details`}
        data={pendingData || {}}
      />
    </div>
  );
}
