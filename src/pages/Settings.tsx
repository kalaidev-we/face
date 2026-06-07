import { useState, useEffect } from 'react';
import { Shield, MapPin, Database, Terminal, RefreshCw, Save, Trash2 } from 'lucide-react';
import { useStore } from '../store/useStore';
import { getSupabaseConfig } from '../lib/supabaseClient';
import { fetchAuditLogs } from '../lib/db';
import type { AuditLog } from '../lib/db';
import { toast } from 'sonner';

export default function SettingsPage() {
  const { isSupabaseMode, checkSupabaseMode } = useStore();
  
  // Supabase keys state
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseAnonKey, setSupabaseAnonKey] = useState('');
  
  // Geofence states
  const [latitude, setLatitude] = useState('37.7749');
  const [longitude, setLongitude] = useState('-122.4194');
  const [radius, setRadius] = useState('200');

  // Logs state
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);

  useEffect(() => {
    // Load Supabase config from client
    const config = getSupabaseConfig();
    setSupabaseUrl(config.url);
    setSupabaseAnonKey(config.key);

    // Load geofence config
    setLatitude(localStorage.getItem('ft_geofence_lat') || '37.7749');
    setLongitude(localStorage.getItem('ft_geofence_lng') || '-122.4194');
    setRadius(localStorage.getItem('ft_geofence_radius') || '200');

    loadSettingsData();
  }, []);

  const loadSettingsData = async () => {
    const logs = await fetchAuditLogs();
    setAuditLogs(logs);
  };

  const saveSupabaseConfig = () => {
    if (supabaseUrl.trim() && supabaseAnonKey.trim()) {
      localStorage.setItem('supabase_url', supabaseUrl.trim());
      localStorage.setItem('supabase_anon_key', supabaseAnonKey.trim());
      checkSupabaseMode();
      toast.success('Supabase integration credentials saved! Re-routing DB gateway.');
    } else {
      toast.error('Supabase URL and Anon API key are required.');
    }
  };

  const clearSupabaseConfig = () => {
    localStorage.removeItem('supabase_url');
    localStorage.removeItem('supabase_anon_key');
    setSupabaseUrl('');
    setSupabaseAnonKey('');
    checkSupabaseMode();
    toast.info('Supabase credentials cleared. Switched back to browser Mock Mode.');
  };

  const saveGeofenceConfig = () => {
    localStorage.setItem('ft_geofence_lat', latitude.trim());
    localStorage.setItem('ft_geofence_lng', longitude.trim());
    localStorage.setItem('ft_geofence_radius', radius.trim());
    toast.success('Geofencing boundaries updated!');
  };

  // handleAddBranch removed as branches are managed under the Departments & Hierarchy view.

  const resetLocalMockDb = () => {
    // Purge local storage caches
    const keys = ['ft_students', 'ft_staff', 'ft_attendance', 'ft_branches', 'ft_departments', 'ft_classes', 'ft_audit_logs'];
    keys.forEach(k => localStorage.removeItem(k));
    toast.success('Mock database reset! Seed data will be recompiled on dashboard refresh.');
    setTimeout(() => window.location.reload(), 1500);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold font-display">System Configuration</h1>
        <p className="text-xs text-gray-400 mt-1">Configure database pathways, geofencing, multi-campus hubs, and view audit trails.</p>
      </div>

      {/* Grid: Database Setup & Geofencing */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Supabase Connection */}
        <div className="glass-panel rounded-2xl p-6 border border-white/5 space-y-6">
          <div className="flex items-center space-x-2 text-primary font-bold uppercase tracking-wider text-[11px] border-b border-white/5 pb-3">
            <Database className="w-5 h-5" />
            <span>Supabase Database Integration</span>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1.5 font-mono">Project API URL</label>
              <input
                type="text"
                value={supabaseUrl}
                onChange={(e) => setSupabaseUrl(e.target.value)}
                placeholder="https://your-project.supabase.co"
                className="w-full px-3 py-2 bg-slate-900/30 border border-white/10 rounded-xl focus:border-primary focus:outline-none text-xs"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1.5 font-mono">Project Anon Key</label>
              <input
                type="password"
                value={supabaseAnonKey}
                onChange={(e) => setSupabaseAnonKey(e.target.value)}
                placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                className="w-full px-3 py-2 bg-slate-900/30 border border-white/10 rounded-xl focus:border-primary focus:outline-none text-xs"
              />
            </div>

            <div className="flex space-x-3 pt-2">
              {isSupabaseMode ? (
                <button
                  onClick={clearSupabaseConfig}
                  className="flex-1 py-2 border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-400 font-bold rounded-xl text-xs transition-all cursor-pointer"
                >
                  Disconnect Supabase
                </button>
              ) : null}
              <button
                onClick={saveSupabaseConfig}
                className="flex-1 py-2 bg-primary hover:bg-primary-hover text-white font-bold rounded-xl text-xs shadow-lg transition-all cursor-pointer flex items-center justify-center space-x-1"
              >
                <Save className="w-3.5 h-3.5" />
                <span>Connect Live Database</span>
              </button>
            </div>
            
            <div className="text-[10px] text-gray-500 leading-relaxed pt-2">
              {!isSupabaseMode ? (
                <span className="text-amber-500 font-semibold">ℹ Currently running in Mock Local Mode. Face data is saved inside your browser session.</span>
              ) : (
                <span className="text-emerald-400 font-semibold">✓ Connected to live Supabase backend. Vector tables and storage buckets are active.</span>
              )}
            </div>
          </div>
        </div>

        {/* Campus Geofence limits */}
        <div className="glass-panel rounded-2xl p-6 border border-white/5 space-y-6">
          <div className="flex items-center space-x-2 text-accent font-bold uppercase tracking-wider text-[11px] border-b border-white/5 pb-3">
            <MapPin className="w-5 h-5" />
            <span>Campus Boundary Geofencing</span>
          </div>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1.5 font-mono">Latitude Coordinates</label>
                <input
                  type="text"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="37.7749"
                  className="w-full px-3 py-2 bg-slate-900/30 border border-white/10 rounded-xl focus:border-primary focus:outline-none text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1.5 font-mono">Longitude Coordinates</label>
                <input
                  type="text"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="-122.4194"
                  className="w-full px-3 py-2 bg-slate-900/30 border border-white/10 rounded-xl focus:border-primary focus:outline-none text-xs"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1.5 font-mono">Radius Boundary Lock (meters)</label>
              <input
                type="number"
                value={radius}
                onChange={(e) => setRadius(e.target.value)}
                placeholder="200"
                className="w-full px-3 py-2 bg-slate-900/30 border border-white/10 rounded-xl focus:border-primary focus:outline-none text-xs"
              />
            </div>

            <button
              onClick={saveGeofenceConfig}
              className="w-full py-2 bg-accent hover:opacity-95 text-white font-bold rounded-xl text-xs shadow-lg transition-all cursor-pointer flex items-center justify-center space-x-1"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Apply Boundary Lock</span>
            </button>
          </div>
        </div>

      </div>

      {/* Grid: System Audit Logs Terminal Shell & Branch list */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Terminal Logs (2 columns) */}
        <div className="lg:col-span-2 glass-panel rounded-2xl p-6 border border-white/5 space-y-4">
          <div className="flex justify-between items-center border-b border-white/5 pb-3">
            <div className="flex items-center space-x-2 text-primary font-bold uppercase tracking-wider text-[11px]">
              <Terminal className="w-5 h-5" />
              <span>System Audit Logs Trail</span>
            </div>
            
            <button 
              onClick={loadSettingsData}
              className="p-1 rounded bg-white/5 hover:bg-white/10 text-gray-400"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>

          {/* Scrolling Terminal Mock Log */}
          <div className="bg-slate-950 p-4 rounded-xl border border-white/5 h-64 overflow-y-auto font-mono text-[10px] text-gray-400 space-y-2">
            {auditLogs.length > 0 ? (
              auditLogs.map((log: AuditLog) => (
                <div key={log.id} className="flex items-start space-x-2">
                  <span className="text-primary select-none">&gt;</span>
                  <span className="text-gray-600">[{new Date(log.timestamp).toLocaleTimeString()}]</span>
                  <span className="text-gray-300">{log.action}</span>
                </div>
              ))
            ) : (
              <div className="text-center text-gray-600 py-12">No audit logs logged in system cache yet.</div>
            )}
          </div>
        </div>

        {/* Database Control Panel */}
        <div className="glass-panel rounded-2xl p-6 border border-white/5 space-y-6">
          <div className="flex items-center space-x-2 text-red-500 font-bold uppercase tracking-wider text-[11px] border-b border-white/5 pb-3">
            <Shield className="w-5 h-5" />
            <span>Database Maintenance</span>
          </div>

          <p className="text-xs text-gray-400 leading-relaxed">
            Perform administrative maintenance on your local database cache. This will clean and re-seed all default tables.
          </p>

          <button 
            onClick={resetLocalMockDb}
            className="w-full py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/25 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center justify-center space-x-1"
          >
            <Trash2 className="w-4 h-4" />
            <span>Reset Local Database</span>
          </button>
        </div>

      </div>
    </div>
  );
}
