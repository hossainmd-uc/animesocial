-- AlterTable
ALTER TABLE "server_messages" ADD COLUMN     "parent_id" TEXT;

-- CreateTable
CREATE TABLE "server_message_likes" (
    "id" TEXT NOT NULL,
    "message_id" TEXT NOT NULL,
    "profile_id" UUID NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "server_message_likes_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "server_message_likes_message_id_idx" ON "server_message_likes"("message_id");

-- CreateIndex
CREATE INDEX "server_message_likes_profile_id_idx" ON "server_message_likes"("profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "server_message_likes_message_id_profile_id_key" ON "server_message_likes"("message_id", "profile_id");

-- CreateIndex
CREATE INDEX "server_messages_parent_id_idx" ON "server_messages"("parent_id");

-- AddForeignKey
ALTER TABLE "server_messages" ADD CONSTRAINT "server_messages_parent_id_fkey" FOREIGN KEY ("parent_id") REFERENCES "server_messages"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "server_message_likes" ADD CONSTRAINT "server_message_likes_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "server_messages"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "server_message_likes" ADD CONSTRAINT "server_message_likes_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;
