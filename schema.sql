-- 1. ISTRUZIONI DI DEPLOY RAPIDO
-- Copia questo contenuto in un file chiamato 'schema.sql'
-- Esegui: psql "postgresql://..." -f schema.sql

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";CREATE ROLE rls_tlc;CREATE ROLE rls_dipartimento;CREATE ROLE rls_docente;CREATE ROLE rls_corsista;CREATE ROLE rls_coord_tutor;CREATE ROLE rls_collab_tutor;CREATE TABLE departments (department_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),name VARCHAR(255) NOT NULL UNIQUE,code VARCHAR(50) UNIQUE,description TEXT);CREATE TABLE academic_years_editions (academic_year_edition_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),year_label VARCHAR(100) NOT NULL,edition_label VARCHAR(100) NOT NULL,start_date DATE NOT NULL,end_date DATE NOT NULL,description TEXT,UNIQUE (year_label, edition_label));CREATE TABLE course_types (course_type_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),name VARCHAR(255) NOT NULL UNIQUE,description TEXT,has_in_itinere_exams BOOLEAN NOT NULL DEFAULT FALSE);CREATE TABLE competition_classes (competition_class_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),code VARCHAR(50) NOT NULL UNIQUE,name VARCHAR(255) NOT NULL,description TEXT);CREATE TABLE schools (school_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),name VARCHAR(255) NOT NULL,address VARCHAR(255),city VARCHAR(100),province VARCHAR(100),contact_person VARCHAR(255),phone VARCHAR(50),email VARCHAR(255));CREATE TABLE usr_referents (usr_referent_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),first_name VARCHAR(100) NOT NULL,last_name VARCHAR(100) NOT NULL,email VARCHAR(255) UNIQUE NOT NULL,phone VARCHAR(50),usr_office_name VARCHAR(255));CREATE TABLE users (user_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),email VARCHAR(255) UNIQUE NOT NULL,password_hash VARCHAR(255) NOT NULL,role VARCHAR(50) NOT NULL CHECK (role IN ('TLC', 'DIPARTIMENTO', 'DOCENTE', 'CORSISTA', 'COORD_TUTOR', 'COLLAB_TUTOR')),is_active BOOLEAN NOT NULL DEFAULT TRUE,department_id UUID REFERENCES departments(department_id) ON DELETE SET NULL,created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP);CREATE OR REPLACE FUNCTION update_updated_at_column() RETURNS TRIGGER AS $$ BEGIN NEW.updated_at = NOW(); RETURN NEW; END; $$ LANGUAGE plpgsql;CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();CREATE TABLE student_profiles (student_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),user_id UUID UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,first_name VARCHAR(100) NOT NULL,last_name VARCHAR(100) NOT NULL,fiscal_code VARCHAR(16) UNIQUE NOT NULL,date_of_birth DATE,address VARCHAR(255),city VARCHAR(100),phone VARCHAR(50));ALTER TABLE student_profiles ENABLE ROW LEVEL SECURITY;CREATE POLICY student_rls_policy ON student_profiles FOR ALL USING ((current_setting('app.user_role') = 'TLC') OR (current_setting('app.user_role') = 'DIPARTIMENTO' AND student_id IN (SELECT sp.student_id FROM student_profiles sp JOIN training_projects tp ON sp.student_id = tp.student_id WHERE tp.department_id = (SELECT u.department_id FROM users u WHERE u.user_id = current_setting('app.user_id')::uuid))) OR (current_setting('app.user_role') = 'CORSISTA' AND user_id = current_setting('app.user_id')::uuid));CREATE TABLE teacher_profiles (teacher_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),user_id UUID UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,first_name VARCHAR(100) NOT NULL,last_name VARCHAR(100) NOT NULL,department_id UUID REFERENCES departments(department_id) ON DELETE SET NULL,competition_class_id UUID REFERENCES competition_classes(competition_class_id) ON DELETE SET NULL,phone VARCHAR(50));ALTER TABLE teacher_profiles ENABLE ROW LEVEL SECURITY;CREATE POLICY teacher_rls_policy ON teacher_profiles FOR ALL USING ((current_setting('app.user_role') = 'TLC') OR (current_setting('app.user_role') = 'DIPARTIMENTO' AND department_id = (SELECT department_id FROM users WHERE user_id = current_setting('app.user_id')::uuid)) OR (current_setting('app.user_role') = 'DOCENTE' AND user_id = current_setting('app.user_id')::uuid));CREATE TABLE coordinator_tutor_profiles (tutor_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),user_id UUID UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,first_name VARCHAR(100) NOT NULL,last_name VARCHAR(100) NOT NULL,department_id UUID REFERENCES departments(department_id) ON DELETE SET NULL,phone VARCHAR(50));ALTER TABLE coordinator_tutor_profiles ENABLE ROW LEVEL SECURITY;CREATE POLICY coordinator_tutor_rls_policy ON coordinator_tutor_profiles FOR ALL USING ((current_setting('app.user_role') = 'TLC') OR (current_setting('app.user_role') = 'DIPARTIMENTO' AND department_id = (SELECT department_id FROM users WHERE user_id = current_setting('app.user_id')::uuid)) OR (current_setting('app.user_role') = 'COORD_TUTOR' AND user_id = current_setting('app.user_id')::uuid));CREATE TABLE collaborator_tutor_profiles (tutor_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),user_id UUID UNIQUE NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,first_name VARCHAR(100) NOT NULL,last_name VARCHAR(100) NOT NULL,school_id UUID REFERENCES schools(school_id) ON DELETE SET NULL,phone VARCHAR(50));ALTER TABLE collaborator_tutor_profiles ENABLE ROW LEVEL SECURITY;CREATE POLICY collaborator_tutor_rls_policy ON collaborator_tutor_profiles FOR ALL USING ((current_setting('app.user_role') = 'TLC') OR (current_setting('app.user_role') = 'DIPARTIMENTO') OR (current_setting('app.user_role') = 'COLLAB_TUTOR' AND user_id = current_setting('app.user_id')::uuid));CREATE TABLE courses (course_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),name VARCHAR(255) NOT NULL,description TEXT,cfu INT NOT NULL,department_id UUID REFERENCES departments(department_id) ON DELETE CASCADE);ALTER TABLE courses ENABLE ROW LEVEL SECURITY;CREATE POLICY courses_rls_policy ON courses FOR ALL USING ((current_setting('app.user_role') = 'TLC') OR (current_setting('app.user_role') = 'DIPARTIMENTO' AND department_id = (SELECT department_id FROM users WHERE user_id = current_setting('app.user_id')::uuid)) OR (current_setting('app.user_role') IN ('DOCENTE', 'CORSISTA', 'COORD_TUTOR', 'COLLAB_TUTOR')));CREATE TABLE course_competition_classes (course_id UUID NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,competition_class_id UUID NOT NULL REFERENCES competition_classes(competition_class_id) ON DELETE CASCADE,PRIMARY KEY (course_id, competition_class_id));CREATE TABLE teacher_course_assignments (assignment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),teacher_id UUID NOT NULL REFERENCES teacher_profiles(teacher_id) ON DELETE CASCADE,course_id UUID NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,academic_year_edition_id UUID NOT NULL REFERENCES academic_years_editions(academic_year_edition_id) ON DELETE CASCADE,UNIQUE (teacher_id, course_id, academic_year_edition_id));ALTER TABLE teacher_course_assignments ENABLE ROW LEVEL SECURITY;CREATE POLICY teacher_course_assignments_rls_policy ON teacher_course_assignments FOR ALL USING ((current_setting('app.user_role') = 'TLC') OR (current_setting('app.user_role') = 'DIPARTIMENTO' AND course_id IN (SELECT course_id FROM courses WHERE department_id = (SELECT department_id FROM users WHERE user_id = current_setting('app.user_id')::uuid))) OR (current_setting('app.user_role') = 'DOCENTE' AND teacher_id = (SELECT teacher_id FROM teacher_profiles WHERE user_id = current_setting('app.user_id')::uuid)));CREATE TABLE training_projects (project_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),student_id UUID NOT NULL REFERENCES student_profiles(student_id) ON DELETE CASCADE,course_type_id UUID NOT NULL REFERENCES course_types(course_type_id) ON DELETE CASCADE,academic_year_edition_id UUID NOT NULL REFERENCES academic_years_editions(academic_year_edition_id) ON DELETE CASCADE,department_id UUID NOT NULL REFERENCES departments(department_id) ON DELETE CASCADE,status VARCHAR(50) NOT NULL DEFAULT 'In_Corso' CHECK (status IN ('In_Corso', 'Completato', 'Sospeso', 'Annullato')),start_date DATE,end_date DATE,UNIQUE (student_id, course_type_id, academic_year_edition_id));ALTER TABLE training_projects ENABLE ROW LEVEL SECURITY;CREATE POLICY training_projects_rls_policy ON training_projects FOR ALL USING ((current_setting('app.user_role') = 'TLC') OR (current_setting('app.user_role') = 'DIPARTIMENTO' AND department_id = (SELECT department_id FROM users WHERE user_id = current_setting('app.user_id')::uuid)) OR (current_setting('app.user_role') = 'CORSISTA' AND student_id = (SELECT student_id FROM student_profiles WHERE user_id = current_setting('app.user_id')::uuid)) OR (current_setting('app.user_role') = 'DOCENTE' AND EXISTS (SELECT 1 FROM student_course_enrollments sce JOIN teacher_course_assignments tca ON sce.course_id = tca.course_id WHERE sce.training_project_id = training_projects.project_id AND tca.teacher_id = (SELECT teacher_id FROM teacher_profiles WHERE user_id = current_setting('app.user_id')::uuid))));CREATE TABLE student_course_enrollments (enrollment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),training_project_id UUID NOT NULL REFERENCES training_projects(project_id) ON DELETE CASCADE,course_id UUID NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,enrollment_date DATE NOT NULL DEFAULT CURRENT_DATE,grade DECIMAL(4,2),UNIQUE (training_project_id, course_id));ALTER TABLE student_course_enrollments ENABLE ROW LEVEL SECURITY;CREATE POLICY student_course_enrollments_rls_policy ON student_course_enrollments FOR ALL USING ((current_setting('app.user_role') = 'TLC') OR (current_setting('app.user_role') = 'DIPARTIMENTO' AND training_project_id IN (SELECT project_id FROM training_projects WHERE department_id = (SELECT department_id FROM users WHERE user_id = current_setting('app.user_id')::uuid))) OR (current_setting('app.user_role') = 'CORSISTA' AND training_project_id IN (SELECT project_id FROM training_projects WHERE student_id = (SELECT student_id FROM student_profiles WHERE user_id = current_setting('app.user_id')::uuid))) OR (current_setting('app.user_role') = 'DOCENTE' AND course_id IN (SELECT course_id FROM teacher_course_assignments WHERE teacher_id = (SELECT teacher_id FROM teacher_profiles WHERE user_id = current_setting('app.user_id')::uuid))));CREATE TABLE lessons (lesson_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),course_id UUID NOT NULL REFERENCES courses(course_id) ON DELETE CASCADE,teacher_id UUID NOT NULL REFERENCES teacher_profiles(teacher_id) ON DELETE CASCADE,lesson_date DATE NOT NULL,start_time TIME NOT NULL,end_time TIME NOT NULL,room VARCHAR(100),pef60_all1_delivery_mode VARCHAR(20) DEFAULT 'Non Applicabile' CHECK (pef60_all1_delivery_mode IN ('Presenza', 'Online', 'Non Applicabile')),pef30_all2_delivery_mode VARCHAR(20) DEFAULT 'Non Applicabile' CHECK (pef30_all2_delivery_mode IN ('Presenza', 'Online', 'Non Applicabile')),pef36_all5_delivery_mode VARCHAR(20) DEFAULT 'Non Applicabile' CHECK (pef36_all5_delivery_mode IN ('Presenza', 'Online', 'Non Applicabile')),pef30_art13_delivery_mode VARCHAR(20) DEFAULT 'Non Applicabile' CHECK (pef30_art13_delivery_mode IN ('Presenza', 'Online', 'Non Applicabile')),teams_meeting_link VARCHAR(255),lesson_cfu DECIMAL(4,2) NOT NULL DEFAULT 0.0);ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;CREATE POLICY lessons_rls_policy ON lessons FOR ALL USING ((current_setting('app.user_role') = 'TLC') OR (current_setting('app.user_role') = 'DIPARTIMENTO' AND course_id IN (SELECT course_id FROM courses WHERE department_id = (SELECT department_id FROM users WHERE user_id = current_setting('app.user_id')::uuid))) OR (current_setting('app.user_role') = 'CORSISTA' AND course_id IN (SELECT sce.course_id FROM student_course_enrollments sce JOIN training_projects tp ON sce.training_project_id = tp.project_id WHERE tp.student_id = (SELECT student_id FROM student_profiles WHERE user_id = current_setting('app.user_id')::uuid))) OR (current_setting('app.user_role') = 'DOCENTE' AND teacher_id = (SELECT teacher_id FROM teacher_profiles WHERE user_id = current_setting('app.user_id')::uuid)));CREATE TABLE lesson_competition_classes (lesson_id UUID NOT NULL REFERENCES lessons(lesson_id) ON DELETE CASCADE,competition_class_id UUID NOT NULL REFERENCES competition_classes(competition_class_id) ON DELETE CASCADE,PRIMARY KEY (lesson_id, competition_class_id));CREATE TABLE lesson_attendances (attendance_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),lesson_id UUID NOT NULL REFERENCES lessons(lesson_id) ON DELETE CASCADE,student_id UUID NOT NULL REFERENCES student_profiles(student_id) ON DELETE CASCADE,attendance_status VARCHAR(50) NOT NULL CHECK (attendance_status IN ('Presente', 'Assente', 'Giustificato')),attendance_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,UNIQUE (lesson_id, student_id));ALTER TABLE lesson_attendances ENABLE ROW LEVEL SECURITY;CREATE POLICY lesson_attendances_rls_policy ON lesson_attendances FOR ALL USING ((current_setting('app.user_role') = 'TLC') OR (current_setting('app.user_role') = 'DIPARTIMENTO' AND lesson_id IN (SELECT l.lesson_id FROM lessons l JOIN courses c ON l.course_id = c.course_id WHERE c.department_id = (SELECT department_id FROM users WHERE user_id = current_setting('app.user_id')::uuid))) OR (current_setting('app.user_role') = 'CORSISTA' AND student_id = (SELECT student_id FROM student_profiles WHERE user_id = current_setting('app.user_id')::uuid)) OR (current_setting('app.user_role') = 'DOCENTE' AND lesson_id IN (SELECT lesson_id FROM lessons WHERE teacher_id = (SELECT teacher_id FROM teacher_profiles WHERE user_id = current_setting('app.user_id')::uuid))));CREATE TABLE direct_internships (internship_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),student_id UUID NOT NULL REFERENCES student_profiles(student_id) ON DELETE CASCADE,school_id UUID NOT NULL REFERENCES schools(school_id) ON DELETE CASCADE,collaborator_tutor_id UUID REFERENCES collaborator_tutor_profiles(tutor_id) ON DELETE SET NULL,training_project_id UUID NOT NULL REFERENCES training_projects(project_id) ON DELETE CASCADE,start_date DATE NOT NULL,end_date DATE NOT NULL,total_hours INT NOT NULL,description TEXT);ALTER TABLE direct_internships ENABLE ROW LEVEL SECURITY;CREATE POLICY direct_internships_rls_policy ON direct_internships FOR ALL USING ((current_setting('app.user_role') = 'TLC') OR (current_setting('app.user_role') = 'DIPARTIMENTO' AND training_project_id IN (SELECT project_id FROM training_projects WHERE department_id = (SELECT department_id FROM users WHERE user_id = current_setting('app.user_id')::uuid))) OR (current_setting('app.user_role') = 'CORSISTA' AND student_id = (SELECT student_id FROM student_profiles WHERE user_id = current_setting('app.user_id')::uuid)) OR (current_setting('app.user_role') = 'COLLAB_TUTOR' AND collaborator_tutor_id = (SELECT tutor_id FROM collaborator_tutor_profiles WHERE user_id = current_setting('app.user_id')::uuid)));CREATE TABLE indirect_internships (internship_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),student_id UUID NOT NULL REFERENCES student_profiles(student_id) ON DELETE CASCADE,coordinator_tutor_id UUID REFERENCES coordinator_tutor_profiles(tutor_id) ON DELETE SET NULL,training_project_id UUID NOT NULL REFERENCES training_projects(project_id) ON DELETE CASCADE,start_date DATE NOT NULL,end_date DATE NOT NULL,total_hours INT NOT NULL,description TEXT);ALTER TABLE indirect_internships ENABLE ROW LEVEL SECURITY;CREATE POLICY indirect_internships_rls_policy ON indirect_internships FOR ALL USING ((current_setting('app.user_role') = 'TLC') OR (current_setting('app.user_role') = 'DIPARTIMENTO' AND training_project_id IN (SELECT project_id FROM training_projects WHERE department_id = (SELECT department_id FROM users WHERE user_id = current_setting('app.user_id')::uuid))) OR (current_setting('app.user_role') = 'CORSISTA' AND student_id = (SELECT student_id FROM student_profiles WHERE user_id = current_setting('app.user_id')::uuid)) OR (current_setting('app.user_role') = 'COORD_TUTOR' AND coordinator_tutor_id = (SELECT tutor_id FROM coordinator_tutor_profiles WHERE user_id = current_setting('app.user_id')::uuid)));CREATE TABLE direct_internship_attendances (attendance_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),direct_internship_id UUID NOT NULL REFERENCES direct_internships(internship_id) ON DELETE CASCADE,student_id UUID NOT NULL REFERENCES student_profiles(student_id) ON DELETE CASCADE,date DATE NOT NULL,hours_attended INT NOT NULL,description TEXT,UNIQUE (direct_internship_id, date, student_id));ALTER TABLE direct_internship_attendances ENABLE ROW LEVEL SECURITY;CREATE POLICY direct_internship_attendances_rls_policy ON direct_internship_attendances FOR ALL USING ((current_setting('app.user_role') = 'TLC') OR (current_setting('app.user_role') = 'DIPARTIMENTO' AND direct_internship_id IN (SELECT di.internship_id FROM direct_internships di JOIN training_projects tp ON di.training_project_id = tp.project_id WHERE tp.department_id = (SELECT department_id FROM users WHERE user_id = current_setting('app.user_id')::uuid))) OR (current_setting('app.user_role') = 'CORSISTA' AND student_id = (SELECT student_id FROM student_profiles WHERE user_id = current_setting('app.user_id')::uuid)) OR (current_setting('app.user_role') = 'COLLAB_TUTOR' AND direct_internship_id IN (SELECT internship_id FROM direct_internships WHERE collaborator_tutor_id = (SELECT tutor_id FROM collaborator_tutor_profiles WHERE user_id = current_setting('app.user_id')::uuid))));CREATE TABLE indirect_internship_attendances (attendance_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),indirect_internship_id UUID NOT NULL REFERENCES indirect_internships(internship_id) ON DELETE CASCADE,student_id UUID NOT NULL REFERENCES student_profiles(student_id) ON DELETE CASCADE,date DATE NOT NULL,hours_attended INT NOT NULL,description TEXT,UNIQUE (indirect_internship_id, date, student_id));ALTER TABLE indirect_internship_attendances ENABLE ROW LEVEL SECURITY;CREATE POLICY indirect_internship_attendances_rls_policy ON indirect_internship_attendances FOR ALL USING ((current_setting('app.user_role') = 'TLC') OR (current_setting('app.user_role') = 'DIPARTIMENTO' AND indirect_internship_id IN (SELECT idi.internship_id FROM indirect_internships idi JOIN training_projects tp ON idi.training_project_id = tp.project_id WHERE tp.department_id = (SELECT department_id FROM users WHERE user_id = current_setting('app.user_id')::uuid))) OR (current_setting('app.user_role') = 'CORSISTA' AND student_id = (SELECT student_id FROM student_profiles WHERE user_id = current_setting('app.user_id')::uuid)) OR (current_setting('app.user_role') = 'COORD_TUTOR' AND indirect_internship_id IN (SELECT internship_id FROM indirect_internships WHERE coordinator_tutor_id = (SELECT tutor_id FROM coordinator_tutor_profiles WHERE user_id = current_setting('app.user_id')::uuid))));CREATE TABLE payments (payment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),student_id UUID NOT NULL REFERENCES student_profiles(student_id) ON DELETE CASCADE,academic_year_edition_id UUID NOT NULL REFERENCES academic_years_editions(academic_year_edition_id) ON DELETE CASCADE,amount DECIMAL(10,2) NOT NULL,payment_date DATE NOT NULL,status VARCHAR(50) NOT NULL CHECK (status IN ('Pagato', 'In_Sospeso', 'Rimborsato', 'Annullato')),description TEXT);ALTER TABLE payments ENABLE ROW LEVEL SECURITY;CREATE POLICY payments_rls_policy ON payments FOR ALL USING ((current_setting('app.user_role') = 'TLC') OR (current_setting('app.user_role') = 'DIPARTIMENTO' AND student_id IN (SELECT sp.student_id FROM student_profiles sp JOIN training_projects tp ON sp.student_id = tp.student_id WHERE tp.department_id = (SELECT department_id FROM users WHERE user_id = current_setting('app.user_id')::uuid))) OR (current_setting('app.user_role') = 'CORSISTA' AND student_id = (SELECT student_id FROM student_profiles WHERE user_id = current_setting('app.user_id')::uuid)));CREATE TABLE final_exam_schedule (schedule_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),academic_year_edition_id UUID NOT NULL REFERENCES academic_years_editions(academic_year_edition_id) ON DELETE CASCADE,course_type_id UUID REFERENCES course_types(course_type_id) ON DELETE SET NULL,exam_date DATE NOT NULL,start_time TIME,end_time TIME,location VARCHAR(255),description TEXT);ALTER TABLE final_exam_schedule ENABLE ROW LEVEL SECURITY;CREATE POLICY final_exam_schedule_rls_policy ON final_exam_schedule FOR ALL USING ((current_setting('app.user_role') = 'TLC') OR (current_setting('app.user_role') = 'DIPARTIMENTO' AND academic_year_edition_id IN (SELECT academic_year_edition_id FROM training_projects WHERE department_id = (SELECT department_id FROM users WHERE user_id = current_setting('app.user_id')::uuid))) OR (current_setting('app.user_role') = 'CORSISTA' AND academic_year_edition_id IN (SELECT academic_year_edition_id FROM training_projects WHERE student_id = (SELECT student_id FROM student_profiles WHERE user_id = current_setting('app.user_id')::uuid))));CREATE TABLE final_exam_commissions (commission_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),schedule_id UUID NOT NULL REFERENCES final_exam_schedule(schedule_id) ON DELETE CASCADE,teacher_id UUID NOT NULL REFERENCES teacher_profiles(teacher_id) ON DELETE CASCADE,role_in_commission VARCHAR(100),UNIQUE (schedule_id, teacher_id));ALTER TABLE final_exam_commissions ENABLE ROW LEVEL SECURITY;CREATE POLICY final_exam_commissions_rls_policy ON final_exam_commissions FOR ALL USING ((current_setting('app.user_role') = 'TLC') OR (current_setting('app.user_role') = 'DIPARTIMENTO' AND schedule_id IN (SELECT fes.schedule_id FROM final_exam_schedule fes JOIN training_projects tp ON fes.academic_year_edition_id = tp.academic_year_edition_id WHERE tp.department_id = (SELECT department_id FROM users WHERE user_id = current_setting('app.user_id')::uuid))) OR (current_setting('app.user_role') = 'DOCENTE' AND teacher_id = (SELECT teacher_id FROM teacher_profiles WHERE user_id = current_setting('app.user_id')::uuid))));CREATE TABLE recognitions (recognition_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),student_id UUID NOT NULL REFERENCES student_profiles(student_id) ON DELETE CASCADE,training_project_id UUID NOT NULL REFERENCES training_projects(project_id) ON DELETE CASCADE,recognized_course_id UUID REFERENCES courses(course_id) ON DELETE SET NULL,recognized_direct_internship_id UUID REFERENCES direct_internships(internship_id) ON DELETE SET NULL,recognized_indirect_internship_id UUID REFERENCES indirect_internships(internship_id) ON DELETE SET NULL,cfu_recognized INT NOT NULL,recognition_date DATE NOT NULL DEFAULT CURRENT_DATE,status VARCHAR(50) NOT NULL CHECK (status IN ('Approvato', 'In_Revisione', 'Rifiutato', 'Annullato')),notes TEXT,CHECK ( (recognized_course_id IS NOT NULL)::INT + (recognized_direct_internship_id IS NOT NULL)::INT + (recognized_indirect_internship_id IS NOT NULL)::INT = 1 ));ALTER TABLE recognitions ENABLE ROW LEVEL SECURITY;CREATE POLICY recognitions_rls_policy ON recognitions FOR ALL USING ((current_setting('app.user_role') = 'TLC') OR (current_setting('app.user_role') = 'DIPARTIMENTO' AND training_project_id IN (SELECT project_id FROM training_projects WHERE department_id = (SELECT u.department_id FROM users u WHERE u.user_id = current_setting('app.user_id')::uuid))) OR (current_setting('app.user_role') = 'CORSISTA' AND student_id = (SELECT student_id FROM student_profiles WHERE user_id = current_setting('app.user_id')::uuid)) OR (current_setting('app.user_role') = 'DOCENTE' AND recognized_course_id IN (SELECT course_id FROM teacher_course_assignments WHERE teacher_id = (SELECT teacher_id FROM teacher_profiles WHERE user_id = current_setting('app.user_id')::uuid))) OR (current_setting('app.user_role') = 'COORD_TUTOR' AND recognized_indirect_internship_id IN (SELECT internship_id FROM indirect_internships WHERE coordinator_tutor_id = (SELECT tutor_id FROM coordinator_tutor_profiles WHERE user_id = current_setting('app.user_id')::uuid))) OR (current_setting('app.user_role') = 'COLLAB_TUTOR' AND recognized_direct_internship_id IN (SELECT internship_id FROM direct_internships WHERE collaborator_tutor_id = (SELECT tutor_id FROM collaborator_tutor_profiles WHERE user_id = current_setting('app.user_id')::uuid))));CREATE TABLE cfu_categories (cfu_category_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),name VARCHAR(255) NOT NULL UNIQUE,category_type VARCHAR(50) NOT NULL CHECK (category_type IN ('DIDATTICA', 'TRASVERSALE', 'TIROCINIO_DIRETTO', 'TIROCINIO_INDIRETTO')),description TEXT);CREATE TABLE course_type_cfu_structure (structure_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),course_type_id UUID NOT NULL REFERENCES course_types(course_type_id) ON DELETE CASCADE,cfu_category_id UUID NOT NULL REFERENCES cfu_categories(cfu_category_id) ON DELETE CASCADE,cfu_amount INT NOT NULL CHECK (cfu_amount >= 0),notes TEXT,UNIQUE (course_type_id, cfu_category_id));CREATE TABLE department_competition_classes (department_competition_class_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),department_id UUID NOT NULL REFERENCES departments(department_id) ON DELETE CASCADE,competition_class_id UUID NOT NULL REFERENCES competition_classes(competition_class_id) ON DELETE CASCADE,is_active BOOLEAN NOT NULL DEFAULT TRUE,activation_date DATE NOT NULL DEFAULT CURRENT_DATE,deactivation_date DATE,description TEXT,UNIQUE (department_id, competition_class_id));

AI Schema Architect

Basato su Gemini 2.5 Flash
Salvato
Modifica / Raffina SchemaModalità Aggiornamento
Tips per Modifica

    Usa la chat qui sopra per chiedere modifiche complesse.
    Usa il tasto Modifica in alto a destra per modifiche manuali rapide.
    Clicca sull'icona ✨ nelle tabelle per modifiche mirate con IA.
    Vai su Forms per vedere le maschere di inserimento.

PefManagementSchema

Questo schema di database è progettato per la gestione completa dei Percorsi Abilitanti Insegnanti (PEF) 30/36/60 CFU, inclusi studenti, docenti, insegnamenti, tirocini, lezioni, pagamenti e prove finali. Utilizza la Row Level Security per garantire che ogni ruolo utente abbia accesso solo ai dati pertinenti. Sono state aggiunte nuove tabelle per definire la struttura dettagliata dei CFU per ogni tipologia di percorso, conformemente ai DPCM pertinenti. La struttura degli insegnamenti è stata migliorata per supportare classi di concorso multiple e le lezioni includono ora dettagli specifici sulla modalità di erogazione per diversi percorsi PEF, link a piattaforme di riunione e sono direttamente collegate a una o più classi di concorso. È stata introdotta una nuova tabella per gestire le classi di concorso attivate da ciascun dipartimento, fornendo un riferimento essenziale per l'offerta formativa.
Dipartimenti / Owners
2
Amministrazione TLC
Dipartimento
Dipartimenti
departments
Amministrazione TLC
4 col
Campo	Tipo	Attr
ID Dipartimento
department_id
	UUID	
PK
Nome Dipartimento
name
	VARCHAR(255)	
NN
Codice Dipartimento
code
	VARCHAR(50)	
Descrizione
description
	TEXT	
Anni Accademici ed Edizioni
academic_years_editions
Amministrazione TLCDipartimento
6 col
Campo	Tipo	Attr
ID Anno/Edizione
academic_year_edition_id
	UUID	
PK
Etichetta Anno Accademico
year_label
	VARCHAR(100)	
NN
Etichetta Edizione
edition_label
	VARCHAR(100)	
NN
Data Inizio
start_date
	DATE	
NN
Data Fine
end_date
	DATE	
NN
Descrizione
description
	TEXT	
Tipologie di Percorso
course_types
Amministrazione TLCDipartimento
3 col
Campo	Tipo	Attr
ID Tipo Percorso
course_type_id
	UUID	
PK
Nome Tipologia
name
	VARCHAR(255)	
NN
Descrizione
description
	TEXT	
Classi di Concorso
competition_classes
Amministrazione TLCDipartimento
4 col
Campo	Tipo	Attr
ID Classe Concorso
competition_class_id
	UUID	
PK
Codice Classe
code
	VARCHAR(50)	
NN
Nome Classe
name
	VARCHAR(255)	
NN
Descrizione
description
	TEXT	
Istituti Scolastici
schools
Amministrazione TLCDipartimento
8 col
Campo	Tipo	Attr
ID Scuola
school_id
	UUID	
PK
Nome Scuola
name
	VARCHAR(255)	
NN
Indirizzo
address
	VARCHAR(255)	
Città
city
	VARCHAR(100)	
Provincia
province
	VARCHAR(100)	
Persona di Contatto
contact_person
	VARCHAR(255)	
Telefono
phone
	VARCHAR(50)	
Email
email
	VARCHAR(255)	
Referenti USR
usr_referents
Amministrazione TLC
6 col
Campo	Tipo	Attr
ID Referente USR
usr_referent_id
	UUID	
PK
Nome
first_name
	VARCHAR(100)	
NN
Cognome
last_name
	VARCHAR(100)	
NN
Email
email
	VARCHAR(255)	
NN
Telefono
phone
	VARCHAR(50)	
Ufficio USR
usr_office_name
	VARCHAR(255)	
Utenti del Sistema
users
Amministrazione TLC
8 col
Campo	Tipo	Attr
ID Utente
user_id
	UUID	
PK
Email
email
	VARCHAR(255)	
NN
Hash Password
password_hash
	VARCHAR(255)	
NN
Ruolo
role
	VARCHAR(50)	
NN
Attivo
is_active
	BOOLEAN	
NN
ID Dipartimento
department_id
	UUID	
FK
Data Creazione
created_at
	TIMESTAMP WITH TIME ZONE	
Data Ultimo Aggiornamento
updated_at
	TIMESTAMP WITH TIME ZONE	
Profili Corsisti
student_profiles
DipartimentoAmministrazione TLC
9 col
Campo	Tipo	Attr
ID Corsista
student_id
	UUID	
PK
ID Utente
user_id
	UUID	
FKNN
Nome
first_name
	VARCHAR(100)	
NN
Cognome
last_name
	VARCHAR(100)	
NN
Codice Fiscale
fiscal_code
	VARCHAR(16)	
NN
Data di Nascita
date_of_birth
	DATE	
Indirizzo
address
	VARCHAR(255)	
Città
city
	VARCHAR(100)	
Telefono
phone
	VARCHAR(50)	
Profili Docenti
teacher_profiles
DipartimentoAmministrazione TLC
7 col
Campo	Tipo	Attr
ID Docente
teacher_id
	UUID	
PK
ID Utente
user_id
	UUID	
FKNN
Nome
first_name
	VARCHAR(100)	
NN
Cognome
last_name
	VARCHAR(100)	
NN
ID Dipartimento
department_id
	UUID	
FK
ID Classe Concorso
competition_class_id
	UUID	
FK
Telefono
phone
	VARCHAR(50)	
Profili Tutor Coordinatori
coordinator_tutor_profiles
DipartimentoAmministrazione TLC
6 col
Campo	Tipo	Attr
ID Tutor Coordinatore
tutor_id
	UUID	
PK
ID Utente
user_id
	UUID	
FKNN
Nome
first_name
	VARCHAR(100)	
NN
Cognome
last_name
	VARCHAR(100)	
NN
ID Dipartimento
department_id
	UUID	
FK
Telefono
phone
	VARCHAR(50)	
Profili Tutor Collaboratori
collaborator_tutor_profiles
DipartimentoAmministrazione TLC
6 col
Campo	Tipo	Attr
ID Tutor Collaboratore
tutor_id
	UUID	
PK
ID Utente
user_id
	UUID	
FKNN
Nome
first_name
	VARCHAR(100)	
NN
Cognome
last_name
	VARCHAR(100)	
NN
ID Scuola
school_id
	UUID	
FK
Telefono
phone
	VARCHAR(50)	
Insegnamenti
courses
DipartimentoAmministrazione TLC
5 col
Campo	Tipo	Attr
ID Insegnamento
course_id
	UUID	
PK
Nome Insegnamento
name
	VARCHAR(255)	
NN
Descrizione
description
	TEXT	
CFU
cfu
	INT	
NN
ID Dipartimento
department_id
	UUID	
FKNN
Classi di Concorso per Insegnamento
course_competition_classes
Amministrazione TLCDipartimento
2 col
Campo	Tipo	Attr
ID Insegnamento
course_id
	UUID	
PKFK
ID Classe Concorso
competition_class_id
	UUID	
PKFK
Assegnazione Docenti a Insegnamenti
teacher_course_assignments
Dipartimento
4 col
Campo	Tipo	Attr
ID Assegnazione
assignment_id
	UUID	
PK
ID Docente
teacher_id
	UUID	
FKNN
ID Insegnamento
course_id
	UUID	
FKNN
ID Anno/Edizione
academic_year_edition_id
	UUID	
FKNN
Progetti Formativi
training_projects
DipartimentoAmministrazione TLC
8 col
Campo	Tipo	Attr
ID Progetto Formativo
project_id
	UUID	
PK
ID Corsista
student_id
	UUID	
FKNN
ID Tipo Percorso
course_type_id
	UUID	
FKNN
ID Anno/Edizione
academic_year_edition_id
	UUID	
FKNN
ID Dipartimento
department_id
	UUID	
FKNN
Stato
status
	VARCHAR(50)	
NN
Data Inizio
start_date
	DATE	
Data Fine
end_date
	DATE	
Iscrizioni Corsisti a Insegnamenti
student_course_enrollments
DipartimentoAmministrazione TLC
5 col
Campo	Tipo	Attr
ID Iscrizione
enrollment_id
	UUID	
PK
ID Progetto Formativo
training_project_id
	UUID	
FKNN
ID Insegnamento
course_id
	UUID	
FKNN
Data Iscrizione
enrollment_date
	DATE	
NN
Voto
grade
	DECIMAL(4,2)	
Lezioni
lessons
DocenteDipartimento
13 col
Campo	Tipo	Attr
ID Lezione
lesson_id
	UUID	
PK
ID Insegnamento
course_id
	UUID	
FKNN
ID Docente
teacher_id
	UUID	
FKNN
Data Lezione
lesson_date
	DATE	
NN
Ora Inizio
start_time
	TIME	
NN
Ora Fine
end_time
	TIME	
NN
Aula
room
	VARCHAR(100)	
Modalità di Erogazione PEF60 all.1
pef60_all1_delivery_mode
	VARCHAR(20)	
Modalità di Erogazione PEF30 all.2
pef30_all2_delivery_mode
	VARCHAR(20)	
Modalità di Erogazione PEF36 all.5
pef36_all5_delivery_mode
	VARCHAR(20)	
Modalità di Erogazione PEF30 art.13
pef30_art13_delivery_mode
	VARCHAR(20)	
Link Riunione Teams
teams_meeting_link
	VARCHAR(255)	
CFU Lezione
lesson_cfu
	DECIMAL(4,2)	
NN
Classi di Concorso per Lezione
lesson_competition_classes
Amministrazione TLCDipartimento
2 col
Campo	Tipo	Attr
ID Lezione
lesson_id
	UUID	
PKFK
ID Classe Concorso
competition_class_id
	UUID	
PKFK
Frequenze Lezioni
lesson_attendances
DocenteDipartimento
5 col
Campo	Tipo	Attr
ID Frequenza Lezione
attendance_id
	UUID	
PK
ID Lezione
lesson_id
	UUID	
FKNN
ID Corsista
student_id
	UUID	
FKNN
Stato Frequenza
attendance_status
	VARCHAR(50)	
NN
Data Registrazione Frequenza
attendance_date
	TIMESTAMP WITH TIME ZONE	
Tirocinio Diretto
direct_internships
DipartimentoAmministrazione TLCCOLLAB_TUTOR
9 col
Campo	Tipo	Attr
ID Tirocinio Diretto
internship_id
	UUID	
PK
ID Corsista
student_id
	UUID	
FKNN
ID Scuola
school_id
	UUID	
FKNN
ID Tutor Collaboratore
collaborator_tutor_id
	UUID	
FK
ID Progetto Formativo
training_project_id
	UUID	
FKNN
Data Inizio
start_date
	DATE	
NN
Data Fine
end_date
	DATE	
NN
Ore Totali
total_hours
	INT	
NN
Descrizione
description
	TEXT	
Tirocinio Indiretto
indirect_internships
DipartimentoAmministrazione TLCCOORD_TUTOR
8 col
Campo	Tipo	Attr
ID Tirocinio Indiretto
internship_id
	UUID	
PK
ID Corsista
student_id
	UUID	
FKNN
ID Tutor Coordinatore
coordinator_tutor_id
	UUID	
FK
ID Progetto Formativo
training_project_id
	UUID	
FKNN
Data Inizio
start_date
	DATE	
NN
Data Fine
end_date
	DATE	
NN
Ore Totali
total_hours
	INT	
NN
Descrizione
description
	TEXT	
Frequenza Tirocinio Diretto
direct_internship_attendances
COLLAB_TUTORDipartimento
6 col
Campo	Tipo	Attr
ID Frequenza Tirocinio Diretto
attendance_id
	UUID	
PK
ID Tirocinio Diretto
direct_internship_id
	UUID	
FKNN
ID Corsista
student_id
	UUID	
FKNN
Data Frequenza
date
	DATE	
NN
Ore Frequentate
hours_attended
	INT	
NN
Descrizione
description
	TEXT	
Frequenza Tirocinio Indiretto
indirect_internship_attendances
COORD_TUTORDipartimento
6 col
Campo	Tipo	Attr
ID Frequenza Tirocinio Indiretto
attendance_id
	UUID	
PK
ID Tirocinio Indiretto
indirect_internship_id
	UUID	
FKNN
ID Corsista
student_id
	UUID	
FKNN
Data Frequenza
date
	DATE	
NN
Ore Frequentate
hours_attended
	INT	
NN
Descrizione
description
	TEXT	
Pagamenti Effettuati
payments
Amministrazione TLC
7 col
Campo	Tipo	Attr
ID Pagamento
payment_id
	UUID	
PK
ID Corsista
student_id
	UUID	
FKNN
ID Anno/Edizione
academic_year_edition_id
	UUID	
FKNN
Importo
amount
	DECIMAL(10,2)	
NN
Data Pagamento
payment_date
	DATE	
NN
Stato Pagamento
status
	VARCHAR(50)	
NN
Descrizione
description
	TEXT	
Calendario Prove Finali
final_exam_schedule
DipartimentoAmministrazione TLC
8 col
Campo	Tipo	Attr
ID Calendario Esame
schedule_id
	UUID	
PK
ID Anno/Edizione
academic_year_edition_id
	UUID	
FKNN
ID Tipo Percorso
course_type_id
	UUID	
FK
Data Esame
exam_date
	DATE	
NN
Ora Inizio
start_time
	TIME	
Ora Fine
end_time
	TIME	
Luogo
location
	VARCHAR(255)	
Descrizione
description
	TEXT	
Commissioni Prove Finali
final_exam_commissions
DipartimentoAmministrazione TLC
4 col
Campo	Tipo	Attr
ID Commissione
commission_id
	UUID	
PK
ID Calendario Esame
schedule_id
	UUID	
FKNN
ID Docente
teacher_id
	UUID	
FKNN
Ruolo nella Commissione
role_in_commission
	VARCHAR(100)	
Riconoscimenti
recognitions
DipartimentoAmministrazione TLC
10 col
Campo	Tipo	Attr
ID Riconoscimento
recognition_id
	UUID	
PK
ID Corsista
student_id
	UUID	
FKNN
ID Progetto Formativo
training_project_id
	UUID	
FKNN
ID Insegnamento Riconosciuto
recognized_course_id
	UUID	
FK
ID Tirocinio Diretto Riconosciuto
recognized_direct_internship_id
	UUID	
FK
ID Tirocinio Indiretto Riconosciuto
recognized_indirect_internship_id
	UUID	
FK
CFU Riconosciuti
cfu_recognized
	INT	
NN
Data Riconoscimento
recognition_date
	DATE	
NN
Stato Riconoscimento
status
	VARCHAR(50)	
NN
Note
notes
	TEXT	
Categorie CFU
cfu_categories
Amministrazione TLCDipartimento
4 col
Campo	Tipo	Attr
ID Categoria CFU
cfu_category_id
	UUID	
PK
Nome Categoria
name
	VARCHAR(255)	
NN
Tipo Categoria
category_type
	VARCHAR(50)	
NN
Descrizione
description
	TEXT	
Struttura CFU Tipologia Percorso
course_type_cfu_structure
Amministrazione TLCDipartimento
5 col
Campo	Tipo	Attr
ID Struttura CFU
structure_id
	UUID	
PK
ID Tipo Percorso
course_type_id
	UUID	
FKNN
ID Categoria CFU
cfu_category_id
	UUID	
FKNN
Quantità CFU
cfu_amount
	INT	
NN
Note
notes
	TEXT	
Classi di Concorso Attivate per Dipartimento
department_competition_classes
Amministrazione TLCDipartimento
7 col
Campo	Tipo	Attr
ID Classe Concorso Dipartimento
department_competition_class_id
	UUID	
PK
ID Dipartimento
department_id
	UUID	
FKNN
ID Classe Concorso
competition_class_id
	UUID	
FKNN
Attiva
is_active
	BOOLEAN	
NN
Data Attivazione
activation_date
	DATE	
NN
Data Disattivazione
deactivation_date
	DATE	
Descrizione
description
	TEXT	
