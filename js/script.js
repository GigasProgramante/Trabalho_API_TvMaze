import { criarDocumento, guardarSerie } from "./restheart.js";
import { criarCardSerie } from "./series-card.js";

const tvMazeUrl = "https://api.tvmaze.com";

// Busca no HTML os elementos que serão usados pelo JavaScript.
const form = document.querySelector("#search-form");
const input = document.querySelector("#search-input");
const status = document.querySelector("#status");
const seriesContainer = document.querySelector("#series");

// "submit" acontece quando a pessoa clica em Buscar ou pressiona Enter no campo.
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
    const response = await fetch(
      `${tvMazeUrl}/search/shows?q=${encodeURIComponent(searchTerm)}`
    );

    if (!response.ok) {
      throw new Error(`A API respondeu com o status ${response.status}.`);
    }

    const results = await response.json();

    results.forEach(({ show }) => {
      const serie = criarDocumento(show);
      const card = criarCardSerie(serie, {
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

    status.textContent = results.length === 0
      ? "Nenhuma série encontrada."
      : "";
  } catch (error) {
    status.textContent = "Não foi possível buscar as séries. Tente novamente.";
    console.error("Erro ao buscar séries:", error);
  }
});