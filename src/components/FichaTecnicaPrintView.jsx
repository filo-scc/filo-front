import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";

const calcularProporcao = (totaisPorTamanho) => {
    const valoresValidos = totaisPorTamanho.map(Number).filter((t) => t > 0);
    if (valoresValidos.length === 0) return totaisPorTamanho.map(() => 0);
    const base = Math.min(...valoresValidos);
    return totaisPorTamanho.map((t) => (t > 0 ? Math.round(t / base) : 0));
};

const darkSide = "0.5px solid #7B7D80";
const shellSide = "0.5px solid #D9D9D9";

export default function FichaTecnicaPrintView({ dadosFicha, fichaId, referencia, onReadyToPrint }) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (!isMounted) return undefined;
        onReadyToPrint?.();
    }, [isMounted, onReadyToPrint]);

    if (!dadosFicha || !isMounted) return null;

    const sizeItems = dadosFicha?.grade_versao?.itens || [];
    const cores = Object.values(
        dadosFicha.ficha_tecnica_itens?.reduce((acc, item) => {
            if (item.cor) acc[item.cor.id] = item.cor;
            return acc;
        }, {}) || {},
    );

    const totaisPorTamanho = sizeItems.reduce((acc, s) => {
        let sum = 0;
        cores.forEach((cor) => {
            const item = dadosFicha.ficha_tecnica_itens?.find(
                (fi) => fi.cor_id === cor.id && fi.grade_versao_item_id === s.id,
            );
            sum += Number(item?.quantidade || 0);
        });
        acc[s.id] = sum;
        return acc;
    }, {});

    const totalGeral = Object.values(totaisPorTamanho).reduce((acc, val) => acc + val, 0);
    const totalRowBg = cores.length % 2 === 1 ? "bg-[#F9F9F9]" : "bg-white";

    const arrayDeTotais = sizeItems.map((s) => totaisPorTamanho[s.id] || 0);
    const arrayDeProporcoes = calcularProporcao(arrayDeTotais);

    const proporcoes = {};
    sizeItems.forEach((s, index) => {
        proporcoes[s.id] = arrayDeProporcoes[index];
    });

    const categoriaAceitas = [
        "Costura",
        "costura",
        "Facção",
        "facção",
        "Facçao",
        "facçao",
        "Faccão",
        "faccão",
        "Faccao",
        "faccao",
        "Confecção",
        "confecção",
        "Confecçao",
        "confecçao",
        "Confeccão",
        "confeccão",
        "Confeccao",
        "confeccao",
    ];

    const parceirosCostura = (dadosFicha?.ficha_parceiro || []).filter((vinculo) =>
        categoriaAceitas.includes(vinculo.parceiro?.categoria),
    );

    const printContent = (
        <>
            <style type="text/css" media="print">
                {`
                    @page { 
                        size: A4 portrait; 
                        margin: 0mm; 
                    }
                    
                    html, body {
                        width: 100%;
                        height: auto !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        background-color: white;
                        overflow: visible !important; 
                    }

                    #ficha-print-view table {
                        border-collapse: collapse;
                    }
                    #ficha-print-view th,
                    #ficha-print-view td {
                        border: none;
                    }

                    @media print {
                        body > div:not(#portal-impressao) {
                            display: none !important;
                        }

                        #portal-impressao-ficha {
                            display: block !important;
                            position: relative !important; 
                            width: 100% !important;
                            margin: 0 !important;
                            padding: 0 !important;
                        }

                        #ficha-print-view,
                        #ficha-print-view * {
                            visibility: visible;
                            -webkit-print-color-adjust: exact !important;
                            print-color-adjust: exact !important;
                        }
                        
                        .break-inside-avoid {
                            break-inside: avoid !important;
                            page-break-inside: avoid !important;
                        }
                    }
                `}
            </style>

            <div id="portal-impressao" className="hidden print:block w-full">
                <div
                    id="ficha-print-view"
                    className="bg-white text-black p-5 w-full max-w-[210mm] mx-auto font-['Outfit',_sans-serif]"
                >
                    {/* HEADER */}
                    <div className="flex justify-between items-start mb-6 mx-[30px] break-inside-avoid">
                        <h1 className="text-[28px] font-light text-[#4696AD]">Ficha Técnica</h1>
                        <div className="flex gap-4 mt-2">
                            <div className="border border-[#4696AD] rounded-[20px] h-[38px] min-w-[70px] relative flex items-center justify-center px-4">
                                <span className="absolute -top-[9px] left-3 bg-white px-1 text-[11px] text-[#4696AD]">
                                    Nº
                                </span>
                                <span className="text-[15px] font-medium text-[#4696AD]">
                                    {dadosFicha?.numero}
                                </span>
                            </div>
                            <div className="border border-[#4696AD] rounded-[20px] h-[38px] min-w-[70px] relative flex items-center justify-center px-4">
                                <span className="absolute -top-[9px] left-3 bg-white px-1 text-[11px] text-[#4696AD]">
                                    Pedido
                                </span>
                                <span className="text-[15px] font-medium text-[#4696AD]">
                                    {dadosFicha?.pedido?.numero || "--"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* FOTO E DADOS */}
                    <div className="flex gap-6 mb-6 mx-[30px] break-inside-avoid">
                        <div className="flex-1 flex flex-col justify-end gap-5 pb-1">
                            <div className="w-[calc(50%-0.5rem)]">
                                <div className="border border-[#B4B4B4] rounded-[10px] min-h-[39px] py-1.5 px-3 relative flex items-center">
                                    <span className="absolute -top-[9px] left-2 bg-white px-1 text-[11px] text-[#898C8F]">
                                        Data
                                    </span>
                                    <span className="text-[14px] text-[#707070]">
                                        {new Date().toLocaleDateString("pt-BR")}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="border border-[#B4B4B4] rounded-[10px] min-h-[39px] py-1.5 px-3 relative flex items-center">
                                    <span className="absolute -top-[9px] left-2 bg-white px-1 text-[11px] text-[#898C8F]">
                                        Referência Interna
                                    </span>
                                    <span className="text-[14px] text-[#707070] leading-tight">
                                        {dadosFicha?.produto?.nome || "--"}
                                    </span>
                                </div>
                                <div className="border border-[#B4B4B4] rounded-[10px] min-h-[39px] py-1.5 px-3 relative flex items-center">
                                    <span className="absolute -top-[9px] left-2 bg-white px-1 text-[11px] text-[#898C8F]">
                                        Cliente
                                    </span>
                                    <span className="text-[14px] text-[#707070] leading-tight">
                                        {dadosFicha?.pedido?.cliente?.nome || "--"}
                                    </span>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="border border-[#B4B4B4] rounded-[10px] min-h-[39px] py-1.5 px-3 relative flex items-center">
                                    <span className="absolute -top-[9px] left-2 bg-white px-1 text-[11px] text-[#898C8F]">
                                        Referência do Cliente
                                    </span>
                                    <span className="text-[14px] text-[#707070] leading-tight">
                                        {referencia || "--"}
                                    </span>
                                </div>
                                <div className="border border-[#B4B4B4] rounded-[10px] min-h-[39px] py-1.5 px-3 relative flex items-center">
                                    <span className="absolute -top-[9px] left-2 bg-white px-1 text-[11px] text-[#898C8F]">
                                        Tecido
                                    </span>
                                    <span className="text-[14px] text-[#707070] leading-tight">
                                        {dadosFicha?.produto?.tecido?.nome || "--"}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="w-[240px] h-[240px] rounded-[10px] overflow-hidden border border-[#D9D9D9] shrink-0">
                            <img
                                src={dadosFicha?.produto?.foto || "/image-placeholder.png"}
                                alt="Produto"
                                className="w-full h-full object-cover"
                            />
                        </div>
                    </div>

                    {/* GRADE */}
                    <div className="mb-4 mx-[30px] break-inside-avoid">
                        <div className="mb-2 text-center text-[15px] font-light text-[#737373]">
                            Grade
                        </div>

                        <div className="relative w-full">
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: `160px repeat(${sizeItems.length}, 1fr) 80px`,
                                }}
                            >
                                {/* proporção */}
                                <div className="bg-transparent" />
                                {sizeItems.map((s, i) => {
                                    const isFirst = i === 0;
                                    const isLast = i === sizeItems.length - 1;
                                    return (
                                        <div
                                            key={`prop-${s.id}`}
                                            className="h-[25px] flex items-center justify-center text-[13px] font-light bg-[#F4F4F4]"
                                            style={{
                                                borderTop: darkSide,
                                                borderBottom: darkSide,
                                                borderLeft: isFirst ? darkSide : "none",
                                                borderRight: darkSide,
                                                borderTopLeftRadius: isFirst ? "8px" : undefined,
                                                borderTopRightRadius: isLast ? "8px" : undefined,
                                                color:
                                                    totaisPorTamanho[s.id] > 0
                                                        ? "#898C8F"
                                                        : "#D7D7D7",
                                            }}
                                        >
                                            {proporcoes[s.id] || 0}
                                        </div>
                                    );
                                })}
                                <div className="bg-transparent" />

                                <div
                                    className="h-[35px] flex items-center px-4 font-normal bg-[#C9EAF6] text-[#4696AD]"
                                    style={{
                                        borderTopLeftRadius: "8px",
                                    }}
                                >
                                    Cores
                                </div>
                                {sizeItems.map((s) => (
                                    <div
                                        key={`header-${s.id}`}
                                        className="h-[35px] flex items-center justify-center text-[14px] font-normal text-[#4696AD] bg-[#C9EAF6]"
                                    >
                                        {s.tamanho?.codigo || "-"}
                                    </div>
                                ))}
                                <div
                                    className="h-[35px] flex items-center justify-center text-[14px] font-normal text-[#4696AD] bg-[#C9EAF6]"
                                    style={{
                                        borderTopRightRadius: "8px",
                                    }}
                                >
                                    Total (cor)
                                </div>

                                {/* Corpo — cores */}
                                {cores.length > 0 ? (
                                    cores.map((cor, index) => {
                                        let totalCor = 0;
                                        const rowBg = index % 2 === 1 ? "bg-[#F9F9F9]" : "bg-white";
                                        return (
                                            <React.Fragment key={cor.id}>
                                                <div
                                                    className={`h-[35px] flex items-center gap-3 pl-4 pr-4 ${rowBg}`}
                                                >
                                                    <span
                                                        className="w-[18px] h-[18px] rounded-[4px] shrink-0 shadow-sm border border-black/10"
                                                        style={{
                                                            backgroundColor:
                                                                cor.codigo_hex || "#E5E5E5",
                                                        }}
                                                    />
                                                    <span className="text-[14px] font-light text-[#707070] truncate">
                                                        {cor.nome}
                                                    </span>
                                                </div>
                                                {sizeItems.map((s) => {
                                                    const item =
                                                        dadosFicha.ficha_tecnica_itens?.find(
                                                            (fi) =>
                                                                fi.cor_id === cor.id &&
                                                                fi.grade_versao_item_id === s.id,
                                                        );
                                                    const val = item?.quantidade;
                                                    if (typeof val === "number") totalCor += val;
                                                    return (
                                                        <div
                                                            key={`qty-${cor.id}-${s.id}`}
                                                            className={`h-[35px] flex items-center justify-center text-[14px] font-light text-[#707070] ${rowBg}`}
                                                        >
                                                            {val || "-"}
                                                        </div>
                                                    );
                                                })}
                                                <div
                                                    className={`h-[35px] flex items-center justify-center text-[14px] font-normal text-[#707070] ${rowBg}`}
                                                >
                                                    {totalCor || "-"}
                                                </div>
                                            </React.Fragment>
                                        );
                                    })
                                ) : (
                                    <div
                                        className="py-4 text-center text-[13px] text-[#888]"
                                        style={{ gridColumn: `1 / span ${sizeItems.length + 2}` }}
                                    >
                                        Nenhuma cor selecionada.
                                    </div>
                                )}

                                {/* Rodapé */}
                                <div
                                    className="h-[35px] flex items-center justify-center text-[14px] font-normal text-[#4696AD] bg-[#C9EAF6]"
                                    style={{ borderBottomLeftRadius: "8px" }}
                                >
                                    Total (tamanho)
                                </div>
                                {sizeItems.map((s) => (
                                    <div
                                        key={`total-rodape-${s.id}`}
                                        className={`h-[35px] flex items-center justify-center text-[14px] font-normal text-[#707070] ${totalRowBg}`}
                                        style={{ borderBottom: shellSide }}
                                    >
                                        {totaisPorTamanho[s.id] || "-"}
                                    </div>
                                ))}
                                <div
                                    className="h-[35px] flex items-center justify-center text-[14px] font-normal text-[#4696AD] bg-[#C9EAF6]"
                                    style={{ borderBottomRightRadius: "8px" }}
                                >
                                    {totalGeral || "-"}
                                </div>
                            </div>

                            {/* divisórias verticais (header + corpo + rodapé) */}
                            <div
                                className="absolute left-0 right-0 pointer-events-none"
                                style={{ top: "25px", bottom: 0 }}
                            >
                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: `160px repeat(${sizeItems.length}, 1fr) 80px`,
                                        height: "100%",
                                    }}
                                >
                                    <div />
                                    {sizeItems.map((s, i) => {
                                        const isFirst = i === 0;
                                        return (
                                            <div
                                                key={`divider-${s.id}`}
                                                style={{
                                                    borderLeft: isFirst ? darkSide : "none",
                                                    borderRight: darkSide,
                                                }}
                                            />
                                        );
                                    })}
                                    <div />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* COSTURA */}
                    <div className="mb-4 mx-[30px] break-inside-avoid">
                        <div className="text-center text-[15px] font-light text-[#737373] mb-2">
                            Costura
                        </div>
                        <div className="rounded-[10px] border border-[#D9D9D9] overflow-hidden">
                            <table
                                className="w-full text-center text-sm table-fixed"
                                style={{ borderCollapse: "collapse" }}
                            >
                                <thead className="bg-[#F4F4F4] text-[#737373]">
                                    <tr>
                                        <th
                                            className="py-1.5 font-normal w-1/3"
                                            style={{ borderRight: darkSide }}
                                        >
                                            Facção
                                        </th>
                                        <th
                                            className="py-1.5 font-normal w-1/3"
                                            style={{ borderRight: darkSide }}
                                        >
                                            Operação
                                        </th>
                                        <th className="py-1.5 font-normal ">Quantidade</th>
                                    </tr>
                                </thead>
                                <tbody className="text-[#707070]">
                                    {parceirosCostura?.length > 0 ? (
                                        parceirosCostura.map((vinculo, index) => {
                                            const parceiro = vinculo.parceiro;
                                            const nome = parceiro?.nome || "-";
                                            const operacao = vinculo.operacao || "-";
                                            const quantidade = vinculo.quantidade || "-";

                                            return (
                                                <tr key={vinculo.id || index}>
                                                    <td
                                                        className="py-1.5"
                                                        style={{ borderRight: darkSide }}
                                                    >
                                                        {nome}
                                                    </td>
                                                    <td
                                                        className="py-1.5 text-[#D3D3D3]"
                                                        style={{ borderRight: darkSide }}
                                                    >
                                                        {operacao}
                                                    </td>
                                                    <td className="py-1.5">{quantidade}</td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan="3"
                                                className="py-1.5 text-center text-[13px] text-[#888]"
                                            >
                                                Nenhuma facção vinculada a esta ficha.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* RELATÓRIO DE ACABAMENTO */}
                    <div className="mb-4 mx-[30px] break-inside-avoid">
                        <div className="text-center text-[15px] font-light text-[#737373] mb-2">
                            Relatório de acabamento
                        </div>
                        <div className="rounded-[10px] border border-[#D9D9D9] overflow-hidden">
                            <table className="w-full text-center text-sm border-collapse">
                                <thead>
                                    <tr className="bg-[#F4F4F4] text-[#898C8F]">
                                        <th
                                            className="py-1.5 font-normal w-1/4"
                                            style={{ borderRight: darkSide }}
                                        >
                                            Defeito de costura
                                        </th>
                                        <th
                                            className="py-1.5 font-normal w-1/4"
                                            style={{ borderRight: darkSide }}
                                        >
                                            Defeito no tecido
                                        </th>
                                        <th
                                            className="py-1.5 font-normal w-1/4"
                                            style={{ borderRight: darkSide }}
                                        >
                                            Retiradas
                                        </th>
                                        <th className="py-1.5 font-normal w-1/4">Sobras</th>
                                    </tr>
                                </thead>
                                <tbody className="text-[#707070] font-light bg-white">
                                    <tr>
                                        <td className="py-3" style={{ borderRight: darkSide }}></td>
                                        <td className="py-3" style={{ borderRight: darkSide }}></td>
                                        <td className="py-3" style={{ borderRight: darkSide }}></td>
                                        <td className="py-3"></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* MATERIAIS */}
                    <div className="mx-[30px] relative mt-5 break-inside-avoid">
                        <fieldset className="border border-[#D9D9D9] rounded-[10px] p-4 bg-[#F9F9F9] min-h-[80px]">
                            <legend className="px-2 text-[12px] text-[#898C8F] ml-2 font-light bg-white">
                                Materiais necessários por peça:
                            </legend>
                            <p className="text-[13px] text-[#898C8F] whitespace-pre-line font-light px-2 pt-1">
                                {"\n\n"}
                            </p>
                        </fieldset>
                    </div>

                    {/* FOOTER */}
                    <div className="flex justify-between items-end mt-6 mx-4 pb-4 break-inside-avoid">
                        <img
                            src="/filo.png"
                            alt="Logo filo"
                            className="w-[59px] h-[35px] object-contain"
                        />
                        <span className="text-[12px] font-light text-[#4696AD]">
                            Onde negócios fluem, resultados acontecem
                        </span>
                    </div>
                </div>
            </div>
        </>
    );

    return createPortal(printContent, document.body);
}
