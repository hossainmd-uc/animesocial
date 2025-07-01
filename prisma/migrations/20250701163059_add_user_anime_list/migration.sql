/*
  Warnings:

  - The primary key for the `anime_genres` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `anime_producers` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `anime_studios` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `episode_range` on the `anime_themes` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[anime_id,genre_id]` on the table `anime_genres` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[anime_id,producer_id]` on the table `anime_producers` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[anime_id,studio_id]` on the table `anime_studios` will be added. If there are existing duplicate values, this will fail.
  - The required column `id` was added to the `anime_genres` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `id` was added to the `anime_producers` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - The required column `id` was added to the `anime_studios` table with a prisma-level default value. This is not possible if the table is not empty. Please add this column as optional, then populate it before making it required.
  - Made the column `image_url` on table `animes` required. This step will fail if there are existing NULL values in that column.

*/
-- DropIndex
DROP INDEX "anime_external_links_anime_id_url_key";

-- DropIndex
DROP INDEX "anime_relations_anime_id_related_mal_id_relation_type_key";

-- DropIndex
DROP INDEX "anime_streaming_anime_id_url_key";

-- DropIndex
DROP INDEX "anime_themes_anime_id_type_number_key";

-- DropIndex
DROP INDEX "animes_mal_id_idx";

-- DropIndex
DROP INDEX "animes_popularity_idx";

-- DropIndex
DROP INDEX "animes_score_idx";

-- DropIndex
DROP INDEX "animes_title_idx";

-- DropIndex
DROP INDEX "genres_name_key";

-- DropIndex
DROP INDEX "producers_name_key";

-- DropIndex
DROP INDEX "studios_name_key";

-- AlterTable
ALTER TABLE "anime_external_links" ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "anime_genres" DROP CONSTRAINT "anime_genres_pkey",
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ADD CONSTRAINT "anime_genres_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "anime_producers" DROP CONSTRAINT "anime_producers_pkey",
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ADD CONSTRAINT "anime_producers_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "anime_relations" ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "anime_streaming" ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "anime_studios" DROP CONSTRAINT "anime_studios_pkey",
ADD COLUMN     "id" TEXT NOT NULL,
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ADD CONSTRAINT "anime_studios_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "anime_themes" DROP COLUMN "episode_range",
ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "animes" ALTER COLUMN "aired_from" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "aired_to" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "image_url" SET NOT NULL,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3),
ALTER COLUMN "updated_at" SET DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "updated_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "genres" ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "producers" ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- AlterTable
ALTER TABLE "studios" ADD COLUMN     "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ALTER COLUMN "created_at" SET DATA TYPE TIMESTAMP(3);

-- CreateTable
CREATE TABLE "user_anime_list" (
    "id" TEXT NOT NULL,
    "profile_id" UUID NOT NULL,
    "anime_id" TEXT NOT NULL,
    "status" TEXT NOT NULL,
    "progress" INTEGER NOT NULL DEFAULT 0,
    "score" DOUBLE PRECISION,
    "notes" TEXT,
    "is_favorite" BOOLEAN NOT NULL DEFAULT false,
    "start_date" TIMESTAMP(3),
    "finish_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "user_anime_list_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "user_anime_list_profile_id_idx" ON "user_anime_list"("profile_id");

-- CreateIndex
CREATE INDEX "user_anime_list_anime_id_idx" ON "user_anime_list"("anime_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_anime_list_profile_id_anime_id_key" ON "user_anime_list"("profile_id", "anime_id");

-- CreateIndex
CREATE UNIQUE INDEX "anime_genres_anime_id_genre_id_key" ON "anime_genres"("anime_id", "genre_id");

-- CreateIndex
CREATE UNIQUE INDEX "anime_producers_anime_id_producer_id_key" ON "anime_producers"("anime_id", "producer_id");

-- CreateIndex
CREATE UNIQUE INDEX "anime_studios_anime_id_studio_id_key" ON "anime_studios"("anime_id", "studio_id");

-- AddForeignKey
ALTER TABLE "user_anime_list" ADD CONSTRAINT "user_anime_list_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user_anime_list" ADD CONSTRAINT "user_anime_list_anime_id_fkey" FOREIGN KEY ("anime_id") REFERENCES "animes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
