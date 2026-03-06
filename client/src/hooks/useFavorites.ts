import { useState, useEffect } from 'react';

export type RepairStatus = 'pending' | 'in progress' | 'completed' | 'resolved' | 'not fixed';

export const STATUS_COLORS: Record<RepairStatus, string> = {
  'pending': 'bg-slate-600 text-slate-100',
  'in progress': 'bg-blue-600 text-white',
  'completed': 'bg-green-600 text-white',
  'resolved': 'bg-emerald-600 text-white',
  'not fixed': 'bg-red-600 text-white'
};

export const STATUS_LABELS: Record<RepairStatus, string> = {
  'pending': 'Pending',
  'in progress': 'In Progress',
  'completed': 'Completed',
  'resolved': 'Resolved',
  'not fixed': 'Not Fixed'
};

export interface FavoriteCase {
  id: number;
  vehicleMake: string;
  vehicleModel: string;
  year?: number;
  engine?: string;
  errorCode: string;
  confidence: string;
  symptoms: string[];
  sourceUrl: string;
  notes?: string;
  status?: RepairStatus;
  resolvedDate?: string;
  repairAction?: string;
  toolsUsed?: string[];
  repairTimeHours?: number;
  repairCostEstimate?: number;
}

const FAVORITES_STORAGE_KEY = 'mechanic-helper-favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteCase[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Ensure all favorites have a status (backward compatibility)
        const withDefaults = parsed.map((fav: FavoriteCase) => ({
          ...fav,
          status: fav.status || 'pending'
        }));
        setFavorites(withDefaults);
      }
    } catch (error) {
      console.error('Failed to load favorites:', error);
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever favorites change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
    }
  }, [favorites, isLoaded]);

  const addFavorite = (caseData: FavoriteCase) => {
    if (!isFavorite(caseData.id)) {
      setFavorites(prev => [...prev, { ...caseData, status: 'pending' }]);
    }
  };

  const removeFavorite = (caseId: number) => {
    setFavorites(prev => prev.filter(fav => fav.id !== caseId));
  };

  const isFavorite = (caseId: number) => {
    return favorites.some(fav => fav.id === caseId);
  };

  const toggleFavorite = (caseData: FavoriteCase) => {
    if (isFavorite(caseData.id)) {
      removeFavorite(caseData.id);
    } else {
      addFavorite(caseData);
    }
  };

  const updateNote = (caseId: number, note: string) => {
    setFavorites(prev =>
      prev.map(fav =>
        fav.id === caseId
          ? { ...fav, notes: note.trim() || undefined }
          : fav
      )
    );
  };

  const deleteNote = (caseId: number) => {
    setFavorites(prev =>
      prev.map(fav =>
        fav.id === caseId
          ? { ...fav, notes: undefined }
          : fav
      )
    );
  };

  const updateStatus = (caseId: number, status: RepairStatus | undefined) => {
    setFavorites(prev =>
      prev.map(fav =>
        fav.id === caseId
          ? {
              ...fav,
              status: status || 'pending',
              resolvedDate: (status === 'resolved' || status === 'completed') && !fav.resolvedDate
                ? new Date().toISOString().split('T')[0]
                : fav.resolvedDate
            }
          : fav
      )
    );
  };

  return {
    favorites,
    addFavorite,
    removeFavorite,
    isFavorite,
    toggleFavorite,
    updateNote,
    deleteNote,
    updateStatus,
    isLoaded,
  };
}
