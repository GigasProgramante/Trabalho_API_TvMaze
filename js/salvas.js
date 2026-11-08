import { listarSeries } from "./restheart.js";
import { criarCardSerie } from "./series-card.js";

const form = document.querySelector("#search-form");
const input = document.querySelector("#search-input");
const status = document.querySelector("#status");
const seriesContainer = document.querySelector("#series");
let seriesSalvas = [];

// Filtra os documentos carregados e atualiza os cards e a mensagem de estado.
function renderizarSeries(filtro = "") {
  const termo = filtro.trim().toLocaleLowerCase();
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

    return texto.includes(termo);
  });

  seriesContainer.replaceChildren(
    ...seriesFiltradas.map((serie) =>
      criarCardSerie(serie, { mostrarDetalhes: true })
    )
  );

  status.textContent = seriesSalvas.length === 0
    ? "Ainda não há séries guardadas no banco."
    : seriesFiltradas.length === 0
      ? "Nenhuma série guardada corresponde ao filtro."
      : `${seriesFiltradas.length} série(s) guardada(s).`;
}

// Aplica o filtro digitado sem recarregar a página.
form.addEventListener("submit", (event) => {
  event.preventDefault();
  renderizarSeries(input.value);
});

// Busca a coleção no RESTHeart e exibe os resultados iniciais.
try {
  seriesSalvas = await listarSeries();
  renderizarSeries();
} catch (error) {
  console.error("Erro ao consultar séries no RESTHeart:", error);
  status.textContent = `${error.message} Verifique se o Docker/RESTHeart está em execução (ele deve corrigir sozinho, tente novament).`;
}
