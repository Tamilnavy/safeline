import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';
import { useAuth } from './AuthContext';

const LevelContext = createContext();

export const LevelProvider = ({ children }) => {
  const [levels, setLevels] = useState([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (user) {
      handleMigrationAndFetch();
    } else {
      // Offline/Unauthenticated defaults
      const defaultLevels = [
        { id: 'LEVEL_1', name: 'Admin', value: 'LEVEL_1', isDefault: true },
        { id: 'LEVEL_2', name: 'HR/Management', value: 'LEVEL_2', isDefault: true },
        { id: 'LEVEL_3', name: 'Employee', value: 'LEVEL_3', isDefault: true }
      ];
      setLevels(defaultLevels);
      setLoading(false);
    }
  }, [user]);

  const handleMigrationAndFetch = async () => {
    setLoading(true);
    try {
      // 1. Check for legacy localStorage levels
      const saved = localStorage.getItem('safeline_hierarchy_levels');
      if (saved) {
        const legacyLevels = JSON.parse(saved);
        const customLegacy = legacyLevels.filter(l => !l.isDefault);
        
        if (customLegacy.length > 0) {
          console.log(`Migrating ${customLegacy.length} legacy levels to backend...`);
          // Sync them one by one to the backend
          for (const legacy of customLegacy) {
            try {
              await api.post('/levels', { name: legacy.name, technicalId: legacy.id });
            } catch (err) {
              console.warn(`Failed to migrate level ${legacy.name}`, err);
            }
          }
          // Clear legacy storage so we don't migrate again
          localStorage.removeItem('safeline_hierarchy_levels');
        }
      }
    } catch (err) {
      console.error('Migration framework failed', err);
    }
    await fetchLevels();
  };

  const fetchLevels = async () => {
    try {
      const resp = await api.get('/levels');
      const mapped = resp.data.map(l => ({
        id: l.technicalId,
        dbId: l.id,
        name: l.name,
        value: l.technicalId,
        isDefault: l.isDefault
      }));
      setLevels(mapped);
    } catch (err) {
      console.error('Failed to fetch hierarchy levels', err);
      if (err.response?.status !== 401) {
        alert('Failed to load levels from server: ' + (err.response?.data?.message || err.message));
      }
    } finally {
      setLoading(false);
    }
  };

  const addLevel = async (name) => {
    try {
      await api.post('/levels', { name });
      await fetchLevels();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to add level. You may not have permission.';
      alert(msg);
      console.error('Failed to add level', err);
    }
  };

  const removeLevel = async (id) => {
    const level = levels.find(l => l.id === id);
    if (!level || level.isDefault) return;
    try {
      await api.delete(`/levels/${level.dbId}`);
      await fetchLevels();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to delete level';
      alert(msg);
    }
  };

  const updateLevel = async (id, newName) => {
    const level = levels.find(l => l.id === id);
    if (!level || level.isDefault) return;
    try {
      await api.put(`/levels/${level.dbId}`, { name: newName });
      await fetchLevels();
    } catch (err) {
      const msg = err.response?.data?.message || 'Failed to update level';
      alert(msg);
      console.error('Failed to update level', err);
    }
  };

  const getLevelName = (id) => {
    if (!id) return '';
    if (id === 'SUPER_ADMIN') return 'Super Admin';
    const normalizedId = id.toString().trim().toUpperCase();
    const level = levels.find(l => l.id.toUpperCase() === normalizedId);
    return level ? level.name : id.replace(/_/g, ' ');
  };

  const getLevelNumber = (id) => {
    if (!id) return '';
    if (id === 'SUPER_ADMIN') return '0';
    const normalizedId = id.toString().trim().toUpperCase();
    const index = levels.findIndex(l => l.id.toUpperCase() === normalizedId);
    return index !== -1 ? (index + 1).toString() : '';
  };

  return (
    <LevelContext.Provider value={{ levels, addLevel, removeLevel, updateLevel, getLevelName, getLevelNumber }}>
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
