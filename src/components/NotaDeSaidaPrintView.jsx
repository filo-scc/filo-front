import React, { useMemo, useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { getFabricoById } from "../services/fabricoService";

// AJUSTE: cinza das linhas alternadas da grade na impressão.
const PRINT_ROW_GRAY = "bg-[#D9D9D9]";

// Helper para padronizar o ajuste manual de alinhamento vertical em labels/textos
const TextoAjustado = ({ children, className = "", printReset = true }) => (
    <span className={`${printReset ? "-translate-y-[6px] print:translate-y-0" : ""} ${className}`}>
        {children}
    </span>
);

const Campo = ({ label, valor }) => (
    <div className="relative border border-[#666666] rounded-[10px] min-h-[39px] py-1.5 px-3 flex items-center bg-white">
        <span className="absolute -top-[9px] left-2 bg-white px-1 text-[11px] text-[#555555]">
            {label}
        </span>
        <span className="text-[14px] text-[#333333] leading-tight">{valor || "-"}</span>
    </div>
);

const Badge = ({ label, valor }) => (
    <div className="border border-[#4696AD] rounded-[14px] h-[38px] min-w-[70px] relative flex items-center justify-center px-4 bg-white">
        <span className="absolute -top-[9px] left-3 bg-white px-1 text-[11px] text-[#4696AD] flex items-center">
            <TextoAjustado>{label}</TextoAjustado>
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

    const dados = useMemo(() => {
        if (dadosProp) return { ...dadosProp, anotacoes: "" };
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
            imagemUrl: ficha.produto?.foto || "/image-delete-02-2.png",
            anotacoes: "",
        };
    }, [ficha, referenciaCliente, dadosProp, fabricoInfo]);

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

    const footerRowBg = itens.length % 2 === 1 ? PRINT_ROW_GRAY : "bg-white";
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
                                display: block !important;
                                padding: 10mm !important;
                            }

                            .print-footer {
                                position: static !important;
                                bottom: 0 !important;
                                left: 0 !important;
                                right: 0 !important;
                                width: 100% !important;
                                background-color: white !important;
                                padding-bottom: 0 !important;
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
                    className="bg-white text-black p-[10mm] w-full max-w-[210mm] mx-auto font-['Outfit',_sans-serif] flex flex-col justify-between box-border"
                    className="bg-white text-black p-5 w-full max-w-[260mm] mx-auto font-['Outfit',_sans-serif]"
                >
                    <div className="flex-1">
                        {/* HEADER */}
                        <div className="flex justify-between items-start mb-6 mx-0 break-inside-avoid">
                            <h1 className="text-[28px] font-light text-[#4696AD] flex items-center">
                                <TextoAjustado>
                                    {isProducaoSobDemanda ? "Nota de saída" : "Nota de Conferência"}
                                </TextoAjustado>
                            </h1>
                            <div className="flex gap-4 mt-2">
                                <span className="flex items-center gap-2">
                                    <Badge label="Nº" valor={dados.numeroNota} />
                                </span>
                                <Badge
                                    label={isProducaoSobDemanda ? "Pedido" : "Produção"}
                                    valor={dados.numeroPedido}
                                />
                            </div>
                        </div>
                    {/* HEADER */}
                    <div className="flex justify-between items-start mb-6 mx-[30px] break-inside-avoid">
                        <h1 className="text-[28px] font-light text-[#4696AD]">Nota de saída</h1>
                        <div className="flex gap-4 mt-2">
                            <Badge label="Nº" valor={dados.numeroNota} />
                            <Badge label="Pedido" valor={dados.numeroPedido} />
                        </div>
                    </div>

                        {/* CAMPOS + FOTO */}
                        <div className="flex gap-6 mb-6 mx-0 break-inside-avoid">
                            <div className="flex-1 flex flex-col justify-end gap-5 pb-1">
                                {/* Primeira linha: Fornecedor */}
                                <div className="grid grid-cols-2 gap-4">
                                    <Campo label="Fornecedor" valor={dados.fornecedor} />
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
                                    <>
                                        {/* Segunda linha: Data | Cliente */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <Campo label="Data" valor={dados.data} />
                                            <Campo label="Cliente" valor={dados.cliente} />
                                        </div>

                                        {/* Terceira linha: Referência Interna | Modelo */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <Campo
                                                label="Referência Interna"
                                                valor={dados.referenciaInterna}
                                            />
                                            <Campo
                                                label="Tipo de produto"
                                                valor={ficha?.produto?.tipo_produto?.nome}
                                            />
                                        </div>

                                        {/* Quarta linha: Referência do Cliente | Tecido */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <Campo
                                                label={labelReferenciaCliente}
                                                valor={dados.referenciaCliente}
                                            />
                                            <Campo label="Tecido" valor={dados.tecido} />
                                        </div>
                                    </>
                                ) : (
                                    <>
                                        {/* Segunda linha: Data | Referência Interna */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <Campo label="Data" valor={dados.data} />
                                            <Campo
                                                label="Referência Interna"
                                                valor={dados.referenciaInterna}
                                            />
                                        </div>

                                        {/* Terceira linha: Tecido | Modelo */}
                                        <div className="grid grid-cols-2 gap-4">
                                            <Campo label="Tecido" valor={dados.tecido} />
                                            <Campo
                                                label="Tipo de produto"
                                                valor={ficha?.produto?.tipo_produto?.nome}
                                            />
                                        </div>
                                    </>
                                )}
                            </div>
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

                        {/* CONTAINER DE IMAGEM */}
                        <div className="w-[240px] h-[240px] rounded-[10px] overflow-hidden border border-[#666666] shrink-0 bg-gray-50 flex items-center justify-center">
                            {ficha?.produto?.foto ? (
                                <img
                                    src={ficha.produto.foto}
                                    alt="Produto"
                                    className="w-full h-full object-cover"
                                />
                            ) : (
                                <img
                                    src="/image-delete-02-2.png"
                                    alt="Adicionar imagem"
                                    className="w-16 h-16 object-contain opacity-70"
                                />
                            )}
                        </div>
                    </div>

                        {/* GRADE DE TAMANHOS */}
                        <div className="mb-4 mx-0 print-no-break">
                            <div className="mb-2 text-center text-[15px] font-light text-[#737373]">
                                <TextoAjustado>Grade</TextoAjustado>
                            </div>
                    {/* GRADE DE TAMANHOS */}
                    <div className="mb-4 mx-[30px] break-inside-avoid">
                        <div className="mb-2 text-center text-[15px] font-light text-[#555555]">
                            Grade
                        </div>

                        <div className="w-full">
                            <div
                                style={{
                                    display: "grid",
                                    gridTemplateColumns: `160px repeat(${colunasGrid}, 1fr) 100px`,
                                }}
                            >
                                {/* LINHA DE PROPORÇÕES */}
                                <div className="bg-transparent" />
                                {tamanhos.map((tam, index) => {
                                    const isFirst = index === 0;
                                    const isLast = index === tamanhos.length - 1;
                                    return (
                                        <div
                                            key={`prop-${tam}`}
                                            className={`h-[25px] flex items-center justify-center text-[13px] font-light text-[#555555] bg-[#F4F4F4] border-t border-b border-r border-[#666666] ${
                                                isFirst ? "border-l rounded-tl-[8px]" : ""
                                            } ${isLast ? "rounded-tr-[8px]" : ""}`}
                                        >
                                            {proporcoes[index] || ""}
                                        </div>
                                    );
                                })}
                                <div className="bg-transparent" />

                                {/* CABEÇALHO */}
                                <div className="h-[35px] flex items-center px-4 font-medium bg-[#C9EAF6] text-[#2c6e80] rounded-l-[8px]">
                                    Cores
                                </div>
                                {tamanhos.map((tam, index) => {
                                    const isFirst = index === 0;
                                    return (
                                        <div
                                            key={`header-${tam}`}
                                            className={`h-[35px] flex items-center justify-center text-[14px] font-medium text-[#2c6e80] bg-[#C9EAF6] border-r border-[#666666] ${
                                                isFirst ? "border-l" : ""
                                            }`}
                                        >
                                            {tam}
                                        </div>
                                    );
                                })}
                                <div className="h-[35px] flex items-center justify-center text-[14px] font-medium text-[#2c6e80] bg-[#C9EAF6] rounded-r-[8px]">
                                    Total (cor)
                                </div>

                                {/* Corpo + rodapé: borda externa apenas esquerda, direita e abaixo. */}
                                <div className="rounded-b-[8px] overflow-hidden">
                                    <div className="flex flex-col w-full">
                                        {itens.length > 0 ? (
                                            itens.map((item, index) => {
                                                const rowBg =
                                                    index % 2 === 1 ? PRINT_ROW_GRAY : "bg-white";
                                                return (
                                                    <div
                                                        key={item.id || item.corNome || index}
                                                        className={`grid w-full h-[35px] ${rowBg} grade-row`}
                                {/* CORPO — LINHAS DE CORES */}
                                {itens.length > 0 ? (
                                    itens.map((item, index) => {
                                        const rowBg = index % 2 === 1 ? "bg-[#F9F9F9]" : "bg-white";
                                        return (
                                            <React.Fragment key={item.id || item.corNome || index}>
                                                <div
                                                    className={`h-[35px] flex items-center gap-3 pl-4 pr-4 ${rowBg}`}
                                                >
                                                    <span
                                                        className="w-[18px] h-[18px] rounded-[4px] shrink-0 shadow-sm border border-black/30"
                                                        style={{
                                                            backgroundColor:
                                                                item.hexColor || "#E5E5E5",
                                                        }}
                                                    />
                                                    <span className="text-[14px] font-light text-[#333333] truncate">
                                                        {item.corNome}
                                                    </span>
                                                </div>
                                                {tamanhos.map((tam, tIdx) => {
                                                    const isFirst = tIdx === 0;
                                                    const val = item.quantidades?.[tam] || "";
                                                    return (
                                                        <div
                                                            key={`qty-${item.id || index}-${tam}`}
                                                            className={`h-[35px] flex items-center justify-center text-[14px] font-light text-[#333333] ${rowBg} border-r border-[#666666] ${
                                                                isFirst ? "border-l" : ""
                                                            }`}
                                                        >
                                                            {val}
                                                        </div>
                                                    );
                                                })}
                                                <div
                                                    className={`h-[35px] flex items-center justify-center text-[14px] font-normal text-[#333333] ${rowBg}`}
                                                >
                                                    {""}
                                                </div>
                                            </React.Fragment>
                                        );
                                    })
                                ) : (
                                    <>
                                        <div className="h-[35px] flex items-center pl-4 bg-white text-[13px] text-[#555555]">
                                            Nenhuma cor vinculada
                                        </div>
                                        {tamanhos.map((tam, tIdx) => (
                                            <div
                                                key={`empty-${tam}`}
                                                className={`h-[35px] bg-white border-r border-[#666666] ${
                                                    tIdx === 0 ? "border-l" : ""
                                                }`}
                                            />
                                        ))}
                                        <div className="h-[35px] bg-white" />
                                    </>
                                )}

                                {/* RODAPÉ — TOTAIS */}
                                <div className="h-[35px] flex items-center px-4 text-[14px] font-medium text-[#2c6e80] bg-[#C9EAF6] rounded-l-[8px]">
                                    Total (tamanho)
                                </div>
                                {tamanhos.map((tam, index) => {
                                    const isFirst = index === 0;
                                    const isLast = index === tamanhos.length - 1;
                                    return (
                                        <div
                                            key={`total-rodape-${tam}`}
                                            className={`h-[35px] flex items-center justify-center text-[14px] font-normal text-[#333333] ${footerRowBg} border-b border-r border-[#666666] ${
                                                isFirst ? "border-l rounded-bl-[8px]" : ""
                                            } ${isLast ? "rounded-br-[8px]" : ""}`}
                                        >
                                            {totaisPorTamanho[tam] || ""}
                                        </div>
                                    );
                                })}
                                <div className="h-[35px] flex items-center justify-center text-[14px] font-medium text-[#2c6e80] bg-[#C9EAF6] rounded-r-[8px]">
                                    {totalGeral || ""}
                                </div>
                            </div>
                        </div>
                    </div>

                        {/* ANOTAÇÕES */}
                        <div className="mx-0 relative mt-5 nota-observacoes break-inside-avoid">
                            <fieldset className="border border-[#898C8F] rounded-[10px] p-4 bg-[#F4F4F4] min-h-[180px]">
                                <legend className="px-2 text-[12px] text-[#898C8F] ml-2 font-light">
                                    <TextoAjustado>
                                        <span className="inline-block -translate-y-[10px] print:translate-y-0 bg-gradient-to-t from-[#F4F4F4] to-white px-1">
                                            Anotações
                                        </span>
                                    </TextoAjustado>
                                </legend>

                                <p className="text-[13px] text-[#707070] whitespace-pre-line font-light px-2 pt-1">
                                    {dados.anotacoes}
                                </p>
                            </fieldset>
                        </div>
                    </div>

                    {/* FOOTER */}
                    <div className="print-footer mt-auto pt-6 pb-2 w-full">
                        <div className="mx-0 flex items-end justify-between">
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
