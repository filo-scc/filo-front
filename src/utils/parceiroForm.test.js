import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
    aplicarMascara,
    criarFormParceiro,
    encontrarParceiroPorNome,
    filtrarParceirosDaEtapa,
    maskAgencia,
    maskCep,
    maskConta,
    maskTelefone,
    montarPayloadParceiro,
    obterMensagemErroCadastroParceiro,
} from "./parceiroForm.js";

const erroHttp = (status, message) => ({ response: { status, data: { message } } });

describe("máscaras", () => {
    it("formata telefone com 11 dígitos", () => {
        assert.equal(maskTelefone("81999998888"), "(81) 99999-8888");
        assert.equal(maskTelefone("(81) 99999-88889999"), "(81) 99999-8888");
    });

    it("formata CEP", () => {
        assert.equal(maskCep("50000000"), "50000-000");
        assert.equal(maskCep("5000"), "5000");
    });

    it("formata agência e conta", () => {
        assert.equal(maskAgencia("12345"), "1234-5");
        assert.equal(maskAgencia("123"), "123");
        assert.equal(maskConta("1234567"), "123456-7");
        assert.equal(maskConta("1"), "1");
    });

    it("só aplica máscara de agência e conta no pagamento por conta bancária", () => {
        assert.equal(aplicarMascara("agencia", "12345", "TED"), "1234-5");
        assert.equal(aplicarMascara("agencia", "12345", "PIX"), "12345");
        assert.equal(aplicarMascara("conta", "1234567", ""), "1234567");
        assert.equal(aplicarMascara("nome", "Maria", "TED"), "Maria");
    });
});

describe("montarPayloadParceiro", () => {
    it("envia só o nome quando o resto está vazio", () => {
        const form = { ...criarFormParceiro(), nome: "Maria Souza" };

        assert.deepEqual(montarPayloadParceiro(form), { nome: "Maria Souza" });
    });

    it("envia a etapa pré-selecionada pelo id, como número", () => {
        const form = { ...criarFormParceiro(7), nome: "Maria Souza" };

        assert.deepEqual(montarPayloadParceiro(form), {
            nome: "Maria Souza",
            etapa_id: 7,
        });
        assert.deepEqual(montarPayloadParceiro({ ...form, etapa_id: "7" }), {
            nome: "Maria Souza",
            etapa_id: 7,
        });
    });

    it("nunca envia a categoria antiga", () => {
        const form = { ...criarFormParceiro(7), nome: "Maria Souza", categoria: "Acabamento" };

        assert.equal("categoria" in montarPayloadParceiro(form), false);
    });

    it("limpa a máscara de telefone e CEP e agrupa o endereço", () => {
        const form = {
            ...criarFormParceiro(4),
            nome: "Facção Aurora",
            telefone: "(81) 99999-8888",
            responsavel: "Dona Rita",
            cep: "50000-000",
            rua: "Rua A",
            numero: "10",
        };

        assert.deepEqual(montarPayloadParceiro(form), {
            nome: "Facção Aurora",
            etapa_id: 4,
            telefone: "81999998888",
            responsavel: "Dona Rita",
            endereco: { rua: "Rua A", numero: "10", cep: "50000000" },
        });
    });

    it("envia a chave Pix só quando o pagamento é Pix", () => {
        const pix = {
            ...criarFormParceiro(),
            nome: "A",
            forma_pagamento: "PIX",
            chave_pix: "a@b.com",
            banco: "X",
        };

        assert.deepEqual(montarPayloadParceiro(pix), {
            nome: "A",
            forma_pagamento: "PIX",
            chave_pix: "a@b.com",
        });
    });

    it("envia os dados bancários só quando o pagamento é por conta bancária", () => {
        const ted = {
            ...criarFormParceiro(),
            nome: "A",
            forma_pagamento: "TED",
            chave_pix: "a@b.com",
            banco: "Banco X",
            agencia: "1234-5",
            conta: "123456-7",
        };

        assert.deepEqual(montarPayloadParceiro(ted), {
            nome: "A",
            forma_pagamento: "TED",
            banco: "Banco X",
            agencia: "1234-5",
            conta: "123456-7",
        });
    });
});

describe("obterMensagemErroCadastroParceiro", () => {
    it("mostra a regra de negócio em português como veio", () => {
        assert.equal(
            obterMensagemErroCadastroParceiro(
                erroHttp(409, "Já existe um parceiro com esse nome nesse fabrico"),
            ),
            "Já existe um parceiro com esse nome nesse fabrico",
        );
    });

    it("não mostra validação em inglês nem erro do servidor", () => {
        const generica = "Erro ao cadastrar parceiro. Verifique os dados.";

        assert.equal(
            obterMensagemErroCadastroParceiro(erroHttp(400, ["nome must be a string"])),
            generica,
        );
        assert.equal(
            obterMensagemErroCadastroParceiro(erroHttp(500, "Internal server error")),
            generica,
        );
        assert.equal(
            obterMensagemErroCadastroParceiro(erroHttp(403, "Forbidden resource")),
            generica,
        );
        assert.equal(obterMensagemErroCadastroParceiro(undefined), generica);
    });
});

describe("encontrarParceiroPorNome", () => {
    const lista = [
        { id: 1, nome: "Maria Souza", etapa_id: 1 },
        { id: 2, nome: "João Lima", etapa_id: 2 },
    ];

    it("acha o parceiro recém-criado pelo nome, ignorando espaços nas pontas", () => {
        assert.equal(encontrarParceiroPorNome(lista, "  João Lima ").id, 2);
    });

    it("devolve null quando não existe ou a listagem é inválida", () => {
        assert.equal(encontrarParceiroPorNome(lista, "Pedro"), null);
        assert.equal(encontrarParceiroPorNome(undefined, "Maria Souza"), null);
    });
});

describe("filtrarParceirosDaEtapa", () => {
    const lista = [
        { id: 1, nome: "Maria Souza", etapa_id: 1, categoria: "Acabamento" },
        { id: 2, nome: "João Lima", etapa_id: 2, categoria: "Costura" },
        { id: 3, nome: "Sem etapa", etapa_id: null, categoria: "Costura" },
    ];

    it("filtra pelo id da etapa", () => {
        assert.deepEqual(
            filtrarParceirosDaEtapa(lista, 2).map((p) => p.id),
            [2],
        );
        assert.deepEqual(
            filtrarParceirosDaEtapa(lista, "1").map((p) => p.id),
            [1],
        );
    });

    it("ignora o texto da categoria e parceiro sem etapa", () => {
        assert.deepEqual(filtrarParceirosDaEtapa(lista, 3), []);
        assert.deepEqual(filtrarParceirosDaEtapa(lista, null), []);
    });

    it("devolve lista vazia quando a listagem é inválida", () => {
        assert.deepEqual(filtrarParceirosDaEtapa(null, 2), []);
    });
});
