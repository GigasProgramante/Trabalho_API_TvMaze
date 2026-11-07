export function criarCardSerie(serie, { aoGuardar, mostrarDetalhes = true } = {}) {
  const coluna = document.createElement("div");
  coluna.className = "col";

  const card = document.createElement("article");
  card.className = "card h-100 series-card";
  coluna.append(card);

  if (serie.imagem) {
    const imagem = document.createElement("img");
    imagem.src = serie.imagem;
    imagem.alt = `Imagem da série ${serie.nome}`;
    imagem.className = "card-img-top";
    card.append(imagem);
  }

  const corpo = document.createElement("div");
  corpo.className = "card-body d-flex flex-column";
  card.append(corpo);

  const titulo = document.createElement("h2");
  titulo.className = "card-title";
  titulo.textContent = serie.nome;
  corpo.append(titulo);

  const resumo = document.createElement("p");
  resumo.className = "card-text";
  resumo.textContent = serie.resumo || "Descrição indisponível.";
  corpo.append(resumo);

  const botoes = document.createElement("div");
  botoes.className = "d-grid gap-2 mt-auto";
  corpo.append(botoes);

  if (aoGuardar) {
    const botaoGuardar = document.createElement("button");
    botaoGuardar.textContent = "Guardar no banco";
    botaoGuardar.className = "btn btn-dark guardar";
    botaoGuardar.addEventListener("click", () => aoGuardar(botaoGuardar));
    botoes.append(botaoGuardar);
  }

  if (mostrarDetalhes && serie.tvmazeId) {
    const botaoDetalhes = document.createElement("button");
    botaoDetalhes.textContent = "Ver detalhes";
    botaoDetalhes.className = "btn btn-outline-dark detalhar";
    botaoDetalhes.addEventListener("click", () => {
      window.location.href = `detalhes.html?id=${encodeURIComponent(serie.tvmazeId)}`;
    });
    botoes.append(botaoDetalhes);
  }

  return coluna;
}
