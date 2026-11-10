import {
  alternarFavoritoDocumento,
  excluirSerieSalva,
  listarSeries,
} from "./restheart.js";
import { criarCardSerie } from "./series-card.js";

const form = document.querySelector("#search-form");
const input = document.querySelector("#search-input");
const status = document.querySelector("#status");
const seriesContainer = document.querySelector("#series");
const filterToggle = document.querySelector("#filter-toggle");
const filterPanel = document.querySelector("#filter-panel");
const statusFilter = document.querySelector("#status-filter");
const genreFilter = document.querySelector("#genre-filter");
const minimumScoreFilter = document.querySelector("#minimum-score-filter");
const favoritesOnlyFilter = document.querySelector("#favorites-only-filter");
const applyFiltersButton = document.querySelector("#apply-filters");
const clearFiltersButton = document.querySelector("#clear-filters");
let seriesSalvas = [];

// Preenche cada seletor com os valores existentes nos documentos salvos.
function atualizarOpcoes(select, valores, textoInicial) {
  const valorAnterior = select.value;
  const opcoes = [...new Set(valores.filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, "pt-BR")
  );
  select.replaceChildren(new Option(textoInicial, ""));
  opcoes.forEach((valor) => select.add(new Option(valor, valor)));
  select.value = opcoes.includes(valorAnterior) ? valorAnterior : "";
}

// Filtra os documentos carregados e atualiza os cards e a mensagem de estado.
function renderizarSeries(filtro = "") {
  const termo = filtro.trim().toLocaleLowerCase();
  const statusSelecionado = statusFilter.value;
  const generoSelecionado = genreFilter.value;
  const pontuacaoMinima = minimumScoreFilter.value === ""
    ? null
    : Number(minimumScoreFilter.value);
  const seriesFiltradas = seriesSalvas.filter((serie) => {
    const texto = [
      serie.nome,
      serie.status,
      serie.idioma,
      ...(serie.generos ?? []),
    ]
      .filter(Boolean)
      .join(" ")
      .toLocaleLowerCase();

    const minhaNota = serie.minhaNota;
    const pontuacao = minhaNota !== null && minhaNota !== undefined && minhaNota !== ""
      ? Number(minhaNota)
      : Number(serie.notaTvmaze);

    return texto.includes(termo)
      && (!statusSelecionado || serie.status === statusSelecionado)
      && (!generoSelecionado || (serie.generos ?? []).includes(generoSelecionado))
      && (!favoritesOnlyFilter.checked || serie.favorito === true)
      && (pontuacaoMinima === null
        || (Number.isFinite(pontuacao) && pontuacao >= pontuacaoMinima));
  });

  seriesContainer.replaceChildren(
    ...seriesFiltradas.map((serie) =>
      criarCardSerie(serie, {
        aoFavoritar: async (botao) => {
          botao.disabled = true;
          botao.textContent = "Atualizando...";

          try {
            serie.favorito = await alternarFavoritoDocumento(serie);
            botao.textContent = serie.favorito ? "♥ Desfavoritar" : "♡ Favoritar";
            botao.disabled = false;
            if (favoritesOnlyFilter.checked) {
              renderizarSeries(input.value);
              return;
            }
            status.textContent = serie.favorito
              ? `${serie.nome} foi marcada como favorita.`
              : `${serie.nome} foi removida dos favoritos.`;
          } catch (error) {
            console.error("Erro ao favoritar série salva:", error);
            botao.disabled = false;
            botao.textContent = serie.favorito ? "♥ Desfavoritar" : "♡ Favoritar";
            status.textContent = error.message;
          }
        },
        aoExcluir: async (botao) => {
          if (!window.confirm(`Remover "${serie.nome}" e todos os seus dados do banco?`)) {
            return;
          }

          botao.disabled = true;
          botao.textContent = "Removendo...";
          try {
            await excluirSerieSalva(serie.tvmazeId);
            seriesSalvas = seriesSalvas.filter(
              (item) => item.tvmazeId !== serie.tvmazeId
            );
            renderizarSeries(input.value);
            status.textContent = `${serie.nome} e todos os seus dados foram removidos do banco.`;
          } catch (error) {
            console.error("Erro ao excluir série do banco:", error);
            botao.disabled = false;
            botao.textContent = "Remover do banco";
            status.textContent = error.message;
          }
        },
        mostrarDetalhes: true,
      })
    )
  );

  status.textContent = seriesSalvas.length === 0
    ? "Ainda não há séries guardadas no banco."
    : seriesFiltradas.length === 0
      ? "Nenhuma série guardada corresponde ao filtro."
      : `${seriesFiltradas.length} série(s) guardada(s).`;
}

// Abre ou fecha os controles de filtro da listagem.
filterToggle.addEventListener("click", () => {
  filterPanel.hidden = !filterPanel.hidden;
  filterToggle.setAttribute("aria-expanded", String(!filterPanel.hidden));
});

// Aplica os filtros selecionados à lista atual.
applyFiltersButton.addEventListener("click", () => renderizarSeries(input.value));

// Remove os filtros estruturados sem apagar o texto da busca.
clearFiltersButton.addEventListener("click", () => {
  statusFilter.value = "";
  genreFilter.value = "";
  minimumScoreFilter.value = "";
  favoritesOnlyFilter.checked = false;
  renderizarSeries(input.value);
});

// Atualiza a lista ao alternar a exibição exclusiva de favoritos.
favoritesOnlyFilter.addEventListener("change", () => renderizarSeries(input.value));

// Aplica a busca textual ao enviar o formulário.
form.addEventListener("submit", (event) => {
  event.preventDefault();
  renderizarSeries(input.value);
});

// Busca a coleção no RESTHeart e exibe os resultados iniciais.
try {
  seriesSalvas = await listarSeries();
  atualizarOpcoes(
    statusFilter,
    seriesSalvas.map((serie) => serie.status),
    "Todos os status"
  );
  atualizarOpcoes(
    genreFilter,
    seriesSalvas.flatMap((serie) => serie.generos ?? []),
    "Todos os gêneros"
  );
  renderizarSeries();
} catch (error) {
  console.error("Erro ao consultar séries no RESTHeart:", error);
  status.textContent = `${error.message} Verifique se o Docker/RESTHeart está em execução (ele deve corrigir sozinho, tente novament).`;
}
