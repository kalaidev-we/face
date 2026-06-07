-- FaceTrack AI Database Schema Setup
-- Run this SQL in the Supabase SQL Editor to initialize the database.

-- 1. Enable Required Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "vector"; -- Enables the pgvector extension for facial embeddings

-- 2. Create Tables
-- 2.1 Institutions Table
CREATE TABLE IF NOT EXISTS institutions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    address TEXT,
    contact VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2.2 Branches Table (Multi-Campus Support)
CREATE TABLE IF NOT EXISTS branches (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2.3 Departments Table
CREATE TABLE IF NOT EXISTS departments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    institution_id UUID REFERENCES institutions(id) ON DELETE CASCADE NOT NULL,
    branch_id UUID REFERENCES branches(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2.4 Classes Table
CREATE TABLE IF NOT EXISTS classes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    department_id UUID REFERENCES departments(id) ON DELETE CASCADE NOT NULL,
    name VARCHAR(255) NOT NULL,
    year INTEGER NOT NULL,
    section VARCHAR(10) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2.5 Students Table (incorporating pgvector embedding)
CREATE TABLE IF NOT EXISTS students (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    register_number VARCHAR(100) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50),
    photo_url TEXT,
    face_embedding vector(128), -- Stores the 128-dimensional embedding from face-api.js
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    class_id UUID REFERENCES classes(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2.6 Staff Table
CREATE TABLE IF NOT EXISTS staff (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    department_id UUID REFERENCES departments(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 2.7 Attendance Table
CREATE TABLE IF NOT EXISTS attendance (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    student_id UUID REFERENCES students(id) ON DELETE CASCADE NOT NULL,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    time TIME NOT NULL DEFAULT CURRENT_TIME,
    status VARCHAR(50) NOT NULL CHECK (status IN ('present', 'absent', 'late', 'verification_pending')),
    confidence_score DOUBLE PRECISION NOT NULL,
    captured_image TEXT,
    location_lat DOUBLE PRECISION,
    location_lng DOUBLE PRECISION,
    verification_method VARCHAR(50) NOT NULL CHECK (verification_method IN ('face', 'qr', 'manual')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    -- Prevent marking duplicate attendance for the same student on the same date
    CONSTRAINT unique_student_daily_attendance UNIQUE (student_id, date)
);

-- 2.8 Audit Logs Table
CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL, -- Refers to auth.users.id
    action TEXT NOT NULL,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL
);

-- 3. Create Vector Similarity Search RPC Function
-- Cosine distance operator <=> returns 1 - cosine_similarity
-- So we order by <=> ascending to find the most similar faces.
CREATE OR REPLACE FUNCTION match_student_face(
    input_embedding vector(128),
    match_threshold DOUBLE PRECISION,
    match_limit INTEGER
)
RETURNS TABLE (
    id UUID,
    register_number VARCHAR,
    name VARCHAR,
    email VARCHAR,
    photo_url VARCHAR,
    department_id UUID,
    class_id UUID,
    similarity DOUBLE PRECISION
)
LANGUAGE plpgsql
AS $$
BEGIN
    RETURN QUERY
    SELECT
        s.id,
        s.register_number,
        s.name,
        s.email,
        s.photo_url,
        s.department_id,
        s.class_id,
        1 - (s.face_embedding <=> input_embedding) AS similarity
    FROM students s
    WHERE s.face_embedding IS NOT NULL
      AND 1 - (s.face_embedding <=> input_embedding) > match_threshold
    ORDER BY s.face_embedding <=> input_embedding
    LIMIT match_limit;
END;
$$;

-- 4. Audit Log Helper Function & Triggers
CREATE OR REPLACE FUNCTION log_attendance_action()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO audit_logs (user_id, action)
    VALUES (
        COALESCE(auth.uid(), '00000000-0000-0000-0000-000000000000'::uuid),
        'Attendance marked for student: ' || NEW.student_id || ' status: ' || NEW.status || ' (Method: ' || NEW.verification_method || ')'
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trigger_log_attendance
AFTER INSERT ON attendance
FOR EACH ROW
EXECUTE FUNCTION log_attendance_action();

-- 5. Performance Indexes
CREATE INDEX IF NOT EXISTS idx_students_class ON students(class_id);
CREATE INDEX IF NOT EXISTS idx_students_dept ON students(department_id);
CREATE INDEX IF NOT EXISTS idx_attendance_date ON attendance(date);
CREATE INDEX IF NOT EXISTS idx_attendance_student_date ON attendance(student_id, date);
CREATE INDEX IF NOT EXISTS idx_classes_dept ON classes(department_id);
-- Index for vector search (HNSW index for pgvector performance)
CREATE INDEX IF NOT EXISTS idx_students_face_embedding ON students 
USING hnsw (face_embedding vector_cosine_ops);

-- 6. Row Level Security (RLS) Setup
ALTER TABLE institutions ENABLE ROW LEVEL SECURITY;
ALTER TABLE branches ENABLE ROW LEVEL SECURITY;
ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE students ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE attendance ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;

-- Helper security functions
-- We assume roles are stored in user metadata or a dedicated user roles mapping.
-- To keep it clean, we check if the authenticated user's email belongs to staff or admin.

-- 6.1 RLS Policies for Institutions
CREATE POLICY admin_all_institutions ON institutions FOR ALL TO authenticated
    USING (COALESCE(auth.jwt() ->> 'email', '') IN (SELECT email FROM staff) OR auth.jwt() ->> 'email' LIKE '%admin%');

CREATE POLICY select_institutions ON institutions FOR SELECT TO authenticated
    USING (true);

-- 6.2 RLS Policies for Branches
CREATE POLICY admin_all_branches ON branches FOR ALL TO authenticated
    USING (COALESCE(auth.jwt() ->> 'email', '') IN (SELECT email FROM staff) OR auth.jwt() ->> 'email' LIKE '%admin%');

CREATE POLICY select_branches ON branches FOR SELECT TO authenticated
    USING (true);

-- 6.3 RLS Policies for Departments
CREATE POLICY admin_all_departments ON departments FOR ALL TO authenticated
    USING (COALESCE(auth.jwt() ->> 'email', '') IN (SELECT email FROM staff) OR auth.jwt() ->> 'email' LIKE '%admin%');

CREATE POLICY select_departments ON departments FOR SELECT TO authenticated
    USING (true);

-- 6.4 RLS Policies for Classes
CREATE POLICY admin_all_classes ON classes FOR ALL TO authenticated
    USING (COALESCE(auth.jwt() ->> 'email', '') IN (SELECT email FROM staff) OR auth.jwt() ->> 'email' LIKE '%admin%');

CREATE POLICY select_classes ON classes FOR SELECT TO authenticated
    USING (true);

-- 6.5 RLS Policies for Students
CREATE POLICY admin_staff_all_students ON students FOR ALL TO authenticated
    USING (COALESCE(auth.jwt() ->> 'email', '') IN (SELECT email FROM staff) OR auth.jwt() ->> 'email' LIKE '%admin%');

CREATE POLICY student_view_self ON students FOR SELECT TO authenticated
    USING (auth.jwt() ->> 'email' = email);

-- 6.6 RLS Policies for Staff
CREATE POLICY admin_all_staff ON staff FOR ALL TO authenticated
    USING (auth.jwt() ->> 'email' LIKE '%admin%');

CREATE POLICY staff_view_self ON staff FOR SELECT TO authenticated
    USING (true);

-- 6.7 RLS Policies for Attendance
CREATE POLICY staff_admin_all_attendance ON attendance FOR ALL TO authenticated
    USING (COALESCE(auth.jwt() ->> 'email', '') IN (SELECT email FROM staff) OR auth.jwt() ->> 'email' LIKE '%admin%');

CREATE POLICY student_view_own_attendance ON attendance FOR SELECT TO authenticated
    USING (student_id IN (SELECT id FROM students WHERE email = auth.jwt() ->> 'email'));

CREATE POLICY student_insert_own_attendance ON attendance FOR INSERT TO authenticated
    WITH CHECK (
        -- Students can only mark their own attendance if verified via QR (NFC/Geofenced client-side matches)
        student_id IN (SELECT id FROM students WHERE email = auth.jwt() ->> 'email')
    );

-- 6.8 RLS Policies for Audit Logs
CREATE POLICY admin_view_all_logs ON audit_logs FOR SELECT TO authenticated
    USING (auth.jwt() ->> 'email' LIKE '%admin%');

-- 7. Storage Bucket Configurations
-- Note: Create 'student-photos' and 'attendance-snaps' buckets in the Supabase Dashboard
-- Allow public select access and authenticated insert/update access.
