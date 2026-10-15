import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getEffectiveQuantity } from "./quantidadesTransferencia.js";

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
