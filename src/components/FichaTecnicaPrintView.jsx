import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";

export default function FichaTecnicaPrintView({ dadosFicha, fichaId, referencia }) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsMounted(true);
    }, []);

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

                    @media print {
                        body > div:not(#portal-impressao) {
                            display: none !important;
                        }

                        #portal-impressao {
                            display: block !important;
                            position: relative !important; 
                            width: 100% !important;
                            margin: 0 !important;
                            padding: 0 !important;
                            
                        }

                        #ficha-print-view, #ficha-print-view * {
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
                                <span className="absolute -top-[9px] bg-white px-1 text-[11px] text-[#4696AD]">
                                    Nº
                                </span>
                                <span className="text-[15px] font-medium text-[#4696AD]">
                                    {fichaId}
                                </span>
                            </div>
                            <div className="border border-[#4696AD] rounded-[20px] h-[38px] min-w-[70px] relative flex items-center justify-center px-4">
                                <span className="absolute -top-[9px] bg-white px-1 text-[11px] text-[#4696AD]">
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

                        <div
                            className="w-full rounded-[10px] overflow-hidden"
                            style={{ border: "0.5px solid #7B7D80" }}
                        >
                            <table
                                className="w-full"
                                style={{ tableLayout: "fixed", borderCollapse: "collapse" }}
                            >
                                <colgroup>
                                    <col style={{ width: "160px" }} />
                                    {sizeItems.map((s) => (
                                        <col key={`col-${s.id}`} />
                                    ))}
                                    <col style={{ width: "80px" }} />
                                </colgroup>

                                <thead>
                                    <tr>
                                        <th
                                            className="bg-[#F4F4F4]"
                                            style={{
                                                borderRight: "0.5px solid #7B7D80",
                                                borderBottom: "0.5px solid #7B7D80",
                                            }}
                                        ></th>
                                        {sizeItems.map((s) => (
                                            <th
                                                key={`total-${s.id}`}
                                                className="h-[30px] text-center text-[13px] font-light bg-[#F4F4F4]"
                                                style={{
                                                    borderLeft: "0.5px solid #7B7D80",
                                                    borderBottom: "0.5px solid #7B7D80",
                                                    color:
                                                        totaisPorTamanho[s.id] > 0
                                                            ? "#898C8F"
                                                            : "#D7D7D7",
                                                }}
                                            >
                                                {totaisPorTamanho[s.id] || 0}
                                            </th>
                                        ))}
                                        <th
                                            className="bg-[#F4F4F4]"
                                            style={{
                                                borderLeft: "0.5px solid #7B7D80",
                                                borderBottom: "0.5px solid #7B7D80",
                                            }}
                                        ></th>
                                    </tr>

                                    <tr>
                                        <th
                                            className="h-[40px] font-normal bg-[#C9EAF6] text-[#4696AD] px-4"
                                            style={{ borderBottom: "0.5px solid #7B7D80" }}
                                        >
                                            Cores
                                        </th>
                                        {sizeItems.map((s) => (
                                            <th
                                                key={`header-${s.id}`}
                                                className="h-[40px] text-center text-[14px] font-normal text-[#4696AD] bg-[#C9EAF6]"
                                                style={{
                                                    borderLeft: "0.5px solid #7B7D80",
                                                    borderBottom: "0.5px solid #7B7D80",
                                                }}
                                            >
                                                {s.tamanho?.codigo || "-"}
                                            </th>
                                        ))}
                                        <th
                                            className="h-[40px] text-center text-[14px] font-normal text-[#4696AD] bg-[#C9EAF6]"
                                            style={{ borderBottom: "0.5px solid #7B7D80" }}
                                        >
                                            Total
                                        </th>
                                    </tr>
                                </thead>

                                <tbody>
                                    {cores.length > 0 ? (
                                        cores.map((cor, index) => {
                                            let totalCor = 0;

                                            return (
                                                <tr
                                                    key={cor.id}
                                                    className={`h-[45px] ${
                                                        index % 2 === 1
                                                            ? "bg-[#F9F9F9]"
                                                            : "bg-white"
                                                    }`}
                                                >
                                                    <td
                                                        className="pl-4 pr-4"
                                                        style={{
                                                            borderTop:
                                                                index === 0
                                                                    ? "none"
                                                                    : "0.5px solid #7B7D80",
                                                            borderRight: "0.5px solid #7B7D80",
                                                        }}
                                                    >
                                                        <div className="flex items-center gap-3">
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
                                                    </td>

                                                    {sizeItems.map((s) => {
                                                        const item =
                                                            dadosFicha.ficha_tecnica_itens?.find(
                                                                (fi) =>
                                                                    fi.cor_id === cor.id &&
                                                                    fi.grade_versao_item_id ===
                                                                        s.id,
                                                            );
                                                        const val = item?.quantidade;
                                                        if (typeof val === "number")
                                                            totalCor += val;

                                                        return (
                                                            <td
                                                                key={`qty-${cor.id}-${s.id}`}
                                                                className="text-center text-[14px] font-light text-[#707070]"
                                                                style={{
                                                                    borderTop:
                                                                        index === 0
                                                                            ? "none"
                                                                            : "0.5px solid #7B7D80",
                                                                    borderRight:
                                                                        "0.5px solid #7B7D80",
                                                                }}
                                                            >
                                                                {val || "-"}
                                                            </td>
                                                        );
                                                    })}

                                                    <td
                                                        className="text-center text-[14px] font-normal text-[#707070]"
                                                        style={{
                                                            borderTop:
                                                                index === 0
                                                                    ? "none"
                                                                    : "0.5px solid #7B7D80",
                                                        }}
                                                    >
                                                        {totalCor || "-"}
                                                    </td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan={sizeItems.length + 2}
                                                className="py-4 text-center text-[13px] text-[#888]"
                                            >
                                                Nenhuma cor selecionada.
                                            </td>
                                        </tr>
                                    )}

                                    <tr className="h-[45px]">
                                        <td
                                            className="text-center text-[14px] font-normal text-[#4696AD] bg-[#C9EAF6]"
                                            style={{
                                                borderTop: "0.5px solid #7B7D80",
                                                borderRight: "0.5px solid #7B7D80",
                                            }}
                                        >
                                            Total (tamanho)
                                        </td>
                                        {sizeItems.map((s) => (
                                            <td
                                                key={`total-rodape-${s.id}`}
                                                className="text-center text-[14px] font-normal text-[#707070]"
                                                style={{
                                                    borderTop: "0.5px solid #7B7D80",
                                                    borderRight: "0.5px solid #7B7D80",
                                                }}
                                            >
                                                {totaisPorTamanho[s.id] || "-"}
                                            </td>
                                        ))}
                                        <td
                                            className="text-center text-[14px] font-normal text-[#4696AD] bg-[#C9EAF6]"
                                            style={{ borderTop: "0.5px solid #7B7D80" }}
                                        >
                                            {totalGeral || "-"}
                                        </td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* COSTURA */}
                    <div className="mb-4 mx-[30px] break-inside-avoid">
                        <div className="text-center text-[15px] font-light text-[#737373] mb-2">
                            Costura
                        </div>
                        <div className="rounded-[10px] border border-[#D9D9D9] overflow-hidden">
                            <table
                                className="w-full text-center text-sm"
                                style={{ borderCollapse: "collapse" }}
                            >
                                <thead className="bg-[#F4F4F4] text-[#737373]">
                                    <tr>
                                        <th
                                            className="py-3 font-normal"
                                            style={{ borderRight: "1px solid #7B7D80" }}
                                        >
                                            Facção
                                        </th>
                                        <th
                                            className="py-3 font-normal"
                                            style={{ borderRight: "1px solid #7B7D80" }}
                                        >
                                            Operação
                                        </th>
                                        <th className="py-3 font-normal">Preço Unitário</th>
                                    </tr>
                                </thead>
                                <tbody className="text-[#707070]">
                                    {dadosFicha?.ficha_parceiro?.length > 0 ? (
                                        dadosFicha.ficha_parceiro.map((vinculo, index) => {
                                            const parceiro = vinculo.parceiro;
                                            const nome = parceiro?.nome || "-";
                                            const operacao = vinculo.operacao || "-";
                                            const preco = parceiro?.parceiro_produto?.[0]?.preco;
                                            const precoFormatado =
                                                preco !== undefined && preco !== null
                                                    ? `R$ ${Number(preco).toFixed(2).replace(".", ",")}`
                                                    : "-";

                                            return (
                                                <tr key={vinculo.id || index}>
                                                    <td
                                                        className="py-3"
                                                        style={{ borderRight: "1px solid #7B7D80" }}
                                                    >
                                                        {nome}
                                                    </td>
                                                    <td
                                                        className="py-3 text-[#D3D3D3]"
                                                        style={{ borderRight: "1px solid #7B7D80" }}
                                                    >
                                                        {operacao}
                                                    </td>
                                                    <td className="py-3">{precoFormatado}</td>
                                                </tr>
                                            );
                                        })
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan="3"
                                                className="py-4 text-center text-[13px] text-[#888]"
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
                                        <th className="py-2.5 font-normal border-r border-r-[#7B7D80] w-1/4">
                                            Defeito de costura
                                        </th>
                                        <th className="py-2.5 font-normal border-r border-r-[#7B7D80] w-1/4">
                                            Defeito no tecido
                                        </th>
                                        <th className="py-2.5 font-normal border-r border-r-[#7B7D80] w-1/4">
                                            Retiradas
                                        </th>
                                        <th className="py-2.5 font-normal w-1/4">Sobras</th>
                                    </tr>
                                </thead>
                                <tbody className="text-[#707070] font-light bg-white">
                                    <tr>
                                        <td className="py-4 border-t border-r border-r-[#7B7D80]"></td>
                                        <td className="py-4 border-t border-r border-r-[#7B7D80]"></td>
                                        <td className="py-4 border-t border-r border-r-[#7B7D80]"></td>
                                        <td className="py-4 border-t border-r-[#7B7D80]"></td>
                                    </tr>
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* MATERIAIS */}
                    <div className="mx-[30px] relative mt-5 break-inside-avoid">
                        <fieldset className="border border-[#D9D9D9] rounded-[10px] p-4 bg-[#F9F9F9] min-h-[80px]">
                            <legend className="px-2 text-[12px] text-[#898C8F] ml-2 font-light bg-white border border-[#D9D9D9] rounded-full">
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
