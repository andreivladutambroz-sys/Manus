import { useState, useEffect } from 'react';

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
}

const FAVORITES_STORAGE_KEY = 'mechanic-helper-favorites';

export function useFavorites() {
  const [favorites, setFavorites] = useState<FavoriteCase[]>([]);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load favorites from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(FAVORITES_STORAGE_KEY);
      if (stored) {
        setFavorites(JSON.parse(stored));
      }
    } catch (error) {
      console.error('Error loading favorites:', error);
    }
    setIsLoaded(true);
  }, []);

  // Save favorites to localStorage whenever they change
  useEffect(() => {
    if (isLoaded) {
      try {
        localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
      } catch (error) {
        console.error('Error saving favorites:', error);
      }
    }
  }, [favorites, isLoaded]);

  const addFavorite = (caseData: FavoriteCase) => {
    setFavorites(prev => {
      // Check if already exists
      if (prev.some(fav => fav.id === caseData.id)) {
        return prev;
      }
      return [...prev, caseData];
    });
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

  return {
    favorites,
    addFavorite,
    removeFavorite,
    isFavorite,
    toggleFavorite,
    updateNote,
    deleteNote,
    isLoaded,
  };
}
