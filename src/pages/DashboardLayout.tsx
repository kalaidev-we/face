import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation, Outlet } from 'react-router-dom';
import { 
  Camera, LayoutDashboard, Users, UserCheck, Layers, 
  BarChart3, FileSpreadsheet, Settings, LogOut, Sun, Moon, 
  Search, Menu, X, Wifi, WifiOff, CornerDownRight 
} from 'lucide-react';
import { useStore } from '../store/useStore';
import { logoutUser, fetchStudents, fetchStaff, fetchClasses, fetchDepartments } from '../lib/db';
import type { Student, Staff, Class, Department } from '../lib/db';
import { toast } from 'sonner';

export default function DashboardLayout() {
  const navigate = useNavigate();
  const location = useLocation();
  const { session, setSession, isDark, toggleTheme, isOffline } = useStore();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<{
    students: Student[];
    staff: Staff[];
    classes: Class[];
    departments: Department[];
  }>({ students: [], staff: [], classes: [], departments: [] });
  const [searchFocused, setSearchFocused] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!session) {
      navigate('/login');
    }
  }, [session, navigate]);

  // Handle click outside search results popover
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Perform search query
  useEffect(() => {
    const runSearch = async () => {
      if (searchQuery.trim().length < 2) {
        setSearchResults({ students: [], staff: [], classes: [], departments: [] });
        return;
      }
      
      const q = searchQuery.toLowerCase().trim();
      const students = await fetchStudents();
      const staff = await fetchStaff();
      const classes = await fetchClasses();
      const depts = await fetchDepartments();

      setSearchResults({
        students: students.filter(s => s.name.toLowerCase().includes(q) || s.register_number.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)).slice(0, 4),
        staff: staff.filter(s => s.name.toLowerCase().includes(q) || s.email.toLowerCase().includes(q)).slice(0, 4),
        classes: classes.filter(c => c.name.toLowerCase().includes(q)).slice(0, 4),
        departments: depts.filter(d => d.name.toLowerCase().includes(q)).slice(0, 4)
      });
    };

    const timer = setTimeout(runSearch, 150);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleLogout = async () => {
    await logoutUser();
    setSession(null);
    toast.success('Logged out successfully');
    navigate('/');
  };

  if (!session) return null;

  const role = session.role;

  // Sidebar navigation items depending on role
  const menuItems = [
    { name: 'Overview', path: '/dashboard/overview', icon: <LayoutDashboard className="w-5 h-5" />, roles: ['super_admin', 'staff', 'student'] },
    { name: 'Live Attendance', path: '/dashboard/attendance', icon: <Camera className="w-5 h-5" />, roles: ['super_admin', 'staff'] },
    { name: 'Students', path: '/dashboard/students', icon: <Users className="w-5 h-5" />, roles: ['super_admin', 'staff'] },
    { name: 'Staff Management', path: '/dashboard/staff', icon: <UserCheck className="w-5 h-5" />, roles: ['super_admin'] },
    { name: 'Departments & Classes', path: '/dashboard/departments', icon: <Layers className="w-5 h-5" />, roles: ['super_admin'] },
    { name: 'Analytics Trends', path: '/dashboard/analytics', icon: <BarChart3 className="w-5 h-5" />, roles: ['super_admin', 'staff', 'student'] },
    { name: 'Reports Center', path: '/dashboard/reports', icon: <FileSpreadsheet className="w-5 h-5" />, roles: ['super_admin', 'staff', 'student'] },
    { name: 'Settings', path: '/dashboard/settings', icon: <Settings className="w-5 h-5" />, roles: ['super_admin', 'settings_staff'] },
  ];

  // Map settings access to admin role
  const filteredMenuItems = menuItems.filter(item => 
    item.roles.includes(role) || (item.name === 'Settings' && role === 'staff') // Let staff view basic settings too
  );

  const hasSearchResults = 
    searchResults.students.length > 0 || 
    searchResults.staff.length > 0 || 
    searchResults.classes.length > 0 || 
    searchResults.departments.length > 0;

  return (
    <div className={`min-h-screen flex transition-colors duration-300 ${isDark ? 'bg-dark-bg text-gray-100' : 'bg-light-bg text-gray-800'}`}>
      
      {/* Sidebar - Desktop */}
      <aside className="hidden lg:flex flex-col w-64 glass-panel border-r border-opacity-10 h-screen sticky top-0">
        <div className="p-6 flex items-center space-x-3 border-b border-white/5">
          <div className="p-1.5 bg-gradient-to-tr from-primary to-secondary rounded-lg text-white">
            <Camera className="w-5 h-5" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            FaceTrack AI
          </span>
        </div>

        <nav className="flex-1 px-4 py-6 space-y-1.5 overflow-y-auto">
          {filteredMenuItems.map((item, idx) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={idx}
                to={item.path}
                className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  isActive 
                    ? 'bg-primary/10 text-primary border border-primary/20 shadow-md shadow-primary/5' 
                    : 'hover:bg-white/5 text-gray-400 hover:text-gray-200 border border-transparent'
                }`}
              >
                {item.icon}
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>

        {/* User Card */}
        <div className="p-4 border-t border-white/5 bg-slate-900/10 dark:bg-black/20">
          <div className="flex items-center space-x-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center text-white font-bold text-sm">
              {session.name.substring(0, 2)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold text-gray-300 truncate">{session.name}</p>
              <p className="text-[10px] text-gray-500 capitalize truncate">{session.role.replace('_', ' ')}</p>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 border border-white/5 hover:border-red-500/20 hover:bg-red-500/5 text-red-400 rounded-xl text-xs font-bold transition-all cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
            <span>Logout Account</span>
          </button>
        </div>
      </aside>

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 overflow-x-hidden">
        
        {/* Header */}
        <header className="sticky top-0 z-40 glass-panel border-b border-opacity-10 py-3.5 px-6 flex justify-between items-center bg-slate-900/20 backdrop-blur-md">
          
          {/* Left: Mobile Menu Toggle & Global Search */}
          <div className="flex items-center space-x-4 flex-1 max-w-lg">
            <button 
              onClick={() => setMobileMenuOpen(true)}
              className="lg:hidden p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-gray-200 transition-colors"
            >
              <Menu className="w-6 h-6" />
            </button>

            {/* Global Search Box */}
            <div className="relative w-full" ref={searchRef}>
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 pointer-events-none">
                <Search className="w-4 h-4" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onFocus={() => setSearchFocused(true)}
                placeholder="Global search (students, staff, classes)..."
                className="w-full pl-9 pr-4 py-2 bg-slate-900/30 border border-white/10 rounded-xl text-xs font-medium focus:border-primary focus:outline-none transition-colors"
              />
              
              {/* Search Results Popover */}
              {searchFocused && searchQuery.trim().length >= 2 && (
                <div className="absolute top-full left-0 right-0 mt-2 glass-panel border border-white/10 rounded-xl shadow-2xl p-4 max-h-[380px] overflow-y-auto z-50 text-left">
                  {hasSearchResults ? (
                    <div className="space-y-4">
                      {/* Students section */}
                      {searchResults.students.length > 0 && (
                        <div>
                          <div className="text-[10px] font-bold text-primary uppercase tracking-wider mb-2">Students</div>
                          <div className="space-y-1.5">
                            {searchResults.students.map(s => (
                              <div 
                                key={s.id}
                                onClick={() => { setSearchQuery(''); navigate('/dashboard/students'); }}
                                className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 cursor-pointer text-xs transition-colors"
                              >
                                <span className="font-semibold">{s.name}</span>
                                <span className="font-mono text-gray-500 text-[10px]">{s.register_number}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Staff section */}
                      {searchResults.staff.length > 0 && (
                        <div>
                          <div className="text-[10px] font-bold text-secondary uppercase tracking-wider mb-2">Staff</div>
                          <div className="space-y-1.5">
                            {searchResults.staff.map(s => (
                              <div 
                                key={s.id}
                                onClick={() => { setSearchQuery(''); navigate('/dashboard/staff'); }}
                                className="flex items-center justify-between p-2 rounded-lg hover:bg-white/5 cursor-pointer text-xs transition-colors"
                              >
                                <span className="font-semibold">{s.name}</span>
                                <span className="text-gray-500 text-[10px]">{s.email}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Classes & Departments */}
                      {(searchResults.classes.length > 0 || searchResults.departments.length > 0) && (
                        <div>
                          <div className="text-[10px] font-bold text-accent uppercase tracking-wider mb-2">Hierarchy</div>
                          <div className="space-y-1.5">
                            {searchResults.departments.map(d => (
                              <div 
                                key={d.id}
                                onClick={() => { setSearchQuery(''); navigate('/dashboard/departments'); }}
                                className="flex items-center p-2 rounded-lg hover:bg-white/5 cursor-pointer text-xs text-gray-400 transition-colors"
                              >
                                <CornerDownRight className="w-3.5 h-3.5 mr-1 text-accent" />
                                <span>Dept: <strong className="text-gray-200">{d.name}</strong></span>
                              </div>
                            ))}
                            {searchResults.classes.map(c => (
                              <div 
                                key={c.id}
                                onClick={() => { setSearchQuery(''); navigate('/dashboard/departments'); }}
                                className="flex items-center p-2 rounded-lg hover:bg-white/5 cursor-pointer text-xs text-gray-400 transition-colors"
                              >
                                <CornerDownRight className="w-3.5 h-3.5 mr-1 text-accent" />
                                <span>Class: <strong className="text-gray-200">{c.name}</strong></span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-xs text-gray-500 font-medium">
                      No global matching records found for "{searchQuery}"
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right: Network Status, Theme, and Notifications panel */}
          <div className="flex items-center space-x-4">
            {/* Online/Offline Status Indicator */}
            <div className="flex items-center">
              {isOffline ? (
                <div className="flex items-center space-x-1.5 text-red-400 text-xs font-semibold bg-red-500/10 px-2.5 py-1 rounded-full border border-red-500/20">
                  <WifiOff className="w-3.5 h-3.5 animate-pulse" />
                  <span className="hidden sm:inline">Offline Mode</span>
                </div>
              ) : (
                <div className="flex items-center space-x-1.5 text-emerald-400 text-xs font-semibold bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                  <Wifi className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Synced</span>
                </div>
              )}
            </div>

            {/* Theme toggle */}
            <button 
              onClick={toggleTheme}
              className="p-2 rounded-lg hover:bg-white/10 transition-colors text-gray-400 hover:text-gray-200"
            >
              {isDark ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-indigo-500" />}
            </button>
          </div>
        </header>

        {/* Content Outlet */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl w-full mx-auto overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {/* Mobile Drawer Navigation */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 flex lg:hidden bg-black/60 backdrop-blur-sm">
          <div className="w-64 glass-panel h-full flex flex-col p-6 relative border-r border-white/10 animate-slide-in">
            <button 
              onClick={() => setMobileMenuOpen(false)}
              className="absolute top-6 right-6 text-gray-400 hover:text-gray-200"
            >
              <X className="w-6 h-6" />
            </button>

            <div className="flex items-center space-x-3 pb-6 border-b border-white/5 mb-8">
              <div className="p-1.5 bg-gradient-to-tr from-primary to-secondary rounded-lg text-white">
                <Camera className="w-5 h-5" />
              </div>
              <span className="font-display font-bold text-lg tracking-tight text-white">
                FaceTrack AI
              </span>
            </div>

            <nav className="flex-1 space-y-1.5 overflow-y-auto">
              {filteredMenuItems.map((item, idx) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={idx}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-semibold transition-all duration-200 ${
                      isActive 
                        ? 'bg-primary/10 text-primary border border-primary/20 shadow-md shadow-primary/5' 
                        : 'hover:bg-white/5 text-gray-400 hover:text-gray-200 border border-transparent'
                    }`}
                  >
                    {item.icon}
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            <div className="pt-6 border-t border-white/5">
              <button 
                onClick={handleLogout}
                className="w-full flex items-center justify-center space-x-2 px-3 py-3 border border-white/5 hover:border-red-500/20 hover:bg-red-500/5 text-red-400 rounded-xl text-xs font-bold transition-all cursor-pointer"
              >
                <LogOut className="w-4 h-4" />
                <span>Logout Account</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
