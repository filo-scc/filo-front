import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
    montarAvisoPrecoInvalido,
    obterMensagemErroTransferencia,
} from "./mensagensTransferencia.js";

const erroHttp = (status, message) => ({ response: { status, data: { message } } });

describe("obterMensagemErroTransferencia", () => {
    it("mostra como veio a regra de negócio em português do back", () => {
        assert.equal(
            obterMensagemErroTransferencia(erroHttp(400, "A etapa de destino está inativa")),
            "A etapa de destino está inativa",
        );
        assert.equal(
            obterMensagemErroTransferencia(
                erroHttp(
                    409,
                    "A ficha técnica já passou pela etapa de destino e não pode voltar a ela",
                ),
            ),
            "A ficha técnica já passou pela etapa de destino e não pode voltar a ela",
        );
        assert.equal(
            obterMensagemErroTransferencia(
                erroHttp(404, "Parceiro 7 não encontrado para este fabrico"),
            ),
            "Parceiro 7 não encontrado para este fabrico",
        );
    });

    it("troca a validação de preço em inglês por uma mensagem em português", () => {
        const mensagem = obterMensagemErroTransferencia(
            erroHttp(400, ["parceiros.0.preco must be a positive number"]),
        );

        assert.equal(mensagem, "Informe um preço unitário maior que zero para todos os parceiros.");
    });

    it("usa mensagem amigável para outras validações em inglês", () => {
        const mensagem = obterMensagemErroTransferencia(
            erroHttp(400, ["parceiros.1.quantidade must not be less than 0"]),
        );

        assert.equal(
            mensagem,
            "Alguns dados da transferência são inválidos. Revise os campos e tente novamente.",
        );
    });

    it("não expõe mensagens genéricas em inglês do servidor", () => {
        const generica = "Não foi possível transferir a ficha. Tente novamente.";

        assert.equal(
            obterMensagemErroTransferencia(erroHttp(500, "Internal server error")),
            generica,
        );
        assert.equal(obterMensagemErroTransferencia(erroHttp(401, "Unauthorized")), generica);
        assert.equal(obterMensagemErroTransferencia(erroHttp(400, "")), generica);
        assert.equal(obterMensagemErroTransferencia(erroHttp(400, undefined)), generica);
    });

    it("avisa quando o usuário não tem permissão", () => {
        assert.equal(
            obterMensagemErroTransferencia(erroHttp(403, "Forbidden resource")),
            "Você não tem permissão para realizar esta transferência.",
        );
    });

    it("distingue falha de conexão de erro inesperado", () => {
        assert.equal(
            obterMensagemErroTransferencia({ request: {} }),
            "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.",
        );
        assert.equal(
            obterMensagemErroTransferencia(new Error("falha")),
            "Não foi possível transferir a ficha. Tente novamente.",
        );
        assert.equal(
            obterMensagemErroTransferencia(undefined),
            "Não foi possível transferir a ficha. Tente novamente.",
        );
    });
});

describe("montarAvisoPrecoInvalido", () => {
    it("cita o parceiro quando só um está sem preço", () => {
        assert.equal(
            montarAvisoPrecoInvalido(["Maria Souza"]),
            "Informe um preço unitário maior que zero para Maria Souza.",
        );
    });

    it("lista os parceiros quando mais de um está sem preço", () => {
        assert.equal(
            montarAvisoPrecoInvalido(["Maria Souza", "João Lima"]),
            "Informe um preço unitário maior que zero para: Maria Souza, João Lima.",
        );
    });

    it("ignora nomes vazios e tem texto padrão quando não há nomes", () => {
        assert.equal(
            montarAvisoPrecoInvalido(["Maria Souza", "", undefined]),
            "Informe um preço unitário maior que zero para Maria Souza.",
        );
        assert.equal(
            montarAvisoPrecoInvalido([]),
            "Informe um preço unitário maior que zero para continuar.",
        );
        assert.equal(
            montarAvisoPrecoInvalido(undefined),
            "Informe um preço unitário maior que zero para continuar.",
        );
    });
});
