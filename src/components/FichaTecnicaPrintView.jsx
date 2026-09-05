import React, { useEffect, useSyncExternalStore } from "react";
import { createPortal } from "react-dom";
import RelatorioDeAcabamento from "./fichas-tecnicas/RelatorioDeAcabamento";

// Hook para verificar montagem no cliente sem causar renderizações em cascata
const emptySubscribe = () => () => {};
function useIsMounted() {
    return useSyncExternalStore(
        emptySubscribe,
        () => true,
        () => false,
    );
}

const calcularProporcao = (totaisPorTamanho) => {
    const valoresValidos = totaisPorTamanho.map(Number).filter((t) => t > 0);
    if (valoresValidos.length === 0) return totaisPorTamanho.map(() => 0);
    const base = Math.min(...valoresValidos);
    return totaisPorTamanho.map((t) => (t > 0 ? Math.round(t / base) : 0));
};

const simplificarUnidade = (unidade) => {
    const unidadesSimplificadas = {
        METRO: "m",
        CENTIMETRO: "cm",
        GRAMA: "g",
        QUILOGRAMA: "kg",
        UNIDADE: "und",
        PAR: "par",
    };
    return unidadesSimplificadas[unidade] || unidade;
};

// AJUSTE: cinza das linhas alternadas da grade e das facções.
const PRINT_ROW_GRAY = "bg-[#D9D9D9]";

const darkSide = "0.5px solid #7B7D80";
const shellSide = "0.5px solid #D9D9D9";

export default function FichaTecnicaPrintView({
    dadosFicha,
    referencia,
    onReadyToPrint,
    aviamentosProduto,
}) {
    const isMounted = useIsMounted();
    const produtoId = dadosFicha?.produto?.id;
    const isSobDemanda = dadosFicha?.fabrico?.fabricacao_sob_demanda !== false;

    // Notifica prontidão para impressão sem disparar setState
    useEffect(() => {
        if (isMounted && dadosFicha) {
            onReadyToPrint?.();
        }
    }, [isMounted, dadosFicha, onReadyToPrint]);

    if (!dadosFicha || !isMounted) return null;

    const listaAviamentos = produtoId ? aviamentosProduto || [] : [];
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
    const totalRowBg = cores.length % 2 === 1 ? PRINT_ROW_GRAY : "bg-white";

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

                    #ficha-print-view > .break-inside-avoid { margin-left: 0; margin-right: 0; }
                    #ficha-print-view table {
                        border-collapse: collapse;
                    }
                    #ficha-print-view th,
                    #ficha-print-view td {
                        border: none;
                    }

                    @media print {
                        body.print-mode-ficha > div:not(#portal-impressao) {
                            display: none !important;
                        }

                        #portal-impressao {
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
                    className="bg-white text-black p-[10mm] w-full max-w-[210mm] mx-auto font-['Outfit',_sans-serif]"
                >
                    {/* HEADER */}
                    <div className="flex justify-between items-start mb-6 mx-0 break-inside-avoid">
                        <h1 className="text-[28px] font-light text-[#4696AD]">Ficha Técnica</h1>
                        <div className="flex gap-4 mt-2">
                            <div className="border border-[#4696AD] rounded-[14px] h-[38px] min-w-[70px] relative flex items-center justify-center px-4">
                                <span className="absolute -top-[9px] left-3 bg-white px-1 text-[11px] text-[#4696AD]">
                                    Nº
                                </span>
                                <span className="text-[15px] font-medium text-[#4696AD]">
                                    {dadosFicha?.numero}
                                </span>
                            </div>
                            <div className="border border-[#4696AD] rounded-[14px] h-[38px] min-w-[70px] relative flex items-center justify-center px-4">
                                <span className="absolute -top-[9px] left-3 bg-white px-1 text-[11px] text-[#4696AD]">
                                    {isSobDemanda ? "Pedido" : "Produção"}
                                </span>
                                <span className="text-[15px] font-medium text-[#4696AD]">
                                    {dadosFicha?.pedido?.numero || "--"}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* FOTO E DADOS */}
                    <div className="flex gap-6 mb-6 mx-0 break-inside-avoid">
                        <div className="flex-1 min-w-0 grid grid-cols-2 gap-x-4 gap-y-5 content-end pb-1">
                            {[
                                ["Data", new Date().toLocaleDateString("pt-BR")],
                                ["Referência Interna", dadosFicha?.produto?.nome],
                                ...(isSobDemanda
                                    ? [
                                          ["Cliente", dadosFicha?.pedido?.cliente?.nome],
                                          ["Referência do Cliente", referencia],
                                      ]
                                    : []),
                                ["Tecido", dadosFicha?.produto?.tecido?.nome],
                                ["Tipo de produto", dadosFicha?.produto?.tipo_produto?.nome],
                            ].map(([label, valor]) => (
                                <div
                                    key={label}
                                    className="min-w-0 border border-[#B4B4B4] rounded-[10px] min-h-[39px] py-1.5 px-3 relative flex items-center"
                                >
                                    <span className="absolute -top-[9px] left-2 bg-white px-1 text-[11px] text-[#898C8F]">
                                        {label}
                                    </span>
                                    <span className="text-[14px] text-[#707070] leading-tight break-words min-w-0">
                                        {valor || "--"}
                                    </span>
                                </div>
                            ))}
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
                    <div className="mb-4 mx-0 break-inside-avoid">
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
                                    style={{ borderTopLeftRadius: "8px" }}
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
                                    style={{ borderTopRightRadius: "8px" }}
                                >
                                    Total (cor)
                                </div>

                                {cores.length > 0 ? (
                                    cores.map((cor, index) => {
                                        let totalCor = 0;
                                        const rowBg = index % 2 === 1 ? PRINT_ROW_GRAY : "bg-white";
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
                                    {sizeItems.map((s, i) => (
                                        <div
                                            key={`divider-${s.id}`}
                                            style={{
                                                borderLeft: i === 0 ? darkSide : "none",
                                                borderRight: darkSide,
                                            }}
                                        />
                                    ))}
                                    <div />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* COSTURA */}
                    <div className="mb-4 mx-0 break-inside-avoid">
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
                                        <th className="py-1.5 font-normal">Quantidade</th>
                                    </tr>
                                </thead>
                                <tbody className="text-[#707070]">
                                    {parceirosCostura?.length > 0 ? (
                                        parceirosCostura.map((vinculo, index) => (
                                            <tr
                                                key={vinculo.id || index}
                                                className={
                                                    index % 2 === 1 ? PRINT_ROW_GRAY : "bg-white"
                                                }
                                            >
                                                <td
                                                    className="py-1.5"
                                                    style={{ borderRight: darkSide }}
                                                >
                                                    {vinculo.parceiro?.nome || "-"}
                                                </td>
                                                <td
                                                    className="py-1.5 text-[#D3D3D3]"
                                                    style={{ borderRight: darkSide }}
                                                >
                                                    {vinculo.operacao || "-"}
                                                </td>
                                                <td className="py-1.5">
                                                    {vinculo.quantidade || "-"}
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td
                                                colSpan="3"
                                                className="py-1.5 text-center text-[13px] text-[#888]"
                                            >
                                                {"\u00A0"}
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>

                    {/* RELATÓRIO DE ACABAMENTO */}
                    <RelatorioDeAcabamento
                        defeitoCostura={dadosFicha?.defeitos_costura ?? 0}
                        defeitoTecido={dadosFicha?.defeitos_tecido ?? 0}
                        retiradas={dadosFicha?.retiradas ?? 0}
                        sobras={dadosFicha?.sobras ?? 0}
                        readonly
                        variant="print"
                    />

                    {/* MATERIAIS / AVIAMENTOS */}
                    <div className="mx-0 relative mt-5 break-inside-avoid">
                        <fieldset className="border border-[#D9D9D9] rounded-[10px] p-4 bg-[#F9F9F9] min-h-[80px]">
                            <legend className="px-2 text-[12px] text-[#898C8F] ml-2 font-light bg-white">
                                Materiais necessários por peça:
                            </legend>
                            {listaAviamentos.length > 0 ? (
                                <div className="flex flex-col gap-1 text-[13px] px-2 pt-1 font-light">
                                    {listaAviamentos.map((item, index) => {
                                        const qtd = item.quantidade ?? "";
                                        const unidade = simplificarUnidade(
                                            item.aviamento?.unidade_de_medida ?? "",
                                        );
                                        const nome = item.aviamento?.nome ?? "";

                                        return (
                                            <div
                                                key={item.aviamento?.id ?? index}
                                                className="leading-relaxed"
                                            >
                                                <span className="font-bold text-[#898C8F]">
                                                    {qtd} {unidade}
                                                </span>{" "}
                                                <span className="text-[#898C8F] font-normal">
                                                    de {nome}
                                                </span>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-[13px] text-[#898C8F] font-light px-2 pt-1">
                                    Nenhum material cadastrado.
                                </p>
                            )}
                        </fieldset>
                    </div>

                    {/* FOOTER */}
                    <div className="flex justify-between items-end mt-4 mx-0 break-inside-avoid">
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
