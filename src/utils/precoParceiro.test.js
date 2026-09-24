import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { obterPrecoUnitarioParceiro } from "./precoParceiro.js";

describe("obterPrecoUnitarioParceiro", () => {
    it("usa o preço unitário da relação parceiro-produto", () => {
        const vinculo = {
            valor: 900,
            quantidade: 300,
            parceiro: {
                parceiro_produto: [{ produto_id: 7, preco: 3 }],
            },
        };

        assert.equal(obterPrecoUnitarioParceiro(vinculo, 7), 3);
    });

    it("seleciona a relação correspondente ao produto da ficha", () => {
        const vinculo = {
            parceiro: {
                parceiro_produto: [
                    { produto_id: 8, preco: 12 },
                    { produto_id: 7, preco: 3 },
                ],
            },
        };

        assert.equal(obterPrecoUnitarioParceiro(vinculo, 7), 3);
    });

    it("não usa o valor total da ficha como preço unitário", () => {
        const vinculo = {
            valor: 900,
            quantidade: 300,
            parceiro: { parceiro_produto: [] },
        };

        assert.equal(obterPrecoUnitarioParceiro(vinculo, 7), null);
    });
});
