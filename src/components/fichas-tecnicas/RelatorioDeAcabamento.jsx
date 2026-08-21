export default function RelatorioDeAcabamento({
    defeitoCostura = 0,
    defeitoTecido = 0,
    retiradas = 0,
    sobras = 0,
    readonly = false,
    onChange,
    variant = "modal",
}) {
    const campos = [
        { key: "defeitoCostura", label: "Defeito de costura", valor: defeitoCostura },
        { key: "defeitoTecido", label: "Defeito no tecido", valor: defeitoTecido },
        { key: "retiradas", label: "Retiradas", valor: retiradas },
        { key: "sobras", label: "Sobras", valor: sobras },
    ];

    const handleChange = (campo, valorTexto) => {
        if (!onChange) return;
        const numeros = valorTexto.replace(/\D/g, "");
        onChange(campo, numeros === "" ? 0 : Number(numeros));
    };

    const isPrint = variant === "print";
    const darkBorder = { borderWidth: "0.5px", borderStyle: "solid", borderColor: "#7B7D80" };

    const wrapperClass = isPrint
        ? "rounded-[10px] border border-[#D9D9D9] overflow-hidden"
        : "border border-[#E8E8E8] rounded-[10px] overflow-hidden";

    const theadClass = isPrint ? "bg-[#F4F4F4] text-[#737373]" : "bg-[#C9EAF6] text-[#4696AD]";

    const tbodyTextClass = isPrint ? "text-[#707070]" : "text-[#898C8F]";

    const thClass = isPrint ? "py-1.5 font-normal w-1/4" : "py-3 font-normal w-1/4";

    const tdClass = isPrint ? "py-1.5" : "py-3";

    return (
        <div className={isPrint ? "mb-4 mx-[30px] break-inside-avoid" : "mt-6"}>
            <div
                className={
                    isPrint
                        ? "text-center text-[15px] font-light text-[#737373] mb-2"
                        : "mb-2 text-center text-[15px] font-light text-[#737373]"
                }
            >
                Relatório de acabamento
            </div>

            <div className={wrapperClass}>
                <table
                    className="w-full text-center text-sm"
                    style={isPrint ? { borderCollapse: "collapse" } : undefined}
                >
                    <thead className={theadClass}>
                        <tr>
                            {campos.map((campo, i) => (
                                <th
                                    key={campo.key}
                                    className={`${thClass} ${
                                        !isPrint && i !== campos.length - 1
                                            ? "border-r border-[#7B7D80]"
                                            : ""
                                    }`}
                                    style={
                                        isPrint
                                            ? i !== campos.length - 1
                                                ? { ...darkBorder, borderWidth: "0 0.5px 0 0" }
                                                : undefined
                                            : undefined
                                    }
                                >
                                    {campo.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className={tbodyTextClass}>
                        <tr className={!isPrint ? "border-t border-[#E8E8E8]" : undefined}>
                            {campos.map((campo, i) => (
                                <td
                                    key={campo.key}
                                    className={`${tdClass} ${
                                        !isPrint && i !== campos.length - 1
                                            ? "border-r border-[#7B7D80]"
                                            : ""
                                    }`}
                                    style={
                                        isPrint && i !== campos.length - 1
                                            ? { ...darkBorder, borderWidth: "0 0.5px 0 0" }
                                            : undefined
                                    }
                                >
                                    {readonly ? (
                                        campo.valor
                                    ) : (
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            value={campo.valor === 0 ? "" : campo.valor}
                                            placeholder="0"
                                            onChange={(e) =>
                                                handleChange(campo.key, e.target.value)
                                            }
                                            className="w-full text-center bg-transparent outline-none placeholder:text-[#D3D3D3]"
                                        />
                                    )}
                                </td>
                            ))}
                        </tr>
                    </tbody>
                </table>
            </div>
        </div>
    );
}
