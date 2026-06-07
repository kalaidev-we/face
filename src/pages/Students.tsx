import { useState, useEffect, useRef } from 'react';
import { Plus, Search, CheckCircle2, AlertTriangle, Loader, X } from 'lucide-react';
import { fetchStudents, fetchClasses, fetchDepartments, addStudent } from '../lib/db';
import type { Student, Class, Department } from '../lib/db';
import { detectAndValidateFace } from '../lib/faceDetector';
import { toast } from 'sonner';

export default function Students() {
  // isDark unused removed
  
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  
  // Registration Form States
  const [showAddModal, setShowAddModal] = useState(false);
  const [regNumber, setRegNumber] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedClass, setSelectedClass] = useState('');

  // Enrollment Camera States
  const [showCameraModal, setShowCameraModal] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const [capturedSamples, setCapturedSamples] = useState<number[][]>([]);
  const [sampleCount, setSampleCount] = useState(0);
  const [enrollmentStatus, setEnrollmentStatus] = useState<'idle' | 'running' | 'completed'>('idle');
  const [faceQualityMsg, setFaceQualityMsg] = useState('Position your face center to start enrollment');
  const [firstFrameSnapshot, setFirstFrameSnapshot] = useState<string>('');

  const enrollVideoRef = useRef<HTMLVideoElement>(null);
  const enrollCanvasRef = useRef<HTMLCanvasElement>(null);
  const isEnrolling = useRef(false);

  useEffect(() => {
    loadRegistryData();
  }, []);

  const loadRegistryData = async () => {
    const s = await fetchStudents();
    const c = await fetchClasses();
    const d = await fetchDepartments();
    setStudents(s);
    setClasses(c);
    setDepartments(d);
  };

  const startEnrollmentCamera = async () => {
    setCapturedSamples([]);
    setSampleCount(0);
    setEnrollmentStatus('running');
    isEnrolling.current = true;
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: { ideal: 640 }, height: { ideal: 480 } } 
      });
      setCameraStream(stream);
      if (enrollVideoRef.current) {
        enrollVideoRef.current.srcObject = stream;
      }
      toast.info('Starting face enrollment camera stream...');
    } catch (err) {
      console.error('Enrollment camera error:', err);
      toast.error('Could not open camera.');
      closeEnrollmentCamera();
    }
  };

  const closeEnrollmentCamera = () => {
    isEnrolling.current = false;
    if (cameraStream) {
      cameraStream.getTracks().forEach(t => t.stop());
      setCameraStream(null);
    }
    setEnrollmentStatus('idle');
    setShowCameraModal(false);
  };

  // 10-Sample Face Capture Loop
  useEffect(() => {
    let frameId: number;
    const captureLoop = async () => {
      if (
        !isEnrolling.current || 
        !enrollVideoRef.current || 
        !enrollCanvasRef.current || 
        sampleCount >= 10
      ) {
        if (sampleCount >= 10 && enrollmentStatus !== 'completed') {
          setEnrollmentStatus('completed');
          toast.success('Face model template compiled successfully!');
        }
        return;
      }

      const video = enrollVideoRef.current;
      const canvas = enrollCanvasRef.current;

      const result = await detectAndValidateFace(video, canvas);

      if (result.faceDetected && result.validation.isValid && result.embedding) {
        setFaceQualityMsg('Hold steady... Capturing face geometry');
        
        // Grab the first photo snapshot to store as profile URL
        if (sampleCount === 0 && canvas) {
          const snapshotUrl = canvas.toDataURL('image/jpeg', 0.85);
          setFirstFrameSnapshot(snapshotUrl);
        }

        // Add embedding sample
        setCapturedSamples(prev => {
          const next = [...prev, result.embedding!];
          setSampleCount(next.length);
          return next;
        });

        // Delay 300ms between samples to ensure separate angles/frames
        await new Promise(r => setTimeout(r, 450));
      } else {
        setFaceQualityMsg(result.validation.message || 'Position face inside the camera view');
      }

      if (isEnrolling.current) {
        frameId = requestAnimationFrame(captureLoop);
      }
    };

    if (enrollmentStatus === 'running') {
      captureLoop();
    }

    return () => cancelAnimationFrame(frameId);
  }, [enrollmentStatus, sampleCount]);

  const handleCreateStudent = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!regNumber || !name || !email || !selectedDept || !selectedClass) {
      toast.error('Please fill in all mandatory fields');
      return;
    }

    if (capturedSamples.length < 10) {
      toast.error('Face Model Enrollment is required to register a student');
      return;
    }

    // Average the 10 captured embeddings to create 1 stable centroid face vector
    const numDimensions = 128;
    const averageEmbedding = new Array(numDimensions).fill(0);

    capturedSamples.forEach(sample => {
      for (let i = 0; i < numDimensions; i++) {
        averageEmbedding[i] += sample[i];
      }
    });

    for (let i = 0; i < numDimensions; i++) {
      averageEmbedding[i] = averageEmbedding[i] / capturedSamples.length;
    }

    // Normalize average vector
    const length = Math.sqrt(averageEmbedding.reduce((sum, val) => sum + val * val, 0));
    const normalizedAverage = averageEmbedding.map(val => val / length);

    try {
      await addStudent({
        register_number: regNumber,
        name,
        email,
        phone: phone || '+1 (555) 000-0000',
        photo_url: firstFrameSnapshot || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&h=200&fit=crop',
        face_embedding: normalizedAverage,
        department_id: selectedDept,
        class_id: selectedClass
      });

      toast.success(`Registered Student: ${name}`);
      setShowAddModal(false);
      clearForm();
      loadRegistryData();
    } catch (err: any) {
      toast.error(err.message || 'Failed to save student.');
    }
  };

  const clearForm = () => {
    setRegNumber('');
    setName('');
    setEmail('');
    setPhone('');
    setSelectedDept('');
    setSelectedClass('');
    setCapturedSamples([]);
    setSampleCount(0);
    setFirstFrameSnapshot('');
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = 
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.register_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase());
      
    const matchesClass = filterClass === 'all' || student.class_id === filterClass;
    
    return matchesSearch && matchesClass;
  });

  const getDeptName = (id: string) => {
    return departments.find(d => d.id === id)?.name || 'Unassigned Dept';
  };

  const getClassName = (id: string) => {
    return classes.find(c => c.id === id)?.name || 'Unassigned Class';
  };

  return (
    <div className="space-y-6">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-4 md:space-y-0">
        <div>
          <h1 className="text-2xl font-bold font-display">Student Registry</h1>
          <p className="text-xs text-gray-400 mt-1">Enroll students, capture facial templates, and link class schedules.</p>
        </div>
        <button 
          onClick={() => { clearForm(); setShowAddModal(true); }}
          className="flex items-center space-x-1.5 px-4 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold shadow-lg shadow-primary/20 transition-all cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Register Student</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Search */}
        <div className="relative md:col-span-2">
          <span className="absolute inset-y-0 left-0 pl-3 flex items-center text-gray-500 pointer-events-none">
            <Search className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search students by name, registry ID, or email..."
            className="w-full pl-9 pr-4 py-2.5 bg-slate-900/30 border border-white/10 rounded-xl text-xs font-medium focus:border-primary focus:outline-none transition-colors"
          />
        </div>

        {/* Filter class */}
        <select
          value={filterClass}
          onChange={(e) => setFilterClass(e.target.value)}
          className="bg-slate-900 border border-white/10 rounded-xl text-xs px-4 py-2.5 focus:outline-none w-full"
        >
          <option value="all">All Registered Classes</option>
          {classes.map(c => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      </div>

      {/* Students list */}
      <div className="glass-panel rounded-2xl border border-white/5 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/5 text-[11px] text-gray-500 uppercase font-bold bg-white/5 bg-opacity-0">
                <th className="py-4 px-6">Name</th>
                <th className="py-4 px-6">Register Number</th>
                <th className="py-4 px-6">Email / Phone</th>
                <th className="py-4 px-6">Department & Class</th>
                <th className="py-4 px-6 text-right font-bold">Face Template</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5 text-xs">
              {filteredStudents.length > 0 ? (
                filteredStudents.map((stud) => (
                  <tr key={stud.id} className="hover:bg-white/5 transition-colors">
                    <td className="py-3.5 px-6">
                      <div className="flex items-center space-x-3">
                        <img 
                          src={stud.photo_url} 
                          alt={stud.name} 
                          className="w-9 h-9 rounded-full object-cover border border-white/10"
                        />
                        <span className="font-semibold text-gray-200">{stud.name}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-6 font-mono text-gray-400">{stud.register_number}</td>
                    <td className="py-3.5 px-6">
                      <div className="space-y-0.5">
                        <div className="text-gray-300">{stud.email}</div>
                        <div className="text-[10px] text-gray-500">{stud.phone}</div>
                      </div>
                    </td>
                    <td className="py-3.5 px-6">
                      <div className="space-y-0.5">
                        <div className="text-gray-300">{getDeptName(stud.department_id)}</div>
                        <div className="text-[10px] text-gray-500">{getClassName(stud.class_id)}</div>
                      </div>
                    </td>
                    <td className="py-3.5 px-6 text-right">
                      {stud.face_embedding ? (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold rounded-md uppercase">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Registered</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 px-2.5 py-0.5 bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-bold rounded-md uppercase">
                          <AlertTriangle className="w-3.5 h-3.5" />
                          <span>Missing Model</span>
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-500 text-xs font-semibold">
                    No students found matching filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Register Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="glass-panel max-w-xl w-full p-6 rounded-2xl border border-white/10 space-y-6 animate-slide-in max-h-[90vh] overflow-y-auto relative">
            <button 
              onClick={() => setShowAddModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="border-b border-white/5 pb-4">
              <h2 className="font-display text-lg font-bold">New Student Registration</h2>
              <p className="text-xs text-gray-400 mt-0.5">Enter details and capture 10 facial samples to train the vector model.</p>
            </div>

            <form onSubmit={handleCreateStudent} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1.5">Register Number *</label>
                  <input
                    type="text"
                    required
                    value={regNumber}
                    onChange={(e) => setRegNumber(e.target.value)}
                    placeholder="FT-2023-009"
                    className="w-full px-3 py-2 bg-slate-900/30 border border-white/10 rounded-xl focus:border-primary focus:outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1.5">Full Name *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="James Stark"
                    className="w-full px-3 py-2 bg-slate-900/30 border border-white/10 rounded-xl focus:border-primary focus:outline-none text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1.5">Email Address *</label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="james.stark@facetrack.ai"
                    className="w-full px-3 py-2 bg-slate-900/30 border border-white/10 rounded-xl focus:border-primary focus:outline-none text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1.5">Phone Number</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1 (555) 019-2834"
                    className="w-full px-3 py-2 bg-slate-900/30 border border-white/10 rounded-xl focus:border-primary focus:outline-none text-xs"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1.5">Department Link *</label>
                  <select
                    required
                    value={selectedDept}
                    onChange={(e) => setSelectedDept(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl focus:outline-none text-xs"
                  >
                    <option value="">Choose Department</option>
                    {departments.map(d => (
                      <option key={d.id} value={d.id}>{d.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold uppercase text-gray-500 mb-1.5">Class Section *</label>
                  <select
                    required
                    value={selectedClass}
                    onChange={(e) => setSelectedClass(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-900 border border-white/10 rounded-xl focus:outline-none text-xs"
                  >
                    <option value="">Choose Class</option>
                    {classes.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Facial recognition capture link panel */}
              <div className="p-4 bg-white/5 rounded-xl border border-white/5 space-y-4">
                <div className="flex justify-between items-center text-xs">
                  <div>
                    <span className="font-semibold text-gray-200">Face Recognition Enrollment</span>
                    <p className="text-[10px] text-gray-500 mt-0.5">Generate biometric template descriptors</p>
                  </div>
                  
                  {capturedSamples.length === 10 ? (
                    <span className="flex items-center text-[10px] text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20 font-bold uppercase">
                      Ready (10/10)
                    </span>
                  ) : (
                    <button 
                      type="button"
                      onClick={() => setShowCameraModal(true)}
                      className="px-3 py-1.5 bg-primary/20 hover:bg-primary/30 text-primary-hover dark:text-primary rounded-lg font-bold text-[10px] uppercase cursor-pointer"
                    >
                      Enroll Biometrics
                    </button>
                  )}
                </div>

                {capturedSamples.length < 10 && (
                  <div className="text-[10px] text-amber-500 flex items-center gap-1">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    <span>Biometric model templates must be compiled before registration completes.</span>
                  </div>
                )}
                
                {capturedSamples.length === 10 && firstFrameSnapshot && (
                  <div className="flex items-center space-x-3">
                    <img 
                      src={firstFrameSnapshot} 
                      alt="Thumbnail"
                      className="w-12 h-12 rounded-lg object-cover border border-white/10"
                    />
                    <div className="text-[10px] text-gray-400 font-mono">
                      Face center vector successfully mapped. Template centroids generated.
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 border-t border-white/5 pt-4">
                <button 
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-white/10 hover:bg-white/5 rounded-xl text-xs font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button 
                  type="submit"
                  disabled={capturedSamples.length < 10}
                  className="px-6 py-2 bg-primary hover:bg-primary-hover disabled:opacity-50 text-white rounded-xl text-xs font-bold shadow-lg cursor-pointer"
                >
                  Save Registration
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Face enrollment camera modal */}
      {showCameraModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/85 backdrop-blur-md p-4">
          <div className="glass-panel max-w-md w-full p-6 rounded-2xl border border-white/10 text-center space-y-6 animate-slide-in relative">
            <button 
              onClick={closeEnrollmentCamera}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-200"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-1">
              <h3 className="font-display text-lg font-bold text-white">Capture Face Geometry</h3>
              <p className="text-xs text-gray-400">Position face centered. System will auto-capture 10 samples.</p>
            </div>

            {/* Webcam video Box */}
            <div className="aspect-video w-full bg-slate-950 rounded-xl overflow-hidden relative border border-white/5 scanner-container flex items-center justify-center">
              <video 
                ref={enrollVideoRef}
                autoPlay 
                playsInline 
                muted
                className="w-full h-full object-cover transform scale-x-[-1]"
              />
              <canvas 
                ref={enrollCanvasRef}
                className="absolute inset-0 w-full h-full pointer-events-none transform scale-x-[-1]"
              />
              {enrollmentStatus === 'idle' && (
                <div className="absolute inset-0 bg-slate-950/70 flex items-center justify-center">
                  <button 
                    onClick={startEnrollmentCamera}
                    className="px-5 py-2.5 bg-primary hover:bg-primary-hover text-white rounded-xl text-xs font-bold shadow-lg cursor-pointer"
                  >
                    Start Capture Setup
                  </button>
                </div>
              )}
              {enrollmentStatus === 'running' && (
                <div className="scanner-line" />
              )}
            </div>

            {/* Quality status feedback */}
            {enrollmentStatus === 'running' && (
              <div className="space-y-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-gray-400">Samples Compiled:</span>
                  <strong className="text-primary font-mono text-sm">{sampleCount} / 10</strong>
                </div>
                
                {/* Progress bar */}
                <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
                    style={{ width: `${sampleCount * 10}%` }}
                  />
                </div>

                <div className="p-2.5 bg-slate-950/60 rounded-xl text-[10px] text-gray-500 font-mono flex items-center justify-center gap-1.5 border border-white/5">
                  <Loader className="w-3.5 h-3.5 text-primary animate-spin" />
                  <span className="truncate">{faceQualityMsg}</span>
                </div>
              </div>
            )}

            {enrollmentStatus === 'completed' && (
              <div className="space-y-4">
                <div className="p-3 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-xl text-xs flex items-center justify-center gap-1.5">
                  <CheckCircle2 className="w-5 h-5" />
                  <span>Face vector model compiled. Click confirm to apply.</span>
                </div>
                <button 
                  onClick={closeEnrollmentCamera}
                  className="w-full py-2.5 bg-primary hover:bg-primary-hover text-white text-xs font-bold rounded-xl shadow-lg cursor-pointer"
                >
                  Confirm Face Model
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
