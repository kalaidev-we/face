import { getSupabaseClient, isSupabaseConfigured } from './supabaseClient';

// --- DATABASE TYPES ---
export interface Institution {
  id: string;
  name: string;
  address: string;
  contact: string;
  created_at: string;
}

export interface Branch {
  id: string;
  institution_id: string;
  name: string;
  address: string;
  created_at: string;
}

export interface Department {
  id: string;
  institution_id: string;
  branch_id: string;
  name: string;
  created_at: string;
}

export interface Class {
  id: string;
  department_id: string;
  name: string;
  year: number;
  section: string;
  created_at: string;
}

export interface Student {
  id: string;
  register_number: string;
  name: string;
  email: string;
  phone: string;
  photo_url: string;
  face_embedding?: number[]; // float[] array of 128 numbers
  department_id: string;
  class_id: string;
  created_at: string;
}

export interface Staff {
  id: string;
  name: string;
  email: string;
  department_id: string;
  created_at: string;
}

export interface Attendance {
  id: string;
  student_id: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM:SS
  status: 'present' | 'absent' | 'late' | 'verification_pending';
  confidence_score: number;
  captured_image: string;
  location_lat?: number;
  location_lng?: number;
  verification_method: 'face' | 'qr' | 'manual';
  created_at: string;
}

export interface AuditLog {
  id: string;
  user_id: string;
  action: string;
  timestamp: string;
}

export interface UserSession {
  user: {
    id: string;
    email: string;
    name: string;
    role: 'super_admin' | 'staff' | 'student';
    detailsId?: string; // staff_id or student_id
  } | null;
}

// --- MOCK DATABASE INITIAL SEED DATA ---
const SEED_INSTITUTIONS: Institution[] = [
  { id: 'inst-1', name: 'FaceTrack Institute of Technology', address: '100 Innovation Way, Silicon Valley', contact: '+1 (555) 019-9000', created_at: new Date().toISOString() }
];

const SEED_BRANCHES: Branch[] = [
  { id: 'branch-1', institution_id: 'inst-1', name: 'Main Campus (HQ)', address: '100 Innovation Way, Silicon Valley', created_at: new Date().toISOString() },
  { id: 'branch-2', institution_id: 'inst-1', name: 'North Campus', address: '500 Academic Drive, Boston', created_at: new Date().toISOString() }
];

const SEED_DEPARTMENTS: Department[] = [
  { id: 'dept-1', institution_id: 'inst-1', branch_id: 'branch-1', name: 'Computer Science & Engineering', created_at: new Date().toISOString() },
  { id: 'dept-2', institution_id: 'inst-1', branch_id: 'branch-1', name: 'Electronics & Communication', created_at: new Date().toISOString() },
  { id: 'dept-3', institution_id: 'inst-1', branch_id: 'branch-2', name: 'Information Technology', created_at: new Date().toISOString() }
];

const SEED_CLASSES: Class[] = [
  { id: 'class-1', department_id: 'dept-1', name: 'CSE - 4th Year', year: 4, section: 'A', created_at: new Date().toISOString() },
  { id: 'class-2', department_id: 'dept-1', name: 'CSE - 3rd Year', year: 3, section: 'B', created_at: new Date().toISOString() },
  { id: 'class-3', department_id: 'dept-2', name: 'ECE - 2nd Year', year: 2, section: 'A', created_at: new Date().toISOString() }
];

const SEED_STAFF: Staff[] = [
  { id: 'staff-1', name: 'Dr. Sarah Jenkins', email: 'sarah.jenkins@facetrack.ai', department_id: 'dept-1', created_at: new Date().toISOString() },
  { id: 'staff-2', name: 'Prof. Robert Chen', email: 'robert.chen@facetrack.ai', department_id: 'dept-2', created_at: new Date().toISOString() }
];

// Helper to generate a dummy 128-d face embedding
const generateMockEmbedding = (seed: number): number[] => {
  const embedding = [];
  let current = seed;
  for (let i = 0; i < 128; i++) {
    // Generate pseudo-random numbers between -1 and 1
    current = Math.sin(current * 12345.67) * 10000;
    embedding.push(current - Math.floor(current));
  }
  // Normalize vector to length 1
  const length = Math.sqrt(embedding.reduce((sum, val) => sum + val * val, 0));
  return embedding.map(val => val / length);
};

const SEED_STUDENTS: Student[] = [
  { id: 'stud-1', register_number: 'FT-2023-001', name: 'Alex Mercer', email: 'alex.mercer@facetrack.ai', phone: '+1 (555) 012-3456', photo_url: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=200&h=200&fit=crop', face_embedding: generateMockEmbedding(1), department_id: 'dept-1', class_id: 'class-1', created_at: new Date().toISOString() },
  { id: 'stud-2', register_number: 'FT-2023-002', name: 'Emily Watson', email: 'emily.watson@facetrack.ai', phone: '+1 (555) 013-4567', photo_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop', face_embedding: generateMockEmbedding(2), department_id: 'dept-1', class_id: 'class-1', created_at: new Date().toISOString() },
  { id: 'stud-3', register_number: 'FT-2023-003', name: 'Marcus Aurelius', email: 'marcus.aurelius@facetrack.ai', phone: '+1 (555) 014-5678', photo_url: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop', face_embedding: generateMockEmbedding(3), department_id: 'dept-2', class_id: 'class-3', created_at: new Date().toISOString() },
  { id: 'stud-4', register_number: 'FT-2023-004', name: 'Chloe Price', email: 'chloe.price@facetrack.ai', phone: '+1 (555) 015-6789', photo_url: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop', face_embedding: generateMockEmbedding(4), department_id: 'dept-1', class_id: 'class-2', created_at: new Date().toISOString() }
];

// Pre-fill 30 days of attendance
const generateMockAttendance = (): Attendance[] => {
  const records: Attendance[] = [];
  const studentIds = ['stud-1', 'stud-2', 'stud-3', 'stud-4'];
  const today = new Date();
  
  // Last 30 days
  for (let i = 29; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    
    // Skip weekends
    if (d.getDay() === 0 || d.getDay() === 6) continue;
    
    const dateStr = d.toISOString().split('T')[0];
    
    studentIds.forEach((studentId) => {
      // Create some randomness
      const rand = Math.random();
      let status: 'present' | 'absent' | 'late' = 'present';
      let confidence = 0.92 + Math.random() * 0.07;
      
      if (rand > 0.93) {
        status = 'absent';
        confidence = 0;
      } else if (rand > 0.82) {
        status = 'late';
        confidence = 0.88 + Math.random() * 0.05;
      }
      
      // Chloe (stud-4) has poor attendance (frequent absentee)
      if (studentId === 'stud-4') {
        if (rand > 0.65) {
          status = 'absent';
          confidence = 0;
        } else if (rand > 0.50) {
          status = 'late';
          confidence = 0.85 + Math.random() * 0.05;
        }
      }

      records.push({
        id: `att-${dateStr}-${studentId}`,
        student_id: studentId,
        date: dateStr,
        time: status === 'present' ? '08:45:00' : status === 'late' ? '09:15:30' : '00:00:00',
        status,
        confidence_score: confidence,
        captured_image: status === 'absent' ? '' : 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100&h=100&fit=crop',
        verification_method: status === 'absent' ? 'manual' : 'face',
        created_at: `${dateStr}T09:00:00.000Z`,
        location_lat: 37.7749,
        location_lng: -122.4194
      });
    });
  }
  return records;
};

// --- CLIENT DB STORAGE GATEWAY ---
class MockDB {
  private getStore(key: string, initial: any): any[] {
    const data = localStorage.getItem(`ft_${key}`);
    if (!data) {
      localStorage.setItem(`ft_${key}`, JSON.stringify(initial));
      return initial;
    }
    return JSON.parse(data);
  }

  private setStore(key: string, data: any[]) {
    localStorage.setItem(`ft_${key}`, JSON.stringify(data));
  }

  getInstitutions(): Institution[] { return this.getStore('institutions', SEED_INSTITUTIONS); }
  setInstitutions(data: Institution[]) { this.setStore('institutions', data); }

  getBranches(): Branch[] { return this.getStore('branches', SEED_BRANCHES); }
  setBranches(data: Branch[]) { this.setStore('branches', data); }

  getDepartments(): Department[] { return this.getStore('departments', SEED_DEPARTMENTS); }
  setDepartments(data: Department[]) { this.setStore('departments', data); }

  getClasses(): Class[] { return this.getStore('classes', SEED_CLASSES); }
  setClasses(data: Class[]) { this.setStore('classes', data); }

  getStudents(): Student[] { return this.getStore('students', SEED_STUDENTS); }
  setStudents(data: Student[]) { this.setStore('students', data); }

  getStaff(): Staff[] { return this.getStore('staff', SEED_STAFF); }
  setStaff(data: Staff[]) { this.setStore('staff', data); }

  getAttendance(): Attendance[] { return this.getStore('attendance', generateMockAttendance()); }
  setAttendance(data: Attendance[]) { this.setStore('attendance', data); }

  getAuditLogs(): AuditLog[] { return this.getStore('audit_logs', []); }
  setAuditLogs(data: AuditLog[]) { this.setStore('audit_logs', data); }
}

const mockDb = new MockDB();

// --- EXPORTED API GATEWAY ---

// User details helper
export const getCurrentSession = (): UserSession => {
  const sessionData = localStorage.getItem('ft_session');
  if (sessionData) {
    return JSON.parse(sessionData);
  }
  // Default fallback guest session
  return { user: null };
};

export const logoutUser = async () => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (client) await client.auth.signOut();
  }
  localStorage.removeItem('ft_session');
};

// Login Simulator
export const loginUser = async (email: string, password?: string, method: 'password' | 'otp' | 'google' = 'password'): Promise<{ success: boolean; error?: string; session?: UserSession }> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (client) {
      try {
        let authResponse;
        if (method === 'password' && password) {
          authResponse = await client.auth.signInWithPassword({ email, password });
        } else {
          // Google or OTP mock login with supabase email
          authResponse = await client.auth.signInWithOtp({ email });
          return { success: true, error: 'OTP request sent (Supabase mode). Check your email.' };
        }
        
        if (authResponse.error) throw authResponse.error;
        
        // Check user role
        let role: 'super_admin' | 'staff' | 'student' = 'staff';
        let detailsId = '';
        
        if (email.includes('admin')) {
          role = 'super_admin';
        } else {
          const { data: staffData } = await client.from('staff').select('id').eq('email', email).maybeSingle();
          if (staffData) {
            role = 'staff';
            detailsId = staffData.id;
          } else {
            const { data: studentData } = await client.from('students').select('id').eq('email', email).maybeSingle();
            if (studentData) {
              role = 'student';
              detailsId = studentData.id;
            }
          }
        }
        
        const session: UserSession = {
          user: {
            id: authResponse.data.user?.id || 'sb-user',
            email,
            name: email.split('@')[0].toUpperCase(),
            role,
            detailsId
          }
        };
        localStorage.setItem('ft_session', JSON.stringify(session));
        return { success: true, session };
      } catch (err: any) {
        return { success: false, error: err.message };
      }
    }
  }

  // Local Mock Login
  const normalizedEmail = email.toLowerCase().trim();
  let role: 'super_admin' | 'staff' | 'student' = 'staff';
  let name = 'Staff Member';
  let detailsId = '';

  if (normalizedEmail.includes('admin')) {
    role = 'super_admin';
    name = 'System Administrator';
  } else {
    const matchedStaff = mockDb.getStaff().find(s => s.email.toLowerCase() === normalizedEmail);
    if (matchedStaff) {
      role = 'staff';
      name = matchedStaff.name;
      detailsId = matchedStaff.id;
    } else {
      const matchedStudent = mockDb.getStudents().find(s => s.email.toLowerCase() === normalizedEmail);
      if (matchedStudent) {
        role = 'student';
        name = matchedStudent.name;
        detailsId = matchedStudent.id;
      } else {
        return { success: false, error: 'User not registered in database. Use admin@facetrack.ai or sarah.jenkins@facetrack.ai to log in.' };
      }
    }
  }

  const session: UserSession = {
    user: {
      id: detailsId || 'mock-id',
      email: normalizedEmail,
      name,
      role,
      detailsId
    }
  };
  localStorage.setItem('ft_session', JSON.stringify(session));
  
  // Log Audit
  addAuditLog(session.user?.id || 'mock-id', `User logged in via ${method}`);
  
  return { success: true, session };
};

// --- DATA ACCESS METHODS (FETCH & MODIFY) ---

// Institutions
export const fetchInstitutions = async (): Promise<Institution[]> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (client) {
      const { data, error } = await client.from('institutions').select('*');
      if (!error) return data || [];
    }
  }
  return mockDb.getInstitutions();
};

export const addInstitution = async (inst: Omit<Institution, 'id' | 'created_at'>): Promise<Institution> => {
  const newInst = { ...inst, id: `inst-${Date.now()}`, created_at: new Date().toISOString() };
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (client) {
      const { data, error } = await client.from('institutions').insert([inst]).select().single();
      if (!error && data) return data;
    }
  }
  const current = mockDb.getInstitutions();
  mockDb.setInstitutions([...current, newInst]);
  return newInst;
};

// Branches
export const fetchBranches = async (): Promise<Branch[]> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (client) {
      const { data, error } = await client.from('branches').select('*');
      if (!error) return data || [];
    }
  }
  return mockDb.getBranches();
};

export const addBranch = async (branch: Omit<Branch, 'id' | 'created_at'>): Promise<Branch> => {
  const newBranch = { ...branch, id: `branch-${Date.now()}`, created_at: new Date().toISOString() };
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (client) {
      const { data, error } = await client.from('branches').insert([branch]).select().single();
      if (!error && data) return data;
    }
  }
  const current = mockDb.getBranches();
  mockDb.setBranches([...current, newBranch]);
  return newBranch;
};

// Departments
export const fetchDepartments = async (): Promise<Department[]> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (client) {
      const { data, error } = await client.from('departments').select('*');
      if (!error) return data || [];
    }
  }
  return mockDb.getDepartments();
};

export const addDepartment = async (dept: Omit<Department, 'id' | 'created_at'>): Promise<Department> => {
  const newDept = { ...dept, id: `dept-${Date.now()}`, created_at: new Date().toISOString() };
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (client) {
      const { data, error } = await client.from('departments').insert([dept]).select().single();
      if (!error && data) return data;
    }
  }
  const current = mockDb.getDepartments();
  mockDb.setDepartments([...current, newDept]);
  return newDept;
};

// Classes
export const fetchClasses = async (): Promise<Class[]> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (client) {
      const { data, error } = await client.from('classes').select('*');
      if (!error) return data || [];
    }
  }
  return mockDb.getClasses();
};

export const addClass = async (cls: Omit<Class, 'id' | 'created_at'>): Promise<Class> => {
  const newClass = { ...cls, id: `class-${Date.now()}`, created_at: new Date().toISOString() };
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (client) {
      const { data, error } = await client.from('classes').insert([cls]).select().single();
      if (!error && data) return data;
    }
  }
  const current = mockDb.getClasses();
  mockDb.setClasses([...current, newClass]);
  return newClass;
};

// Students
export const fetchStudents = async (): Promise<Student[]> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (client) {
      const { data, error } = await client.from('students').select('*');
      if (!error) return data || [];
    }
  }
  return mockDb.getStudents();
};

export const addStudent = async (student: Omit<Student, 'id' | 'created_at'>): Promise<Student> => {
  const newStudent = { ...student, id: `stud-${Date.now()}`, created_at: new Date().toISOString() };
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (client) {
      const { data, error } = await client.from('students').insert([student]).select().single();
      if (!error && data) return data;
    }
  }
  const current = mockDb.getStudents();
  mockDb.setStudents([...current, newStudent]);
  
  // Log Audit
  const session = getCurrentSession();
  addAuditLog(session.user?.id || 'system', `Registered student: ${student.name} (${student.register_number})`);
  
  return newStudent;
};

// Staff
export const fetchStaff = async (): Promise<Staff[]> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (client) {
      const { data, error } = await client.from('staff').select('*');
      if (!error) return data || [];
    }
  }
  return mockDb.getStaff();
};

export const addStaff = async (member: Omit<Staff, 'id' | 'created_at'>): Promise<Staff> => {
  const newMember = { ...member, id: `staff-${Date.now()}`, created_at: new Date().toISOString() };
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (client) {
      const { data, error } = await client.from('staff').insert([member]).select().single();
      if (!error && data) return data;
    }
  }
  const current = mockDb.getStaff();
  mockDb.setStaff([...current, newMember]);
  return newMember;
};

// Attendance
export const fetchAttendance = async (): Promise<Attendance[]> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (client) {
      const { data, error } = await client.from('attendance').select('*');
      if (!error) return data || [];
    }
  }
  return mockDb.getAttendance();
};

export const markAttendance = async (record: Omit<Attendance, 'id' | 'created_at'>): Promise<Attendance> => {
  const newRecord: Attendance = {
    ...record,
    id: `att-${Date.now()}-${record.student_id}`,
    created_at: new Date().toISOString()
  };

  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (client) {
      const { data, error } = await client.from('attendance').insert([record]).select().single();
      if (!error && data) return data;
      if (error) console.error('Supabase markAttendance error:', error);
    }
  }

  const current = mockDb.getAttendance();
  // Filter out any duplicate attendance for the same student on the same date
  const filtered = current.filter(r => !(r.student_id === record.student_id && r.date === record.date));
  mockDb.setAttendance([...filtered, newRecord]);

  // Log Audit
  const session = getCurrentSession();
  addAuditLog(session.user?.id || 'system', `Marked attendance for student ${record.student_id} as ${record.status} (Method: ${record.verification_method})`);

  return newRecord;
};

// Audit Logs
export const fetchAuditLogs = async (): Promise<AuditLog[]> => {
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (client) {
      const { data, error } = await client.from('audit_logs').select('*');
      if (!error) return data || [];
    }
  }
  return mockDb.getAuditLogs();
};

export const addAuditLog = (userId: string, action: string) => {
  const newLog: AuditLog = {
    id: `log-${Date.now()}`,
    user_id: userId,
    action,
    timestamp: new Date().toISOString()
  };
  
  // Local storage logs (even if supabase is enabled, keep local log feed cache)
  const current = mockDb.getAuditLogs();
  mockDb.setAuditLogs([newLog, ...current].slice(0, 100)); // Cap logs at 100
};

// --- FACE VECTOR MATCHING ENGINE ---
export interface FaceMatchResult {
  student: Student;
  confidence: number;
  status: 'present' | 'verification_pending' | 'reject';
}

/**
 * Searches the student list for a matching embedding
 */
export const matchStudentFace = async (
  inputEmbedding: number[], 
  threshold = 0.80
): Promise<FaceMatchResult | null> => {
  
  if (isSupabaseConfigured()) {
    const client = getSupabaseClient();
    if (client) {
      try {
        // Call postgres rpc matching function
        const { data, error } = await client.rpc('match_student_face', {
          input_embedding: inputEmbedding,
          match_threshold: threshold,
          match_limit: 1
        });
        
        if (!error && data && data.length > 0) {
          const match = data[0];
          
          // Fetch student record detail
          const students = await fetchStudents();
          const student = students.find(s => s.id === match.id);
          
          if (student) {
            const similarity = match.similarity;
            let status: 'present' | 'verification_pending' | 'reject' = 'reject';
            if (similarity > 0.90) status = 'present';
            else if (similarity >= 0.80) status = 'verification_pending';
            
            return {
              student,
              confidence: similarity,
              status
            };
          }
        }
      } catch (err) {
        console.error('Vector RPC search error, using local vector fallback:', err);
      }
    }
  }

  // --- LOCAL VECTOR SEARCH FALLBACK ---
  const students = await fetchStudents();
  let bestMatch: Student | null = null;
  let bestSimilarity = -1;

  for (const student of students) {
    if (!student.face_embedding) continue;
    
    // Compute dot product (since embeddings are L2 normalized, dot product = cosine similarity)
    let dotProduct = 0;
    for (let i = 0; i < 128; i++) {
      dotProduct += student.face_embedding[i] * inputEmbedding[i];
    }
    
    if (dotProduct > bestSimilarity) {
      bestSimilarity = dotProduct;
      bestMatch = student;
    }
  }

  if (bestMatch && bestSimilarity >= threshold) {
    let status: 'present' | 'verification_pending' | 'reject' = 'reject';
    if (bestSimilarity > 0.90) status = 'present';
    else if (bestSimilarity >= 0.80) status = 'verification_pending';

    return {
      student: bestMatch,
      confidence: bestSimilarity,
      status
    };
  }

  return null;
};
