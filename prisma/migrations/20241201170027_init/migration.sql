-- CreateTable
CREATE TABLE "user" (
    "id" SERIAL NOT NULL,
    "twitch_id" INTEGER,
    "streamlabs_id" INTEGER,
    "streamelements_id" INTEGER,

    CONSTRAINT "user_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "twitch" (
    "id" SERIAL NOT NULL,
    "account_id" TEXT NOT NULL,
    "access_token" TEXT,
    "refresh_token" TEXT,

    CONSTRAINT "twitch_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "streamlabs" (
    "id" SERIAL NOT NULL,
    "account_id" TEXT NOT NULL,
    "access_token" TEXT,
    "refresh_token" TEXT,
    "socket_token" TEXT,

    CONSTRAINT "streamlabs_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "streamelements" (
    "id" SERIAL NOT NULL,
    "account_id" TEXT NOT NULL,
    "jwt" TEXT,

    CONSTRAINT "streamelements_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "event_synchronization" (
    "user_id" INTEGER NOT NULL,
    "from" TEXT NOT NULL,
    "to" TEXT NOT NULL,

    CONSTRAINT "event_synchronization_pkey" PRIMARY KEY ("user_id","from","to")
);

-- CreateIndex
CREATE UNIQUE INDEX "user_twitch_id_key" ON "user"("twitch_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_streamlabs_id_key" ON "user"("streamlabs_id");

-- CreateIndex
CREATE UNIQUE INDEX "user_streamelements_id_key" ON "user"("streamelements_id");

-- CreateIndex
CREATE UNIQUE INDEX "twitch_account_id_key" ON "twitch"("account_id");

-- CreateIndex
CREATE UNIQUE INDEX "streamlabs_account_id_key" ON "streamlabs"("account_id");

-- CreateIndex
CREATE UNIQUE INDEX "streamelements_account_id_key" ON "streamelements"("account_id");

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_twitch_id_fkey" FOREIGN KEY ("twitch_id") REFERENCES "twitch"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_streamlabs_id_fkey" FOREIGN KEY ("streamlabs_id") REFERENCES "streamlabs"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "user" ADD CONSTRAINT "user_streamelements_id_fkey" FOREIGN KEY ("streamelements_id") REFERENCES "streamelements"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "event_synchronization" ADD CONSTRAINT "event_synchronization_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "user"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
