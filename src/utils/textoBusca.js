export const normalizarTextoBusca = (valor) =>
    String(valor ?? "")
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .toLocaleLowerCase("pt-BR")
        .trim();

export const textoContemBusca = (texto, busca) =>
    normalizarTextoBusca(texto).includes(normalizarTextoBusca(busca));
