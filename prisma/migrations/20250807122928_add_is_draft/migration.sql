-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_TaskDependency" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "taskId" INTEGER NOT NULL,
    "dependsOnId" INTEGER NOT NULL,
    "isDraft" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "TaskDependency_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Todo" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TaskDependency_dependsOnId_fkey" FOREIGN KEY ("dependsOnId") REFERENCES "Todo" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_TaskDependency" ("dependsOnId", "id", "taskId") SELECT "dependsOnId", "id", "taskId" FROM "TaskDependency";
DROP TABLE "TaskDependency";
ALTER TABLE "new_TaskDependency" RENAME TO "TaskDependency";
CREATE UNIQUE INDEX "TaskDependency_taskId_dependsOnId_key" ON "TaskDependency"("taskId", "dependsOnId");
CREATE TABLE "new_Todo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "dueDate" DATETIME,
    "duration" INTEGER NOT NULL DEFAULT 1,
    "earliestStartDate" DATETIME,
    "isOnCriticalPath" BOOLEAN NOT NULL DEFAULT false,
    "imageUrl" TEXT,
    "done" BOOLEAN NOT NULL DEFAULT false,
    "isDraft" BOOLEAN NOT NULL DEFAULT false
);
INSERT INTO "new_Todo" ("createdAt", "dueDate", "duration", "earliestStartDate", "id", "imageUrl", "isOnCriticalPath", "title") SELECT "createdAt", "dueDate", "duration", "earliestStartDate", "id", "imageUrl", "isOnCriticalPath", "title" FROM "Todo";
DROP TABLE "Todo";
ALTER TABLE "new_Todo" RENAME TO "Todo";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
