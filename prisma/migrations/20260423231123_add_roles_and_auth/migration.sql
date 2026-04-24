-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Employee" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'GARCOM',
    "username" TEXT,
    "passwordHash" TEXT,
    "salary" REAL NOT NULL,
    "hiredAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);
INSERT INTO "new_Employee" ("hiredAt", "id", "name", "role", "salary") SELECT "hiredAt", "id", "name", "role", "salary" FROM "Employee";
DROP TABLE "Employee";
ALTER TABLE "new_Employee" RENAME TO "Employee";
CREATE UNIQUE INDEX "Employee_username_key" ON "Employee"("username");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
