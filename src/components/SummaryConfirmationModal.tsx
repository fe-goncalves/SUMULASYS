import React from 'react';
import { CheckCircle, X } from 'lucide-react';

interface SummaryConfirmationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  data: Record<string, any>;
  confirmText?: string;
  cancelText?: string;
}

export default function SummaryConfirmationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  data,
  confirmText = 'Confirm & Save',
  cancelText = 'Back to Edit',
}: SummaryConfirmationModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
      <div className="bg-dark-900 border border-white/10 rounded-2xl w-full max-w-md shadow-2xl relative overflow-hidden scale-100 animate-in zoom-in-95 duration-200">
        <div className="absolute top-0 left-0 w-full h-1 bg-green-500" />
        
        <div className="p-6">
          <div className="flex items-start gap-4 mb-6">
            <div className="p-3 rounded-full shrink-0 bg-green-500/10 text-green-500">
              <CheckCircle size={24} />
            </div>
            <div className="flex-1">
              <h3 className="text-xl font-bold text-white mb-2">{title}</h3>
              <p className="text-gray-400 text-sm">Please review the details below before confirming.</p>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-white transition-colors"
            >
              <X size={20} />
            </button>
          </div>

          <div className="bg-white/5 rounded-xl p-4 space-y-3 mb-8 max-h-[60vh] overflow-y-auto custom-scrollbar">
            {Object.entries(data).map(([key, value]) => {
              if (value === null || value === undefined || value === '') return null;
              
              // Handle Logotype/Image preview
              if (key === 'logotype' && typeof value === 'string' && value.startsWith('data:')) {
                 return (
                    <div key={key} className="flex flex-col gap-1 border-b border-white/5 last:border-0 pb-2 last:pb-0">
                        <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{key.replace(/_/g, ' ')}</span>
                        <div className="w-16 h-16 rounded-lg overflow-hidden border border-white/10 bg-dark-800">
                            <img src={value} alt="Logo preview" className="w-full h-full object-cover" />
                        </div>
                    </div>
                 );
              }

              // Skip FileList objects or other non-renderable objects if they slipped through
              if (typeof value === 'object' && value !== null) return null;
              
              return (
                <div key={key} className="flex flex-col gap-1 border-b border-white/5 last:border-0 pb-2 last:pb-0">
                  <span className="text-xs font-medium text-gray-500 uppercase tracking-wider">{key.replace(/_/g, ' ')}</span>
                  <span className="text-white font-medium break-words">{String(value)}</span>
                </div>
              );
            })}
          </div>

          <div className="flex justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-400 hover:text-white hover:bg-white/5 rounded-lg transition-colors font-medium text-sm"
            >
              {cancelText}
            </button>
            <button
              onClick={() => {
                onConfirm();
                onClose();
              }}
              className="px-6 py-2 rounded-lg text-white font-medium text-sm shadow-lg transition-all bg-green-600 hover:bg-green-500 shadow-green-600/20"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
