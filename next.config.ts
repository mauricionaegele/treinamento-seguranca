import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Servidor enxuto e autossuficiente para a imagem Docker de produção
  output: "standalone",
  poweredByHeader: false,
  // Os módulos (HTML, áudio) são lidos de conteudo/ em tempo de execução
  outputFileTracingIncludes: { "/curso/[...caminho]": ["./conteudo/**/*"] },
};

export default nextConfig;
