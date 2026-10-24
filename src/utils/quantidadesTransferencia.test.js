import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
    formatarQuantidadeCampo,
    getEffectiveQuantity,
    lerQuantidadeDigitada,
} from "./quantidadesTransferencia.js";

const somar = (linhas, fichaQuantidade) =>
    linhas.reduce(
        (total, linha) => total + getEffectiveQuantity(linha, linhas.length, fichaQuantidade),
        0,
    );

describe("getEffectiveQuantity", () => {
    describe("parceiro único", () => {
        it("usa o total da ficha", () => {
            assert.equal(getEffectiveQuantity({ quantidade: 40 }, 1, 90), 90);
        });

        it("usa o total da ficha mesmo com a quantidade registrada zerada ou vazia", () => {
            assert.equal(getEffectiveQuantity({ quantidade: 0 }, 1, 90), 90);
            assert.equal(getEffectiveQuantity({ quantidade: null }, 1, 90), 90);
        });
    });

    describe("vários parceiros", () => {
        it("preserva a quantidade zero registrada em cada parceiro", () => {
            assert.equal(getEffectiveQuantity({ quantidade: 0 }, 2, 90), 0);
        });

        it("não soma o total da ficha duas vezes quando os dois parceiros estão zerados", () => {
            const linhas = [{ quantidade: 0 }, { quantidade: 0 }];

            assert.equal(somar(linhas, 90), 0);
        });

        it("trata quantidade ausente como zero em vez de assumir o total da ficha", () => {
            assert.equal(getEffectiveQuantity({ quantidade: null }, 2, 90), 0);
            assert.equal(getEffectiveQuantity({ quantidade: undefined }, 2, 90), 0);
            assert.equal(getEffectiveQuantity(undefined, 2, 90), 0);
        });

        it("mantém a quantidade distribuída pelo usuário", () => {
            const linhas = [{ quantidade: 40 }, { quantidade: 50 }];

            assert.equal(getEffectiveQuantity(linhas[0], 2, 90), 40);
            assert.equal(somar(linhas, 90), 90);
        });
    });

    it("considera zero quando a ficha não tem quantidade", () => {
        assert.equal(getEffectiveQuantity({ quantidade: 5 }, 1, undefined), 0);
        assert.equal(getEffectiveQuantity({ quantidade: 5 }, 1, null), 0);
    });
});

describe("lerQuantidadeDigitada", () => {
    it("converte dígitos em número", () => {
        assert.equal(lerQuantidadeDigitada("40"), 40);
        assert.equal(lerQuantidadeDigitada("7"), 7);
    });

    it("descarta zeros à esquerda", () => {
        assert.equal(lerQuantidadeDigitada("040"), 40);
        assert.equal(lerQuantidadeDigitada("0"), 0);
    });

    it("ignora qualquer caractere que não seja dígito", () => {
        assert.equal(lerQuantidadeDigitada("4a0"), 40);
        assert.equal(lerQuantidadeDigitada("-5"), 5);
        assert.equal(lerQuantidadeDigitada("1,5"), 15);
        assert.equal(lerQuantidadeDigitada("1e3"), 13);
    });

    it("vira 0 quando não sobra dígito", () => {
        assert.equal(lerQuantidadeDigitada(""), 0);
        assert.equal(lerQuantidadeDigitada("abc"), 0);
        assert.equal(lerQuantidadeDigitada(null), 0);
        assert.equal(lerQuantidadeDigitada(undefined), 0);
    });
});

describe("formatarQuantidadeCampo", () => {
    it("mostra a quantidade quando maior que zero", () => {
        assert.equal(formatarQuantidadeCampo(40), "40");
    });

    it("deixa o campo vazio para zero ou ausência de valor", () => {
        assert.equal(formatarQuantidadeCampo(0), "");
        assert.equal(formatarQuantidadeCampo(null), "");
        assert.equal(formatarQuantidadeCampo(undefined), "");
        assert.equal(formatarQuantidadeCampo(""), "");
    });
});
