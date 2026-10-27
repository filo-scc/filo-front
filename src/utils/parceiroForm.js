import { parceiroEhDaEtapa } from "./etapaDoParceiro.js";

export const maskTelefone = (value) => {
    return value
        .replace(/\D/g, "")
        .slice(0, 11)
        .replace(/^(\d{2})(\d)/, "($1) $2")
        .replace(/(\d{5})(\d{1,4})$/, "$1-$2");
};

export const maskCep = (value) => {
    return value
        .replace(/\D/g, "")
        .slice(0, 8)
        .replace(/(\d{5})(\d{1,3})$/, "$1-$2");
};

export const maskAgencia = (value) => {
    const numeros = value.replace(/\D/g, "").slice(0, 5);
    if (numeros.length <= 4) return numeros;
    return `${numeros.slice(0, 4)}-${numeros.slice(4)}`;
};

export const maskConta = (value) => {
    const numeros = value.replace(/\D/g, "").slice(0, 13);
    if (numeros.length <= 1) return numeros;
    return `${numeros.slice(0, -1)}-${numeros.slice(-1)}`;
};

export const criarFormParceiro = (etapaId = "") => ({
    etapa_id: etapaId,
    nome: "",
    responsavel: "",
    telefone: "",

    cep: "",
    rua: "",
    numero: "",
    bairro: "",
    complemento: "",
    cidade: "",
    estado: "",

    forma_pagamento: "",
    chave_pix: "",
    banco: "",
    agencia: "",
    conta: "",
});

// Agência e conta só ganham máscara quando o pagamento é por conta bancária (TED).
export const aplicarMascara = (name, value, formaPagamento) => {
    if (name === "telefone") return maskTelefone(value);
    if (name === "cep") return maskCep(value);
    if (name === "agencia" && formaPagamento === "TED") return maskAgencia(value);
    if (name === "conta" && formaPagamento === "TED") return maskConta(value);
    return value;
};

export const montarPayloadParceiro = (formData) => {
    const payload = {
        nome: formData.nome,
    };

    if (formData.etapa_id) payload.etapa_id = Number(formData.etapa_id);
    if (formData.telefone) payload.telefone = formData.telefone.replace(/\D/g, "");
    if (formData.responsavel) payload.responsavel = formData.responsavel;

    const endereco = {};
    if (formData.rua) endereco.rua = formData.rua;
    if (formData.numero) endereco.numero = formData.numero;
    if (formData.bairro) endereco.bairro = formData.bairro;
    if (formData.complemento) endereco.complemento = formData.complemento;
    if (formData.cidade) endereco.cidade = formData.cidade;
    if (formData.estado) endereco.estado = formData.estado;
    if (formData.cep) endereco.cep = formData.cep.replace(/\D/g, "");

    if (Object.keys(endereco).length > 0) {
        payload.endereco = endereco;
    }

    if (formData.forma_pagamento) {
        payload.forma_pagamento = formData.forma_pagamento;
        if (formData.forma_pagamento === "PIX" && formData.chave_pix) {
            payload.chave_pix = formData.chave_pix;
        } else if (formData.forma_pagamento === "TED") {
            if (formData.banco) payload.banco = formData.banco;
            if (formData.agencia) payload.agencia = formData.agencia;
            if (formData.conta) payload.conta = formData.conta;
        }
    }

    return payload;
};

const MENSAGEM_ERRO_CADASTRO = "Erro ao cadastrar parceiro. Verifique os dados.";
const STATUS_COM_MENSAGEM_DE_NEGOCIO = [400, 404, 409, 422];

// O back devolve a regra de negócio em português (ex.: "Já existe um parceiro com esse nome nesse
// fabrico") e a validação de DTO como lista em inglês, que não vai para o usuário.
export const obterMensagemErroCadastroParceiro = (error) => {
    const resposta = error?.response;
    const mensagem = resposta?.data?.message;

    if (
        STATUS_COM_MENSAGEM_DE_NEGOCIO.includes(resposta?.status) &&
        typeof mensagem === "string" &&
        mensagem.trim()
    ) {
        return mensagem;
    }

    return MENSAGEM_ERRO_CADASTRO;
};

const normalizar = (texto) => String(texto ?? "").trim();

// O cadastro responde só com uma mensagem, sem o parceiro criado. O nome é único por fábrica,
// então a listagem atualizada permite achar o parceiro recém-cadastrado.
export const encontrarParceiroPorNome = (parceiros, nome) => {
    if (!Array.isArray(parceiros)) return null;

    const alvo = normalizar(nome);
    return parceiros.find((parceiro) => normalizar(parceiro?.nome) === alvo) ?? null;
};

export const filtrarParceirosDaEtapa = (parceiros, etapaId) => {
    if (!Array.isArray(parceiros)) return [];

    return parceiros.filter((parceiro) => parceiroEhDaEtapa(parceiro, etapaId));
};
