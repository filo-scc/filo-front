export const apenasNumeros = (valor) => String(valor || "").replace(/\D/g, "");

export const formatarCnpj = (valor) => {
    const digitos = apenasNumeros(valor).slice(0, 14);
    return digitos
        .replace(/^(\d{2})(\d)/, "$1.$2")
        .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1/$2")
        .replace(/(\d{4})(\d)/, "$1-$2");
};

export const formatarTelefone = (valor) => {
    const digitos = apenasNumeros(valor).slice(0, 11);

    if (!digitos) return "";
    if (digitos.length <= 2) return `(${digitos}`;
    if (digitos.length <= 6) return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
    if (digitos.length <= 10) {
        return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
    }
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
};

export const formatarCep = (valor) => {
    const digitos = apenasNumeros(valor).slice(0, 8);
    if (digitos.length <= 5) return digitos;
    return `${digitos.slice(0, 5)}-${digitos.slice(5)}`;
};
