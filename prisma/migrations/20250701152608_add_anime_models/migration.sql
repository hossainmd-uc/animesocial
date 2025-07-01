-- CreateTable
CREATE TABLE "animes" (
    "id" TEXT NOT NULL,
    "mal_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "title_english" TEXT,
    "title_japanese" TEXT,
    "synopsis" TEXT,
    "status" TEXT NOT NULL,
    "episodes" INTEGER,
    "duration" TEXT,
    "score" DOUBLE PRECISION,
    "rank" INTEGER,
    "popularity" INTEGER,
    "members_count" INTEGER,
    "favorites_count" INTEGER,
    "rating" TEXT,
    "type" TEXT NOT NULL,
    "source" TEXT,
    "season" TEXT,
    "year" INTEGER,
    "aired_from" TIMESTAMPTZ,
    "aired_to" TIMESTAMPTZ,
    "broadcast_day" TEXT,
    "broadcast_time" TEXT,
    "broadcast_timezone" TEXT,
    "image_url" TEXT,
    "trailer_url" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ NOT NULL,

    CONSTRAINT "animes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anime_relations" (
    "id" TEXT NOT NULL,
    "anime_id" TEXT NOT NULL,
    "related_mal_id" INTEGER NOT NULL,
    "relation_type" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anime_relations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anime_external_links" (
    "id" TEXT NOT NULL,
    "anime_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anime_external_links_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anime_streaming" (
    "id" TEXT NOT NULL,
    "anime_id" TEXT NOT NULL,
    "platform_name" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anime_streaming_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anime_themes" (
    "id" TEXT NOT NULL,
    "anime_id" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "artist" TEXT,
    "episode_range" TEXT,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anime_themes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "genres" (
    "id" TEXT NOT NULL,
    "mal_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "genres_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "studios" (
    "id" TEXT NOT NULL,
    "mal_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "studios_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "producers" (
    "id" TEXT NOT NULL,
    "mal_id" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "producers_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "anime_genres" (
    "anime_id" TEXT NOT NULL,
    "genre_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anime_genres_pkey" PRIMARY KEY ("anime_id","genre_id")
);

-- CreateTable
CREATE TABLE "anime_studios" (
    "anime_id" TEXT NOT NULL,
    "studio_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anime_studios_pkey" PRIMARY KEY ("anime_id","studio_id")
);

-- CreateTable
CREATE TABLE "anime_producers" (
    "anime_id" TEXT NOT NULL,
    "producer_id" TEXT NOT NULL,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "anime_producers_pkey" PRIMARY KEY ("anime_id","producer_id")
);

-- CreateIndex
CREATE UNIQUE INDEX "animes_mal_id_key" ON "animes"("mal_id");

-- CreateIndex
CREATE INDEX "animes_mal_id_idx" ON "animes"("mal_id");

-- CreateIndex
CREATE INDEX "animes_title_idx" ON "animes"("title");

-- CreateIndex
CREATE INDEX "animes_score_idx" ON "animes"("score");

-- CreateIndex
CREATE INDEX "animes_popularity_idx" ON "animes"("popularity");

-- CreateIndex
CREATE UNIQUE INDEX "anime_relations_anime_id_related_mal_id_relation_type_key" ON "anime_relations"("anime_id", "related_mal_id", "relation_type");

-- CreateIndex
CREATE UNIQUE INDEX "anime_external_links_anime_id_url_key" ON "anime_external_links"("anime_id", "url");

-- CreateIndex
CREATE UNIQUE INDEX "anime_streaming_anime_id_url_key" ON "anime_streaming"("anime_id", "url");

-- CreateIndex
CREATE UNIQUE INDEX "anime_themes_anime_id_type_number_key" ON "anime_themes"("anime_id", "type", "number");

-- CreateIndex
CREATE UNIQUE INDEX "genres_mal_id_key" ON "genres"("mal_id");

-- CreateIndex
CREATE UNIQUE INDEX "genres_name_key" ON "genres"("name");

-- CreateIndex
CREATE UNIQUE INDEX "studios_mal_id_key" ON "studios"("mal_id");

-- CreateIndex
CREATE UNIQUE INDEX "studios_name_key" ON "studios"("name");

-- CreateIndex
CREATE UNIQUE INDEX "producers_mal_id_key" ON "producers"("mal_id");

-- CreateIndex
CREATE UNIQUE INDEX "producers_name_key" ON "producers"("name");

-- AddForeignKey
ALTER TABLE "anime_relations" ADD CONSTRAINT "anime_relations_anime_id_fkey" FOREIGN KEY ("anime_id") REFERENCES "animes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anime_external_links" ADD CONSTRAINT "anime_external_links_anime_id_fkey" FOREIGN KEY ("anime_id") REFERENCES "animes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anime_streaming" ADD CONSTRAINT "anime_streaming_anime_id_fkey" FOREIGN KEY ("anime_id") REFERENCES "animes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anime_themes" ADD CONSTRAINT "anime_themes_anime_id_fkey" FOREIGN KEY ("anime_id") REFERENCES "animes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anime_genres" ADD CONSTRAINT "anime_genres_anime_id_fkey" FOREIGN KEY ("anime_id") REFERENCES "animes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anime_genres" ADD CONSTRAINT "anime_genres_genre_id_fkey" FOREIGN KEY ("genre_id") REFERENCES "genres"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anime_studios" ADD CONSTRAINT "anime_studios_anime_id_fkey" FOREIGN KEY ("anime_id") REFERENCES "animes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anime_studios" ADD CONSTRAINT "anime_studios_studio_id_fkey" FOREIGN KEY ("studio_id") REFERENCES "studios"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anime_producers" ADD CONSTRAINT "anime_producers_anime_id_fkey" FOREIGN KEY ("anime_id") REFERENCES "animes"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "anime_producers" ADD CONSTRAINT "anime_producers_producer_id_fkey" FOREIGN KEY ("producer_id") REFERENCES "producers"("id") ON DELETE CASCADE ON UPDATE CASCADE;
