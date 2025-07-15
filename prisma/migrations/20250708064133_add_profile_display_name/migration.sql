/*
  Warnings:

  - You are about to drop the column `full_name` on the `profiles` table. All the data in the column will be lost.
  - Made the column `username` on table `profiles` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "profiles" DROP COLUMN "full_name",
ADD COLUMN     "display_name" TEXT,
ALTER COLUMN "username" SET NOT NULL;

-- CreateTable
CREATE TABLE "servers" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "icon_url" TEXT,
    "invite_code" TEXT NOT NULL,
    "is_public" BOOLEAN NOT NULL DEFAULT true,
    "owner_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "servers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "server_members" (
    "id" TEXT NOT NULL,
    "server_id" TEXT NOT NULL,
    "profile_id" UUID NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'member',
    "joined_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "server_members_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "server_channels" (
    "id" TEXT NOT NULL,
    "server_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "type" TEXT NOT NULL DEFAULT 'text',
    "position" INTEGER NOT NULL DEFAULT 0,
    "is_private" BOOLEAN NOT NULL DEFAULT false,
    "parent_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "server_channels_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "server_posts" (
    "id" TEXT NOT NULL,
    "server_id" TEXT NOT NULL,
    "channel_id" TEXT,
    "author_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "title" TEXT,
    "image_url" TEXT,
    "anime_id" TEXT,
    "parent_id" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "server_posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "server_messages" (
    "id" TEXT NOT NULL,
    "channel_id" TEXT NOT NULL,
    "author_id" UUID NOT NULL,
    "content" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "server_messages_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "server_post_likes" (
    "id" TEXT NOT NULL,
    "post_id" TEXT NOT NULL,
    "profile_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "server_post_likes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "servers_invite_code_key" ON "servers"("invite_code");

-- CreateIndex
CREATE INDEX "servers_owner_id_idx" ON "servers"("owner_id");

-- CreateIndex
CREATE INDEX "servers_invite_code_idx" ON "servers"("invite_code");

-- CreateIndex
CREATE INDEX "servers_is_public_idx" ON "servers"("is_public");

-- CreateIndex
CREATE INDEX "server_members_server_id_idx" ON "server_members"("server_id");

-- CreateIndex
CREATE INDEX "server_members_profile_id_idx" ON "server_members"("profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "server_members_server_id_profile_id_key" ON "server_members"("server_id", "profile_id");

-- CreateIndex
CREATE INDEX "server_channels_server_id_idx" ON "server_channels"("server_id");

-- CreateIndex
CREATE INDEX "server_channels_parent_id_idx" ON "server_channels"("parent_id");

-- CreateIndex
CREATE INDEX "server_channels_type_idx" ON "server_channels"("type");

-- CreateIndex
CREATE INDEX "server_posts_server_id_idx" ON "server_posts"("server_id");

-- CreateIndex
CREATE INDEX "server_posts_channel_id_idx" ON "server_posts"("channel_id");

-- CreateIndex
CREATE INDEX "server_posts_author_id_idx" ON "server_posts"("author_id");

-- CreateIndex
CREATE INDEX "server_posts_anime_id_idx" ON "server_posts"("anime_id");

-- CreateIndex
CREATE INDEX "server_posts_parent_id_idx" ON "server_posts"("parent_id");

-- CreateIndex
CREATE INDEX "server_posts_created_at_idx" ON "server_posts"("created_at");

-- CreateIndex
CREATE INDEX "server_messages_channel_id_idx" ON "server_messages"("channel_id");

-- CreateIndex
CREATE INDEX "server_messages_author_id_idx" ON "server_messages"("author_id");

-- CreateIndex
CREATE INDEX "server_messages_created_at_idx" ON "server_messages"("created_at");

-- CreateIndex
CREATE INDEX "server_post_likes_post_id_idx" ON "server_post_likes"("post_id");

-- CreateIndex
CREATE INDEX "server_post_likes_profile_id_idx" ON "server_post_likes"("profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "server_post_likes_post_id_profile_id_key" ON "server_post_likes"("post_id", "profile_id");

-- AddForeignKey
ALTER TABLE "servers" ADD CONSTRAINT "servers_owner_id_fkey" FOREIGN KEY ("owner_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "server_members" ADD CONSTRAINT "server_members_server_id_fkey" FOREIGN KEY ("server_id") REFERENCES "servers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "server_members" ADD CONSTRAINT "server_members_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "server_channels" ADD CONSTRAINT "server_channels_server_id_fkey" FOREIGN KEY ("server_id") REFERENCES "servers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "server_channels" ADD CONSTRAINT "server_channels_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "server_channels"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "server_posts" ADD CONSTRAINT "server_posts_server_id_fkey" FOREIGN KEY ("server_id") REFERENCES "servers"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "server_posts" ADD CONSTRAINT "server_posts_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "server_channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "server_posts" ADD CONSTRAINT "server_posts_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "server_posts" ADD CONSTRAINT "server_posts_anime_id_fkey" FOREIGN KEY ("anime_id") REFERENCES "animes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "server_posts" ADD CONSTRAINT "server_posts_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "server_posts"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "server_messages" ADD CONSTRAINT "server_messages_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "server_channels"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "server_messages" ADD CONSTRAINT "server_messages_author_id_fkey" FOREIGN KEY ("author_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "server_post_likes" ADD CONSTRAINT "server_post_likes_post_id_fkey" FOREIGN KEY ("post_id") REFERENCES "server_posts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "server_post_likes" ADD CONSTRAINT "server_post_likes_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
