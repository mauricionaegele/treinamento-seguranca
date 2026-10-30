import { redirect } from "next/navigation";
import { encerrarSessao } from "@/lib/sessao";

export async function GET() {
  await encerrarSessao();
  redirect("/entrar");
}
