import React, { useState } from 'react';
import { X, Plus, Trash2, Pencil, Check, Info } from 'lucide-react';
import { useLevels } from '../../context/LevelContext';
import { motion, AnimatePresence } from 'framer-motion';

const ManageLevelsModal = ({ isOpen, onClose }) => {
  const { levels, addLevel, removeLevel, updateLevel } = useLevels();
  const [newLevelName, setNewLevelName] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');

  if (!isOpen) return null;

  const handleAdd = (e) => {
    e.preventDefault();
    if (newLevelName.trim()) {
      addLevel(newLevelName.trim());
      setNewLevelName('');
    }
  };

  const startEdit = (level) => {
    setEditingId(level.id);
    setEditValue(level.name);
  };

  const handleUpdate = (id) => {
    if (editValue.trim()) {
      updateLevel(id, editValue.trim());
      setEditingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-[1001] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-white w-full max-w-md p-6 rounded-2xl shadow-2xl border border-slate-200"
      >
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Manage Levels</h3>
            <p className="text-xs text-slate-400 font-medium mt-0.5">Customize your organization's hierarchy</p>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-slate-100 text-slate-400 transition-colors">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleAdd} className="flex gap-2 mb-6">
          <input
            type="text"
            value={newLevelName}
            onChange={(e) => setNewLevelName(e.target.value)}
            placeholder="Level name (e.g. Lead Developer)"
            className="flex-1 h-10 px-4 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-600/20 focus:border-indigo-600 outline-none transition-all text-sm font-medium"
          />
          <button 
            type="submit"
            disabled={!newLevelName.trim()}
            className="h-10 px-4 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 text-white rounded-xl font-bold text-sm transition-all flex items-center gap-2 shadow-lg shadow-indigo-600/20"
          >
            <Plus size={16} />
            <span>Add</span>
          </button>
        </form>

        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
          <AnimatePresence>
            {levels.map((level) => (
              <motion.div 
                key={level.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center justify-between p-3 bg-slate-50 border border-slate-100 rounded-xl group hover:bg-white hover:border-indigo-100 transition-all"
              >
                {editingId === level.id ? (
                  <div className="flex-1 flex gap-2 mr-2">
                    <input
                      type="text"
                      autoFocus
                      value={editValue}
                      onChange={(e) => setEditValue(e.target.value)}
                      className="flex-1 px-2 py-1 bg-white border border-indigo-200 rounded-lg outline-none text-sm font-bold text-indigo-700"
                    />
                    <button onClick={() => handleUpdate(level.id)} className="p-1.5 bg-emerald-100 text-emerald-700 rounded-lg hover:bg-emerald-200 transition-colors">
                      <Check size={16} />
                    </button>
                  </div>
                ) : (
                  <span className="text-sm font-bold text-slate-700 truncate">{level.name}</span>
                )}
                
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  {!level.isDefault && (
                    <>
                      <button 
                        onClick={() => startEdit(level)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                      >
                        <Pencil size={14} />
                      </button>
                      <button 
                        onClick={() => removeLevel(level.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                      >
                        <Trash2 size={14} />
                      </button>
                    </>
                  )}
                  {level.isDefault && (
                    <span className="text-[10px] font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full mr-1">
                      System
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        <div className="mt-6 p-3 bg-amber-50 rounded-xl border border-amber-100 flex gap-3">
          <Info size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
          <p className="text-[10px] leading-relaxed text-amber-700 font-medium">
            Dynamic levels allow you to label roles according to your structure. Backend enforcement for specific authorities remains tied to standardized level rankings.
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default ManageLevelsModal;
