// Endereço principal da API do TVMaze
const tvMazeUrl = "https://api.tvmaze.com";
// Endereço do RESTHeart / MongoDB (ajuste a collection se necessário, ex: /series)
const restHeartUrl = "http://localhost:8080/series";

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
      const card = document.createElement("article");
      card.className = "card";

      // 1. Imagem no topo (se existir)
      if (show.image?.medium) {
        const image = document.createElement("img");
        image.src = show.image.medium;
        image.alt = `Imagem da série ${show.name}`;
        card.append(image);
      }

      // 2. Título da série
      const title = document.createElement("h2");
      title.textContent = show.name;
      card.append(title);

      // 3. Descrição limpa
      const desc = document.createElement("p");
      desc.textContent = show.summary
        ? new DOMParser()
            .parseFromString(show.summary, "text/html")
            .body.textContent
            .trim()
        : "Descrição indisponível.";
      card.append(desc);

      // 4. Botão "Guardar no banco" (POST para o RESTHeart)
      const guardar = document.createElement("button");
      guardar.textContent = "Guardar no banco";
      guardar.className = "guardar";
      
      guardar.addEventListener("click", async () => {
        try {
          // Estrutura do documento para o MongoDB via RESTHeart
          const serieData = {
            tvmaze_id: show.id,
            name: show.name,
            genres: show.genres || [],
            rating: show.rating?.average || null,
            summary: desc.textContent,
            image: show.image?.medium || ""
          };

          const postResponse = await fetch(restHeartUrl, {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(serieData)
          });

          if (!postResponse.ok) {
            throw new Error("Erro ao guardar no servidor.");
          }

          guardar.textContent = "Guardado com sucesso! ✔";
          guardar.style.backgroundColor = "#2d6a4f";
          setTimeout(() => {
            guardar.textContent = "Guardar no banco";
            guardar.style.backgroundColor = "";
          }, 2500);

        } catch (err) {
          console.error("Erro ao salvar no RESTHeart:", err);
          alert("Não foi possível guardar no banco de dados. Verifique se o Docker/RESTHeart está a rodar.");
        }
      });
      card.append(guardar);

      // 5. Botão "Ver Detalhes"
      const detalhar = document.createElement("button");
      detalhar.textContent = "Ver Detalhes";
      detalhar.className = "detalhar";
      detalhar.addEventListener("click", () => {
        window.location.href = `detalhes.html?id=${show.id}`;
      });
      card.append(detalhar);

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