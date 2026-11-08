import { garantir } from "./restheart-api.mjs?v=2";

export const colecaoSeries = "http://localhost:8080/tvmaze/series";
const banco = colecaoSeries.slice(0, colecaoSeries.lastIndexOf("/"));

// Credenciais e formato enviados nas requisições ao RESTHeart local.
const headers = {
  "Content-Type": "application/json",
  Authorization: `Basic ${btoa("admin:secret")}`,
};

// Cria o banco e a coleção caso ainda não existam.
export async function garantirBancoEColecao() {
  await garantir(banco, "banco tvmaze", headers);
  await garantir(colecaoSeries, "coleção series", headers);
}

// Remove as tags HTML do resumo retornado pela TVmaze.
function limparResumo(summary) {
  return summary
    ? new DOMParser()
        .parseFromString(summary, "text/html")
        .body.textContent.trim()
    : "Descrição indisponível.";
}

// Adapta os campos da API pública ao documento usado pelo projeto.
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

// Transforma respostas HTTP malsucedidas em erros com contexto da operação.
async function verificarResposta(response, acao) {
  if (response.ok) return;

  const detalhe = await response.text();
  throw new Error(
    `${acao} falhou (HTTP ${response.status})${detalhe ? `: ${detalhe}` : "."}`
  );
}

// Lê os documentos salvos no banco para a listagem e o painel.
export async function listarSeries() {
  let response = await fetch(`${colecaoSeries}?pagesize=1000`, { headers });
  if (response.status === 404) {
    await garantirBancoEColecao();
    response = await fetch(`${colecaoSeries}?pagesize=1000`, { headers });
  }
  await verificarResposta(response, "A consulta ao banco");
  return response.json();
}

// Procura o documento local correspondente ao ID público da TVmaze.
export async function buscarSerieSalva(tvmazeId) {
  const filtro = encodeURIComponent(JSON.stringify({ tvmazeId }));
  let response = await fetch(`${colecaoSeries}?filter=${filtro}&pagesize=1`, { headers });

  if (response.status === 404) {
    await garantirBancoEColecao();
    response = await fetch(`${colecaoSeries}?filter=${filtro}&pagesize=1`, { headers });
  }
  await verificarResposta(response, "A consulta da série no banco");

  const [serie] = await response.json();
  return serie ?? null;
}

// Evita duplicatas e cadastra uma nova série na coleção.
export async function guardarSerie(show) {
  if (await buscarSerieSalva(show.id)) {
    throw new Error(`${show.name} já está guardada no banco.`);
  }

  // Envia o documento somente depois de confirmar que a série ainda não existe.
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

// Alterna o favorito de um documento salvo ou cria a série já favoritada.
export async function alternarFavorito(show) {
  const serieSalva = await buscarSerieSalva(show.id);
  if (!serieSalva) {
    const documento = criarDocumento(show);
    documento.favorito = true;
    const response = await fetch(colecaoSeries, {
      method: "POST",
      headers,
      body: JSON.stringify(documento),
    });
    await verificarResposta(response, "O cadastro da série favorita");
    return true;
  }

  const id = serieSalva._id?.$oid ?? serieSalva._id;
  if (!id) throw new Error("O documento salvo não possui um ID válido.");
  const favorito = !serieSalva.favorito;
  const response = await fetch(`${colecaoSeries}/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({
      favorito,
      atualizadoEm: new Date().toISOString(),
    }),
  });
  await verificarResposta(response, "A atualização do favorito");
  return favorito;
}

// Altera o favorito usando um documento que já foi carregado da coleção.
export async function alternarFavoritoDocumento(serie) {
  const id = serie._id?.$oid ?? serie._id;
  if (!id) throw new Error("O documento salvo não possui um ID válido.");
  const favorito = !serie.favorito;

  const response = await fetch(`${colecaoSeries}/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify({
      favorito,
      atualizadoEm: new Date().toISOString(),
    }),
  });
  await verificarResposta(response, "A atualização do favorito");
  return favorito;
}
