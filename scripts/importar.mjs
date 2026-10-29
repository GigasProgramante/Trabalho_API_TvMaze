// Importação inicial: GET na API TVmaze + POST de cada série no banco (RESTHeart).
// Como rodar (com o docker compose de pé):  node scripts/importar.mjs
// Opcional: quantidade de séries ->         node scripts/importar.mjs 50
// Precisa do Node.js 18 ou mais novo (fetch já vem embutido).

const TVMAZE = process.env.TVMAZE_URL || "https://api.tvmaze.com";
const BASE = process.env.DB_URL || "http://localhost:8080";
const BANCO = `${BASE}/tvmaze`;
const COLECAO = `${BANCO}/series`;
const QUANTIDADE = Number(process.argv[2]) || 40; // o professor pede no mínimo 30

// Usuário padrão do RESTHeart local (aceito pelo professor só porque roda na máquina).
const HEADERS = {
  "Content-Type": "application/json",
  Authorization: "Basic " + Buffer.from("admin:secret").toString("base64"),
};

// Converte uma série da TVmaze para o modelo de documento do grupo (README).
function paraDocumento(show) {
  const canal = show.network ?? show.webChannel; // série de streaming vem em webChannel
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
    favorito: false,
    minhaNota: null,
    comentario: "",
    criadoEm: agora,
    atualizadoEm: agora,
  };
}

// PUT cria o banco e a coleção: 201 na primeira vez, 200 se já existirem.
async function garantir(url, nome) {
  const res = await fetch(url, { method: "PUT", headers: HEADERS });
  if (res.status !== 201 && res.status !== 200) {
    throw new Error(`PUT ${nome} falhou com status ${res.status}`);
  }
  console.log(`PUT ${nome} -> ${res.status}${res.status === 201 ? " (criado)" : " (já existia)"}`);
}

// GET no banco: ids da TVmaze já salvos, para não duplicar se o script rodar de novo.
async function idsJaSalvos() {
  const keys = encodeURIComponent(JSON.stringify({ tvmazeId: 1 }));
  const res = await fetch(`${COLECAO}?pagesize=1000&keys=${keys}`, { headers: HEADERS });
  if (!res.ok) throw new Error(`GET da coleção falhou com status ${res.status}`);
  const docs = await res.json();
  return new Set(docs.map((d) => d.tvmazeId));
}

async function main() {
  console.log(`Banco: ${COLECAO}`);
  await garantir(BANCO, "banco tvmaze");
  await garantir(COLECAO, "coleção series");

  // GET na API de origem (só leitura).
  const resOrigem = await fetch(`${TVMAZE}/shows?page=0`);
  if (!resOrigem.ok) throw new Error(`GET na TVmaze falhou com status ${resOrigem.status}`);
  const shows = await resOrigem.json();
  console.log(`GET TVmaze /shows?page=0 -> ${resOrigem.status} (${shows.length} séries recebidas)`);

  const existentes = await idsJaSalvos();
  let inseridos = 0;
  let pulados = 0;
  let erros = 0;

  for (const show of shows.slice(0, QUANTIDADE)) {
    if (existentes.has(show.id)) {
      pulados++;
      continue;
    }
    // POST grava o documento; 201 Created e o id novo vem no cabeçalho Location.
    const res = await fetch(COLECAO, {
      method: "POST",
      headers: HEADERS,
      body: JSON.stringify(paraDocumento(show)),
    });
    if (res.status === 201) {
      inseridos++;
      const id = res.headers.get("Location")?.split("/").pop();
      console.log(`POST ${show.name} -> 201 (id ${id})`);
    } else {
      erros++;
      console.log(`POST ${show.name} -> ERRO ${res.status}`);
    }
  }

  const total = (await idsJaSalvos()).size;
  console.log("------------------------------");
  console.log(`Inseridos: ${inseridos} | Já existiam: ${pulados} | Erros: ${erros}`);
  console.log(`Total de séries no banco: ${total}`);
  if (erros > 0) process.exitCode = 1;
}

main().catch((erro) => {
  console.error("Falha na importação:", erro.message);
  console.error("O docker compose está rodando? Teste com: docker compose ps");
  process.exitCode = 1;
});
