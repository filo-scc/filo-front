import test from "node:test";
import assert from "node:assert/strict";
import { calcularSubtotalFicha } from "./calcularSubtotalFicha.js";

test("desconta somente perdas de tecido sem modificar a ficha", () => {
    const ficha = Object.freeze({
        quantidade: 100,
        defeitos_tecido: 5,
        preco_padrao: "10.00",
        defeitos_costura: 10,
        retiradas: 3,
        sobras: 2,
        subtotal: 1000,
    });
    assert.equal(calcularSubtotalFicha(ficha), 950);
    assert.equal(ficha.quantidade, 100);
});

test("ficha nova ou sem perdas mantém seu subtotal", () => {
    assert.equal(calcularSubtotalFicha({ quantidade: 100, preco_padrao: 10 }), 1000);
    assert.equal(
        calcularSubtotalFicha({ quantidade: 100, defeitos_tecido: 0, preco_padrao: 10 }),
        1000,
    );
});

test("perdas iguais ou superiores à quantidade não geram valor negativo", () => {
    for (const perdas of [100, 120]) {
        assert.equal(
            calcularSubtotalFicha({ quantidade: 100, defeitos_tecido: perdas, preco_padrao: 10 }),
            0,
        );
    }
});

test("produção própria preserva o custo integral", () => {
    assert.equal(
        calcularSubtotalFicha(
            { quantidade: 100, defeitos_tecido: 5, custo_total: "12.50", preco_padrao: 10 },
            false,
        ),
        1250,
    );
});

test("alterações de quantidade e preço atualizam o valor e zero é preservado", () => {
    const ficha = { quantidade: 100, defeitos_tecido: 5, preco_padrao: 10 };
    assert.equal(calcularSubtotalFicha({ ...ficha, quantidade: 110 }), 1050);
    assert.equal(calcularSubtotalFicha({ ...ficha, preco_padrao: 20 }), 1900);
    assert.equal(calcularSubtotalFicha({ ...ficha, quantidade: 0 }), 0);
    assert.equal(calcularSubtotalFicha({ ...ficha, preco_padrao: 0 }), 0);
});

test("arredonda o preço unitário em centavos como o backend", () => {
    assert.equal(calcularSubtotalFicha({ quantidade: 3, preco_padrao: "1.005" }), 3.03);
});
