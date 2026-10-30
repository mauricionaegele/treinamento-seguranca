// Dados iniciais: o primeiro administrador (SEED_ADMIN_EMAIL) e, se pedido,
// um cliente de demonstração (SEED_DEMO=1) para testar o fluxo completo.
import "dotenv/config";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

async function main() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  if (email) {
    await prisma.usuarioAdmin.upsert({
      where: { email },
      create: { email, nome: process.env.SEED_ADMIN_NOME || "Administrador", papel: "ADMIN" },
      update: { ativo: true, papel: "ADMIN" },
    });
    console.log(`Administrador: ${email}`);
  }

  if (process.env.SEED_DEMO === "1") {
    let demo = await prisma.cliente.findFirst({ where: { nome: "Cliente Demonstração" } });
    if (!demo) {
      demo = await prisma.cliente.create({
        data: { nome: "Cliente Demonstração", cicloAtual: new Date().getFullYear(), contatoTi: "suporte@broadcastti.com.br", prazo: new Date(Date.UTC(new Date().getFullYear(), 11, 15, 12)) },
      });
    }
    const pessoas = [
      ["Ana Souza", "ana@demo.broadcastti.com.br", "Financeiro", "Carlos Lima"],
      ["Bruno Martins", "bruno@demo.broadcastti.com.br", "Comercial", "Paula Reis"],
      ["Carla Dias", "carla@demo.broadcastti.com.br", "Financeiro", "Carlos Lima"],
      ["Diego Alves", "diego@demo.broadcastti.com.br", "Operações", "Paula Reis"],
    ];
    for (const [nome, em, setor, gerente] of pessoas) {
      await prisma.colaborador.upsert({ where: { email: em }, create: { clienteId: demo.id, nome, email: em, setor, gerente }, update: {} });
    }
    console.log(`Cliente de demonstração com ${pessoas.length} colaboradores.`);
  }
}

main().finally(() => prisma.$disconnect());
