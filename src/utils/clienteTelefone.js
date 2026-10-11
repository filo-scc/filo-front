export const normalizarTelefoneCliente = (valor) =>
    String(valor ?? "").replace(/\D/g, "");

export const telefoneClienteValido = (valor) => {
    const telefone = normalizarTelefoneCliente(valor);
    return !telefone || (telefone.length >= 9 && telefone.length <= 11);
};

export const telefoneParaCadastro = (valor) =>
    normalizarTelefoneCliente(valor) || undefined;

export const telefoneParaEdicao = (valorAtual, valorOriginal) => {
    const atual = normalizarTelefoneCliente(valorAtual);
    const original = normalizarTelefoneCliente(valorOriginal);

    if (atual === original) return undefined;
    return atual || null;
};

export const telefoneParaPayloadAtualizacao = (valor) => {
    if (valor === undefined) return undefined;
    if (valor === null) return null;
    return normalizarTelefoneCliente(valor) || null;
};
