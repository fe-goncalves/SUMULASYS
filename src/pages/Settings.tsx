import React, { useRef, useState } from 'react';
import { Download, Upload, AlertTriangle, CheckCircle, FileJson, Trash, FileSpreadsheet } from 'lucide-react';
import { exportData, importData, deleteAllUserData } from '../api';
import { usePageTitle } from '../hooks/usePageTitle';
import { useAuth } from '../contexts/AuthContext';
import { useCache } from '../contexts/CacheContext';
import ConfirmationModal from '../components/ConfirmationModal';
import {
  BulkEntity,
  csvRowsToBackup,
  downloadCsvTemplate,
  parseCsv,
} from '../utils/csvImport';

export default function Settings() {
  usePageTitle('Settings');
  const { user } = useAuth();
  const { invalidateCache } = useCache();
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [csvEntity, setCsvEntity] = useState<BulkEntity>('teams');
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const jsonInputRef = useRef<HTMLInputElement>(null);
  const csvInputRef = useRef<HTMLInputElement>(null);

  const handleExport = async () => {
    setIsExporting(true);
    setMessage(null);
    try {
      if (!user?.id) {
        setMessage({ type: 'error', text: 'User not authenticated' });
        return;
      }
      const data = await exportData(user.id);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sumulasys_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setMessage({ type: 'success', text: 'Backup exported successfully.' });
    } catch (error) {
      console.error('Export failed:', error);
      setMessage({ type: 'error', text: 'Failed to export data.' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleDeleteAll = async () => {
    if (!user?.id) return;
    setIsDeleting(true);
    setMessage(null);
    try {
      await deleteAllUserData(user.id);
      invalidateCache();
      setMessage({ type: 'success', text: 'All entities were deleted. You can now import the new data.' });
    } catch (error: any) {
      console.error('Delete all failed:', error);
      setMessage({ type: 'error', text: `Failed to delete data: ${error.message}` });
    } finally {
      setIsDeleting(false);
    }
  };

  const handleJsonFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      setMessage({ type: 'error', text: 'Select a JSON backup file.' });
      event.target.value = '';
      return;
    }

    if (!confirm('This will DELETE all current entities and import the JSON. Continue?')) {
      event.target.value = '';
      return;
    }

    setIsImporting(true);
    setMessage(null);
    try {
      if (!user?.id) throw new Error('User not authenticated');
      const json = JSON.parse(await file.text());
      const result = await importData(user.id, json, { replace: true });
      if (!result.success) throw new Error(result.error || 'Import failed');
      invalidateCache();
      const counts = result.counts;
      setMessage({
        type: 'success',
        text: `Imported ${counts?.teams || 0} teams, ${counts?.athletes || 0} athletes, ${counts?.committee || 0} committee, ${counts?.tournaments || 0} tournaments, ${counts?.matches || 0} matches. Reloading...`,
      });
      setTimeout(() => window.location.reload(), 1500);
    } catch (error: any) {
      console.error('Import failed:', error);
      setMessage({ type: 'error', text: `Import failed: ${error.message}` });
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  };

  const handleCsvFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.csv')) {
      setMessage({ type: 'error', text: 'Select a CSV file.' });
      event.target.value = '';
      return;
    }

    setIsImporting(true);
    setMessage(null);
    try {
      if (!user?.id) throw new Error('User not authenticated');
      const rows = parseCsv(await file.text());
      if (rows.length === 0) throw new Error('CSV has no data rows.');
      const backup = csvRowsToBackup(csvEntity, rows);
      const result = await importData(user.id, backup, { replace: false });
      if (!result.success) throw new Error(result.error || 'Import failed');
      invalidateCache();
      setMessage({
        type: 'success',
        text: `Added ${rows.length} ${csvEntity} record(s).`,
      });
    } catch (error: any) {
      console.error('CSV import failed:', error);
      setMessage({ type: 'error', text: `CSV import failed: ${error.message}` });
    } finally {
      setIsImporting(false);
      event.target.value = '';
    }
  };

  const busy = isExporting || isImporting || isDeleting;

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">System Settings</h1>
        <p className="text-gray-400">Backup, wipe, and bulk-load teams, athletes, committee, tournaments, and matches.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass-panel rounded-2xl p-6 border border-white/5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-blue-500 opacity-50" />
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20">
              <Download size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">1. Export backup</h2>
              <p className="text-sm text-gray-400">Download current data before wiping</p>
            </div>
          </div>
          <p className="text-gray-400 mb-6 text-sm leading-relaxed">
            Save a JSON backup first. Wipe cannot be undone.
          </p>
          <button
            onClick={handleExport}
            disabled={busy}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-blue-600/20 border border-blue-500/20"
          >
            {isExporting ? <span className="animate-pulse">Exporting...</span> : <><Download size={20} /> Download Backup</>}
          </button>
        </div>

        <div className="glass-panel rounded-2xl p-6 border border-red-500/20 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-red-500" />
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400 border border-red-500/20">
              <Trash size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">2. Delete all entities</h2>
              <p className="text-sm text-gray-400">Only your user data is removed</p>
            </div>
          </div>
          <p className="text-gray-400 mb-6 text-sm leading-relaxed">
            Deletes matches, athletes, committee, teams, tournaments, and logos in Storage.
          </p>
          <button
            onClick={() => setDeleteModalOpen(true)}
            disabled={busy}
            className="w-full bg-red-600 hover:bg-red-500 text-white font-medium py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 shadow-lg shadow-red-600/20 border border-red-500/20"
          >
            {isDeleting ? <span className="animate-pulse">Deleting...</span> : <><Trash size={20} /> Delete everything</>}
          </button>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <div className="glass-panel rounded-2xl p-6 border border-white/5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-orange-500 opacity-50" />
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400 border border-orange-500/20">
              <Upload size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">3. Bulk JSON</h2>
              <p className="text-sm text-gray-400">Full replace from a backup file</p>
            </div>
          </div>
          <p className="text-gray-400 mb-6 text-sm leading-relaxed">
            Wipes current data, then loads teams, athletes, committee, tournaments, and matches from JSON.
          </p>
          <input ref={jsonInputRef} type="file" accept=".json,application/json" onChange={handleJsonFile} className="hidden" />
          <button
            onClick={() => jsonInputRef.current?.click()}
            disabled={busy}
            className="w-full bg-white/5 hover:bg-white/10 text-white font-medium py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 border border-white/10"
          >
            {isImporting ? <span className="animate-pulse">Importing...</span> : <><Upload size={20} /> Select JSON file</>}
          </button>
        </div>

        <div className="glass-panel rounded-2xl p-6 border border-white/5 shadow-lg relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-green-500 opacity-50" />
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-green-500/10 flex items-center justify-center text-green-400 border border-green-500/20">
              <FileSpreadsheet size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">3. Bulk CSV</h2>
              <p className="text-sm text-gray-400">Add one entity type at a time</p>
            </div>
          </div>
          <p className="text-gray-400 mb-4 text-sm leading-relaxed">
            After wiping, import teams first, then athletes/committee, then tournaments, then matches. Dates can be DD/MM/YYYY.
          </p>
          <select
            value={csvEntity}
            onChange={(event) => setCsvEntity(event.target.value as BulkEntity)}
            className="w-full glass-input rounded-xl px-4 py-3 text-white mb-3 appearance-none"
          >
            <option value="teams" className="bg-dark-900">Teams</option>
            <option value="athletes" className="bg-dark-900">Athletes</option>
            <option value="committee" className="bg-dark-900">Committee</option>
            <option value="tournaments" className="bg-dark-900">Tournaments</option>
            <option value="matches" className="bg-dark-900">Matches</option>
          </select>
          <div className="flex gap-2 mb-3">
            <button
              type="button"
              onClick={() => downloadCsvTemplate(csvEntity)}
              className="flex-1 px-3 py-2 text-sm text-gray-300 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10"
            >
              Download template
            </button>
          </div>
          <input ref={csvInputRef} type="file" accept=".csv,text/csv" onChange={handleCsvFile} className="hidden" />
          <button
            onClick={() => csvInputRef.current?.click()}
            disabled={busy}
            className="w-full bg-green-600 hover:bg-green-500 text-white font-medium py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 border border-green-500/20"
          >
            {isImporting ? <span className="animate-pulse">Importing...</span> : <><FileSpreadsheet size={20} /> Select CSV</>}
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 border ${
          message.type === 'success'
            ? 'bg-green-500/10 border-green-500/20 text-green-400'
            : 'bg-red-500/10 border-red-500/20 text-red-400'
        }`}>
          {message.type === 'success' ? <CheckCircle size={20} /> : <AlertTriangle size={20} />}
          <p className="font-medium">{message.text}</p>
        </div>
      )}

      <div className="glass-panel rounded-2xl p-6 border border-white/5 shadow-lg">
        <h3 className="text-lg font-bold text-white mb-4 flex items-center gap-2">
          <FileJson size={20} className="text-gray-400" />
          CSV columns
        </h3>
        <ul className="text-sm text-gray-400 space-y-2 list-disc pl-5 marker:text-orange-500">
          <li><code className="text-orange-400">teams</code>: id, fullname, shortname, main_color</li>
          <li><code className="text-orange-400">athletes</code>: id, fullname, surname, date_of_birth, team_id</li>
          <li><code className="text-orange-400">committee</code>: id, fullname, surname, team_id</li>
          <li><code className="text-orange-400">tournaments</code>: id, fullname, shortname, season, main_color</li>
          <li><code className="text-orange-400">matches</code>: id (optional), tournament_id, date, phase, round, team_a_id, team_b_id</li>
        </ul>
      </div>

      <ConfirmationModal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleDeleteAll}
        title="Delete all entities"
        message="This permanently deletes all teams, athletes, committee members, tournaments, and matches for your account. Export a backup first. This cannot be undone."
        confirmText="Yes, delete everything"
        isDestructive={true}
      />

      {(isDeleting || isImporting) && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center z-[100]">
          <div className="w-16 h-16 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mb-4" />
          <h2 className="text-2xl font-bold text-white mb-2">{isDeleting ? 'Deleting data...' : 'Importing data...'}</h2>
          <p className="text-gray-400">Please wait.</p>
        </div>
      )}
    </div>
  );
}
