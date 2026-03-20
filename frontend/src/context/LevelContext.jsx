import React, { createContext, useContext, useState, useEffect } from 'react';

const LevelContext = createContext();

export const LevelProvider = ({ children }) => {
  const [levels, setLevels] = useState(() => {
    const saved = localStorage.getItem('safeline_hierarchy_levels');
    const defaultLevels = [
      { id: 'LEVEL_1', name: 'Admin', value: 'LEVEL_1', isDefault: true },
      { id: 'LEVEL_2', name: 'HR/Management', value: 'LEVEL_2', isDefault: true },
      { id: 'LEVEL_3', name: 'Employee', value: 'LEVEL_3', isDefault: true }
    ];
    
    let parsed = saved ? JSON.parse(saved) : defaultLevels;
    
    // Force-merge defaults to ensure LEVEL_1, LEVEL_2, LEVEL_3 always exist with correct isDefault flag
    const merged = [...defaultLevels];
    parsed.forEach(p => {
      if (!merged.find(m => m.id === p.id)) {
        merged.push(p);
      }
    });
    
    return merged;
  });

  useEffect(() => {
    localStorage.setItem('safeline_hierarchy_levels', JSON.stringify(levels));
  }, [levels]);

  const addLevel = (name) => {
    const newLevel = {
      id: `LEVEL_${Date.now()}`,
      name,
      value: `LEVEL_${Date.now()}`,
      isDefault: false
    };
    setLevels([...levels, newLevel]);
  };

  const removeLevel = (id) => {
    const level = levels.find(l => l.id === id);
    if (level?.isDefault) return; // Protect default levels
    setLevels(levels.filter(l => l.id !== id));
  };

  const updateLevel = (id, newName) => {
    const level = levels.find(l => l.id === id);
    if (level?.isDefault) return; // Protect default levels
    setLevels(levels.map(l => l.id === id ? { ...l, name: newName } : l));
  };

  const getLevelName = (id) => {
    if (!id) return '';
    if (id === 'SUPER_ADMIN') return 'Super Admin';
    const normalizedId = id.toString().trim().toUpperCase();
    const level = levels.find(l => l.id.toUpperCase() === normalizedId);
    return level ? level.name : id.replace(/_/g, ' ');
  };

  return (
    <LevelContext.Provider value={{ levels, addLevel, removeLevel, updateLevel, getLevelName }}>
      {children}
    </LevelContext.Provider>
  );
};

export const useLevels = () => {
  const context = useContext(LevelContext);
  if (!context) {
    throw new Error('useLevels must be used within a LevelProvider');
  }
  return context;
};
