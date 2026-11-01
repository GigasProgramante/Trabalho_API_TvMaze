export function criarCardSerie(serie, { aoGuardar, mostrarDetalhes = true } = {}) {
  const card = document.createElement("article");
  card.className = "card";

  if (serie.imagem) {
    const imagem = document.createElement("img");
    imagem.src = serie.imagem;
    imagem.alt = `Imagem da série ${serie.nome}`;
    card.append(imagem);
  }

  const titulo = document.createElement("h2");
  titulo.textContent = serie.nome;
  card.append(titulo);

  const resumo = document.createElement("p");
  resumo.textContent = serie.resumo || "Descrição indisponível.";
  card.append(resumo);

  if (aoGuardar) {
    const botaoGuardar = document.createElement("button");
    botaoGuardar.textContent = "Guardar no banco";
    botaoGuardar.className = "guardar";
    botaoGuardar.addEventListener("click", () => aoGuardar(botaoGuardar));
    card.append(botaoGuardar);
  }

  if (mostrarDetalhes && serie.tvmazeId) {
    const botaoDetalhes = document.createElement("button");
    botaoDetalhes.textContent = "Ver detalhes";
    botaoDetalhes.className = "detalhar";
    botaoDetalhes.addEventListener("click", () => {
      window.location.href = `detalhes.html?id=${encodeURIComponent(serie.tvmazeId)}`;
    });
    card.append(botaoDetalhes);
  }

  return card;
}
