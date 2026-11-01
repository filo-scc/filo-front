import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
    anexarEtapaAosParceiros,
    ehEtapaDeCostura,
    ehParceiroDeCostura,
    indexarEtapasPorId,
    nomeEtapaDoParceiro,
    parceiroEhDaEtapa,
} from "./etapaDoParceiro.js";

const etapas = [
    { id: 1, nome: "Corte", ativa: true },
    { id: 2, nome: "Costura Final", ativa: true },
    { id: 3, nome: "Acabamento", ativa: false },
];

describe("indexarEtapasPorId", () => {
    it("indexa pelo id numérico e aceita lista inválida", () => {
        const mapa = indexarEtapasPorId(etapas);

        assert.equal(mapa.get(2).nome, "Costura Final");
        assert.equal(indexarEtapasPorId(undefined).size, 0);
        assert.equal(indexarEtapasPorId([{ nome: "sem id" }]).size, 0);
    });
});

describe("nomeEtapaDoParceiro", () => {
    const mapa = indexarEtapasPorId(etapas);

    it("usa a etapa que já veio no parceiro", () => {
        assert.equal(
            nomeEtapaDoParceiro({ etapa_id: 9, etapa: { id: 9, nome: "Lavanderia" } }),
            "Lavanderia",
        );
    });

    it("busca o nome no mapa quando o parceiro traz só o etapa_id", () => {
        assert.equal(nomeEtapaDoParceiro({ etapa_id: 2 }, mapa), "Costura Final");
        assert.equal(nomeEtapaDoParceiro({ etapa_id: "3" }, mapa), "Acabamento");
    });

    it("devolve texto vazio sem etapa, com id desconhecido ou sem mapa", () => {
        assert.equal(nomeEtapaDoParceiro({ etapa_id: null }, mapa), "");
        assert.equal(nomeEtapaDoParceiro({ etapa_id: 99 }, mapa), "");
        assert.equal(nomeEtapaDoParceiro({ etapa_id: 2 }), "");
        assert.equal(nomeEtapaDoParceiro(undefined, mapa), "");
    });

    it("ignora a categoria antiga: o nome vem da etapa, não do texto livre", () => {
        assert.equal(nomeEtapaDoParceiro({ etapa_id: 1, categoria: "Costura" }, mapa), "Corte");
    });
});

describe("parceiroEhDaEtapa", () => {
    it("compara pelo id, mesmo vindo como texto", () => {
        assert.equal(parceiroEhDaEtapa({ etapa_id: 2 }, 2), true);
        assert.equal(parceiroEhDaEtapa({ etapa_id: "2" }, 2), true);
        assert.equal(parceiroEhDaEtapa({ etapa_id: 1 }, 2), false);
    });

    it("parceiro sem etapa não pertence a nenhuma, e renomear a etapa não muda o resultado", () => {
        assert.equal(parceiroEhDaEtapa({ etapa_id: null }, 2), false);
        assert.equal(parceiroEhDaEtapa({ categoria: "Costura Final" }, 2), false);
        assert.equal(parceiroEhDaEtapa({ etapa_id: 2 }, null), false);
    });
});

describe("ehEtapaDeCostura", () => {
    it("reconhece costura, facção e confecção sem acento nem caixa", () => {
        for (const nome of [
            "Costura",
            "COSTURA",
            "Costura Final",
            "Facção",
            "faccao",
            "Confecção",
            "confeccao",
        ]) {
            assert.equal(ehEtapaDeCostura(nome), true, nome);
        }
    });

    it("não reconhece as demais etapas nem nome vazio", () => {
        for (const nome of ["Corte", "Acabamento", "Lavanderia", "", null, undefined]) {
            assert.equal(ehEtapaDeCostura(nome), false, String(nome));
        }
    });
});

describe("ehParceiroDeCostura", () => {
    const mapa = indexarEtapasPorId(etapas);

    it("resolve o nome pela etapa vinculada, inclusive depois de renomear a etapa", () => {
        assert.equal(ehParceiroDeCostura({ etapa_id: 2 }, mapa), true);
        assert.equal(ehParceiroDeCostura({ etapa_id: 1 }, mapa), false);
        assert.equal(ehParceiroDeCostura({ etapa_id: null }, mapa), false);
    });
});

describe("anexarEtapaAosParceiros", () => {
    const mapa = indexarEtapasPorId(etapas);
    const ficha = {
        id: 10,
        ficha_parceiro: [
            { id: 1, parceiro: { id: 5, nome: "Maria", etapa_id: 2 } },
            { id: 2, parceiro: { id: 6, nome: "João", etapa_id: 1 } },
            { id: 3, parceiro: { id: 7, nome: "Sem etapa", etapa_id: null } },
        ],
    };

    it("anexa a etapa de cada parceiro e preserva o resto da ficha", () => {
        const resultado = anexarEtapaAosParceiros(ficha, mapa);

        assert.equal(resultado.id, 10);
        assert.equal(resultado.ficha_parceiro[0].parceiro.etapa.nome, "Costura Final");
        assert.equal(resultado.ficha_parceiro[1].parceiro.etapa.nome, "Corte");
        assert.equal(resultado.ficha_parceiro[2].parceiro.etapa, null);
    });

    it("não altera o objeto original e não sobrescreve uma etapa que já veio", () => {
        const jaTemEtapa = {
            ficha_parceiro: [
                { parceiro: { id: 5, etapa_id: 2, etapa: { id: 2, nome: "Veio do back" } } },
            ],
        };

        anexarEtapaAosParceiros(ficha, mapa);

        assert.equal("etapa" in ficha.ficha_parceiro[0].parceiro, false);
        assert.equal(
            anexarEtapaAosParceiros(jaTemEtapa, mapa).ficha_parceiro[0].parceiro.etapa.nome,
            "Veio do back",
        );
    });

    it("devolve a ficha como veio quando não há parceiros ou ela é inválida", () => {
        assert.deepEqual(anexarEtapaAosParceiros({ id: 1 }, mapa), { id: 1 });
        assert.equal(anexarEtapaAosParceiros(undefined, mapa), undefined);
    });

    it("com o parceiro anexado, o filtro de costura funciona sem o mapa", () => {
        const resultado = anexarEtapaAosParceiros(ficha, mapa);

        assert.deepEqual(
            resultado.ficha_parceiro
                .filter((vinculo) => ehParceiroDeCostura(vinculo.parceiro))
                .map((vinculo) => vinculo.parceiro.nome),
            ["Maria"],
        );
    });
});
