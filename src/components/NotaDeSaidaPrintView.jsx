import React, { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { getFabricoById } from "../services/fabricoService";

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
    const [fabricoInfo, setFabricoInfo] = useState(null);

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setIsMounted(true);
    }, []);

    useEffect(() => {
        const fabricoId = ficha?.fabrico_id || ficha?.fabrico?.id;

        if (!fabricoId) {
            const timeoutId = window.setTimeout(() => setFabricoInfo(null), 0);
            return () => window.clearTimeout(timeoutId);
        }

        let isActive = true;

        const carregarFotoFabrico = async () => {
            try {
                const fabrico = await getFabricoById(fabricoId);
                if (isActive) {
                    setFabricoInfo(fabrico || null);
                }
            } catch (error) {
                console.error("Erro ao carregar foto do fabrico", error);
                if (isActive) {
                    setFabricoInfo(null);
                }
            }
        };

        carregarFotoFabrico();

        return () => {
            isActive = false;
        };
    }, [ficha?.fabrico_id, ficha?.fabrico?.id]);

    useEffect(() => {
        if (!isMounted) return undefined;
        onReadyToPrint?.();
    }, [isMounted, onReadyToPrint]);

    // 1. Normalização dos dados básicos (aceita tanto 'ficha' quanto 'dados')
    const dados = useMemo(() => {
        if (dadosProp) return dadosProp;
        if (!ficha) return null;

        const fornecedor =
            ficha?.fabrico?.nome_fantasia ||
            fabricoInfo?.nome_fantasia ||
            ficha?.ficha_parceiro?.[0]?.parceiro?.nome ||
            "-";
        const dataFormatada = new Date().toLocaleDateString("pt-BR");

        return {
            numeroNota: ficha.numero ? String(ficha.numero).padStart(4, "0") : "-",
            numeroPedido: ficha.pedido?.numero || "-",
            fornecedor,
            data: dataFormatada,
            referenciaInterna: ficha.produto?.nome || "-",
            cliente: ficha.pedido?.cliente?.nome || "-",
            referenciaCliente: referenciaCliente || "-",
            tecido: ficha.produto?.tecido?.nome || "-",
            imagemUrl: ficha.produto?.foto || null,
            anotacoes: ficha.observacoes || ficha.anotacoes || "",
        };
    }, [ficha, referenciaCliente, dadosProp, fabricoInfo]);

    // 2. Mapeamento dinâmico da Grade (Tamanhos e Cores) a partir da Ficha
    const { tamanhos, itens, totaisPorTamanho, totalGeral, proporcoes } = useMemo(() => {
        const sizeItems = ficha?.grade_versao?.itens || [];
        const listaTamanhos = sizeItems.map((s) => s.tamanho?.codigo || s.codigo || "-");

        const makeEmptyQuantidades = () =>
            listaTamanhos.reduce((acc, tam) => {
                acc[tam] = "";
                return acc;
            }, {});

        const totaisIniciais = listaTamanhos.reduce((acc, tam) => {
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
                proporcoes: listaTamanhos.map(() => ""),
            };
        }

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

            const tamanhoCodigo = item?.grade_versao_item?.tamanho?.codigo || item?.tamanho?.codigo;
            if (tamanhoCodigo) {
                coresMap[corId].quantidades[tamanhoCodigo] = "";
                totaisIniciais[tamanhoCodigo] = "";
            }
        });

        const listaItens = Object.values(coresMap);
        const proporcoesCalculadas = listaTamanhos.map(() => "");

        return {
            tamanhos: listaTamanhos,
            itens: listaItens,
            totaisPorTamanho: totaisIniciais,
            totalGeral: "",
            proporcoes: proporcoesCalculadas,
        };
    }, [ficha, dadosProp]);

    if (!dados || !isMounted) return null;

    const colunasGrid = tamanhos.length > 0 ? tamanhos.length : 1;

    const footerRowBg = itens.length % 2 === 1 ? "bg-[#F9F9F9]" : "bg-white";
    const isProducaoSobDemanda = Boolean(
        ficha?.fabrico?.fabricacao_sob_demanda ??
        ficha?.fabrico?.producao_sob_demanda ??
        fabricoInfo?.fabricacao_sob_demanda ??
        fabricoInfo?.producao_sob_demanda,
    );
    const nomeCliente = ficha?.pedido?.cliente?.nome || "cliente";
    const labelReferenciaCliente = `Referência do(a) ${nomeCliente}`;

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
                                {isProducaoSobDemanda ? (
                                    <Campo label="Cliente" valor={dados.cliente} />
                                ) : (
                                    <Campo label="Tecido" valor={dados.tecido} />
                                )}
                            </div>
                            {isProducaoSobDemanda ? (
                                <div className="grid grid-cols-2 gap-4">
                                    <Campo
                                        label={labelReferenciaCliente}
                                        valor={dados.referenciaCliente}
                                    />
                                    <Campo label="Tecido" valor={dados.tecido} />
                                </div>
                            ) : null}
                        </div>

                        <div className="w-[240px] h-[240px] rounded-[10px] overflow-hidden border border-[#D9D9D9] shrink-0 bg-gray-50 flex items-center justify-center">
                            <img
                                src={ficha?.produto?.foto || "/filo.png"}
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
                                <div className="h-[26px] bg-transparent border-0" />
                                {tamanhos.map((tam, index) => (
                                    <div
                                        key={`prop-${tam}`}
                                        className="h-[26px] flex items-center justify-center text-[13px] font-light text-[#898C8F] bg-[#F4F4F4]"
                                        style={{
                                            borderTop: darkSide,
                                            borderBottom: darkSide,
                                            borderLeft: index === 0 ? darkSide : "none",
                                            borderRight: darkSide,
                                            borderTopLeftRadius: index === 0 ? "8px" : undefined,
                                            borderTopRightRadius:
                                                index === tamanhos.length - 1 ? "8px" : undefined,
                                        }}
                                    >
                                        {proporcoes[index] || ""}
                                    </div>
                                ))}
                                <div className="h-[26px] bg-transparent border-0" />

                                <div
                                    className="h-[40px] flex items-center justify-center px-4 font-normal bg-[#C9EAF6] text-[#4696AD]"
                                    style={{
                                        borderTopLeftRadius: "8px",
                                        borderTop: darkSide,
                                        borderLeft: darkSide,
                                        borderBottom: darkSide,
                                    }}
                                >
                                    Cores
                                </div>
                                {tamanhos.map((tam, index) => (
                                    <div
                                        key={`header-${tam}`}
                                        className="h-[40px] flex items-center justify-center text-[14px] font-normal text-[#4696AD] bg-[#C9EAF6]"
                                        style={{
                                            borderTop: darkSide,
                                            borderBottom: darkSide,
                                            borderLeft: index === 0 ? darkSide : "none",
                                            borderRight: darkSide,
                                        }}
                                    >
                                        {tam}
                                    </div>
                                ))}
                                <div
                                    className="h-[40px] flex items-center justify-center text-[14px] font-normal text-[#4696AD] bg-[#C9EAF6]"
                                    style={{
                                        borderTopRightRadius: "8px",
                                        borderTop: darkSide,
                                        borderBottom: darkSide,
                                        borderRight: darkSide,
                                    }}
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
                                                    style={{
                                                        borderLeft: darkSide,
                                                        borderRight: darkSide,
                                                        borderBottom: darkSide,
                                                    }}
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
                                                            style={{
                                                                borderRight: darkSide,
                                                                borderBottom: darkSide,
                                                            }}
                                                        >
                                                            {val}
                                                        </div>
                                                    );
                                                })}
                                                <div
                                                    className={`h-[45px] flex items-center justify-center text-[14px] font-normal text-[#707070] ${rowBg}`}
                                                    style={{
                                                        borderRight: darkSide,
                                                        borderBottom: darkSide,
                                                    }}
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
                                    style={{
                                        borderBottomLeftRadius: "8px",
                                        borderLeft: darkSide,
                                        borderBottom: darkSide,
                                    }}
                                >
                                    Total (tamanho)
                                </div>
                                {tamanhos.map((tam) => (
                                    <div
                                        key={`total-rodape-${tam}`}
                                        className={`h-[45px] flex items-center justify-center text-[14px] font-normal text-[#707070] ${footerRowBg}`}
                                        style={{
                                            borderRight: darkSide,
                                            borderBottom: darkSide,
                                        }}
                                    >
                                        {totaisPorTamanho[tam]}
                                    </div>
                                ))}
                                <div
                                    className="h-[45px] flex items-center justify-center text-[14px] font-normal text-[#4696AD] bg-[#C9EAF6]"
                                    style={{
                                        borderBottomRightRadius: "8px",
                                        borderRight: darkSide,
                                        borderBottom: darkSide,
                                    }}
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
                                className="absolute left-0 right-0 top-[26px] bottom-0 pointer-events-none rounded-[8px]"
                                style={{ border: shellSide }}
                            />
                        </div>
                    </div>

                    {/* ANOTAÇÕES */}
                    <div className="mx-[30px] relative mt-5 break-inside-avoid">
                        <fieldset className="border border-[#D9D9D9] rounded-[10px] p-4 bg-white min-h-[200px]">
                            <legend className="px-2 text-[12px] text-[#898C8F] ml-2 font-light bg-white">
                                Anotações
                            </legend>
                            <p className="text-[13px] text-[#707070] whitespace-pre-line font-light px-2 pt-1">
                                {""}
                            </p>
                        </fieldset>
                    </div>
                    {/* FOOTER */}
                    <div className="mt-6 pb-4 break-inside-avoid">
                        <div className="mx-[30px] flex items-end justify-between">
                            {fabricoInfo?.foto_de_perfil ? (
                                <img
                                    src={fabricoInfo.foto_de_perfil}
                                    alt="Logo do fabrico"
                                    className="h-[35px] object-contain"
                                />
                            ) : (
                                <span className="text-[24px] font-bold text-[#4696AD]">Filo</span>
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
            </div>
        </>,
        document.body,
    );

    return printContent;
}
