-- AlterTable
ALTER TABLE "Lembrete" ADD COLUMN     "enviadoPor" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "tipo" TEXT NOT NULL DEFAULT 'lembrete';
