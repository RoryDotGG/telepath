-- CreateTable
CREATE TABLE "UserPreferences" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "defaultDomain" TEXT,
    "preferredSlugStyle" TEXT NOT NULL DEFAULT 'intelligent',
    "autoConfirm" BOOLEAN NOT NULL DEFAULT false,
    "showReasoning" BOOLEAN NOT NULL DEFAULT true,
    "setupCompleted" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "UserLink" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" INTEGER NOT NULL,
    "domain" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "shortLink" TEXT NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME,
    "clicks" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "UserLink_userId_fkey" FOREIGN KEY ("userId") REFERENCES "UserPreferences" ("userId") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "UserPreferences_userId_key" ON "UserPreferences"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "UserLink_domain_key_key" ON "UserLink"("domain", "key");
