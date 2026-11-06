-- Create subjects table
CREATE TABLE IF NOT EXISTS subjects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  program VARCHAR(10) NOT NULL CHECK (program IN ('BTS', 'BTP', 'CAP')),
  category VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create profiles table (for authentication and general user info)
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL UNIQUE,
  full_name VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('student', 'prof', 'staff', 'admin')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create student profiles table
CREATE TABLE IF NOT EXISTS student_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  registration_number VARCHAR(50) UNIQUE,
  subject_id UUID REFERENCES subjects(id),
  enrollment_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create staff profiles table
CREATE TABLE IF NOT EXISTS staff_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  staff_number VARCHAR(50) UNIQUE,
  position VARCHAR(100),
  department VARCHAR(100),
  subject_id UUID REFERENCES subjects(id),
  join_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create admin codes table for secure admin registration
CREATE TABLE IF NOT EXISTS admin_codes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(100) NOT NULL UNIQUE,
  is_used BOOLEAN DEFAULT FALSE,
  used_by_user_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP
);

-- Insert subjects
INSERT INTO subjects (name, program, category) VALUES
  ('Assistant de direction', 'BTS', 'Administration'),
  ('Informatique de Gestion', 'BTS', 'IT'),
  ('Audio Visuel Prise de Son', 'BTS', 'Media'),
  ('Contenus Multimédias', 'BTS', 'Media'),
  ('Assistant de direction', 'BTP', 'Administration'),
  ('Informatique de Gestion', 'BTP', 'IT'),
  ('Audio Visuel Prise de Son', 'BTP', 'Media'),
  ('Contenus Multimédias', 'BTP', 'Media')
ON CONFLICT (name) DO NOTHING;

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_student_profiles_user_id ON student_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_staff_profiles_user_id ON staff_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_codes_code ON admin_codes(code);
CREATE INDEX IF NOT EXISTS idx_subjects_program ON subjects(program);

-- Enable RLS (Row Level Security)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_codes ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view their own student profile" ON student_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can view their own staff profile" ON staff_profiles
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admin codes are viewable only for registration" ON admin_codes
  FOR SELECT USING (NOT is_used);
