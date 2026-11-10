import { listarSeries } from "./restheart.js";

// Referências aos elementos que recebem status, dados e gráficos do painel.
const status = document.querySelector("#status");
const genreChartCanvas = document.querySelector("#genre-chart");
const statusChartCanvas = document.querySelector("#status-chart");

// Conta quantas séries pertencem a cada categoria e ordena da maior para a menor.
function contarPor(series, obterCategorias) {
  const contagens = new Map();

  // Cada série pode contribuir para uma ou mais categorias.
  series.forEach((serie) => {
    obterCategorias(serie).forEach((categoria) => {
      const nome = categoria?.trim() || "Não informado";
      contagens.set(nome, (contagens.get(nome) ?? 0) + 1);
    });
  });

  return [...contagens.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0], "pt-BR"));
}

// Calcula os quatro indicadores principais a partir dos documentos do banco.
function atualizarIndicadores(series, generos) {
  const notas = series
    .map((serie) => serie.notaTvmaze)
    .filter((nota) => nota !== null && nota !== undefined && nota !== "")
    .map(Number)
    .filter(Number.isFinite);
  // Sem notas válidas, apresenta N/A em vez de dividir por zero.
  const media = notas.length
    ? (notas.reduce((total, nota) => total + nota, 0) / notas.length).toFixed(1)
    : "N/A";
  const favoritas = series.filter((serie) => serie.favorito === true).length;

  // Atualiza os cartões do HTML pelos seus IDs.
  document.querySelector("#total-series").textContent = String(series.length);
  document.querySelector("#average-rating").textContent = media;
  document.querySelector("#favorite-series").textContent = String(favoritas);
  document.querySelector("#genre-count").textContent = String(generos.length);
}

// Desenha o gráfico dos gêneros mais frequentes e a distribuição por status.
function renderizarGraficos(generos, statusSeries) {
  if (typeof Chart === "undefined") {
    throw new Error("Não foi possível carregar a biblioteca dos gráficos.");
  }

  // Limita o gráfico de barras aos oito gêneros mais frequentes.
  const topGeneros = generos.slice(0, 8);
  new Chart(genreChartCanvas, {
    // Barras horizontais facilitam a leitura dos nomes dos gêneros.
    type: "bar",
    data: {
      labels: topGeneros.map(([nome]) => nome),
      datasets: [{
        label: "Séries",
        data: topGeneros.map(([, quantidade]) => quantidade),
        backgroundColor: "#6d4c1f",
        borderColor: "#1b160f",
        borderWidth: 2,
      }],
    },
    options: {
      indexAxis: "y",
      maintainAspectRatio: false,
      plugins: { legend: { display: false } },
      scales: { x: { beginAtZero: true, ticks: { precision: 0 } } },
    },
  });

  // Cada fatia representa a quantidade de séries em um status.
  new Chart(statusChartCanvas, {
    type: "doughnut",
    data: {
      labels: statusSeries.map(([nome]) => nome),
      datasets: [{
        data: statusSeries.map(([, quantidade]) => quantidade),
        backgroundColor: ["#6d4c1f", "#c17a25", "#e7ae60", "#8c806d", "#554b3d"],
        borderColor: "#fff8ef",
        borderWidth: 2,
      }],
    },
    options: {
      maintainAspectRatio: false,
      plugins: { legend: { position: "bottom" } },
    },
  });
}

// Exibe as cinco séries com as maiores notas TVmaze disponíveis.
function renderizarRanking(series) {
  const ranking = document.querySelector("#rating-ranking");
  // Ignora notas ausentes ou inválidas, ordena e mantém somente as cinco primeiras.
  const maisBemAvaliadas = series
    .filter((serie) =>
      serie.notaTvmaze !== null
      && serie.notaTvmaze !== undefined
      && serie.notaTvmaze !== ""
      && Number.isFinite(Number(serie.notaTvmaze))
    )
    .sort((a, b) => Number(b.notaTvmaze) - Number(a.notaTvmaze))
    .slice(0, 5);

  if (maisBemAvaliadas.length === 0) {
    // Informa quando ainda não existem notas para compor o ranking.
    const item = document.createElement("li");
    item.className = "list-group-item";
    item.textContent = "Ainda não há séries com nota disponível.";
    ranking.append(item);
    return;
  }

  // Cria os itens com nome e nota sem inserir dados como HTML executável.
  maisBemAvaliadas.forEach((serie) => {
    const item = document.createElement("li");
    item.className = "list-group-item d-flex justify-content-between gap-3";

    const nome = document.createElement("span");
    nome.textContent = serie.nome || "Série sem nome";

    const nota = document.createElement("strong");
    nota.textContent = `★ ${Number(serie.notaTvmaze).toFixed(1)}`;

    item.append(nome, nota);
    ranking.append(item);
  });
}

// Monta a tabela com a contagem de séries em cada gênero.
function renderizarTabelaGeneros(generos) {
  const tabela = document.querySelector("#genre-table");

  if (generos.length === 0) {
    // Mantém a tabela válida e informativa quando a coleção não tem gêneros.
    const linha = document.createElement("tr");
    const celula = document.createElement("td");
    celula.colSpan = 2;
    celula.textContent = "Ainda não há gêneros cadastrados.";
    linha.append(celula);
    tabela.append(linha);
    return;
  }

  // Adiciona uma linha para cada gênero e sua contagem de séries.
  generos.forEach(([genero, quantidade]) => {
    const linha = document.createElement("tr");
    const nome = document.createElement("th");
    nome.scope = "row";
    nome.textContent = genero;
    const total = document.createElement("td");
    total.textContent = String(quantidade);
    linha.append(nome, total);
    tabela.append(linha);
  });
}

// Carrega os documentos uma vez e alimenta todas as visualizações do painel.
try {
  // Lê todos os documentos do banco antes de calcular os indicadores.
  const series = await listarSeries();
  // Agrupa os gêneros; documentos sem gênero ficam em uma categoria própria.
  const generos = contarPor(series, (serie) =>
    Array.isArray(serie.generos) && serie.generos.length > 0
      ? serie.generos
      : ["Não informado"]
  );
  const generosInformados = generos.filter(([nome]) => nome !== "Não informado");
  // Cada documento pertence a um único status para este gráfico.
  const statusSeries = contarPor(series, (serie) => [serie.status || "Não informado"]);

  // Mantém a categoria sem gênero no gráfico/tabela, mas não a conta como gênero.
  // Em seguida, renderiza os quatro blocos do painel e atualiza a mensagem final.
  atualizarIndicadores(series, generosInformados);
  renderizarGraficos(generos, statusSeries);
  renderizarRanking(series);
  renderizarTabelaGeneros(generos);
  status.textContent = `${series.length} série(s) analisada(s) com dados do banco.`;
} catch (error) {
  // Apresenta a falha no próprio painel e registra detalhes no console.
  console.error("Erro ao carregar o painel:", error);
  status.className = "alert alert-danger status-message";
  status.textContent = `${error.message} Verifique se o Docker/RESTHeart está em execução e tente novamente.`;
}
