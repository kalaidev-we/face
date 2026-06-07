import { create } from 'zustand';
import { type UserSession, getCurrentSession } from '../lib/db';
import { isSupabaseConfigured } from '../lib/supabaseClient';

interface GlobalState {
  session: UserSession['user'] | null;
  isDark: boolean;
  activeCamera: string | null;
  availableCameras: MediaDeviceInfo[];
  isSupabaseMode: boolean;
  isOffline: boolean;
  
  // Actions
  setSession: (session: UserSession['user'] | null) => void;
  toggleTheme: () => void;
  setActiveCamera: (cameraId: string | null) => void;
  setAvailableCameras: (cameras: MediaDeviceInfo[]) => void;
  checkSupabaseMode: () => void;
  setOfflineStatus: (status: boolean) => void;
}

export const useStore = create<GlobalState>((set, get) => ({
  session: getCurrentSession().user,
  isDark: localStorage.getItem('ft_theme') !== 'light', // Default dark
  activeCamera: localStorage.getItem('ft_active_camera'),
  availableCameras: [],
  isSupabaseMode: isSupabaseConfigured(),
  isOffline: !navigator.onLine,

  setSession: (user) => set({ session: user }),
  
  toggleTheme: () => {
    const nextDark = !get().isDark;
    localStorage.setItem('ft_theme', nextDark ? 'dark' : 'light');
    
    // Toggle DOM class
    const body = document.body;
    if (nextDark) {
      body.classList.remove('light-mode');
    } else {
      body.classList.add('light-mode');
    }
    
    set({ isDark: nextDark });
  },

  setActiveCamera: (cameraId) => {
    if (cameraId) {
      localStorage.setItem('ft_active_camera', cameraId);
    } else {
      localStorage.removeItem('ft_active_camera');
    }
    set({ activeCamera: cameraId });
  },

  setAvailableCameras: (cameras) => set({ availableCameras: cameras }),
  
  checkSupabaseMode: () => set({ isSupabaseMode: isSupabaseConfigured() }),
  
  setOfflineStatus: (status) => set({ isOffline: status })
}));

// Set up online/offline event listeners
if (typeof window !== 'undefined') {
  window.addEventListener('online', () => useStore.getState().setOfflineStatus(false));
  window.addEventListener('offline', () => useStore.getState().setOfflineStatus(true));
  
  // Set initial theme on body
  const isDark = localStorage.getItem('ft_theme') !== 'light';
  if (!isDark) {
    document.body.classList.add('light-mode');
  }
}
