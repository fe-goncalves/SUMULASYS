import React from 'react';
import { Link } from 'react-router-dom';
import { Trash } from 'lucide-react';
import { motion } from 'framer-motion';
import { useDominantColor } from '../hooks/useDominantColor';

interface TeamCardProps {
  team: any;
  onDelete: (id: string, e: React.MouseEvent) => void;
}

export default function TeamCard({ team, onDelete }: TeamCardProps) {
  const dominantColor = useDominantColor(team.logotype, team.main_color || '#f97316');

  return (
    <Link to={`/teams/${team.id}`}>
      <motion.div 
        whileHover={{ scale: 1.02 }}
        className="bg-dark-800 p-6 rounded-2xl border border-white/5 transition-all duration-300 flex flex-col items-center text-center group relative overflow-hidden h-full"
        style={{
            '--hover-color': dominantColor,
        } as React.CSSProperties}
      >
        {/* Dynamic Hover Border & Glow */}
        <div className="absolute inset-0 rounded-2xl border-2 border-transparent group-hover:border-[var(--hover-color)] transition-colors duration-300 pointer-events-none" />
        <div className="absolute inset-0 bg-[var(--hover-color)] opacity-0 group-hover:opacity-5 transition-opacity duration-300 pointer-events-none" />
        
        <div className="absolute top-4 right-4 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
            <button 
                onClick={(e) => onDelete(team.id, e)}
                className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
            >
                <Trash size={16} />
            </button>
        </div>

        <div 
            className="w-24 h-24 bg-dark-900 rounded-2xl mb-4 flex items-center justify-center overflow-hidden ring-1 ring-white/10 transition-all shadow-xl relative z-10 group-hover:shadow-[0_0_20px_var(--hover-color)] group-hover:ring-[var(--hover-color)]"
        >
        {team.logotype ? (
            <img src={team.logotype} alt={team.fullname} className="w-full h-full object-cover" />
        ) : (
            <span className="text-2xl font-bold text-gray-600 group-hover:text-[var(--hover-color)] transition">{team.shortname?.[0]}</span>
        )}
        </div>
        
        <div className="relative z-10">
        <h3 className="text-xl font-bold text-white group-hover:text-[var(--hover-color)] transition-colors">{team.fullname}</h3>
        <div className="flex items-center justify-center gap-2 mt-2">
            <span className="px-2 py-0.5 rounded-md bg-white/5 border border-white/5 text-xs font-mono text-gray-500 group-hover:text-gray-300 transition-colors">
            {team.id}
            </span>
            <span className="text-sm text-gray-500">{team.shortname}</span>
        </div>
        </div>
      </motion.div>
    </Link>
  );
}
