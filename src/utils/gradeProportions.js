const quantidadePositiva = (valor) => {
    const numero = Number(valor);
    return Number.isFinite(numero) && numero > 0 ? numero : 0;
};

const idsIguais = (primeiroId, segundoId) =>
    primeiroId !== null &&
    primeiroId !== undefined &&
    segundoId !== null &&
    segundoId !== undefined &&
    String(primeiroId) === String(segundoId);

export const obterReferenciaProporcao = ({ sizeIds, totalsBySize }) => {
    return sizeIds.reduce((menorId, sizeId) => {
        const totalAtual = quantidadePositiva(totalsBySize[sizeId]);
        if (totalAtual === 0) return menorId;
        if (menorId === null) return sizeId;

        const menorTotal = quantidadePositiva(totalsBySize[menorId]);
        return totalAtual < menorTotal ? sizeId : menorId;
    }, null);
};

export const calcularProporcoesGrade = ({ sizeIds, colorIds, referenceSizeId, getQuantity }) => {
    const proporcoes = {};
    sizeIds.forEach((sizeId) => {
        proporcoes[sizeId] = 0;
    });

    if (referenceSizeId === null || referenceSizeId === undefined) return proporcoes;

    const totalReferencia = colorIds.reduce(
        (total, colorId) => total + quantidadePositiva(getQuantity(colorId, referenceSizeId)),
        0,
    );
    if (totalReferencia === 0) return proporcoes;

    sizeIds.forEach((sizeId) => {
        if (idsIguais(sizeId, referenceSizeId)) {
            proporcoes[sizeId] = 1;
            return;
        }

        let totalComparado = 0;
        let totalReferenciaComparada = 0;

        colorIds.forEach((colorId) => {
            const quantidade = quantidadePositiva(getQuantity(colorId, sizeId));
            const quantidadeReferencia = quantidadePositiva(getQuantity(colorId, referenceSizeId));

            // Uma coluna preenchida parcialmente e manualmente deve ser comparada
            // somente com as mesmas linhas já preenchidas na coluna de referência.
            if (quantidade > 0 && quantidadeReferencia > 0) {
                totalComparado += quantidade;
                totalReferenciaComparada += quantidadeReferencia;
            }
        });

        if (totalComparado > 0 && totalReferenciaComparada > 0) {
            proporcoes[sizeId] = Math.max(1, Math.round(totalComparado / totalReferenciaComparada));
        }
    });

    return proporcoes;
};

export const isReferenciaProporcao = idsIguais;
