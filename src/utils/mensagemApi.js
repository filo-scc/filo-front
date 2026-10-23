export const extrairMensagemDeErro = (error) => {
    const mensagem = error?.response?.data?.message;

    if (Array.isArray(mensagem)) return mensagem.join(". ");

    return typeof mensagem === "string" ? mensagem : "";
};
