const MENSAGEM_ERRO_GENERICA = "Não foi possível transferir a ficha. Tente novamente.";
const MENSAGEM_SEM_CONEXAO =
    "Não foi possível conectar ao servidor. Verifique sua conexão e tente novamente.";
const MENSAGEM_SEM_PERMISSAO = "Você não tem permissão para realizar esta transferência.";
const MENSAGEM_PRECO_INVALIDO = "Informe um preço unitário maior que zero para todos os parceiros.";
const MENSAGEM_DADOS_INVALIDOS =
    "Alguns dados da transferência são inválidos. Revise os campos e tente novamente.";

// Nestes status o back responde com a regra de negócio já escrita em português
// (ex.: "A etapa de destino está inativa"), então a mensagem pode ser mostrada como veio.
const STATUS_COM_MENSAGEM_DE_NEGOCIO = [400, 404, 409, 422];

// A validação de DTO do back devolve uma lista de mensagens em inglês
// (ex.: "parceiros.0.preco must be a positive number"), que não vai para o usuário.
function traduzirErrosDeValidacao(mensagens) {
    const falhouNoPreco = mensagens.some((mensagem) => /preco/i.test(String(mensagem)));
    return falhouNoPreco ? MENSAGEM_PRECO_INVALIDO : MENSAGEM_DADOS_INVALIDOS;
}

export function obterMensagemErroTransferencia(error) {
    const resposta = error?.response;

    if (!resposta) return error?.request ? MENSAGEM_SEM_CONEXAO : MENSAGEM_ERRO_GENERICA;
    if (resposta.status === 403) return MENSAGEM_SEM_PERMISSAO;

    const mensagem = resposta.data?.message;

    if (Array.isArray(mensagem)) return traduzirErrosDeValidacao(mensagem);

    if (
        STATUS_COM_MENSAGEM_DE_NEGOCIO.includes(resposta.status) &&
        typeof mensagem === "string" &&
        mensagem.trim()
    ) {
        return mensagem;
    }

    return MENSAGEM_ERRO_GENERICA;
}

export function montarAvisoPrecoInvalido(nomes) {
    const lista = (nomes ?? []).filter(Boolean);

    if (lista.length === 0) return "Informe um preço unitário maior que zero para continuar.";
    if (lista.length === 1) return `Informe um preço unitário maior que zero para ${lista[0]}.`;

    return `Informe um preço unitário maior que zero para: ${lista.join(", ")}.`;
}
