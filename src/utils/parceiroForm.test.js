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

    it("traz a categoria pré-selecionada", () => {
        const form = { ...criarFormParceiro("Acabamento"), nome: "Maria Souza" };

        assert.deepEqual(montarPayloadParceiro(form), {
            nome: "Maria Souza",
            categoria: "Acabamento",
        });
    });

    it("limpa a máscara de telefone e CEP e agrupa o endereço", () => {
        const form = {
            ...criarFormParceiro("Costura"),
            nome: "Facção Aurora",
            telefone: "(81) 99999-8888",
            responsavel: "Dona Rita",
            cep: "50000-000",
            rua: "Rua A",
            numero: "10",
        };

        assert.deepEqual(montarPayloadParceiro(form), {
            nome: "Facção Aurora",
            categoria: "Costura",
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
        { id: 1, nome: "Maria Souza", categoria: "Acabamento" },
        { id: 2, nome: "João Lima", categoria: "Costura" },
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
        { id: 1, nome: "Maria Souza", categoria: "Acabamento" },
        { id: 2, nome: "João Lima", categoria: "costura" },
        { id: 3, nome: "Sem categoria", categoria: null },
    ];

    it("filtra pela categoria da etapa sem diferenciar maiúsculas", () => {
        assert.deepEqual(
            filtrarParceirosDaEtapa(lista, "Costura").map((p) => p.id),
            [2],
        );
        assert.deepEqual(
            filtrarParceirosDaEtapa(lista, "ACABAMENTO").map((p) => p.id),
            [1],
        );
    });

    it("devolve lista vazia quando a listagem é inválida", () => {
        assert.deepEqual(filtrarParceirosDaEtapa(null, "Costura"), []);
    });
});
