import { useState, useEffect } from 'react';
import { Plus, Building2, MapPin, Calendar, X } from 'lucide-react';
import { useStore } from '../store/useStore';
import { 
  fetchInstitutions, fetchBranches, fetchDepartments, fetchClasses, 
  addBranch, addDepartment, addClass
} from '../lib/db';
import type { Institution, Branch, Department, Class } from '../lib/db';
import { toast } from 'sonner';

export default function DepartmentsHierarchy() {
  const { session } = useStore();
  
  const [institutions, setInstitutions] = useState<Institution[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [activeTab, setActiveTab] = useState<'branches' | 'departments' | 'classes'>('branches');

  // Modal Triggers
  const [showModal, setShowModal] = useState(false);

  // Form States
  const [branchName, setBranchName] = useState('');
  const [branchAddress, setBranchAddress] = useState('');
  
  const [deptName, setDeptName] = useState('');
  const [deptBranch, setDeptBranch] = useState('');
  
  const [className, setClassName] = useState('');
  const [classYear, setClassYear] = useState(1);
  const [classSection, setClassSection] = useState('A');
  const [classDept, setClassDept] = useState('');

  useEffect(() => {
    loadHierarchyData();
  }, []);

  const loadHierarchyData = async () => {
    const inst = await fetchInstitutions();
    const br = await fetchBranches();
    const de = await fetchDepartments();
    const cl = await fetchClasses();
    
    setInstitutions(inst);
    setBranches(br);
    setDepartments(de);
    setClasses(cl);
  };

  const handleCreateRecord = async (e: React.FormEvent) => {
    e.preventDefault();
    if (institutions.length === 0) {
      toast.error('No parent institution configured in the system.');
      return;
    }
    const instId = institutions[0].id;

    try {
      if (activeTab === 'branches') {
        if (!branchName) return;
        await addBranch({
          institution_id: instId,
          name: branchName,
          address: branchAddress
        });
        toast.success(`Created Branch: ${branchName}`);
        setBranchName('');
        setBranchAddress('');
      } else if (activeTab === 'departments') {
        if (!deptName || !deptBranch) return;
        await addDepartment({
          institution_id: instId,
          branch_id: deptBranch,
          name: deptName
        });
        toast.success(`Created Department: ${deptName}`);
        setDeptName('');
        setDeptBranch('');
      } else {
        if (!className || !classDept || !classYear || !classSection) return;
        await addClass({
          department_id: classDept,
          name: className,
          year: Number(classYear),
          section: classSection
        });
        toast.success(`Created Class: ${className}`);
        setClassName('');
        setClassDept('');
      }
      
      setShowModal(false);
      loadHierarchyData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to create record');
    }
  };

  const getBranchName = (id: string) => {
    return branches.find(b => b.id === id)?.name || 'Unknown Branch';
  };

  const getDeptName = (id: string) => {
    return departments.find(d => d.id === id)?.name || 'Unknown Dept';
  };

  return (
    <div className="space-y-6">
      {/* Title block */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold font-display">Structure & Departments</h1>
          <p className="text-xs text-gray-400 mt-1">Configure campus branches, academic departments, and class sections.</p>
        </div>
        
        {session?.role === 'super_admin' && (
          <button 
            onClick={() => setShowModal(true)}
            className="flex items-center space-x-1.5 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold shadow-lg shadow-primary/20 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Add {activeTab.slice(0, -1)}</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex space-x-1.5 p-1 bg-white/5 rounded-xl border border-white/5 w-fit text-xs font-semibold">
        {(['branches', 'departments', 'classes'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-lg transition-all capitalize cursor-pointer ${
              activeTab === tab 
                ? 'bg-primary text-white shadow-lg shadow-primary/15' 
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Content Lists */}
      <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden p-6">
        {activeTab === 'branches' && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold font-display uppercase tracking-wider text-gray-400">Branches list</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {branches.map(b => (
                <div key={b.id} className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-start space-x-3">
                  <div className="p-2 bg-primary/10 rounded-lg text-primary"><MapPin className="w-5 h-5" /></div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-gray-200">{b.name}</h4>
                    <p className="text-[10px] text-gray-500">{b.address || 'No address configured'}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'departments' && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold font-display uppercase tracking-wider text-gray-400">Departments list</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {departments.map(d => (
                <div key={d.id} className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-start space-x-3">
                  <div className="p-2 bg-secondary/10 rounded-lg text-secondary"><Building2 className="w-5 h-5" /></div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-gray-200">{d.name}</h4>
                    <p className="text-[10px] text-gray-500">Linked Branch: {getBranchName(d.branch_id)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'classes' && (
          <div className="space-y-4">
            <h3 className="text-xs font-bold font-display uppercase tracking-wider text-gray-400">Classes list</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {classes.map(c => (
                <div key={c.id} className="p-4 bg-white/5 rounded-xl border border-white/5 flex items-start space-x-3">
                  <div className="p-2 bg-accent/10 rounded-lg text-accent"><Calendar className="w-5 h-5" /></div>
                  <div className="space-y-1">
                    <h4 className="text-xs font-bold text-gray-200">{c.name}</h4>
                    <div className="flex items-center text-[10px] text-gray-500 space-x-2">
                      <span>Year {c.year}</span>
                      <span>•</span>
                      <span>Section {c.section}</span>
                    </div>
                    <p className="text-[9px] text-gray-600 mt-1">Dept: {getDeptName(c.department_id)}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Modal */}
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
              <h2 className="font-display text-lg font-bold text-white capitalize">Add New {activeTab.slice(0, -1)}</h2>
              <p className="text-xs text-gray-400 mt-0.5">Configure institutional nodes in the relational hierarchy.</p>
            </div>

            <form onSubmit={handleCreateRecord} className="space-y-4">
              
              {/* Branch Fields */}
              {activeTab === 'branches' && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1.5">Branch Name *</label>
                    <input
                      type="text"
                      required
                      value={branchName}
                      onChange={(e) => setBranchName(e.target.value)}
                      placeholder="Boston Campus"
                      className="w-full px-3 py-2 bg-slate-900/30 border border-white/10 rounded-xl focus:border-primary focus:outline-none text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1.5">Branch Location Address</label>
                    <textarea
                      value={branchAddress}
                      onChange={(e) => setBranchAddress(e.target.value)}
                      placeholder="500 Academic Drive, Boston"
                      rows={2}
                      className="w-full px-3 py-2 bg-slate-900/30 border border-white/10 rounded-xl focus:border-primary focus:outline-none text-xs resize-none"
                    />
                  </div>
                </>
              )}

              {/* Department Fields */}
              {activeTab === 'departments' && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1.5">Department Name *</label>
                    <input
                      type="text"
                      required
                      value={deptName}
                      onChange={(e) => setDeptName(e.target.value)}
                      placeholder="Mechanical Engineering"
                      className="w-full px-3 py-2 bg-slate-900/30 border border-white/10 rounded-xl focus:border-primary focus:outline-none text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1.5">Branch Link *</label>
                    <select
                      required
                      value={deptBranch}
                      onChange={(e) => setDeptBranch(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl focus:outline-none text-xs"
                    >
                      <option value="">Select Branch</option>
                      {branches.map(b => (
                        <option key={b.id} value={b.id}>{b.name}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              {/* Class Fields */}
              {activeTab === 'classes' && (
                <>
                  <div>
                    <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1.5">Class Cohort Name *</label>
                    <input
                      type="text"
                      required
                      value={className}
                      onChange={(e) => setClassName(e.target.value)}
                      placeholder="ME - 4th Year"
                      className="w-full px-3 py-2 bg-slate-900/30 border border-white/10 rounded-xl focus:border-primary focus:outline-none text-xs"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1.5">Year *</label>
                      <input
                        type="number"
                        required
                        min={1}
                        max={6}
                        value={classYear}
                        onChange={(e) => setClassYear(Number(e.target.value))}
                        className="w-full px-3 py-2 bg-slate-900/30 border border-white/10 rounded-xl focus:border-primary focus:outline-none text-xs"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1.5">Section *</label>
                      <input
                        type="text"
                        required
                        value={classSection}
                        onChange={(e) => setClassSection(e.target.value)}
                        placeholder="A"
                        className="w-full px-3 py-2 bg-slate-900/30 border border-white/10 rounded-xl focus:border-primary focus:outline-none text-xs"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1.5">Linked Department *</label>
                    <select
                      required
                      value={classDept}
                      onChange={(e) => setClassDept(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl focus:outline-none text-xs"
                    >
                      <option value="">Choose Department</option>
                      {departments.map(d => (
                        <option key={d.id} value={d.id}>{d.name}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

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
                  Save Hierarchy
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
