import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { calcularCustosMediosDasEtapas } from "./custosEtapasProduto.js";

const etapas = [
    { id: 1, nome: "Corte", ordem: 1, ativa: true },
    { id: 2, nome: "Costura", ordem: 2, ativa: true },
    { id: 3, nome: "Acabamento", ordem: 3, ativa: true },
];

const vinculos = [
    { preco: "10.00", parceiro: { id: 1, etapa_id: 1, categoria: "Corte" } },
    { preco: "20.00", parceiro: { id: 2, etapa_id: 1, categoria: "Corte" } },
    { preco: "7.50", parceiro: { id: 3, etapa_id: 2, categoria: "Costura" } },
];

describe("calcularCustosMediosDasEtapas", () => {
    it("tira a média dos parceiros de cada etapa pelo etapa_id e ignora a última etapa", () => {
        const custos = calcularCustosMediosDasEtapas(etapas, vinculos);

        assert.deepEqual(
            custos.map((etapa) => [etapa.nome, etapa.custo]),
            [
                ["Corte", 15],
                ["Costura", 7.5],
            ],
        );
    });

    it("renomear a etapa não altera o custo", () => {
        const renomeadas = etapas.map((etapa) =>
            etapa.id === 1 ? { ...etapa, nome: "Corte e Risco" } : etapa,
        );

        const antes = calcularCustosMediosDasEtapas(etapas, vinculos);
        const depois = calcularCustosMediosDasEtapas(renomeadas, vinculos);

        assert.deepEqual(
            depois.map((etapa) => etapa.custo),
            antes.map((etapa) => etapa.custo),
        );
    });

    it("parceiro sem etapa_id não entra no custo, mesmo com a categoria igual ao nome", () => {
        const semEtapa = [{ preco: "99", parceiro: { id: 9, etapa_id: null, categoria: "Corte" } }];

        assert.equal(calcularCustosMediosDasEtapas(etapas, semEtapa)[0].custo, 0);
    });

    it("preço vazio, zero ou inválido não conta", () => {
        const invalidos = [
            { preco: "", parceiro: { etapa_id: 1 } },
            { preco: 0, parceiro: { etapa_id: 1 } },
            { preco: "abc", parceiro: { etapa_id: 1 } },
        ];

        assert.equal(calcularCustosMediosDasEtapas(etapas, invalidos)[0].custo, 0);
    });
});
