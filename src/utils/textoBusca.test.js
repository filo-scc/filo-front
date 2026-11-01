import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { textoContemBusca } from "./textoBusca.js";

describe("textoContemBusca", () => {
    it("encontra fragmentos sem diferenciar caixa ou acentos", () => {
        assert.equal(textoContemBusca("Camisa Básica", "BASI"), true);
        assert.equal(textoContemBusca("Camisa Basica", "básica"), true);
    });

    it("não encontra um fragmento ausente", () => {
        assert.equal(textoContemBusca("Camisa Básica", "calça"), false);
    });
});
