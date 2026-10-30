const id = new URLSearchParams(window.location.search).get("id");
const container = document.querySelector("#detalhes");

if (id) {
  fetch(`https://api.tvmaze.com/shows/${encodeURIComponent(id)}?embed=cast`)
    .then((response) => {
      if (!response.ok) throw new Error("Série não encontrada.");
      return response.json();
    })
    .then((show) => {
      const title = document.createElement("h1");
      title.textContent = show.name;

      const summary = document.createElement("p");
      summary.textContent = show.summary
        ? new DOMParser().parseFromString(show.summary, "text/html").body.textContent.trim()
        : "Descrição indisponível.";

      container.append(title, summary);
    })
    .catch((error) => {
      container.textContent = error.message;
    });
} else {
  container.textContent = "ID da série não informado.";
}