-- DropForeignKey
ALTER TABLE "Certificado" DROP CONSTRAINT "Certificado_tentativaId_fkey";

-- AlterTable
ALTER TABLE "Certificado" ALTER COLUMN "tentativaId" DROP NOT NULL;

-- AlterTable
ALTER TABLE "Cliente" ADD COLUMN     "exigeProvaFinal" BOOLEAN NOT NULL DEFAULT true;

-- AddForeignKey
ALTER TABLE "Certificado" ADD CONSTRAINT "Certificado_tentativaId_fkey" FOREIGN KEY ("tentativaId") REFERENCES "TentativaProva"("id") ON DELETE SET NULL ON UPDATE CASCADE;
