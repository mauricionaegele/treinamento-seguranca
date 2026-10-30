-- CreateEnum
CREATE TYPE "Papel" AS ENUM ('ADMIN', 'GERENTE');

-- CreateTable
CREATE TABLE "Cliente" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "contatoTi" TEXT NOT NULL DEFAULT '',
    "cicloAtual" INTEGER NOT NULL,
    "prazo" TIMESTAMP(3),
    "notaMinima" INTEGER NOT NULL DEFAULT 70,
    "maxTentativas" INTEGER NOT NULL DEFAULT 3,
    "validadeMeses" INTEGER NOT NULL DEFAULT 12,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Cliente_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Colaborador" (
    "id" TEXT NOT NULL,
    "clienteId" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "setor" TEXT NOT NULL DEFAULT '',
    "gerente" TEXT NOT NULL DEFAULT '',
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Colaborador_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "UsuarioAdmin" (
    "id" TEXT NOT NULL,
    "nome" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "papel" "Papel" NOT NULL,
    "clienteId" TEXT,
    "ativo" BOOLEAN NOT NULL DEFAULT true,
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "UsuarioAdmin_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CodigoAcesso" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "codigoHash" TEXT NOT NULL,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "tentativas" INTEGER NOT NULL DEFAULT 0,
    "usadoEm" TIMESTAMP(3),
    "ip" TEXT NOT NULL DEFAULT '',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "CodigoAcesso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Sessao" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "colaboradorId" TEXT,
    "adminId" TEXT,
    "expiraEm" TIMESTAMP(3) NOT NULL,
    "ip" TEXT NOT NULL DEFAULT '',
    "userAgent" TEXT NOT NULL DEFAULT '',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Sessao_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProgressoModulo" (
    "id" TEXT NOT NULL,
    "colaboradorId" TEXT NOT NULL,
    "ciclo" INTEGER NOT NULL,
    "modulo" TEXT NOT NULL,
    "iniciadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "concluidoEm" TIMESTAMP(3),
    "melhorNota" INTEGER,
    "tentativas" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProgressoModulo_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TentativaProva" (
    "id" TEXT NOT NULL,
    "colaboradorId" TEXT NOT NULL,
    "ciclo" INTEGER NOT NULL,
    "questoes" JSONB NOT NULL,
    "respostas" JSONB,
    "nota" INTEGER,
    "aprovado" BOOLEAN,
    "iniciadaEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finalizadaEm" TIMESTAMP(3),
    "ip" TEXT NOT NULL DEFAULT '',

    CONSTRAINT "TentativaProva_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Certificado" (
    "id" TEXT NOT NULL,
    "codigo" TEXT NOT NULL,
    "colaboradorId" TEXT NOT NULL,
    "ciclo" INTEGER NOT NULL,
    "tentativaId" TEXT NOT NULL,
    "nota" INTEGER NOT NULL,
    "emitidoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "validoAte" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Certificado_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RegistroAcesso" (
    "id" TEXT NOT NULL,
    "colaboradorId" TEXT,
    "email" TEXT NOT NULL DEFAULT '',
    "evento" TEXT NOT NULL,
    "detalhe" TEXT NOT NULL DEFAULT '',
    "ip" TEXT NOT NULL DEFAULT '',
    "userAgent" TEXT NOT NULL DEFAULT '',
    "criadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "RegistroAcesso_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Lembrete" (
    "id" TEXT NOT NULL,
    "colaboradorId" TEXT NOT NULL,
    "enviadoEm" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Lembrete_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Colaborador_email_key" ON "Colaborador"("email");

-- CreateIndex
CREATE INDEX "Colaborador_clienteId_idx" ON "Colaborador"("clienteId");

-- CreateIndex
CREATE UNIQUE INDEX "UsuarioAdmin_email_key" ON "UsuarioAdmin"("email");

-- CreateIndex
CREATE INDEX "CodigoAcesso_email_criadoEm_idx" ON "CodigoAcesso"("email", "criadoEm");

-- CreateIndex
CREATE UNIQUE INDEX "Sessao_tokenHash_key" ON "Sessao"("tokenHash");

-- CreateIndex
CREATE UNIQUE INDEX "ProgressoModulo_colaboradorId_ciclo_modulo_key" ON "ProgressoModulo"("colaboradorId", "ciclo", "modulo");

-- CreateIndex
CREATE INDEX "TentativaProva_colaboradorId_ciclo_idx" ON "TentativaProva"("colaboradorId", "ciclo");

-- CreateIndex
CREATE UNIQUE INDEX "Certificado_codigo_key" ON "Certificado"("codigo");

-- CreateIndex
CREATE UNIQUE INDEX "Certificado_tentativaId_key" ON "Certificado"("tentativaId");

-- CreateIndex
CREATE UNIQUE INDEX "Certificado_colaboradorId_ciclo_key" ON "Certificado"("colaboradorId", "ciclo");

-- CreateIndex
CREATE INDEX "RegistroAcesso_colaboradorId_criadoEm_idx" ON "RegistroAcesso"("colaboradorId", "criadoEm");

-- AddForeignKey
ALTER TABLE "Colaborador" ADD CONSTRAINT "Colaborador_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "UsuarioAdmin" ADD CONSTRAINT "UsuarioAdmin_clienteId_fkey" FOREIGN KEY ("clienteId") REFERENCES "Cliente"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sessao" ADD CONSTRAINT "Sessao_colaboradorId_fkey" FOREIGN KEY ("colaboradorId") REFERENCES "Colaborador"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sessao" ADD CONSTRAINT "Sessao_adminId_fkey" FOREIGN KEY ("adminId") REFERENCES "UsuarioAdmin"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProgressoModulo" ADD CONSTRAINT "ProgressoModulo_colaboradorId_fkey" FOREIGN KEY ("colaboradorId") REFERENCES "Colaborador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TentativaProva" ADD CONSTRAINT "TentativaProva_colaboradorId_fkey" FOREIGN KEY ("colaboradorId") REFERENCES "Colaborador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificado" ADD CONSTRAINT "Certificado_colaboradorId_fkey" FOREIGN KEY ("colaboradorId") REFERENCES "Colaborador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Certificado" ADD CONSTRAINT "Certificado_tentativaId_fkey" FOREIGN KEY ("tentativaId") REFERENCES "TentativaProva"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RegistroAcesso" ADD CONSTRAINT "RegistroAcesso_colaboradorId_fkey" FOREIGN KEY ("colaboradorId") REFERENCES "Colaborador"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Lembrete" ADD CONSTRAINT "Lembrete_colaboradorId_fkey" FOREIGN KEY ("colaboradorId") REFERENCES "Colaborador"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
