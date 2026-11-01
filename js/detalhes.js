// Obtém o parâmetro 'id' da URL (ex: detalhes.html?id=123)
const urlParams = new URLSearchParams(window.location.search);
const id = urlParams.get("id");
const container = document.querySelector("#detalhes");

if (id) {
  fetch(`https://api.tvmaze.com/shows/${encodeURIComponent(id)}?embed=cast`)
    .then((response) => {
      if (!response.ok) throw new Error("Série não encontrada na base de dados do TVMaze.");
      return response.json();
    })
    .then((show) => {
      // Limpa o container de status
      container.innerHTML = "";

      // 1. Imagem de Capa
      if (show.image?.original || show.image?.medium) {
        const img = document.createElement("img");
        img.src = show.image.original || show.image.medium;
        img.alt = `Capa da série ${show.name}`;
        img.style.width = "100%";
        img.style.maxHeight = "400px";
        img.style.objectFit = "contain";
        img.style.backgroundColor = "#261f14";
        img.style.padding = "8px";
        img.style.border = "3px solid var(--color-card-shadow)";
        container.append(img);
      }

      // 2. Título
      const title = document.createElement("h2");
      title.textContent = show.name;
      title.style.fontSize = "24px";
      title.style.margin = "8px 0";
      container.append(title);

      // 3. Informações Rápidas (Géneros, Nota, Idioma)
      const infoDiv = document.createElement("div");
      infoDiv.style.display = "flex";
      infoDiv.style.gap = "12px";
      infoDiv.style.flexWrap = "wrap";
      infoDiv.style.fontWeight = "bold";
      infoDiv.style.fontSize = "14px";
      
      const genres = show.genres ? show.genres.join(", ") : "Não informado";
      const rating = show.rating?.average ? `⭐ ${show.rating.average}` : "⭐ N/A";
      const language = show.language ? `🌐 ${show.language}` : "";

      infoDiv.innerHTML = `
        <span style="background: var(--color-input-background); padding: 4px 8px; border: 2px solid var(--color-card-shadow);">Géneros: ${genres}</span>
        <span style="background: var(--color-input-background); padding: 4px 8px; border: 2px solid var(--color-card-shadow);">Nota: ${rating}</span>
        ${language ? `<span style="background: var(--color-input-background); padding: 4px 8px; border: 2px solid var(--color-card-shadow);">${language}</span>` : ""}
      `;
      container.append(infoDiv);

      // 4. Resumo limpo de tags HTML
      const summary = document.createElement("p");
      summary.innerHTML = show.summary
        ? new DOMParser().parseFromString(show.summary, "text/html").body.textContent.trim()
        : "Descrição indisponível.";
      summary.style.lineHeight = "1.6";
      container.append(summary);

      // 5. Elenco Principal (Cast retornado pelo ?embed=cast)
      if (show._embedded?.cast && show._embedded.cast.length > 0) {
        const castTitle = document.createElement("h3");
        castTitle.textContent = "Elenco Principal:";
        castTitle.style.marginTop = "16px";
        container.append(castTitle);

        const castList = document.createElement("ul");
        castList.style.paddingLeft = "20px";
        
        // Exibe até os primeiros 5 atores principais
        show._embedded.cast.slice(0, 5).forEach(({ person, character }) => {
          const listItem = document.createElement("li");
          listItem.textContent = `${person.name} como ${character.name}`;
          castList.append(listItem);
        });
        container.append(castList);
      }
    })
    .catch((error) => {
      container.innerHTML = `<p style="color: #b22222; font-weight: bold;">${error.message}</p>`;
    });
} else {
  container.innerHTML = `<p style="color: #b22222; font-weight: bold;">ID da série não informado na URL.</p>`;
}