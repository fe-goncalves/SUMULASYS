import React, { useState } from 'react';
import { Link, Outlet, useLocation } from 'react-router-dom';
import { Users, Trophy, Calendar, Home, User, Briefcase, Settings, Menu, ChevronLeft, ChevronRight, Upload, Download } from 'lucide-react';
import clsx from 'clsx';
import { exportData, importData } from '../api';
import ConfirmationModal from './ConfirmationModal';

export default function Layout() {
  const location = useLocation();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);

  const navItems = [
    { name: 'TEAMS', path: '/teams' },
    { name: 'ATHLETES', path: '/athletes' },
    { name: 'COMMITTEE', path: '/committee' },
    { name: 'TOURNAMENTS', path: '/tournaments' },
    { name: 'MATCHES', path: '/matches' },
    { name: 'SETTINGS', path: '/settings' },
  ];

  async function handleExport() {
    try {
      const data = await exportData();
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `sumulas_backup_${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Export failed:', error);
      alert('Failed to export data.');
    }
  }

  function handleImportClick(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    setImportFile(file);
    setIsImportModalOpen(true);
    event.target.value = ''; // Reset input
  }

  async function confirmImport() {
    if (!importFile) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const json = JSON.parse(e.target?.result as string);
        await importData(json);
        alert('Data imported successfully! The page will reload.');
        window.location.reload();
      } catch (error) {
        console.error('Import failed:', error);
        alert('Failed to import data. Please ensure the file is a valid backup JSON.');
      }
    };
    reader.readAsText(importFile);
    setImportFile(null);
  }

  return (
    <div className="flex flex-col h-screen bg-dark-950 text-white font-sans overflow-hidden">
      {/* Main Content */}
      <div className="flex-1 overflow-auto relative bg-dark-950 pb-24">
        {/* Ambient Background Glow */}
        <div className="absolute top-0 left-0 w-full h-96 bg-gradient-to-b from-orange-500/5 to-transparent pointer-events-none" />
        
        <div className="p-8 max-w-7xl mx-auto relative z-10">
          <Outlet />
        </div>
      </div>

      {/* Bottom Navigation - Glass Effect */}
      <div className="fixed bottom-0 left-0 w-full border-t border-white/5 bg-dark-900/80 backdrop-blur-xl z-50 transition-all duration-300">
        <div className="flex items-center justify-between px-6 py-2 max-w-7xl mx-auto">
            <div className="flex items-center gap-3 mr-8">
                <div className="w-8 h-8 rounded-lg bg-orange-500 flex items-center justify-center shadow-lg shadow-orange-500/20 shrink-0">
                <Trophy size={18} className="text-black" />
                </div>
                <h1 className="text-lg font-bold tracking-tight text-white whitespace-nowrap overflow-hidden hidden md:block">
                SUMULA<span className="text-orange-500">SYS</span>
                </h1>
            </div>

            <nav className="flex-1 flex items-center justify-center gap-1 md:gap-4 overflow-x-auto custom-scrollbar">
            {navItems.map((item) => {
                const isActive = location.pathname.startsWith(item.path);
                return (
                <Link
                    key={item.path}
                    to={item.path}
                    className={clsx(
                    'flex flex-col items-center justify-center gap-1 px-3 py-2 rounded-xl transition-all duration-300 group relative overflow-hidden min-w-[80px]',
                    isActive
                        ? 'text-orange-500 font-bold bg-white/5'
                        : 'text-gray-400 hover:text-white hover:bg-white/5'
                    )}
                >
                    {isActive && (
                    <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1/2 h-0.5 bg-orange-500 rounded-t-full shadow-[0_-2px_8px_rgba(249,115,22,0.6)]" />
                    )}
                    <span className="relative z-10 whitespace-nowrap overflow-hidden text-[10px] md:text-xs uppercase tracking-wider">
                        {item.name}
                    </span>
                </Link>
                );
            })}
            </nav>

            <div className="flex items-center gap-2 ml-4">
                <button 
                    onClick={handleExport}
                    className="p-2 bg-dark-800 hover:bg-dark-700 text-gray-300 hover:text-white rounded-lg transition-colors border border-white/5"
                    title="Export Data"
                >
                    <Download size={18} />
                </button>
                <label className="p-2 bg-orange-600/10 hover:bg-orange-600/20 text-orange-500 hover:text-orange-400 rounded-lg transition-colors border border-orange-500/20 cursor-pointer" title="Import Data">
                    <Upload size={18} />
                    <input type="file" accept=".json" onChange={handleImportClick} className="hidden" />
                </label>
            </div>
        </div>
      </div>

      {/* Import Confirmation Modal */}
      <ConfirmationModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onConfirm={confirmImport}
        title="Confirm Data Import"
        message="WARNING: Importing data will OVERWRITE all existing data. This action cannot be undone. Are you sure you want to proceed?"
        confirmText="Yes, Import Data"
        isDestructive={true}
      />
    </div>
  );
}
