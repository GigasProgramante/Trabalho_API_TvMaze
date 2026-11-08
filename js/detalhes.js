import { alternarFavorito, buscarSerieSalva } from "./restheart.js";

// Lê o ID da série enviado pela tela de listagem na query string.
const urlParams = new URLSearchParams(window.location.search);
const id = urlParams.get("id");
const container = document.querySelector("#detalhes");

// Substitui o conteúdo da página por uma mensagem de erro acessível.
function mostrarErro(mensagem) {
  const erro = document.createElement("p");
  erro.className = "alert alert-danger mb-0";
  erro.setAttribute("role", "alert");
  erro.textContent = mensagem;
  container.replaceChildren(erro);
}

// Consulta a TVmaze com o elenco e monta os detalhes da série selecionada.
if (id) {
  fetch(`https://api.tvmaze.com/shows/${encodeURIComponent(id)}?embed=cast`)
    .then((response) => {
      if (!response.ok) throw new Error("Série não encontrada na base de dados do TVMaze.");
      return response.json();
    })
    .then(async (show) => {
      container.replaceChildren();

      if (show.image?.original || show.image?.medium) {
        const img = document.createElement("img");
        img.src = show.image.original || show.image.medium;
        img.alt = `Capa da série ${show.name}`;
        img.className = "details-image img-fluid w-100 mb-4";
        container.append(img);
      }

      const title = document.createElement("h2");
      title.textContent = show.name;
      title.className = "mb-3";
      container.append(title);

      const infoDiv = document.createElement("div");
      infoDiv.className = "details-metadata d-flex flex-wrap gap-2 mb-3";

      // Reúne os metadados disponíveis em etiquetas junto ao título.
      const genres = show.genres?.join(", ") || "Não informado";
      const rating = show.rating?.average ? `⭐ ${show.rating.average}` : "⭐ N/A";
      const metadata = [
        `Géneros: ${genres}`,
        `Nota: ${rating}`,
        ...(show.language ? [`🌐 ${show.language}`] : []),
      ];

      metadata.forEach((text) => {
        const item = document.createElement("span");
        item.className = "badge border rounded-0 details-meta-item";
        item.textContent = text;
        infoDiv.append(item);
      });
      container.append(infoDiv);

      const summary = document.createElement("p");
      summary.textContent = show.summary
        ? new DOMParser().parseFromString(show.summary, "text/html").body.textContent.trim()
        : "Descrição indisponível.";
      summary.className = "details-summary mb-4";
      container.append(summary);

      // Carrega o estado salvo e permite alternar o favorito nesta página.
      const botaoFavoritar = document.createElement("button");
      botaoFavoritar.type = "button";
      botaoFavoritar.className = "btn btn-dark align-self-start mb-4";
      botaoFavoritar.textContent = "Verificando favorito...";
      botaoFavoritar.disabled = true;
      try {
        show.favorito = (await buscarSerieSalva(show.id))?.favorito === true;
        botaoFavoritar.textContent = show.favorito ? "♥ Desfavoritar" : "♡ Favoritar";
        botaoFavoritar.disabled = false;
      } catch (error) {
        console.error("Erro ao consultar favorito:", error);
        botaoFavoritar.textContent = "Estado do favorito indisponível";
        botaoFavoritar.disabled = true;
      }
      botaoFavoritar.addEventListener("click", async () => {
        botaoFavoritar.disabled = true;
        botaoFavoritar.textContent = "Atualizando...";

        try {
          show.favorito = await alternarFavorito(show);
          botaoFavoritar.textContent = show.favorito ? "♥ Desfavoritar" : "♡ Favoritar";
          botaoFavoritar.setAttribute("aria-pressed", String(show.favorito));
          botaoFavoritar.disabled = false;
        } catch (error) {
          console.error("Erro ao favoritar série:", error);
          botaoFavoritar.disabled = false;
          botaoFavoritar.textContent = show.favorito ? "♥ Desfavoritar" : "♡ Favoritar";
          const aviso = document.createElement("p");
          aviso.className = "alert alert-danger mb-4";
          aviso.setAttribute("role", "alert");
          aviso.textContent = error.message;
          botaoFavoritar.after(aviso);
        }
      });
      container.append(botaoFavoritar);

      // Mostra no máximo cinco integrantes do elenco incorporado à resposta.
      if (show._embedded?.cast && show._embedded.cast.length > 0) {
        const castTitle = document.createElement("h3");
        castTitle.textContent = "Elenco Principal:";
        castTitle.className = "h5";
        container.append(castTitle);

        const castList = document.createElement("ul");
        castList.className = "list-group list-group-flush details-cast";

        show._embedded.cast.slice(0, 5).forEach(({ person, character }) => {
          const listItem = document.createElement("li");
          listItem.className = "list-group-item px-0";
          listItem.textContent = `${person.name} como ${character.name}`;
          castList.append(listItem);
        });
        container.append(castList);
      }
    })
    .catch((error) => {
      mostrarErro(error.message);
    });
} else {
  mostrarErro("ID da série não informado na URL.");
}