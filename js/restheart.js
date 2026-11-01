import { garantir } from "./restheart-api.mjs";

export const colecaoSeries = "http://localhost:8080/tvmaze/series";
const banco = colecaoSeries.slice(0, colecaoSeries.lastIndexOf("/"));

const headers = {
  "Content-Type": "application/json",
  Authorization: `Basic ${btoa("admin:secret")}`,
};

export async function garantirBancoEColecao() {
  await garantir(banco, "banco tvmaze", headers);
  await garantir(colecaoSeries, "coleção series", headers);
}

function limparResumo(summary) {
  return summary
    ? new DOMParser()
        .parseFromString(summary, "text/html")
        .body.textContent.trim()
    : "Descrição indisponível.";
}

export function criarDocumento(show) {
  const canal = show.network ?? show.webChannel;
  const agora = new Date().toISOString();

  return {
    tvmazeId: show.id,
    nome: show.name,
    tipo: show.type,
    idioma: show.language,
    generos: show.genres ?? [],
    status: show.status,
    estreia: show.premiered ?? null,
    duracaoMin: show.runtime ?? show.averageRuntime ?? null,
    notaTvmaze: show.rating?.average ?? null,
    emissora: canal ? { nome: canal.name, pais: canal.country?.name ?? null } : null,
    imagem: show.image?.medium ?? null,
    resumo: limparResumo(show.summary),
    favorito: false,
    minhaNota: null,
    comentario: "",
    criadoEm: agora,
    atualizadoEm: agora,
  };
}

async function verificarResposta(response, acao) {
  if (response.ok) return;

  const detalhe = await response.text();
  throw new Error(
    `${acao} falhou (HTTP ${response.status})${detalhe ? `: ${detalhe}` : "."}`
  );
}

export async function listarSeries() {
  const response = await fetch(`${colecaoSeries}?pagesize=1000`, { headers });
  await verificarResposta(response, "A consulta ao banco");
  return response.json();
}

export async function guardarSerie(show) {
  const filtro = encodeURIComponent(JSON.stringify({ tvmazeId: show.id }));
  let consulta = await fetch(`${colecaoSeries}?filter=${filtro}&pagesize=1`, { headers });
  if (consulta.status === 404) {
    await garantirBancoEColecao();
    consulta = await fetch(`${colecaoSeries}?filter=${filtro}&pagesize=1`, { headers });
  }
  await verificarResposta(consulta, "A verificação de série existente");

  if ((await consulta.json()).length > 0) {
    throw new Error(`${show.name} já está guardada no banco.`);
  }

  const opcoes = {
    method: "POST",
    headers,
    body: JSON.stringify(criarDocumento(show)),
  };
  let response = await fetch(colecaoSeries, opcoes);
  if (!response.ok) {
    await garantirBancoEColecao();
    response = await fetch(colecaoSeries, opcoes);
  }
  await verificarResposta(response, "A gravação da série no banco");
}
