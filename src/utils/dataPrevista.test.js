import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { dataPrevistaParaBackend } from "./dataPrevista.js";

describe("dataPrevistaParaBackend", () => {
    it("retorna null quando o input está vazio para o JSON poder limpar a data", () => {
        assert.equal(dataPrevistaParaBackend(""), null);
        assert.equal(dataPrevistaParaBackend(null), null);
        assert.equal(dataPrevistaParaBackend(undefined), null);
    });

    it("retorna null quando a data está incompleta", () => {
        assert.equal(dataPrevistaParaBackend("15/03"), null);
        assert.equal(dataPrevistaParaBackend("15/03/20"), null);
    });

    it("retorna ISO quando a data está completa (dd/mm/aaaa)", () => {
        assert.equal(dataPrevistaParaBackend("15/03/2026"), "2026-03-15T12:00:00.000Z");
    });

    it("retorna null para dia inexistente em fevereiro não bissexto", () => {
        assert.equal(dataPrevistaParaBackend("29/02/2026"), null);
        assert.equal(dataPrevistaParaBackend("30/02/2026"), null);
    });

    it("retorna null para dias excedentes no mês", () => {
        assert.equal(dataPrevistaParaBackend("31/02/2026"), null);
        assert.equal(dataPrevistaParaBackend("31/04/2026"), null);
    });

    it("aceita 29/02 em ano bissexto", () => {
        assert.equal(dataPrevistaParaBackend("29/02/2024"), "2024-02-29T12:00:00.000Z");
    });
});
