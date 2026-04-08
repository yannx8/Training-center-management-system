/*
  Warnings:

  - You are about to drop the column `enrolled_at` on the `enrollments` table. All the data in the column will be lost.
  - You are about to alter the column `grade` on the `grades` table. The data in that column could be lost. The data in that column will be cast from `Decimal(5,2)` to `DoublePrecision`.
  - Made the column `grade` on table `grades` required. This step will fail if there are existing NULL values in that column.
  - Made the column `user_id` on table `parents` required. This step will fail if there are existing NULL values in that column.
  - Made the column `user_id` on table `students` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "enrollments" DROP CONSTRAINT "enrollments_academic_year_id_fkey";

-- AlterTable
ALTER TABLE "academic_weeks" ADD COLUMN     "availability_deadline" TIMESTAMP(3),
ADD COLUMN     "certification_id" INTEGER,
ALTER COLUMN "department_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "certifications" ADD COLUMN     "capacity" INTEGER,
ADD COLUMN     "remaining_hours" DOUBLE PRECISION NOT NULL DEFAULT 0;

-- AlterTable
ALTER TABLE "courses" ADD COLUMN     "remaining_hours" DOUBLE PRECISION NOT NULL DEFAULT 32,
ADD COLUMN     "total_duration_hours" DOUBLE PRECISION NOT NULL DEFAULT 32;

-- AlterTable
ALTER TABLE "enrollments" DROP COLUMN "enrolled_at",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- AlterTable
ALTER TABLE "grades" ALTER COLUMN "grade" SET NOT NULL,
ALTER COLUMN "grade" SET DATA TYPE DOUBLE PRECISION;

-- AlterTable
ALTER TABLE "parents" ALTER COLUMN "user_id" SET NOT NULL;

-- AlterTable
ALTER TABLE "programs" ADD COLUMN     "capacity" INTEGER;

-- AlterTable
ALTER TABLE "students" ALTER COLUMN "user_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "academic_weeks" ADD CONSTRAINT "academic_weeks_certification_id_fkey" FOREIGN KEY ("certification_id") REFERENCES "certifications"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "enrollments" ADD CONSTRAINT "enrollments_academic_year_id_fkey" FOREIGN KEY ("academic_year_id") REFERENCES "academic_years"("id") ON DELETE SET NULL ON UPDATE CASCADE;
