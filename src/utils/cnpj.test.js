import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { cnpjValido, normalizarCnpj } from "./cnpj.js";

describe("validação de CNPJ", () => {
    it("aceita CNPJs válidos com ou sem formatação", () => {
        assert.equal(cnpjValido("04.252.011/0001-10"), true);
        assert.equal(cnpjValido("11222333000181"), true);
    });

    it("rejeita dígitos verificadores incorretos", () => {
        assert.equal(cnpjValido("04.252.011/0001-11"), false);
    });

    it("rejeita sequências repetidas e quantidade incompleta", () => {
        assert.equal(cnpjValido("00.000.000/0000-00"), false);
        assert.equal(cnpjValido("04.252.011/0001"), false);
    });

    it("normaliza o valor para apenas dígitos", () => {
        assert.equal(normalizarCnpj("04.252.011/0001-10"), "04252011000110");
    });
});
