/*
  Warnings:

  - Added the required column `bola16` to the `concursos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bola17` to the `concursos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bola18` to the `concursos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bola19` to the `concursos` table without a default value. This is not possible if the table is not empty.
  - Added the required column `bola20` to the `concursos` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_concursos" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "concurso" INTEGER NOT NULL,
    "dataSorteio" DATETIME NOT NULL,
    "bola01" INTEGER NOT NULL,
    "bola02" INTEGER NOT NULL,
    "bola03" INTEGER NOT NULL,
    "bola04" INTEGER NOT NULL,
    "bola05" INTEGER NOT NULL,
    "bola06" INTEGER NOT NULL,
    "bola07" INTEGER NOT NULL,
    "bola08" INTEGER NOT NULL,
    "bola09" INTEGER NOT NULL,
    "bola10" INTEGER NOT NULL,
    "bola11" INTEGER NOT NULL,
    "bola12" INTEGER NOT NULL,
    "bola13" INTEGER NOT NULL,
    "bola14" INTEGER NOT NULL,
    "bola15" INTEGER NOT NULL,
    "bola16" INTEGER NOT NULL,
    "bola17" INTEGER NOT NULL,
    "bola18" INTEGER NOT NULL,
    "bola19" INTEGER NOT NULL,
    "bola20" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_concursos" ("bola01", "bola02", "bola03", "bola04", "bola05", "bola06", "bola07", "bola08", "bola09", "bola10", "bola11", "bola12", "bola13", "bola14", "bola15", "concurso", "createdAt", "dataSorteio", "id", "updatedAt") SELECT "bola01", "bola02", "bola03", "bola04", "bola05", "bola06", "bola07", "bola08", "bola09", "bola10", "bola11", "bola12", "bola13", "bola14", "bola15", "concurso", "createdAt", "dataSorteio", "id", "updatedAt" FROM "concursos";
DROP TABLE "concursos";
ALTER TABLE "new_concursos" RENAME TO "concursos";
CREATE UNIQUE INDEX "concursos_concurso_key" ON "concursos"("concurso");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
