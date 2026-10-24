import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { calcularPercentualSoma, obterIniciais } from "./layoutTransferencia.js";

describe("obterIniciais", () => {
    it("usa a primeira e a última palavra do nome", () => {
        assert.equal(obterIniciais("Maria Souza"), "MS");
        assert.equal(obterIniciais("Ana Paula Ribeiro"), "AR");
    });

    it("usa só a inicial quando há uma palavra", () => {
        assert.equal(obterIniciais("Eduardo"), "E");
    });

    it("ignora espaços extras e funciona com acentos", () => {
        assert.equal(obterIniciais("  João   Lima "), "JL");
        assert.equal(obterIniciais("érico chen"), "ÉC");
    });

    it("devolve vazio para nome ausente", () => {
        assert.equal(obterIniciais(""), "");
        assert.equal(obterIniciais(null), "");
        assert.equal(obterIniciais(undefined), "");
    });
});

describe("calcularPercentualSoma", () => {
    it("calcula o percentual da soma sobre o total", () => {
        assert.equal(calcularPercentualSoma(45, 90), 50);
        assert.equal(calcularPercentualSoma(90, 90), 100);
    });

    it("limita a 100 quando a soma passa do total", () => {
        assert.equal(calcularPercentualSoma(120, 90), 100);
    });

    it("devolve 0 sem soma ou sem total válido", () => {
        assert.equal(calcularPercentualSoma(0, 90), 0);
        assert.equal(calcularPercentualSoma(40, 0), 0);
        assert.equal(calcularPercentualSoma(40, undefined), 0);
        assert.equal(calcularPercentualSoma(-5, 90), 0);
    });
});
