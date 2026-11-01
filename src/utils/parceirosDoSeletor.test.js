import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
    deveBuscarParceiros,
    filtrarParceirosDisponiveis,
    normalizeParceiro,
} from "./parceirosDoSeletor.js";

describe("deveBuscarParceiros", () => {
    it("respeita a lista recebida da tela, inclusive vazia: não busca", () => {
        assert.equal(deveBuscarParceiros([]), false);
        assert.equal(deveBuscarParceiros([{ id: 1, nome: "Maria" }]), false);
    });

    it("busca por conta própria só quando a tela não passa lista", () => {
        assert.equal(deveBuscarParceiros(undefined), true);
        assert.equal(deveBuscarParceiros(null), true);
        assert.equal(deveBuscarParceiros({ data: [] }), true);
    });
});

describe("filtrarParceirosDisponiveis", () => {
    it("lista vazia continua vazia, sem oferecer nenhuma facção", () => {
        assert.deepEqual(filtrarParceirosDisponiveis([]), []);
        assert.deepEqual(filtrarParceirosDisponiveis([], new Set(["1"])), []);
    });

    it("tira as facções já selecionadas, comparando o id como texto", () => {
        const lista = [
            { id: 1, nome: "Maria" },
            { id: 2, nome: "João" },
        ];

        assert.deepEqual(
            filtrarParceirosDisponiveis(lista, new Set(["1"])).map((p) => p.nome),
            ["João"],
        );
    });

    it("descarta itens nulos da lista", () => {
        assert.deepEqual(
            filtrarParceirosDisponiveis([null, undefined, { id: 3, nome: "Ana" }]).map((p) => p.id),
            [3],
        );
    });
});

describe("normalizeParceiro", () => {
    it("normaliza o parceiro direto, com preço numérico", () => {
        assert.deepEqual(normalizeParceiro({ id: 4, nome: "Paulo", preco: "12.5", etapa_id: 2 }), {
            id: 4,
            nome: "Paulo",
            preco: 12.5,
            etapa_id: 2,
            possuiPedido: false,
        });
    });

    it("normaliza o vínculo produto-parceiro usando o preço do vínculo", () => {
        assert.deepEqual(
            normalizeParceiro({
                preco: 8,
                possuiPedido: true,
                parceiro: { id: 5, nome: "Rita", etapa_id: null },
            }),
            { id: 5, nome: "Rita", preco: 8, etapa_id: null, possuiPedido: true },
        );
    });

    it("preço vazio ou inválido vira null, e zero é preservado", () => {
        assert.equal(normalizeParceiro({ id: 1, preco: "" }).preco, null);
        assert.equal(normalizeParceiro({ id: 1, preco: "abc" }).preco, null);
        assert.equal(normalizeParceiro({ id: 1, preco: 0 }).preco, 0);
    });
});
