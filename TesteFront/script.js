// Endereço principal da API. As outras partes da URL serão acrescentadas na busca.
const tvMazeUrl = "https://api.tvmaze.com";

// Busca no HTML os elementos que serão usados pelo JavaScript.
const form = document.querySelector("#search-form");
const input = document.querySelector("#search-input");
const status = document.querySelector("#status");
const seriesContainer = document.querySelector("#series");

// "submit" acontece quando a pessoa clica em Buscar ou pressiona Enter no campo.
form.addEventListener("submit", async (event) => {
  // Evita que o navegador recarregue a página ao enviar o formulário.
  event.preventDefault();

  // trim() remove espaços no começo e no fim do texto digitado.
  const searchTerm = input.value.trim();

  // required impede campo vazio, mas não impede que sejam digitados só espaços.
  if (!searchTerm) {
    status.textContent = "Digite o nome de uma série para buscar.";
    input.focus();
    return;
  }

  // Mostra uma mensagem e limpa resultados anteriores enquanto busca.
  status.textContent = "Buscando...";
  seriesContainer.replaceChildren();

  try {
    // encodeURIComponent transforma o texto em um formato seguro para uma URL.
    // await espera a resposta da API antes de continuar.
    const response = await fetch(
      `${tvMazeUrl}/search/shows?q=${encodeURIComponent(searchTerm)}`
    );

    // fetch não considera respostas HTTP de erro (como 404) uma rejeição.
    // Por isso, verificamos explicitamente se a resposta foi bem-sucedida.
    if (!response.ok) {
      throw new Error(`A API respondeu com o status ${response.status}.`);
    }

    // json() interpreta os dados recebidos como JSON; await espera essa leitura.
    const results = await response.json();

    // A busca retorna uma lista; cada item contém os dados dentro de "show".
    results.forEach(({ show }) => {
      // Cria os elementos HTML do card sem inserir conteúdo como HTML.
      const card = document.createElement("article");
      card.className = "card";

      //const guardar = document.createElement("button");
      //guardar.textContent = "Guardar no banco";
      //card.className = "guardar"
      //card.append(guardar)

      const title = document.createElement("h2");
      title.textContent = show.name;
      card.append(title);

      const desc = document.createElement("p");

      desc.textContent = show.summary
        ? new DOMParser()
          .parseFromString(show.summary, "text/html")
          .body.textContent
          .trim()
        : "Descrição indisponível.";

      card.append(desc);

      // ?. acessa medium somente se show.image existir.
      if (show.image?.medium) {
        const image = document.createElement("img");
        image.src = show.image.medium;
        image.alt = `Imagem da série ${show.name}`;
        card.append(image);
      }

      desc.textContent = show.summary
        ? new DOMParser()
          .parseFromString(show.summary, "text/html")
          .body.textContent
          .trim()
        : "Descrição indisponível.";

      card.append(desc);

      const detalhar = document.createElement("button");
      detalhar.textContent = "Ver Detalhes";
      detalhar.className = "detalhar";
      card.append(detalhar);

      // Coloca o card pronto dentro do elemento de resultados.
      seriesContainer.append(card);
    });

    // Informa quando a lista veio vazia; caso contrário, limpa a mensagem.
    status.textContent = results.length === 0
      ? "Nenhuma série encontrada."
      : "";
  } catch (error) {
    // Mostra uma mensagem na página e os detalhes técnicos no console.
    status.textContent = "Não foi possível buscar as séries. Tente novamente.";
    console.error("Erro ao buscar séries:", error);
  }
});
