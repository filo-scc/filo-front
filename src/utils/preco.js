export const parsePreco = (valor) => {
    if (typeof valor === "number") return Number.isFinite(valor) ? valor : 0;
    if (!valor) return 0;

    let str = String(valor).trim().replace(/[^\d.,-]/g, "");
    if (!str) return 0;

    if (str.includes(",") && str.includes(".")) {
        str = str.replace(/\./g, "").replace(",", ".");
    } else if (str.includes(",")) {
        str = str.replace(",", ".");
    }

    const num = Number(str);
    return Number.isFinite(num) ? num : 0;
};