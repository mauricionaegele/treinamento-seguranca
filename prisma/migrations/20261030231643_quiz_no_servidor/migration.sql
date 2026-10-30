-- CreateTable
CREATE TABLE "QuizTentativa" (
    "id" TEXT NOT NULL,
    "colaboradorId" TEXT NOT NULL,
    "ciclo" INTEGER NOT NULL,
    "modulo" TEXT NOT NULL,
    "respostas" JSONB NOT NULL DEFAULT '{}',
    "nota" INTEGER,
    "criadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalizadaEm" TIMESTAMP(3),

    CONSTRAINT "QuizTentativa_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "QuizTentativa_colaboradorId_ciclo_modulo_idx" ON "QuizTentativa"("colaboradorId", "ciclo", "modulo");

-- AddForeignKey
ALTER TABLE "QuizTentativa" ADD CONSTRAINT "QuizTentativa_colaboradorId_fkey" FOREIGN KEY ("colaboradorId") REFERENCES "Colaborador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
