export async function garantir(url, nome, headers) {
  const response = await fetch(url, { method: "PUT", headers });
  if (response.status !== 201 && response.status !== 200) {
    const detalhe = await response.text();
    throw new Error(
      `PUT ${nome} falhou (HTTP ${response.status})${detalhe ? `: ${detalhe}` : "."}`
    );
  }
  return response.status;
}
