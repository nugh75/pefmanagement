-- CreateTable
-- CreateExtension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- CreateTable
CREATE TABLE "departments" (
    "department_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" VARCHAR(255) NOT NULL,
    "code" VARCHAR(50),
    "description" TEXT,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("department_id")
);

-- CreateTable
CREATE TABLE "academic_years_editions" (
    "academic_year_edition_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "year_label" VARCHAR(100) NOT NULL,
    "edition_label" VARCHAR(100) NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "description" TEXT,

    CONSTRAINT "academic_years_editions_pkey" PRIMARY KEY ("academic_year_edition_id")
);

-- CreateTable
CREATE TABLE "course_types" (
    "course_type_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "has_in_itinere_exams" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "course_types_pkey" PRIMARY KEY ("course_type_id")
);

-- CreateTable
CREATE TABLE "competition_classes" (
    "competition_class_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,

    CONSTRAINT "competition_classes_pkey" PRIMARY KEY ("competition_class_id")
);


-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('TLC', 'DIPARTIMENTO', 'DOCENTE', 'CORSISTA', 'COORD_TUTOR', 'COLLAB_TUTOR');

-- CreateTable
CREATE TABLE "schools" (
    "school_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" VARCHAR(255) NOT NULL,
    "address" VARCHAR(255),
    "city" VARCHAR(100),
    "province" VARCHAR(100),
    "contact_person" VARCHAR(255),
    "phone" VARCHAR(50),
    "email" VARCHAR(255),

    CONSTRAINT "schools_pkey" PRIMARY KEY ("school_id")
);

-- CreateTable
CREATE TABLE "usr_referents" (
    "usr_referent_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(50),
    "usr_office_name" VARCHAR(255),

    CONSTRAINT "usr_referents_pkey" PRIMARY KEY ("usr_referent_id")
);

-- CreateTable
CREATE TABLE "users" (
    "user_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "email" VARCHAR(255) NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" VARCHAR(50) NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "department_id" UUID,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "student_profiles" (
    "student_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "fiscal_code" VARCHAR(16) NOT NULL,
    "date_of_birth" DATE,
    "address" VARCHAR(255),
    "city" VARCHAR(100),
    "phone" VARCHAR(50),

    CONSTRAINT "student_profiles_pkey" PRIMARY KEY ("student_id")
);

-- CreateTable
CREATE TABLE "teacher_profiles" (
    "teacher_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "department_id" UUID,
    "competition_class_id" UUID,
    "phone" VARCHAR(50),

    CONSTRAINT "teacher_profiles_pkey" PRIMARY KEY ("teacher_id")
);

-- CreateTable
CREATE TABLE "coordinator_tutor_profiles" (
    "tutor_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "department_id" UUID,
    "phone" VARCHAR(50),

    CONSTRAINT "coordinator_tutor_profiles_pkey" PRIMARY KEY ("tutor_id")
);

-- CreateTable
CREATE TABLE "collaborator_tutor_profiles" (
    "tutor_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "user_id" UUID NOT NULL,
    "first_name" VARCHAR(100) NOT NULL,
    "last_name" VARCHAR(100) NOT NULL,
    "school_id" UUID,
    "phone" VARCHAR(50),

    CONSTRAINT "collaborator_tutor_profiles_pkey" PRIMARY KEY ("tutor_id")
);

-- CreateTable
CREATE TABLE "courses" (
    "course_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" VARCHAR(255) NOT NULL,
    "description" TEXT,
    "cfu" INTEGER NOT NULL,
    "department_id" UUID,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("course_id")
);

-- CreateTable
CREATE TABLE "course_competition_classes" (
    "course_id" UUID NOT NULL,
    "competition_class_id" UUID NOT NULL,

    CONSTRAINT "course_competition_classes_pkey" PRIMARY KEY ("course_id","competition_class_id")
);

-- CreateTable
CREATE TABLE "teacher_course_assignments" (
    "assignment_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "teacher_id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "academic_year_edition_id" UUID NOT NULL,

    CONSTRAINT "teacher_course_assignments_pkey" PRIMARY KEY ("assignment_id")
);

-- CreateTable
CREATE TABLE "training_projects" (
    "project_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "student_id" UUID NOT NULL,
    "course_type_id" UUID NOT NULL,
    "academic_year_edition_id" UUID NOT NULL,
    "department_id" UUID NOT NULL,
    "status" VARCHAR(50) NOT NULL DEFAULT 'In_Corso',
    "start_date" DATE,
    "end_date" DATE,

    CONSTRAINT "training_projects_pkey" PRIMARY KEY ("project_id")
);

-- CreateTable
CREATE TABLE "student_course_enrollments" (
    "enrollment_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "training_project_id" UUID NOT NULL,
    "course_id" UUID NOT NULL,
    "enrollment_date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "grade" DECIMAL(4,2),

    CONSTRAINT "student_course_enrollments_pkey" PRIMARY KEY ("enrollment_id")
);

-- CreateTable
CREATE TABLE "lessons" (
    "lesson_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "course_id" UUID NOT NULL,
    "teacher_id" UUID NOT NULL,
    "lesson_date" DATE NOT NULL,
    "start_time" TIME(6) NOT NULL,
    "end_time" TIME(6) NOT NULL,
    "room" VARCHAR(100),
    "pef60_all1_delivery_mode" VARCHAR(20) DEFAULT 'Non Applicabile',
    "pef30_all2_delivery_mode" VARCHAR(20) DEFAULT 'Non Applicabile',
    "pef36_all5_delivery_mode" VARCHAR(20) DEFAULT 'Non Applicabile',
    "pef30_art13_delivery_mode" VARCHAR(20) DEFAULT 'Non Applicabile',
    "teams_meeting_link" VARCHAR(255),
    "lesson_cfu" DECIMAL(4,2) NOT NULL DEFAULT 0.0,

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("lesson_id")
);

-- CreateTable
CREATE TABLE "lesson_competition_classes" (
    "lesson_id" UUID NOT NULL,
    "competition_class_id" UUID NOT NULL,

    CONSTRAINT "lesson_competition_classes_pkey" PRIMARY KEY ("lesson_id","competition_class_id")
);

-- CreateTable
CREATE TABLE "lesson_attendances" (
    "attendance_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "lesson_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "attendance_status" VARCHAR(50) NOT NULL,
    "attendance_date" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lesson_attendances_pkey" PRIMARY KEY ("attendance_id")
);

-- CreateTable
CREATE TABLE "direct_internships" (
    "internship_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "student_id" UUID NOT NULL,
    "school_id" UUID NOT NULL,
    "collaborator_tutor_id" UUID,
    "training_project_id" UUID NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "total_hours" INTEGER NOT NULL,
    "description" TEXT,

    CONSTRAINT "direct_internships_pkey" PRIMARY KEY ("internship_id")
);

-- CreateTable
CREATE TABLE "indirect_internships" (
    "internship_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "student_id" UUID NOT NULL,
    "coordinator_tutor_id" UUID,
    "training_project_id" UUID NOT NULL,
    "start_date" DATE NOT NULL,
    "end_date" DATE NOT NULL,
    "total_hours" INTEGER NOT NULL,
    "description" TEXT,

    CONSTRAINT "indirect_internships_pkey" PRIMARY KEY ("internship_id")
);

-- CreateTable
CREATE TABLE "direct_internship_attendances" (
    "attendance_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "direct_internship_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "hours_attended" INTEGER NOT NULL,
    "description" TEXT,

    CONSTRAINT "direct_internship_attendances_pkey" PRIMARY KEY ("attendance_id")
);

-- CreateTable
CREATE TABLE "indirect_internship_attendances" (
    "attendance_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "indirect_internship_id" UUID NOT NULL,
    "student_id" UUID NOT NULL,
    "date" DATE NOT NULL,
    "hours_attended" INTEGER NOT NULL,
    "description" TEXT,

    CONSTRAINT "indirect_internship_attendances_pkey" PRIMARY KEY ("attendance_id")
);

-- CreateTable
CREATE TABLE "payments" (
    "payment_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "student_id" UUID NOT NULL,
    "academic_year_edition_id" UUID NOT NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "payment_date" DATE NOT NULL,
    "status" VARCHAR(50) NOT NULL,
    "description" TEXT,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("payment_id")
);

-- CreateTable
CREATE TABLE "final_exam_schedule" (
    "schedule_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "academic_year_edition_id" UUID NOT NULL,
    "course_type_id" UUID,
    "exam_date" DATE NOT NULL,
    "start_time" TIME(6),
    "end_time" TIME(6),
    "location" VARCHAR(255),
    "description" TEXT,

    CONSTRAINT "final_exam_schedule_pkey" PRIMARY KEY ("schedule_id")
);

-- CreateTable
CREATE TABLE "final_exam_commissions" (
    "commission_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "schedule_id" UUID NOT NULL,
    "teacher_id" UUID NOT NULL,
    "role_in_commission" VARCHAR(100),

    CONSTRAINT "final_exam_commissions_pkey" PRIMARY KEY ("commission_id")
);

-- CreateTable
CREATE TABLE "recognitions" (
    "recognition_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "student_id" UUID NOT NULL,
    "training_project_id" UUID NOT NULL,
    "recognized_course_id" UUID,
    "recognized_direct_internship_id" UUID,
    "recognized_indirect_internship_id" UUID,
    "cfu_recognized" INTEGER NOT NULL,
    "recognition_date" DATE NOT NULL DEFAULT CURRENT_DATE,
    "status" VARCHAR(50) NOT NULL,
    "notes" TEXT,

    CONSTRAINT "recognitions_pkey" PRIMARY KEY ("recognition_id")
);

-- CreateTable
CREATE TABLE "cfu_categories" (
    "cfu_category_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "name" VARCHAR(255) NOT NULL,
    "category_type" VARCHAR(50) NOT NULL,
    "description" TEXT,

    CONSTRAINT "cfu_categories_pkey" PRIMARY KEY ("cfu_category_id")
);

-- CreateTable
CREATE TABLE "course_type_cfu_structure" (
    "structure_id" UUID NOT NULL DEFAULT uuid_generate_v4(),
    "course_type_id" UUID NOT NULL,
    "cfu_category_id" UUID NOT NULL,
    "cfu_amount" INTEGER NOT NULL,
    "notes" TEXT,

    CONSTRAINT "course_type_cfu_structure_pkey" PRIMARY KEY ("structure_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "departments_name_key" ON "departments"("name");

-- CreateIndex
CREATE UNIQUE INDEX "departments_code_key" ON "departments"("code");

-- CreateIndex
CREATE UNIQUE INDEX "academic_years_editions_year_label_edition_label_key" ON "academic_years_editions"("year_label", "edition_label");

-- CreateIndex
CREATE UNIQUE INDEX "course_types_name_key" ON "course_types"("name");

-- CreateIndex
CREATE UNIQUE INDEX "competition_classes_code_key" ON "competition_classes"("code");

-- CreateIndex
CREATE UNIQUE INDEX "usr_referents_email_key" ON "usr_referents"("email");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- CreateIndex
CREATE UNIQUE INDEX "student_profiles_user_id_key" ON "student_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_profiles_fiscal_code_key" ON "student_profiles"("fiscal_code");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_profiles_user_id_key" ON "teacher_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "coordinator_tutor_profiles_user_id_key" ON "coordinator_tutor_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "collaborator_tutor_profiles_user_id_key" ON "collaborator_tutor_profiles"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "teacher_course_assignments_teacher_id_course_id_academic_ye_key" ON "teacher_course_assignments"("teacher_id", "course_id", "academic_year_edition_id");

-- CreateIndex
CREATE UNIQUE INDEX "training_projects_student_id_course_type_id_academic_year_e_key" ON "training_projects"("student_id", "course_type_id", "academic_year_edition_id");

-- CreateIndex
CREATE UNIQUE INDEX "student_course_enrollments_training_project_id_course_id_key" ON "student_course_enrollments"("training_project_id", "course_id");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_attendances_lesson_id_student_id_key" ON "lesson_attendances"("lesson_id", "student_id");

-- CreateIndex
CREATE UNIQUE INDEX "direct_internship_attendances_direct_internship_id_date_stu_key" ON "direct_internship_attendances"("direct_internship_id", "date", "student_id");

-- CreateIndex
CREATE UNIQUE INDEX "indirect_internship_attendanc_indirect_internship_id_date_s_key" ON "indirect_internship_attendances"("indirect_internship_id", "date", "student_id");

-- CreateIndex
CREATE UNIQUE INDEX "final_exam_commissions_schedule_id_teacher_id_key" ON "final_exam_commissions"("schedule_id", "teacher_id");

-- CreateIndex
CREATE UNIQUE INDEX "cfu_categories_name_key" ON "cfu_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "course_type_cfu_structure_course_type_id_cfu_category_id_key" ON "course_type_cfu_structure"("course_type_id", "cfu_category_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("department_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "teacher_profiles" ADD CONSTRAINT "teacher_profiles_competition_class_id_fkey" FOREIGN KEY ("competition_class_id") REFERENCES "competition_classes"("competition_class_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "teacher_profiles" ADD CONSTRAINT "teacher_profiles_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("department_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "teacher_profiles" ADD CONSTRAINT "teacher_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "coordinator_tutor_profiles" ADD CONSTRAINT "coordinator_tutor_profiles_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("department_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "coordinator_tutor_profiles" ADD CONSTRAINT "coordinator_tutor_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "collaborator_tutor_profiles" ADD CONSTRAINT "collaborator_tutor_profiles_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("school_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "collaborator_tutor_profiles" ADD CONSTRAINT "collaborator_tutor_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("department_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "course_competition_classes" ADD CONSTRAINT "course_competition_classes_competition_class_id_fkey" FOREIGN KEY ("competition_class_id") REFERENCES "competition_classes"("competition_class_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "course_competition_classes" ADD CONSTRAINT "course_competition_classes_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("course_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "teacher_course_assignments" ADD CONSTRAINT "teacher_course_assignments_academic_year_edition_id_fkey" FOREIGN KEY ("academic_year_edition_id") REFERENCES "academic_years_editions"("academic_year_edition_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "teacher_course_assignments" ADD CONSTRAINT "teacher_course_assignments_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("course_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "teacher_course_assignments" ADD CONSTRAINT "teacher_course_assignments_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teacher_profiles"("teacher_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "training_projects" ADD CONSTRAINT "training_projects_academic_year_edition_id_fkey" FOREIGN KEY ("academic_year_edition_id") REFERENCES "academic_years_editions"("academic_year_edition_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "training_projects" ADD CONSTRAINT "training_projects_course_type_id_fkey" FOREIGN KEY ("course_type_id") REFERENCES "course_types"("course_type_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "training_projects" ADD CONSTRAINT "training_projects_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("department_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "training_projects" ADD CONSTRAINT "training_projects_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student_profiles"("student_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "student_course_enrollments" ADD CONSTRAINT "student_course_enrollments_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("course_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "student_course_enrollments" ADD CONSTRAINT "student_course_enrollments_training_project_id_fkey" FOREIGN KEY ("training_project_id") REFERENCES "training_projects"("project_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("course_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teacher_profiles"("teacher_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lesson_competition_classes" ADD CONSTRAINT "lesson_competition_classes_competition_class_id_fkey" FOREIGN KEY ("competition_class_id") REFERENCES "competition_classes"("competition_class_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lesson_competition_classes" ADD CONSTRAINT "lesson_competition_classes_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("lesson_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lesson_attendances" ADD CONSTRAINT "lesson_attendances_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("lesson_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "lesson_attendances" ADD CONSTRAINT "lesson_attendances_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student_profiles"("student_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "direct_internships" ADD CONSTRAINT "direct_internships_collaborator_tutor_id_fkey" FOREIGN KEY ("collaborator_tutor_id") REFERENCES "collaborator_tutor_profiles"("tutor_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "direct_internships" ADD CONSTRAINT "direct_internships_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("school_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "direct_internships" ADD CONSTRAINT "direct_internships_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student_profiles"("student_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "direct_internships" ADD CONSTRAINT "direct_internships_training_project_id_fkey" FOREIGN KEY ("training_project_id") REFERENCES "training_projects"("project_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "indirect_internships" ADD CONSTRAINT "indirect_internships_coordinator_tutor_id_fkey" FOREIGN KEY ("coordinator_tutor_id") REFERENCES "coordinator_tutor_profiles"("tutor_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "indirect_internships" ADD CONSTRAINT "indirect_internships_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student_profiles"("student_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "indirect_internships" ADD CONSTRAINT "indirect_internships_training_project_id_fkey" FOREIGN KEY ("training_project_id") REFERENCES "training_projects"("project_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "direct_internship_attendances" ADD CONSTRAINT "direct_internship_attendances_direct_internship_id_fkey" FOREIGN KEY ("direct_internship_id") REFERENCES "direct_internships"("internship_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "direct_internship_attendances" ADD CONSTRAINT "direct_internship_attendances_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student_profiles"("student_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "indirect_internship_attendances" ADD CONSTRAINT "indirect_internship_attendances_indirect_internship_id_fkey" FOREIGN KEY ("indirect_internship_id") REFERENCES "indirect_internships"("internship_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "indirect_internship_attendances" ADD CONSTRAINT "indirect_internship_attendances_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student_profiles"("student_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_academic_year_edition_id_fkey" FOREIGN KEY ("academic_year_edition_id") REFERENCES "academic_years_editions"("academic_year_edition_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student_profiles"("student_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "final_exam_schedule" ADD CONSTRAINT "final_exam_schedule_academic_year_edition_id_fkey" FOREIGN KEY ("academic_year_edition_id") REFERENCES "academic_years_editions"("academic_year_edition_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "final_exam_schedule" ADD CONSTRAINT "final_exam_schedule_course_type_id_fkey" FOREIGN KEY ("course_type_id") REFERENCES "course_types"("course_type_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "final_exam_commissions" ADD CONSTRAINT "final_exam_commissions_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "final_exam_schedule"("schedule_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "final_exam_commissions" ADD CONSTRAINT "final_exam_commissions_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teacher_profiles"("teacher_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "recognitions" ADD CONSTRAINT "recognitions_recognized_course_id_fkey" FOREIGN KEY ("recognized_course_id") REFERENCES "courses"("course_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "recognitions" ADD CONSTRAINT "recognitions_recognized_direct_internship_id_fkey" FOREIGN KEY ("recognized_direct_internship_id") REFERENCES "direct_internships"("internship_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "recognitions" ADD CONSTRAINT "recognitions_recognized_indirect_internship_id_fkey" FOREIGN KEY ("recognized_indirect_internship_id") REFERENCES "indirect_internships"("internship_id") ON DELETE SET NULL ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "recognitions" ADD CONSTRAINT "recognitions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student_profiles"("student_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "recognitions" ADD CONSTRAINT "recognitions_training_project_id_fkey" FOREIGN KEY ("training_project_id") REFERENCES "training_projects"("project_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "course_type_cfu_structure" ADD CONSTRAINT "course_type_cfu_structure_cfu_category_id_fkey" FOREIGN KEY ("cfu_category_id") REFERENCES "cfu_categories"("cfu_category_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "course_type_cfu_structure" ADD CONSTRAINT "course_type_cfu_structure_course_type_id_fkey" FOREIGN KEY ("course_type_id") REFERENCES "course_types"("course_type_id") ON DELETE CASCADE ON UPDATE NO ACTION;
