import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
    telefoneClienteValido,
    telefoneParaCadastro,
    telefoneParaEdicao,
    telefoneParaPayloadAtualizacao,
} from "./clienteTelefone.js";

describe("telefone do cliente", () => {
    it("omite o telefone vazio na criação", () => {
        assert.equal(telefoneParaCadastro(""), undefined);
        assert.equal(telefoneParaCadastro(null), undefined);
    });

    it("envia null ao remover um telefone existente", () => {
        const telefone = telefoneParaEdicao("", "81999999999");

        assert.equal(telefone, null);
        assert.equal(telefoneParaPayloadAtualizacao(telefone), null);
    });

    it("omite o telefone inalterado ao editar outro campo", () => {
        const telefone = telefoneParaEdicao("(81) 99999-9999", "81999999999");

        assert.equal(telefone, undefined);
        assert.equal(telefoneParaPayloadAtualizacao(telefone), undefined);
    });

    it("normaliza e aceita telefones com 9, 10 e 11 dígitos", () => {
        assert.equal(telefoneParaCadastro("99999-9999"), "999999999");
        assert.equal(telefoneParaCadastro("(81) 3333-4444"), "8133334444");
        assert.equal(telefoneParaCadastro("(81) 99999-9999"), "81999999999");

        assert.equal(telefoneClienteValido("99999-9999"), true);
        assert.equal(telefoneClienteValido("(81) 3333-4444"), true);
        assert.equal(telefoneClienteValido("(81) 99999-9999"), true);
    });

    it("rejeita telefone preenchido abaixo do mínimo", () => {
        assert.equal(telefoneClienteValido("1234-5678"), false);
    });
});
