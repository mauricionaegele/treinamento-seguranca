-- AlterTable
ALTER TABLE "Cliente" ADD COLUMN     "gestorMfa" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "Sessao" ADD COLUMN     "adminPendente" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "UsuarioAdmin" ADD COLUMN     "codigosEmergencia" JSONB,
ADD COLUMN     "mfaConfiguradoEm" TIMESTAMP(3),
ADD COLUMN     "senhaHash" TEXT,
ADD COLUMN     "totpAtivo" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "totpSegredo" TEXT,
ADD COLUMN     "totpUltimoPasso" INTEGER;

-- Sessões administrativas abertas só com o código do e-mail deixam de valer:
-- no próximo acesso, administradores configuram senha + autenticador.
DELETE FROM "Sessao" WHERE "adminId" IS NOT NULL;
