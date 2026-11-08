import { criarDocumento, guardarSerie } from "./restheart.js";
import { criarCardSerie } from "./series-card.js";

const tvMazeUrl = "https://api.tvmaze.com";

// Referências aos controles usados na busca e na exibição dos resultados.
const form = document.querySelector("#search-form");
const input = document.querySelector("#search-input");
const status = document.querySelector("#status");
const seriesContainer = document.querySelector("#series");

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

    // Converte cada resultado ao modelo local e configura sua ação de cadastro.
    results.forEach(({ show }) => {
      const serie = criarDocumento(show);
      const card = criarCardSerie(serie, {
        aoGuardar: async (botao) => {
          botao.disabled = true;
          botao.textContent = "Guardando...";

          // Informa o resultado do cadastro e reabilita o botão em caso de erro.
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