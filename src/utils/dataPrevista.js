/**
 * Converte data dd/mm/aaaa do formulário para ISO do backend.
 * Retorna null quando vazia/incompleta/inválida para o JSON incluir a chave e limpar o campo
 * (omitir a propriedade faria o update preservar a data anterior).
 * Rejeita datas de calendário impossíveis (ex.: 31/02) em vez de deixar o Date normalizar.
 */
export const dataPrevistaParaBackend = (dataBr) => {
    if (!dataBr || dataBr.length !== 10) return null;

    const [diaStr, mesStr, anoStr] = dataBr.split("/");
    const dia = Number(diaStr);
    const mes = Number(mesStr);
    const ano = Number(anoStr);

    if (
        !Number.isInteger(dia) ||
        !Number.isInteger(mes) ||
        !Number.isInteger(ano) ||
        mes < 1 ||
        mes > 12 ||
        dia < 1
    ) {
        return null;
    }

    // Meio-dia UTC evita deslocamento de fuso; compara componentes para bloquear overflow.
    const data = new Date(Date.UTC(ano, mes - 1, dia, 12, 0, 0, 0));
    if (
        data.getUTCFullYear() !== ano ||
        data.getUTCMonth() !== mes - 1 ||
        data.getUTCDate() !== dia
    ) {
        return null;
    }

    return data.toISOString();
};
