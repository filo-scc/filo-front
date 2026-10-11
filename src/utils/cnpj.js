export const normalizarCnpj = (valor) => String(valor ?? "").replace(/\D/g, "");

const calcularDigito = (base, pesos) => {
    const soma = pesos.reduce((total, peso, indice) => total + Number(base[indice]) * peso, 0);
    const resto = soma % 11;
    return resto < 2 ? 0 : 11 - resto;
};

export const cnpjValido = (valor) => {
    const cnpj = normalizarCnpj(valor);

    if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false;

    const primeiroDigito = calcularDigito(cnpj.slice(0, 12), [5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2]);
    const segundoDigito = calcularDigito(
        `${cnpj.slice(0, 12)}${primeiroDigito}`,
        [6, 5, 4, 3, 2, 9, 8, 7, 6, 5, 4, 3, 2],
    );

    return cnpj.endsWith(`${primeiroDigito}${segundoDigito}`);
};
