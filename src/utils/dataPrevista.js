/**
 * Converte data dd/mm/aaaa do formulário para ISO do backend.
 * Retorna null quando vazia/incompleta para o JSON incluir a chave e limpar o campo
 * (omitir a propriedade faria o update preservar a data anterior).
 */
export const dataPrevistaParaBackend = (dataBr) => {
    if (!dataBr || dataBr.length !== 10) return null;

    const [dia, mes, ano] = dataBr.split("/");
    return new Date(`${ano}-${mes}-${dia}T12:00:00.000Z`).toISOString();
};
