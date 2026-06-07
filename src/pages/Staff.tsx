import { useState, useEffect } from 'react';
import { Plus, Search, Mail, GraduationCap, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import { fetchStaff, fetchDepartments, addStaff } from '../lib/db';
import type { Staff, Department } from '../lib/db';
import { toast } from 'sonner';

export default function StaffManagement() {
  const { session } = useStore();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Create Form States
  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [selectedDept, setSelectedDept] = useState('');

  useEffect(() => {
    loadStaffData();
  }, []);

  const loadStaffData = async () => {
    const s = await fetchStaff();
    const d = await fetchDepartments();
    setStaff(s);
    setDepartments(d);
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !selectedDept) {
      toast.error('All fields are required');
      return;
    }

    try {
      await addStaff({
        name,
        email,
        department_id: selectedDept
      });
      toast.success(`Registered Staff: ${name}`);
      setShowModal(false);
      setName('');
      setEmail('');
      setSelectedDept('');
      loadStaffData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save staff member');
    }
  };

  const filteredStaff = staff.filter(member => 
    member.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    member.email.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getDeptName = (id: string) => {
    return departments.find(d => d.id === id)?.name || 'Unassigned Dept';
  };

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold font-display">Staff Registry</h1>
          <p className="text-xs text-gray-400 mt-1">Manage academic professors, scanning personnel, and admin privileges.</p>
        </div>
        
        {session?.role === 'super_admin' && (
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold shadow-lg shadow-primary/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Register Staff Handler</span>
          </button>
        )}
      </div>

      {/* Search Bar */}
      <div className="relative">
        <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 pointer-events-none">
          <Search className="w-4 h-4" />
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search staff handlers by name or email..."
          className="w-full pl-9 pr-4 py-2.5 bg-slate-900/30 border border-white/10 rounded-xl text-xs font-medium focus:border-primary focus:outline-none transition-colors"
        />
      </div>

      {/* Staff List Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredStaff.length > 0 ? (
          filteredStaff.map((member) => (
            <div 
              key={member.id} 
              className="glass-panel p-6 rounded-2xl border border-white/5 flex items-start justify-between hover:border-primary/25 transition-all"
            >
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-tr from-primary to-secondary flex items-center justify-center text-white font-bold font-display text-base shadow-md shadow-primary/10">
                  {member.name.split(' ').slice(-1)[0].substring(0, 2).toUpperCase()}
                </div>
                
                <div className="space-y-1">
                  <h3 className="text-sm font-semibold text-gray-200">{member.name}</h3>
                  
                  <div className="flex items-center text-[10px] text-gray-500 gap-1.5">
                    <Mail className="w-3.5 h-3.5" />
                    <span>{member.email}</span>
                  </div>

                  <div className="flex items-center text-[10px] text-gray-500 gap-1.5 pt-1.5">
                    <GraduationCap className="w-3.5 h-3.5 text-secondary" />
                    <span className="text-gray-300 font-medium">{getDeptName(member.department_id)}</span>
                  </div>
                </div>
              </div>

              <span className="px-2.5 py-0.5 rounded-md bg-white/5 border border-white/10 text-[9px] font-bold text-gray-400 uppercase tracking-wider">
                Staff Handler
              </span>
            </div>
          ))
        ) : (
          <div className="col-span-2 text-center py-12 text-gray-500 text-xs font-semibold">
            No registered staff members found.
          </div>
        )}
      </div>

      {/* Create Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-panel max-w-md w-full p-6 rounded-2xl border border-white/10 space-y-6 animate-slide-in relative">
            <button 
              onClick={() => setShowModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-white/5 pb-4">
              <h2 className="font-display text-lg font-bold text-white">Register Staff Account</h2>
              <p className="text-xs text-gray-400 mt-0.5">Create a credentialed handler. Automatically applies security policies.</p>
            </div>

            <form onSubmit={handleCreateStaff} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1.5">Full Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Dr. Samuel Watson"
                  className="w-full px-3 py-2.5 bg-slate-900/30 border border-white/10 rounded-xl focus:border-primary focus:outline-none text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1.5">Email Address *</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="samuel.watson@facetrack.ai"
                  className="w-full px-3 py-2.5 bg-slate-900/30 border border-white/10 rounded-xl focus:border-primary focus:outline-none text-xs"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1.5">Linked Department *</label>
                <select
                  required
                  value={selectedDept}
                  onChange={(e) => setSelectedDept(e.target.value)}
                  className="w-full px-3 py-2.5 bg-slate-900 border border-white/10 rounded-xl focus:outline-none text-xs"
                >
                  <option value="">Select Department</option>
                  {departments.map(d => (
                    <option key={d.id} value={d.id}>{d.name}</option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end space-x-3 border-t border-white/5 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-white/10 hover:bg-white/5 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  className="px-6 py-2 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold shadow-lg cursor-pointer"
                >
                  Save Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
