-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('TLC', 'DIPARTIMENTO', 'DOCENTE', 'CORSISTA', 'COORD_TUTOR', 'COLLAB_TUTOR');

-- CreateEnum
CREATE TYPE "ProjectStatus" AS ENUM ('In_Corso', 'Completato', 'Sospeso', 'Annullato');

-- CreateEnum
CREATE TYPE "AttendanceStatus" AS ENUM ('Presente', 'Assente', 'Giustificato');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('Pagato', 'In_Sospeso', 'Rimborsato', 'Annullato');

-- CreateEnum
CREATE TYPE "RecognitionStatus" AS ENUM ('Approvato', 'In_Revisione', 'Rifiutato', 'Annullato');

-- CreateEnum
CREATE TYPE "DeliveryMode" AS ENUM ('Presenza', 'Online', 'Non Applicabile');

-- CreateEnum
CREATE TYPE "CfuCategoryType" AS ENUM ('DIDATTICA', 'TRASVERSALE', 'TIROCINIO_DIRETTO', 'TIROCINIO_INDIRETTO');

-- CreateTable
CREATE TABLE "departments" (
    "department_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,

    CONSTRAINT "departments_pkey" PRIMARY KEY ("department_id")
);

-- CreateTable
CREATE TABLE "academic_years_editions" (
    "academic_year_edition_id" TEXT NOT NULL,
    "year_label" TEXT NOT NULL,
    "edition_label" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "description" TEXT,

    CONSTRAINT "academic_years_editions_pkey" PRIMARY KEY ("academic_year_edition_id")
);

-- CreateTable
CREATE TABLE "course_types" (
    "course_type_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "has_in_itinere_exams" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "course_types_pkey" PRIMARY KEY ("course_type_id")
);

-- CreateTable
CREATE TABLE "competition_classes" (
    "competition_class_id" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,

    CONSTRAINT "competition_classes_pkey" PRIMARY KEY ("competition_class_id")
);

-- CreateTable
CREATE TABLE "schools" (
    "school_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "address" TEXT,
    "city" TEXT,
    "province" TEXT,
    "contact_person" TEXT,
    "phone" TEXT,
    "email" TEXT,

    CONSTRAINT "schools_pkey" PRIMARY KEY ("school_id")
);

-- CreateTable
CREATE TABLE "usr_referents" (
    "usr_referent_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "usr_office_name" TEXT,

    CONSTRAINT "usr_referents_pkey" PRIMARY KEY ("usr_referent_id")
);

-- CreateTable
CREATE TABLE "users" (
    "user_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "password_hash" TEXT NOT NULL,
    "role" "UserRole" NOT NULL DEFAULT 'CORSISTA',
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "department_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("user_id")
);

-- CreateTable
CREATE TABLE "student_profiles" (
    "student_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "fiscal_code" TEXT NOT NULL,
    "date_of_birth" TIMESTAMP(3),
    "address" TEXT,
    "city" TEXT,
    "phone" TEXT,

    CONSTRAINT "student_profiles_pkey" PRIMARY KEY ("student_id")
);

-- CreateTable
CREATE TABLE "teacher_profiles" (
    "teacher_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "department_id" TEXT,
    "competition_class_id" TEXT,
    "phone" TEXT,

    CONSTRAINT "teacher_profiles_pkey" PRIMARY KEY ("teacher_id")
);

-- CreateTable
CREATE TABLE "coordinator_tutor_profiles" (
    "tutor_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "department_id" TEXT,
    "phone" TEXT,

    CONSTRAINT "coordinator_tutor_profiles_pkey" PRIMARY KEY ("tutor_id")
);

-- CreateTable
CREATE TABLE "collaborator_tutor_profiles" (
    "tutor_id" TEXT NOT NULL,
    "user_id" TEXT NOT NULL,
    "first_name" TEXT NOT NULL,
    "last_name" TEXT NOT NULL,
    "school_id" TEXT,
    "phone" TEXT,

    CONSTRAINT "collaborator_tutor_profiles_pkey" PRIMARY KEY ("tutor_id")
);

-- CreateTable
CREATE TABLE "courses" (
    "course_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "cfu" INTEGER NOT NULL,
    "department_id" TEXT NOT NULL,

    CONSTRAINT "courses_pkey" PRIMARY KEY ("course_id")
);

-- CreateTable
CREATE TABLE "course_competition_classes" (
    "course_id" TEXT NOT NULL,
    "competition_class_id" TEXT NOT NULL,

    CONSTRAINT "course_competition_classes_pkey" PRIMARY KEY ("course_id","competition_class_id")
);

-- CreateTable
CREATE TABLE "teacher_course_assignments" (
    "assignment_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "academic_year_edition_id" TEXT NOT NULL,

    CONSTRAINT "teacher_course_assignments_pkey" PRIMARY KEY ("assignment_id")
);

-- CreateTable
CREATE TABLE "training_projects" (
    "project_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "course_type_id" TEXT NOT NULL,
    "academic_year_edition_id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "status" "ProjectStatus" NOT NULL DEFAULT 'In_Corso',
    "start_date" TIMESTAMP(3),
    "end_date" TIMESTAMP(3),

    CONSTRAINT "training_projects_pkey" PRIMARY KEY ("project_id")
);

-- CreateTable
CREATE TABLE "student_course_enrollments" (
    "enrollment_id" TEXT NOT NULL,
    "training_project_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "enrollment_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "grade" DOUBLE PRECISION,

    CONSTRAINT "student_course_enrollments_pkey" PRIMARY KEY ("enrollment_id")
);

-- CreateTable
CREATE TABLE "lessons" (
    "lesson_id" TEXT NOT NULL,
    "course_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "lesson_date" TIMESTAMP(3) NOT NULL,
    "start_time" TIMESTAMP(3) NOT NULL,
    "end_time" TIMESTAMP(3) NOT NULL,
    "room" TEXT,
    "pef60_all1_delivery_mode" "DeliveryMode" NOT NULL DEFAULT 'Non Applicabile',
    "pef30_all2_delivery_mode" "DeliveryMode" NOT NULL DEFAULT 'Non Applicabile',
    "pef36_all5_delivery_mode" "DeliveryMode" NOT NULL DEFAULT 'Non Applicabile',
    "pef30_art13_delivery_mode" "DeliveryMode" NOT NULL DEFAULT 'Non Applicabile',
    "teams_meeting_link" TEXT,
    "lesson_cfu" DOUBLE PRECISION NOT NULL DEFAULT 0,

    CONSTRAINT "lessons_pkey" PRIMARY KEY ("lesson_id")
);

-- CreateTable
CREATE TABLE "lesson_competition_classes" (
    "lesson_id" TEXT NOT NULL,
    "competition_class_id" TEXT NOT NULL,

    CONSTRAINT "lesson_competition_classes_pkey" PRIMARY KEY ("lesson_id","competition_class_id")
);

-- CreateTable
CREATE TABLE "lesson_attendances" (
    "attendance_id" TEXT NOT NULL,
    "lesson_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "attendance_status" "AttendanceStatus" NOT NULL,
    "attendance_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lesson_attendances_pkey" PRIMARY KEY ("attendance_id")
);

-- CreateTable
CREATE TABLE "direct_internships" (
    "internship_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "school_id" TEXT NOT NULL,
    "collaborator_tutor_id" TEXT,
    "training_project_id" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "total_hours" INTEGER NOT NULL,
    "description" TEXT,

    CONSTRAINT "direct_internships_pkey" PRIMARY KEY ("internship_id")
);

-- CreateTable
CREATE TABLE "indirect_internships" (
    "internship_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "coordinator_tutor_id" TEXT,
    "training_project_id" TEXT NOT NULL,
    "start_date" TIMESTAMP(3) NOT NULL,
    "end_date" TIMESTAMP(3) NOT NULL,
    "total_hours" INTEGER NOT NULL,
    "description" TEXT,

    CONSTRAINT "indirect_internships_pkey" PRIMARY KEY ("internship_id")
);

-- CreateTable
CREATE TABLE "direct_internship_attendances" (
    "attendance_id" TEXT NOT NULL,
    "direct_internship_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "hours_attended" INTEGER NOT NULL,
    "description" TEXT,

    CONSTRAINT "direct_internship_attendances_pkey" PRIMARY KEY ("attendance_id")
);

-- CreateTable
CREATE TABLE "indirect_internship_attendances" (
    "attendance_id" TEXT NOT NULL,
    "indirect_internship_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL,
    "hours_attended" INTEGER NOT NULL,
    "description" TEXT,

    CONSTRAINT "indirect_internship_attendances_pkey" PRIMARY KEY ("attendance_id")
);

-- CreateTable
CREATE TABLE "payments" (
    "payment_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "academic_year_edition_id" TEXT NOT NULL,
    "amount" DOUBLE PRECISION NOT NULL,
    "payment_date" TIMESTAMP(3) NOT NULL,
    "status" "PaymentStatus" NOT NULL,
    "description" TEXT,

    CONSTRAINT "payments_pkey" PRIMARY KEY ("payment_id")
);

-- CreateTable
CREATE TABLE "final_exam_schedule" (
    "schedule_id" TEXT NOT NULL,
    "academic_year_edition_id" TEXT NOT NULL,
    "course_type_id" TEXT,
    "exam_date" TIMESTAMP(3) NOT NULL,
    "start_time" TIMESTAMP(3),
    "end_time" TIMESTAMP(3),
    "location" TEXT,
    "description" TEXT,

    CONSTRAINT "final_exam_schedule_pkey" PRIMARY KEY ("schedule_id")
);

-- CreateTable
CREATE TABLE "final_exam_commissions" (
    "commission_id" TEXT NOT NULL,
    "schedule_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "role_in_commission" TEXT,

    CONSTRAINT "final_exam_commissions_pkey" PRIMARY KEY ("commission_id")
);

-- CreateTable
CREATE TABLE "recognitions" (
    "recognition_id" TEXT NOT NULL,
    "student_id" TEXT NOT NULL,
    "training_project_id" TEXT NOT NULL,
    "recognized_course_id" TEXT,
    "recognized_direct_internship_id" TEXT,
    "recognized_indirect_internship_id" TEXT,
    "cfu_recognized" INTEGER NOT NULL,
    "recognition_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" "RecognitionStatus" NOT NULL,
    "notes" TEXT,

    CONSTRAINT "recognitions_pkey" PRIMARY KEY ("recognition_id")
);

-- CreateTable
CREATE TABLE "cfu_categories" (
    "cfu_category_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "category_type" "CfuCategoryType" NOT NULL,
    "description" TEXT,

    CONSTRAINT "cfu_categories_pkey" PRIMARY KEY ("cfu_category_id")
);

-- CreateTable
CREATE TABLE "course_type_cfu_structure" (
    "structure_id" TEXT NOT NULL,
    "course_type_id" TEXT NOT NULL,
    "cfu_category_id" TEXT NOT NULL,
    "cfu_amount" INTEGER NOT NULL,
    "notes" TEXT,

    CONSTRAINT "course_type_cfu_structure_pkey" PRIMARY KEY ("structure_id")
);

-- CreateTable
CREATE TABLE "department_competition_classes" (
    "department_competition_class_id" TEXT NOT NULL,
    "department_id" TEXT NOT NULL,
    "competition_class_id" TEXT NOT NULL,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "activation_date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deactivation_date" TIMESTAMP(3),
    "description" TEXT,

    CONSTRAINT "department_competition_classes_pkey" PRIMARY KEY ("department_competition_class_id")
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
CREATE UNIQUE INDEX "indirect_internship_attendances_indirect_internship_id_date_key" ON "indirect_internship_attendances"("indirect_internship_id", "date", "student_id");

-- CreateIndex
CREATE UNIQUE INDEX "final_exam_commissions_schedule_id_teacher_id_key" ON "final_exam_commissions"("schedule_id", "teacher_id");

-- CreateIndex
CREATE UNIQUE INDEX "cfu_categories_name_key" ON "cfu_categories"("name");

-- CreateIndex
CREATE UNIQUE INDEX "course_type_cfu_structure_course_type_id_cfu_category_id_key" ON "course_type_cfu_structure"("course_type_id", "cfu_category_id");

-- CreateIndex
CREATE UNIQUE INDEX "department_competition_classes_department_id_competition_cl_key" ON "department_competition_classes"("department_id", "competition_class_id");

-- AddForeignKey
ALTER TABLE "users" ADD CONSTRAINT "users_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("department_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_profiles" ADD CONSTRAINT "student_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_profiles" ADD CONSTRAINT "teacher_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_profiles" ADD CONSTRAINT "teacher_profiles_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("department_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_profiles" ADD CONSTRAINT "teacher_profiles_competition_class_id_fkey" FOREIGN KEY ("competition_class_id") REFERENCES "competition_classes"("competition_class_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coordinator_tutor_profiles" ADD CONSTRAINT "coordinator_tutor_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "coordinator_tutor_profiles" ADD CONSTRAINT "coordinator_tutor_profiles_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("department_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collaborator_tutor_profiles" ADD CONSTRAINT "collaborator_tutor_profiles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("user_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "collaborator_tutor_profiles" ADD CONSTRAINT "collaborator_tutor_profiles_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("school_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "courses" ADD CONSTRAINT "courses_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("department_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_competition_classes" ADD CONSTRAINT "course_competition_classes_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("course_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_competition_classes" ADD CONSTRAINT "course_competition_classes_competition_class_id_fkey" FOREIGN KEY ("competition_class_id") REFERENCES "competition_classes"("competition_class_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_course_assignments" ADD CONSTRAINT "teacher_course_assignments_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teacher_profiles"("teacher_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_course_assignments" ADD CONSTRAINT "teacher_course_assignments_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("course_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "teacher_course_assignments" ADD CONSTRAINT "teacher_course_assignments_academic_year_edition_id_fkey" FOREIGN KEY ("academic_year_edition_id") REFERENCES "academic_years_editions"("academic_year_edition_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_projects" ADD CONSTRAINT "training_projects_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student_profiles"("student_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_projects" ADD CONSTRAINT "training_projects_course_type_id_fkey" FOREIGN KEY ("course_type_id") REFERENCES "course_types"("course_type_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_projects" ADD CONSTRAINT "training_projects_academic_year_edition_id_fkey" FOREIGN KEY ("academic_year_edition_id") REFERENCES "academic_years_editions"("academic_year_edition_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "training_projects" ADD CONSTRAINT "training_projects_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("department_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_course_enrollments" ADD CONSTRAINT "student_course_enrollments_training_project_id_fkey" FOREIGN KEY ("training_project_id") REFERENCES "training_projects"("project_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "student_course_enrollments" ADD CONSTRAINT "student_course_enrollments_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("course_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_course_id_fkey" FOREIGN KEY ("course_id") REFERENCES "courses"("course_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lessons" ADD CONSTRAINT "lessons_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teacher_profiles"("teacher_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_competition_classes" ADD CONSTRAINT "lesson_competition_classes_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("lesson_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_competition_classes" ADD CONSTRAINT "lesson_competition_classes_competition_class_id_fkey" FOREIGN KEY ("competition_class_id") REFERENCES "competition_classes"("competition_class_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_attendances" ADD CONSTRAINT "lesson_attendances_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("lesson_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_attendances" ADD CONSTRAINT "lesson_attendances_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student_profiles"("student_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct_internships" ADD CONSTRAINT "direct_internships_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student_profiles"("student_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct_internships" ADD CONSTRAINT "direct_internships_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("school_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct_internships" ADD CONSTRAINT "direct_internships_collaborator_tutor_id_fkey" FOREIGN KEY ("collaborator_tutor_id") REFERENCES "collaborator_tutor_profiles"("tutor_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct_internships" ADD CONSTRAINT "direct_internships_training_project_id_fkey" FOREIGN KEY ("training_project_id") REFERENCES "training_projects"("project_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indirect_internships" ADD CONSTRAINT "indirect_internships_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student_profiles"("student_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indirect_internships" ADD CONSTRAINT "indirect_internships_coordinator_tutor_id_fkey" FOREIGN KEY ("coordinator_tutor_id") REFERENCES "coordinator_tutor_profiles"("tutor_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indirect_internships" ADD CONSTRAINT "indirect_internships_training_project_id_fkey" FOREIGN KEY ("training_project_id") REFERENCES "training_projects"("project_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct_internship_attendances" ADD CONSTRAINT "direct_internship_attendances_direct_internship_id_fkey" FOREIGN KEY ("direct_internship_id") REFERENCES "direct_internships"("internship_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "direct_internship_attendances" ADD CONSTRAINT "direct_internship_attendances_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student_profiles"("student_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indirect_internship_attendances" ADD CONSTRAINT "indirect_internship_attendances_indirect_internship_id_fkey" FOREIGN KEY ("indirect_internship_id") REFERENCES "indirect_internships"("internship_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "indirect_internship_attendances" ADD CONSTRAINT "indirect_internship_attendances_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student_profiles"("student_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student_profiles"("student_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "payments" ADD CONSTRAINT "payments_academic_year_edition_id_fkey" FOREIGN KEY ("academic_year_edition_id") REFERENCES "academic_years_editions"("academic_year_edition_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "final_exam_schedule" ADD CONSTRAINT "final_exam_schedule_academic_year_edition_id_fkey" FOREIGN KEY ("academic_year_edition_id") REFERENCES "academic_years_editions"("academic_year_edition_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "final_exam_schedule" ADD CONSTRAINT "final_exam_schedule_course_type_id_fkey" FOREIGN KEY ("course_type_id") REFERENCES "course_types"("course_type_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "final_exam_commissions" ADD CONSTRAINT "final_exam_commissions_schedule_id_fkey" FOREIGN KEY ("schedule_id") REFERENCES "final_exam_schedule"("schedule_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "final_exam_commissions" ADD CONSTRAINT "final_exam_commissions_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "teacher_profiles"("teacher_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recognitions" ADD CONSTRAINT "recognitions_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "student_profiles"("student_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recognitions" ADD CONSTRAINT "recognitions_training_project_id_fkey" FOREIGN KEY ("training_project_id") REFERENCES "training_projects"("project_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recognitions" ADD CONSTRAINT "recognitions_recognized_course_id_fkey" FOREIGN KEY ("recognized_course_id") REFERENCES "courses"("course_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recognitions" ADD CONSTRAINT "recognitions_recognized_direct_internship_id_fkey" FOREIGN KEY ("recognized_direct_internship_id") REFERENCES "direct_internships"("internship_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "recognitions" ADD CONSTRAINT "recognitions_recognized_indirect_internship_id_fkey" FOREIGN KEY ("recognized_indirect_internship_id") REFERENCES "indirect_internships"("internship_id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_type_cfu_structure" ADD CONSTRAINT "course_type_cfu_structure_course_type_id_fkey" FOREIGN KEY ("course_type_id") REFERENCES "course_types"("course_type_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "course_type_cfu_structure" ADD CONSTRAINT "course_type_cfu_structure_cfu_category_id_fkey" FOREIGN KEY ("cfu_category_id") REFERENCES "cfu_categories"("cfu_category_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_competition_classes" ADD CONSTRAINT "department_competition_classes_department_id_fkey" FOREIGN KEY ("department_id") REFERENCES "departments"("department_id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "department_competition_classes" ADD CONSTRAINT "department_competition_classes_competition_class_id_fkey" FOREIGN KEY ("competition_class_id") REFERENCES "competition_classes"("competition_class_id") ON DELETE CASCADE ON UPDATE CASCADE;
