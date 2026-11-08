// Cria um card reutilizável para resultados da busca ou séries já salvas.
export function criarCardSerie(
  serie,
  {
    aoGuardar,
    aoFavoritar,
    aoExcluir,
    guardada = false,
    favorita = serie.favorito === true,
    mostrarDetalhes = true,
  } = {}
) {
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

  // O botão de cadastro só aparece quando a tela fornece a ação correspondente.
  if (aoGuardar) {
    const botaoGuardar = document.createElement("button");
    botaoGuardar.textContent = guardada ? "Guardada no banco" : "Guardar no banco";
    botaoGuardar.className = "btn btn-dark guardar";
    botaoGuardar.disabled = guardada;
    botaoGuardar.addEventListener("click", () => aoGuardar(botaoGuardar));
    botoes.append(botaoGuardar);
  }

  // Permite marcar como favorita uma série da busca, salvando-a no banco se necessário.
  if (aoFavoritar) {
    const botaoFavoritar = document.createElement("button");
    botaoFavoritar.textContent = favorita ? "♥ Desfavoritar" : "♡ Favoritar";
    botaoFavoritar.className = "btn btn-outline-dark favoritar";
    botaoFavoritar.addEventListener("click", () => aoFavoritar(botaoFavoritar));
    botoes.append(botaoFavoritar);
  }

  // Remove o documento completo da série quando a tela oferece essa ação.
  if (aoExcluir) {
    const botaoExcluir = document.createElement("button");
    botaoExcluir.textContent = "Remover do banco";
    botaoExcluir.className = "btn btn-outline-danger excluir";
    botaoExcluir.addEventListener("click", () => aoExcluir(botaoExcluir));
    botoes.append(botaoExcluir);
  }

  // O detalhe usa o ID da TVmaze para buscar informações completas e elenco.
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
