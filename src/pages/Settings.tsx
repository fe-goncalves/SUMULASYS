import React, { useState, useRef, useEffect } from 'react';
import { Download, Upload, AlertTriangle, CheckCircle, FileJson, Database, RefreshCw } from 'lucide-react';
import { exportData, importData, fetchTeams, fetchTournaments, updateTeam, updateTournament } from '../api';
import { compressImage } from '../utils/imageCompressor';

export default function Settings() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isOptimizing, setIsOptimizing] = useState(false);
  const [storageUsage, setStorageUsage] = useState({ used: 0, total: 5 * 1024 * 1024, percentage: 0 });
  const [message, setMessage] = useState<{ type: 'success' | 'error', text: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    calculateStorage();
  }, []);

  const calculateStorage = () => {
    let total = 0;
    for (let x in localStorage) {
      if (localStorage.hasOwnProperty(x)) {
        total += ((localStorage[x].length + x.length) * 2);
      }
    }
    const totalAllowed = 5 * 1024 * 1024; // ~5MB
    setStorageUsage({
      used: total,
      total: totalAllowed,
      percentage: Math.min(100, Math.round((total / totalAllowed) * 100))
    });
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleOptimizeStorage = async () => {
    setIsOptimizing(true);
    setMessage(null);
    try {
      let optimizedCount = 0;
      
      // Helper to convert base64 to File
      const dataURLtoFile = (dataurl: string, filename: string) => {
        let arr = dataurl.split(','), mime = arr[0].match(/:(.*?);/)?.[1],
            bstr = atob(arr[1]), n = bstr.length, u8arr = new Uint8Array(n);
        while(n--){
            u8arr[n] = bstr.charCodeAt(n);
        }
        return new File([u8arr], filename, {type:mime});
      };

      const teams = await fetchTeams();
      for (const team of teams) {
        if (team.logotype && team.logotype.length > 50000) { // Only compress if larger than ~50KB
          try {
            const file = dataURLtoFile(team.logotype, 'logo.png');
            const compressed = await compressImage(file, 300, 300);
            if (compressed.length < team.logotype.length) {
              await updateTeam(team.id, { logotype: compressed });
              optimizedCount++;
            }
          } catch (e) { console.error("Failed to compress team logo", e); }
        }
      }

      const tournaments = await fetchTournaments();
      for (const tournament of tournaments) {
        if (tournament.logotype && tournament.logotype.length > 50000) {
          try {
            const file = dataURLtoFile(tournament.logotype, 'logo.png');
            const compressed = await compressImage(file, 300, 300);
            if (compressed.length < tournament.logotype.length) {
              await updateTournament(tournament.id, { logotype: compressed });
              optimizedCount++;
            }
          } catch (e) { console.error("Failed to compress tournament logo", e); }
        }
      }

      calculateStorage();
      setMessage({ type: 'success', text: `Storage optimized! Compressed ${optimizedCount} images.` });
    } catch (error: any) {
      console.error('Optimization failed:', error);
      setMessage({ type: 'error', text: `Optimization failed: ${error.message}` });
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    setMessage(null);
    try {
      const data = await exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sumulasys_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setMessage({ type: 'success', text: 'Data exported successfully!' });
    } catch (error) {
      console.error('Export failed:', error);
      setMessage({ type: 'error', text: 'Failed to export data.' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/json' && !file.name.endsWith('.json')) {
      setMessage({ type: 'error', text: 'Please select a valid JSON file.' });
      return;
    }

    if (!confirm('WARNING: Importing data will OVERWRITE all current system data. This action cannot be undone. Are you sure you want to proceed?')) {
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setIsImporting(true);
    setMessage(null);

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        const result = await importData(json);
        
        if (result && result.success) {
          setMessage({ type: 'success', text: 'Data imported successfully! The page will reload.' });
          setTimeout(() => window.location.reload(), 2000);
        } else {
          throw new Error('Import failed');
        }
      } catch (error: any) {
        console.error('Import failed:', error);
        setMessage({ type: 'error', text: `Import failed: ${error.message}` });
      } finally {
        setIsImporting(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold text-white tracking-tight mb-2">System Settings</h1>
        <p className="text-gray-400">Manage your system data and configurations.</p>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Storage Optimization Section */}
        <div className="glass-panel rounded-2xl p-6 border border-white/5 shadow-lg relative overflow-hidden group md:col-span-2">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-purple-500 to-purple-600 opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-purple-500/10 flex items-center justify-center text-purple-400 border border-purple-500/20 shadow-inner">
                <Database size={24} />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">Storage Optimization</h2>
                <p className="text-sm text-gray-400">Manage local storage and compress images</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm font-medium text-white">{formatBytes(storageUsage.used)} / {formatBytes(storageUsage.total)}</p>
              <p className="text-xs text-gray-400">{storageUsage.percentage}% Used</p>
            </div>
          </div>
          
          <div className="w-full bg-dark-900 rounded-full h-2.5 mb-6 overflow-hidden border border-white/5">
            <div 
              className={`h-2.5 rounded-full ${storageUsage.percentage > 90 ? 'bg-red-500' : storageUsage.percentage > 70 ? 'bg-orange-500' : 'bg-purple-500'}`} 
              style={{ width: `${storageUsage.percentage}%` }}
            ></div>
          </div>

          <p className="text-gray-400 mb-6 text-sm leading-relaxed">
            If you are running out of space or encountering "Quota Exceeded" errors, you can optimize your storage. 
            This will compress all existing team and tournament logos to free up space without losing significant quality.
          </p>
          <button
            onClick={handleOptimizeStorage}
            disabled={isOptimizing || storageUsage.used === 0}
            className="w-full bg-purple-600 hover:bg-purple-500 text-white font-medium py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-purple-600/20 border border-purple-500/20"
          >
            {isOptimizing ? (
              <span className="animate-pulse flex items-center gap-2"><RefreshCw size={20} className="animate-spin" /> Optimizing...</span>
            ) : (
              <>
                <RefreshCw size={20} />
                Compress Existing Images
              </>
            )}
          </button>
        </div>

        {/* Export Section */}
        <div className="glass-panel rounded-2xl p-6 border border-white/5 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-blue-600 opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 border border-blue-500/20 shadow-inner">
              <Download size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Export Data</h2>
              <p className="text-sm text-gray-400">Download a backup of all system data</p>
            </div>
          </div>
          <p className="text-gray-400 mb-6 text-sm leading-relaxed">
            Create a full JSON backup of your teams, athletes, committee members, tournaments, and matches. 
            Keep this file safe to restore your data later.
          </p>
          <button
            onClick={handleExport}
            disabled={isExporting}
            className="w-full bg-blue-600 hover:bg-blue-500 text-white font-medium py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/20 border border-blue-500/20"
          >
            {isExporting ? (
              <span className="animate-pulse">Exporting...</span>
            ) : (
              <>
                <Download size={20} />
                Download Backup
              </>
            )}
          </button>
        </div>

        {/* Import Section */}
        <div className="glass-panel rounded-2xl p-6 border border-white/5 shadow-lg relative overflow-hidden group">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-orange-500 to-orange-600 opacity-50 group-hover:opacity-100 transition-opacity" />
          <div className="flex items-center gap-4 mb-4">
            <div className="w-12 h-12 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400 border border-orange-500/20 shadow-inner">
              <Upload size={24} />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">Import Data</h2>
              <p className="text-sm text-gray-400">Restore system data from a backup file</p>
            </div>
          </div>
          
          <div className="bg-orange-900/10 border border-orange-500/20 rounded-lg p-4 mb-6 flex gap-3 items-start">
            <AlertTriangle className="text-orange-500 shrink-0 mt-0.5" size={18} />
            <p className="text-orange-200/80 text-xs leading-relaxed">
              <strong className="text-orange-400">Warning:</strong> Importing data will permanently delete and overwrite all current system data. 
              This action cannot be undone. Please ensure you have a backup of your current data before proceeding.
            </p>
          </div>

          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            accept=".json,application/json"
            className="hidden"
          />
          
          <button
            onClick={handleImportClick}
            disabled={isImporting}
            className="w-full bg-white/5 hover:bg-white/10 text-white font-medium py-3 px-4 rounded-xl transition-all flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed border border-white/10 hover:border-white/20"
          >
            {isImporting ? (
              <span className="animate-pulse">Importing...</span>
            ) : (
              <>
                <Upload size={20} />
                Select Backup File
              </>
            )}
          </button>
        </div>
      </div>

      {message && (
        <div className={`p-4 rounded-xl flex items-center gap-3 backdrop-blur-md shadow-lg border ${
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
          Data Structure Info
        </h3>
        <div className="prose prose-invert prose-sm max-w-none text-gray-400">
          <p>
            The backup file is a standard JSON format containing arrays for:
          </p>
          <ul className="list-disc pl-5 space-y-1 mt-2 marker:text-orange-500">
            <li><code className="text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20">teams</code>: Team profiles and logos</li>
            <li><code className="text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20">athletes</code>: Player rosters linked to teams</li>
            <li><code className="text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20">committee</code>: Technical staff members</li>
            <li><code className="text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20">tournaments</code>: Competition details</li>
            <li><code className="text-orange-400 bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/20">matches</code>: Match schedules and results</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
