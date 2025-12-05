-- RLS Policies for PEF Management Schema
-- This script adds Row Level Security policies to the existing tables

-- Create extension for UUID if not exists
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create roles for RLS
DO $$ BEGIN
  CREATE ROLE rls_tlc;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE ROLE rls_dipartimento;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE ROLE rls_docente;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE ROLE rls_corsista;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE ROLE rls_coord_tutor;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  CREATE ROLE rls_collab_tutor;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Enable RLS on all profile and data tables
ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE coordinator_tutor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE collaborator_tutor_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE teacher_course_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE training_projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_internships ENABLE ROW LEVEL SECURITY;
ALTER TABLE indirect_internships ENABLE ROW LEVEL SECURITY;
ALTER TABLE direct_internship_attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE indirect_internship_attendances ENABLE ROW LEVEL SECURITY;
ALTER TABLE payments ENABLE ROW LEVEL SECURITY;
ALTER TABLE final_exam_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE final_exam_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE recognitions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any (for re-run safety)
DROP POLICY IF EXISTS student_rls_policy ON student_profiles;
DROP POLICY IF EXISTS teacher_rls_policy ON teacher_profiles;
DROP POLICY IF EXISTS coordinator_tutor_rls_policy ON coordinator_tutor_profiles;
DROP POLICY IF EXISTS collaborator_tutor_rls_policy ON collaborator_tutor_profiles;
DROP POLICY IF EXISTS courses_rls_policy ON courses;
DROP POLICY IF EXISTS teacher_course_assignments_rls_policy ON teacher_course_assignments;
DROP POLICY IF EXISTS training_projects_rls_policy ON training_projects;
DROP POLICY IF EXISTS student_course_enrollments_rls_policy ON student_course_enrollments;
DROP POLICY IF EXISTS lessons_rls_policy ON lessons;
DROP POLICY IF EXISTS lesson_attendances_rls_policy ON lesson_attendances;
DROP POLICY IF EXISTS direct_internships_rls_policy ON direct_internships;
DROP POLICY IF EXISTS indirect_internships_rls_policy ON indirect_internships;
DROP POLICY IF EXISTS direct_internship_attendances_rls_policy ON direct_internship_attendances;
DROP POLICY IF EXISTS indirect_internship_attendances_rls_policy ON indirect_internship_attendances;
DROP POLICY IF EXISTS payments_rls_policy ON payments;
DROP POLICY IF EXISTS final_exam_schedule_rls_policy ON final_exam_schedule;
DROP POLICY IF EXISTS final_exam_commissions_rls_policy ON final_exam_commissions;
DROP POLICY IF EXISTS recognitions_rls_policy ON recognitions;

-- Student Profiles RLS
CREATE POLICY student_rls_policy ON student_profiles FOR ALL USING (
  (current_setting('app.user_role', true) = 'TLC') OR
  (current_setting('app.user_role', true) = 'DIPARTIMENTO' AND id IN (
    SELECT sp.id FROM student_profiles sp 
    JOIN training_projects tp ON sp.id = tp."studentId" 
    WHERE tp."departmentId" = (
      SELECT u."departmentId" FROM users u WHERE u.id = current_setting('app.user_id', true)::uuid
    )
  )) OR
  (current_setting('app.user_role', true) = 'CORSISTA' AND "userId" = current_setting('app.user_id', true)::uuid)
);

-- Teacher Profiles RLS
CREATE POLICY teacher_rls_policy ON teacher_profiles FOR ALL USING (
  (current_setting('app.user_role', true) = 'TLC') OR
  (current_setting('app.user_role', true) = 'DIPARTIMENTO' AND "departmentId" = (
    SELECT "departmentId" FROM users WHERE id = current_setting('app.user_id', true)::uuid
  )) OR
  (current_setting('app.user_role', true) = 'DOCENTE' AND "userId" = current_setting('app.user_id', true)::uuid)
);

-- Coordinator Tutor Profiles RLS
CREATE POLICY coordinator_tutor_rls_policy ON coordinator_tutor_profiles FOR ALL USING (
  (current_setting('app.user_role', true) = 'TLC') OR
  (current_setting('app.user_role', true) = 'DIPARTIMENTO' AND "departmentId" = (
    SELECT "departmentId" FROM users WHERE id = current_setting('app.user_id', true)::uuid
  )) OR
  (current_setting('app.user_role', true) = 'COORD_TUTOR' AND "userId" = current_setting('app.user_id', true)::uuid)
);

-- Collaborator Tutor Profiles RLS
CREATE POLICY collaborator_tutor_rls_policy ON collaborator_tutor_profiles FOR ALL USING (
  (current_setting('app.user_role', true) = 'TLC') OR
  (current_setting('app.user_role', true) = 'DIPARTIMENTO') OR
  (current_setting('app.user_role', true) = 'COLLAB_TUTOR' AND "userId" = current_setting('app.user_id', true)::uuid)
);

-- Courses RLS
CREATE POLICY courses_rls_policy ON courses FOR ALL USING (
  (current_setting('app.user_role', true) = 'TLC') OR
  (current_setting('app.user_role', true) = 'DIPARTIMENTO' AND "departmentId" = (
    SELECT "departmentId" FROM users WHERE id = current_setting('app.user_id', true)::uuid
  )) OR
  (current_setting('app.user_role', true) IN ('DOCENTE', 'CORSISTA', 'COORD_TUTOR', 'COLLAB_TUTOR'))
);

-- Training Projects RLS
CREATE POLICY training_projects_rls_policy ON training_projects FOR ALL USING (
  (current_setting('app.user_role', true) = 'TLC') OR
  (current_setting('app.user_role', true) = 'DIPARTIMENTO' AND "departmentId" = (
    SELECT "departmentId" FROM users WHERE id = current_setting('app.user_id', true)::uuid
  )) OR
  (current_setting('app.user_role', true) = 'CORSISTA' AND "studentId" = (
    SELECT id FROM student_profiles WHERE "userId" = current_setting('app.user_id', true)::uuid
  ))
);

-- Lessons RLS  
CREATE POLICY lessons_rls_policy ON lessons FOR ALL USING (
  (current_setting('app.user_role', true) = 'TLC') OR
  (current_setting('app.user_role', true) = 'DIPARTIMENTO' AND "courseId" IN (
    SELECT id FROM courses WHERE "departmentId" = (
      SELECT "departmentId" FROM users WHERE id = current_setting('app.user_id', true)::uuid
    )
  )) OR
  (current_setting('app.user_role', true) = 'DOCENTE' AND "teacherId" = (
    SELECT id FROM teacher_profiles WHERE "userId" = current_setting('app.user_id', true)::uuid
  ))
);

-- Payments RLS
CREATE POLICY payments_rls_policy ON payments FOR ALL USING (
  (current_setting('app.user_role', true) = 'TLC') OR
  (current_setting('app.user_role', true) = 'DIPARTIMENTO' AND "studentId" IN (
    SELECT sp.id FROM student_profiles sp 
    JOIN training_projects tp ON sp.id = tp."studentId" 
    WHERE tp."departmentId" = (
      SELECT "departmentId" FROM users WHERE id = current_setting('app.user_id', true)::uuid
    )
  )) OR
  (current_setting('app.user_role', true) = 'CORSISTA' AND "studentId" = (
    SELECT id FROM student_profiles WHERE "userId" = current_setting('app.user_id', true)::uuid
  ))
);

-- Direct Internships RLS
CREATE POLICY direct_internships_rls_policy ON direct_internships FOR ALL USING (
  (current_setting('app.user_role', true) = 'TLC') OR
  (current_setting('app.user_role', true) = 'DIPARTIMENTO' AND "trainingProjectId" IN (
    SELECT id FROM training_projects WHERE "departmentId" = (
      SELECT "departmentId" FROM users WHERE id = current_setting('app.user_id', true)::uuid
    )
  )) OR
  (current_setting('app.user_role', true) = 'CORSISTA' AND "studentId" = (
    SELECT id FROM student_profiles WHERE "userId" = current_setting('app.user_id', true)::uuid
  )) OR
  (current_setting('app.user_role', true) = 'COLLAB_TUTOR' AND "collaboratorTutorId" = (
    SELECT id FROM collaborator_tutor_profiles WHERE "userId" = current_setting('app.user_id', true)::uuid
  ))
);

-- Indirect Internships RLS
CREATE POLICY indirect_internships_rls_policy ON indirect_internships FOR ALL USING (
  (current_setting('app.user_role', true) = 'TLC') OR
  (current_setting('app.user_role', true) = 'DIPARTIMENTO' AND "trainingProjectId" IN (
    SELECT id FROM training_projects WHERE "departmentId" = (
      SELECT "departmentId" FROM users WHERE id = current_setting('app.user_id', true)::uuid
    )
  )) OR
  (current_setting('app.user_role', true) = 'CORSISTA' AND "studentId" = (
    SELECT id FROM student_profiles WHERE "userId" = current_setting('app.user_id', true)::uuid
  )) OR
  (current_setting('app.user_role', true) = 'COORD_TUTOR' AND "coordinatorTutorId" = (
    SELECT id FROM coordinator_tutor_profiles WHERE "userId" = current_setting('app.user_id', true)::uuid
  ))
);

-- Recognitions RLS
CREATE POLICY recognitions_rls_policy ON recognitions FOR ALL USING (
  (current_setting('app.user_role', true) = 'TLC') OR
  (current_setting('app.user_role', true) = 'DIPARTIMENTO' AND "trainingProjectId" IN (
    SELECT id FROM training_projects WHERE "departmentId" = (
      SELECT "departmentId" FROM users WHERE id = current_setting('app.user_id', true)::uuid
    )
  )) OR
  (current_setting('app.user_role', true) = 'CORSISTA' AND "studentId" = (
    SELECT id FROM student_profiles WHERE "userId" = current_setting('app.user_id', true)::uuid
  ))
);

-- Create trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column() 
RETURNS TRIGGER AS $$ 
BEGIN 
  NEW."updatedAt" = NOW(); 
  RETURN NEW; 
END; 
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users 
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Grant permissions to app user
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO postgres;

SELECT 'RLS Policies applied successfully!' as status;
