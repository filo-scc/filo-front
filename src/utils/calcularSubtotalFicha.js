import { parsePreco } from "./preco.js";

export function calcularSubtotalFicha(ficha, isSobDemanda = true) {
    const quantidade = Number(ficha.quantidade ?? ficha.quantidade_pecas) || 0;
    const quantidadeFaturavel = isSobDemanda
        ? Math.max(0, quantidade - (Number(ficha.defeitos_tecido) || 0))
        : quantidade;
    const valor = isSobDemanda
        ? (ficha.preco_padrao ?? ficha.preco_unitario ?? ficha.preco ?? 0)
        : (ficha.custo_total ?? ficha.custo_unitario ?? ficha.custo ?? 0);
    const preco = parsePreco(valor);
    if (!isSobDemanda) return quantidade * preco;
    // O backend normaliza o preço unitário em centavos antes de multiplicar.
    const centavos = Math.round((preco + Math.abs(preco) * Number.EPSILON) * 100);
    return (quantidadeFaturavel * centavos) / 100;
}
