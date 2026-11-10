import {
  alternarFavorito,
  criarDocumento,
  listarSeries,
  guardarSerie,
} from "./restheart.js";
import { criarCardSerie } from "./series-card.js";

const tvMazeUrl = "https://api.tvmaze.com";

// Referências aos controles usados na busca e na exibição dos resultados.
const form = document.querySelector("#search-form");
const input = document.querySelector("#search-input");
const status = document.querySelector("#status");
const seriesContainer = document.querySelector("#series");
const filterToggle = document.querySelector("#filter-toggle");
const filterPanel = document.querySelector("#filter-panel");
const statusFilter = document.querySelector("#status-filter");
const genreFilter = document.querySelector("#genre-filter");
const minimumScoreFilter = document.querySelector("#minimum-score-filter");
const applyFiltersButton = document.querySelector("#apply-filters");
const clearFiltersButton = document.querySelector("#clear-filters");
let resultadosBusca = [];
let seriesSalvas = [];

// Preenche cada seletor com as opções disponíveis nos resultados atuais.
function atualizarOpcoes(select, valores, textoInicial) {
  const valorAnterior = select.value;
  const opcoes = [...new Set(valores.filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "pt-BR")
  );
  select.replaceChildren(new Option(textoInicial, ""));
  opcoes.forEach((valor) => select.add(new Option(valor, valor)));
  select.value = opcoes.includes(valorAnterior) ? valorAnterior : "";
}

// Aplica texto, status e gênero antes de desenhar os cards encontrados.
function renderizarResultados() {
  const statusSelecionado = statusFilter.value;
  const generoSelecionado = genreFilter.value;
  const pontuacaoMinima = minimumScoreFilter.value === ""
    ? null
    : Number(minimumScoreFilter.value);
  const salvasPorTvmazeId = new Map(
    seriesSalvas.map((serie) => [serie.tvmazeId, serie])
  );
  const resultadosFiltrados = resultadosBusca.filter(({ show }) => {
    const serieSalva = salvasPorTvmazeId.get(show.id);
    const minhaNota = serieSalva?.minhaNota;
    const pontuacao = minhaNota !== null && minhaNota !== undefined && minhaNota !== ""
      ? Number(minhaNota)
      : Number(show.rating?.average);
    const statusCorresponde = !statusSelecionado || show.status === statusSelecionado;
    const generoCorresponde =
      !generoSelecionado || (show.genres ?? []).includes(generoSelecionado);
    const pontuacaoCorresponde = pontuacaoMinima === null
      || (Number.isFinite(pontuacao) && pontuacao >= pontuacaoMinima);
    return statusCorresponde && generoCorresponde && pontuacaoCorresponde;
  });

  seriesContainer.replaceChildren();
  resultadosFiltrados.forEach(({ show }) => {
    const salva = salvasPorTvmazeId.get(show.id);
    const serie = {
      ...criarDocumento(show),
      favorito: salva?.favorito === true,
    };
    const card = criarCardSerie(serie, {
      aoFavoritar: async (botao) => {
        botao.disabled = true;
        botao.textContent = "Atualizando...";

        try {
          serie.favorito = await alternarFavorito(show);
          botao.textContent = serie.favorito ? "♥ Desfavoritar" : "♡ Favoritar";
          botao.disabled = false;
          const botaoGuardar = botao.parentElement.querySelector(".guardar");
          if (serie.favorito && botaoGuardar) {
            botaoGuardar.textContent = "Guardada no banco";
            botaoGuardar.disabled = true;
          }
          status.textContent = serie.favorito
            ? `${show.name} foi marcada como favorita.`
            : `${show.name} foi removida dos favoritos.`;
        } catch (error) {
          console.error("Erro ao favoritar no RESTHeart:", error);
          botao.disabled = false;
          botao.textContent = serie.favorito ? "♥ Desfavoritar" : "♡ Favoritar";
          status.textContent = error.message;
        }
      },
      guardada: Boolean(salva),
      aoGuardar: async (botao) => {
        botao.disabled = true;
        botao.textContent = "Guardando...";

        try {
          await guardarSerie(show);
          botao.textContent = "Guardada com sucesso";
          status.textContent = `${show.name} foi guardada no banco de dados.`;
        } catch (error) {
          console.error("Erro ao guardar no RESTHeart:", error);
          botao.disabled = false;
          botao.textContent = "Guardar no banco";
          status.textContent = error.message;
        }
      },
    });
    seriesContainer.append(card);
  });

  status.textContent = resultadosBusca.length === 0
    ? "Nenhuma série encontrada."
    : resultadosFiltrados.length === 0
      ? "Nenhuma série corresponde à busca e aos filtros selecionados."
      : `${resultadosFiltrados.length} série(s) encontrada(s).`;
}

// Mostra ou oculta os controles de filtro, mantendo o estado acessível.
filterToggle.addEventListener("click", () => {
  filterPanel.hidden = !filterPanel.hidden;
  filterToggle.setAttribute("aria-expanded", String(!filterPanel.hidden));
});

applyFiltersButton.addEventListener("click", renderizarResultados);

clearFiltersButton.addEventListener("click", () => {
  statusFilter.value = "";
  genreFilter.value = "";
  minimumScoreFilter.value = "";
  renderizarResultados();
});

// Busca séries na TVmaze e cria um card com a opção de salvar cada resultado.
form.addEventListener("submit", async (event) => {
  event.preventDefault();

  const searchTerm = input.value.trim();

  if (!searchTerm) {
    status.textContent = "Digite o nome de uma série para buscar.";
    input.focus();
    return;
  }

  status.textContent = "Buscando...";
  seriesContainer.replaceChildren();

  try {
    // Codifica o termo para que espaços e caracteres especiais sejam válidos na URL.
    const response = await fetch(
      `${tvMazeUrl}/search/shows?q=${encodeURIComponent(searchTerm)}`
    );

    if (!response.ok) {
      throw new Error(`A API respondeu com o status ${response.status}.`);
    }

    const results = await response.json();
    resultadosBusca = results;
    seriesSalvas = [];
    try {
      seriesSalvas = await listarSeries();
    } catch (error) {
      console.error("Não foi possível consultar os títulos já salvos:", error);
    }
    atualizarOpcoes(
      statusFilter,
      results.map(({ show }) => show.status),
      "Todos os status"
    );
    atualizarOpcoes(
      genreFilter,
      results.flatMap(({ show }) => show.genres ?? []),
      "Todos os gêneros"
    );
    renderizarResultados();
  } catch (error) {
    resultadosBusca = [];
    seriesContainer.replaceChildren();
    status.textContent = "Não foi possível buscar as séries. Tente novamente.";
    console.error("Erro ao buscar séries:", error);
  }
});