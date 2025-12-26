-- CreateTable
CREATE TABLE "concursos" (
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
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "game_analysis" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "gameId" TEXT NOT NULL,
    "strategy" TEXT NOT NULL,
    "numbers" TEXT NOT NULL,
    "stats" TEXT,
    "isValid" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "concursos_concurso_key" ON "concursos"("concurso");
