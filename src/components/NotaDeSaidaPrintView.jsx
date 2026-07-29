import React, { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";

const darkSide = "0.5px solid #7B7D80";
const shellSide = "0.5px solid #D9D9D9";

const Campo = ({ label, valor }) => (
    <div className="relative border border-[#B4B4B4] rounded-[10px] min-h-[39px] py-1.5 px-3 flex items-center bg-white">
        <span className="absolute -top-[9px] left-2 bg-white px-1 text-[11px] text-[#898C8F]">
            {label}
        </span>
        <span className="text-[14px] text-[#707070] leading-tight">{valor || "-"}</span>
    </div>
);

const Badge = ({ label, valor }) => (
    <div className="border border-[#4696AD] rounded-[20px] h-[38px] min-w-[70px] relative flex items-center justify-center px-4 bg-white">
        <span className="absolute -top-[9px] left-3 bg-white px-1 text-[11px] text-[#4696AD]">
            {label}
        </span>
        <span className="text-[15px] font-medium text-[#4696AD]">{valor || "--"}</span>
    </div>
);

export default function NotaDeSaidaPrintView({
    ficha,
    referenciaCliente,
    dados: dadosProp,
    onReadyToPrint,
}) {
    const [isMounted, setIsMounted] = useState(false);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsMounted(true);
    }, []);

    useEffect(() => {
        if (!isMounted) return undefined;
        onReadyToPrint?.();
    }, [isMounted, onReadyToPrint]);

    // 1. Normalização dos dados básicos (aceita tanto 'ficha' quanto 'dados')
    const dados = useMemo(() => {
        if (dadosProp) return dadosProp;
        if (!ficha) return null;

        const parceiro = ficha?.ficha_parceiro?.[0]?.parceiro?.nome || "-";
        const dataFormatada = ficha?.created_at
            ? new Date(ficha.created_at).toLocaleDateString("pt-BR")
            : "-";

        return {
            numeroNota: ficha.id ? String(ficha.id).padStart(4, "0") : "-",
            numeroPedido: ficha.pedido?.id || "-",
            fornecedor: parceiro,
            data: dataFormatada,
            referenciaInterna: ficha.produto?.nome || "-",
            cliente: ficha.pedido?.cliente?.nome || "-",
            referenciaCliente: referenciaCliente || "-",
            tecido: ficha.produto?.tecido?.nome || "-",
            imagemUrl: ficha.produto?.foto || null,
            anotacoes: ficha.observacoes || ficha.anotacoes || "",
        };
    }, [ficha, referenciaCliente, dadosProp]);

    // 2. Mapeamento dinâmico da Grade (Tamanhos e Cores) a partir da Ficha
    const { tamanhos, itens, totaisPorTamanho, totalGeral } = useMemo(() => {
        const sizeItems = ficha?.grade_versao?.itens || [];
        const listaTamanhos = sizeItems.map((s) => s.tamanho?.codigo || s.codigo || "-");

        const makeEmptyQuantidades = () =>
            listaTamanhos.reduce((acc, tam) => {
                acc[tam] = "";
                return acc;
            }, {});

        if (dadosProp) {
            return {
                tamanhos: dadosProp.tamanhos || listaTamanhos,
                itens: (dadosProp.itens || []).map((item) => ({
                    ...item,
                    quantidades: makeEmptyQuantidades(),
                })),
                totaisPorTamanho: listaTamanhos.reduce((acc, tam) => {
                    acc[tam] = "";
                    return acc;
                }, {}),
                totalGeral: "",
            };
        }

        // Agrupa itens por cor somente para manter as cores na tabela
        const coresMap = {};
        (ficha?.ficha_tecnica_itens || []).forEach((item) => {
            const corId = item.cor?.id || item.cor_id;
            if (!corId) return;

            if (!coresMap[corId]) {
                coresMap[corId] = {
                    id: corId,
                    corNome: item.cor?.nome || "Cor sem nome",
                    hexColor: item.cor?.codigo_hex || "#E5E5E5",
                    quantidades: makeEmptyQuantidades(),
                };
            }
        });

        const listaItens = Object.values(coresMap);

        return {
            tamanhos: listaTamanhos,
            itens: listaItens,
            totaisPorTamanho: listaTamanhos.reduce((acc, tam) => {
                acc[tam] = "";
                return acc;
            }, {}),
            totalGeral: "",
        };
    }, [ficha, dadosProp]);

    if (!dados || !isMounted) return null;

    const colunasGrid = tamanhos.length > 0 ? tamanhos.length : 1;

    // Correção: envolvemos o JSX e document.body com o createPortal(...)
    const printContent = createPortal(
        <>
            <style type="text/css" media="print">
                {`
                    @page { 
                        size: A4 portrait; 
                        margin: 0mm; 
                    }

                    #root {
                        display: none !important;
                    }
                    
                    html, body {
                        width: 100%;
                        height: auto !important;
                        margin: 0 !important;
                        padding: 0 !important;
                        background-color: white !important;
                        overflow: visible !important; 
                    }

                    #nota-print-view table {
                        border-collapse: collapse;
                    }
                    #nota-print-view th,
                    #nota-print-view td {
                        border: none;
                    }

                    @media print {
                        body.print-mode-nota > div:not(#portal-impressao-nota) {
                            display: none !important;
                        }

                        body.print-mode-nota #portal-impressao-nota,
                        body.print-mode-nota #portal-impressao-nota * {
                            visibility: visible !important;
                        }

                        body.print-mode-nota #portal-impressao-nota {
                            display: block !important;
                            position: relative !important;
                            left: 0 !important;
                            top: 0 !important;
                            width: 100% !important;
                            margin: 0 !important;
                            padding: 0 !important;
                        }

                        body.print-mode-nota #nota-print-view {
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

            <div id="portal-impressao-nota" className="hidden print:block w-full">
                <div
                    id="nota-print-view"
                    className="bg-white text-black p-5 w-full max-w-[260mm] mx-auto font-['Outfit',_sans-serif]"
                >
                    {/* HEADER */}
                    <div className="flex justify-between items-start mb-6 mx-[30px] break-inside-avoid">
                        <h1 className="text-[28px] font-light text-[#4696AD]">Nota de saída</h1>
                        <div className="flex gap-4 mt-2">
                            <Badge label="Nº" valor={dados.numeroNota} />
                            <Badge label="Pedido" valor={dados.numeroPedido} />
                        </div>
                    </div>

                    {/* CAMPOS + FOTO */}
                    <div className="flex gap-6 mb-6 mx-[30px] break-inside-avoid">
                        <div className="flex-1 flex flex-col justify-end gap-5 pb-1">
                            <div className="grid grid-cols-2 gap-4">
                                <Campo label="Fornecedor" valor={dados.fornecedor} />
                                <Campo label="Data" valor={dados.data} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Campo label="Referência Interna" valor={dados.referenciaInterna} />
                                <Campo label="Cliente" valor={dados.cliente} />
                            </div>
                            <div className="grid grid-cols-2 gap-4">
                                <Campo
                                    label="Referência do Radar"
                                    valor={dados.referenciaCliente}
                                />
                                <Campo label="Tecido" valor={dados.tecido} />
                            </div>
                        </div>

                        <div className="w-[240px] h-[240px] rounded-[10px] overflow-hidden border border-[#D9D9D9] shrink-0 bg-gray-50 flex items-center justify-center">
                            <img
                                src={dados.imagemUrl || "/filo.png"}
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
                                    gridTemplateColumns: `160px repeat(${colunasGrid}, 1fr) 80px`,
                                }}
                            >
                                <div
                                    className="h-[40px] flex items-center px-4 font-normal bg-[#C9EAF6] text-[#4696AD]"
                                    style={{ borderTopLeftRadius: "8px" }}
                                >
                                    Cores
                                </div>
                                {tamanhos.map((tam) => (
                                    <div
                                        key={`header-${tam}`}
                                        className="h-[40px] flex items-center justify-center text-[14px] font-normal text-[#4696AD] bg-[#C9EAF6]"
                                    >
                                        {tam}
                                    </div>
                                ))}
                                <div
                                    className="h-[40px] flex items-center justify-center text-[14px] font-normal text-[#4696AD] bg-[#C9EAF6]"
                                    style={{ borderTopRightRadius: "8px" }}
                                >
                                    Total (cor)
                                </div>

                                {/* Corpo — cores */}
                                {itens.length > 0 ? (
                                    itens.map((item, index) => {
                                        let totalCor = 0;
                                        const rowBg = index % 2 === 1 ? "bg-[#F9F9F9]" : "bg-white";
                                        return (
                                            <React.Fragment key={item.id || item.corNome || index}>
                                                <div
                                                    className={`h-[45px] flex items-center gap-3 pl-4 pr-4 ${rowBg}`}
                                                >
                                                    <span
                                                        className="w-[18px] h-[18px] rounded-[4px] shrink-0 shadow-sm border border-black/10"
                                                        style={{
                                                            backgroundColor:
                                                                item.hexColor || "#E5E5E5",
                                                        }}
                                                    />
                                                    <span className="text-[14px] font-light text-[#707070] truncate">
                                                        {item.corNome}
                                                    </span>
                                                </div>
                                                {tamanhos.map((tam) => {
                                                    const val = item.quantidades?.[tam] || "";
                                                    return (
                                                        <div
                                                            key={`qty-${item.id || index}-${tam}`}
                                                            className={`h-[45px] flex items-center justify-center text-[14px] font-light text-[#707070] ${rowBg}`}
                                                        >
                                                            {val}
                                                        </div>
                                                    );
                                                })}
                                                <div
                                                    className={`h-[45px] flex items-center justify-center text-[14px] font-normal text-[#707070] ${rowBg}`}
                                                >
                                                    {totalCor || "-"}
                                                </div>
                                            </React.Fragment>
                                        );
                                    })
                                ) : (
                                    <div
                                        className="py-4 text-center text-[13px] text-[#888] bg-white"
                                        style={{ gridColumn: `1 / span ${colunasGrid + 2}` }}
                                    >
                                        Nenhuma cor vinculada a esta nota.
                                    </div>
                                )}

                                {/* Rodapé */}
                                <div
                                    className="h-[45px] flex items-center justify-center text-[14px] font-normal text-[#4696AD] bg-[#C9EAF6]"
                                    style={{ borderBottomLeftRadius: "8px" }}
                                >
                                    Total (tamanho)
                                </div>
                                {tamanhos.map((tam) => (
                                    <div
                                        key={`total-rodape-${tam}`}
                                        className="h-[45px] flex items-center justify-center text-[14px] font-normal text-[#4696AD] bg-[#C9EAF6]"
                                    >
                                        {totaisPorTamanho[tam]}
                                    </div>
                                ))}
                                <div
                                    className="h-[45px] flex items-center justify-center text-[14px] font-normal text-[#4696AD] bg-[#C9EAF6]"
                                    style={{ borderBottomRightRadius: "8px" }}
                                >
                                    {totalGeral}
                                </div>
                            </div>

                            {/* divisórias verticais */}
                            <div
                                className="absolute left-0 right-0 pointer-events-none"
                                style={{ top: "40px", bottom: 0 }}
                            >
                                <div
                                    style={{
                                        display: "grid",
                                        gridTemplateColumns: `160px repeat(${colunasGrid}, 1fr) 80px`,
                                        height: "100%",
                                    }}
                                >
                                    <div />
                                    {tamanhos.map((tam, i) => (
                                        <div
                                            key={`divider-${tam}`}
                                            style={{
                                                borderLeft: i === 0 ? darkSide : "none",
                                                borderRight: darkSide,
                                            }}
                                        />
                                    ))}
                                    <div />
                                </div>
                            </div>

                            {/* moldura externa */}
                            <div
                                className="absolute left-0 right-0 top-0 bottom-0 pointer-events-none rounded-[8px]"
                                style={{ border: shellSide }}
                            />
                        </div>
                    </div>

                    {/* ANOTAÇÕES */}
                    <div className="mx-[30px] relative mt-5 break-inside-avoid">
                        <fieldset className="border border-[#D9D9D9] rounded-[10px] p-4 bg-white min-h-[110px]">
                            <legend className="px-2 text-[12px] text-[#898C8F] ml-2 font-light bg-white">
                                Anotações
                            </legend>
                            <p className="text-[13px] text-[#707070] whitespace-pre-line font-light px-2 pt-1">
                                {dados.anotacoes || ""}
                            </p>
                        </fieldset>
                    </div>

                    {/* FOOTER */}
                    <div className="flex justify-between items-end mt-6 mx-4 pb-4 break-inside-avoid">
                        {dados.logoEsquerdaUrl ? (
                            <img
                                src={dados.logoEsquerdaUrl}
                                alt="PV Lab"
                                className="h-[35px] object-contain"
                            />
                        ) : (
                            <div className="leading-none">
                                <span className="text-[18px] font-semibold text-[#1a1a1a]">
                                    pvlab.
                                </span>
                                <div className="text-[8px] text-[#707070]">
                                    produzindo com sua identidade
                                </div>
                            </div>
                        )}

                        {dados.logoDireitaUrl ? (
                            <img
                                src={dados.logoDireitaUrl}
                                alt="Logo filo"
                                className="w-[59px] h-[35px] object-contain"
                            />
                        ) : (
                            <span className="text-[24px] font-bold text-[#4696AD]">Filo</span>
                        )}
                    </div>
                </div>
            </div>
        </>,
        document.body,
    );

    return printContent;
}
