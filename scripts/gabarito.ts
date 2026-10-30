// Só para o teste automático: imprime as respostas certas em JSON.
// (os arquivos importados têm "server-only", que aqui é neutralizado)
import Module from "node:module";

type Carregador = { _load: (r: string, ...a: unknown[]) => unknown };
const M = Module as unknown as Carregador;
const original = M._load;
M._load = (r: string, ...a: unknown[]) => (r === "server-only" ? {} : original(r, ...a));

// eslint-disable-next-line @typescript-eslint/no-require-imports
const { QUIZZES } = require("../src/lib/quizzes") as typeof import("../src/lib/quizzes");
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { QUESTOES } = require("../src/lib/questoes") as typeof import("../src/lib/questoes");

const quizzes = Object.fromEntries(Object.entries(QUIZZES).map(([m, ps]) => [m, ps.map((p) => p.c)]));
const prova = Object.fromEntries(QUESTOES.map((q) => [q.q, q.o[q.c]]));
console.log(JSON.stringify({ quizzes, prova }));
