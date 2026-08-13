    import React, { useMemo, useState, useEffect } from "react";
    import { createPortal } from "react-dom";
    import { getFabricoById } from "../services/fabricoService";

    // Helper para padronizar o ajuste manual de alinhamento vertical em labels/textos
    const TextoAjustado = ({ children, className = "", printReset = true }) => (
        <span className={`${printReset ? "-translate-y-[6px] print:translate-y-0" : ""} ${className}`}>
            {children}
        </span>
    );

    const Campo = ({ label, valor }) => (
        <div className="relative border border-[#666666] rounded-[10px] min-h-[39px] py-1.5 px-3 flex items-center bg-white">
            <span className="absolute -top-[9px] left-2 bg-white px-1 text-[11px] text-[#555555] flex items-center">
                <TextoAjustado>{label}</TextoAjustado>
            </span>
            <span className="text-[14px] text-[#333333] leading-tight flex items-center h-full">
                <TextoAjustado>{valor || "-"}</TextoAjustado>
            </span>
        </div>
    );

    const Badge = ({ label, valor }) => (
        <div className="border border-[#4696AD] rounded-[20px] h-[38px] min-w-[70px] relative flex items-center justify-center px-4 bg-white">
            <span className="absolute -top-[9px] left-3 bg-white px-1 text-[11px] text-[#4696AD] flex items-center">
                <TextoAjustado>{label}</TextoAjustado>
            </span>
            <span className="text-[15px] font-medium text-[#4696AD] flex items-center h-full">
                <TextoAjustado>{valor || "--"}</TextoAjustado>
            </span>
        </div>
    );

    export default function NotaDeSaidaPrintView({
        ficha,
        referenciaCliente,
        dados: dadosProp,
        onReadyToPrint,
        forceVisibleForPdf = false,
    }) {
        const [isMounted, setIsMounted] = useState(false);
        const [fabricoInfo, setFabricoInfo] = useState(null);

        useEffect(() => {
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
            if (dadosProp) return { anotacoes: "", ...dadosProp };
            if (!ficha) return null;

            const fornecedor =
                ficha?.fabrico?.nome_fantasia ||
                fabricoInfo?.nome_fantasia ||
                ficha?.ficha_parceiro?.[0]?.parceiro?.nome ||
                "-";
            const dataFormatada = new Date().toLocaleDateString("pt-BR");

            return {
                numeroNota: ficha.numero ? String(ficha.numero) : "-",
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
                    itens: dadosProp.itens || [],
                    totaisPorTamanho: dadosProp.totaisPorTamanho || {},
                    totalGeral: dadosProp.totalGeral ?? "",
                    proporcoes: dadosProp.proporcoes || listaTamanhos.map(() => ""),
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
                            margin: 10mm 0mm 15mm 0mm; 
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
                            #nota-print-view .grade-table {
                                break-inside: avoid-page !important;
                                page-break-inside: avoid !important;
                            }
                            #nota-print-view .grade-row {
                                break-inside: avoid !important;
                                page-break-inside: avoid !important;
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
                                padding-bottom: 60px !important;
                            }

                            .print-footer {
                                position: fixed !important;
                                bottom: 0 !important;
                                left: 0 !important;
                                right: 0 !important;
                                width: 100% !important;
                                background-color: white !important;
                                padding-bottom: 5mm !important;
                            }

                            .break-inside-avoid {
                                break-inside: avoid !important;
                                page-break-inside: avoid !important;
                            }
                        }
                    `}
                </style>

                <div
                    id="portal-impressao-nota"
                    className={`${forceVisibleForPdf ? "block" : "hidden print:block"} w-full`}
                    style={
                        forceVisibleForPdf
                            ? {
                                position: "absolute",
                                left: 0,
                                top: "-10000px",
                                width: "210mm",
                                visibility: "visible",
                                zIndex: 99999,
                                pointerEvents: "none",
                                opacity: 1,
                                display: "block",
                            }
                            : undefined
                    }
                >
                    <div
                        id="nota-print-view"
                        className="bg-white text-black p-5 w-full max-w-[260mm] min-h-[280mm] mx-auto font-['Outfit',_sans-serif] flex flex-col justify-between box-border"
                    >
                        <div className="flex-1">
                            {/* HEADER */}
                            <div className="flex justify-between items-start mb-6 mx-[30px] break-inside-avoid">
                                <h1 className="text-[28px] font-light text-[#4696AD] flex items-center">
                                    <TextoAjustado>Nota de saída</TextoAjustado>
                                </h1>
                                <div className="flex gap-4 mt-2">
                                    <span className="flex items-center gap-2">
                                        <Badge label="Nº" valor={dados.numeroNota} />
                                    </span>
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
                                        <Campo
                                            label="Referência Interna"
                                            valor={dados.referenciaInterna}
                                        />
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
                            <div className="mb-4 mx-[30px] print-no-break">
                                <div className="mb-2 text-center text-[15px] font-light text-[#555555]">
                                    <TextoAjustado>Grade</TextoAjustado>
                                </div>

                                <table
                                    className="w-full border-collapse grade-table"
                                    style={{ tableLayout: "fixed" }}
                                >
                                    <colgroup>
                                        <col style={{ width: "160px" }} />
                                        {tamanhos.map((tam, i) => (
                                            <col key={`col-${tam}-${i}`} />
                                        ))}
                                        <col style={{ width: "100px" }} />
                                    </colgroup>

                                    <thead>
                                        {/* linha de proporções */}
                                        <tr>
                                            <td className="bg-transparent" />
                                            {tamanhos.map((tam, index) => {
                                                const isFirst = index === 0;
                                                const isLast = index === tamanhos.length - 1;
                                                return (
                                                    <td
                                                        key={`prop-${tam}`}
                                                        className={`h-[25px] text-center text-[13px] font-light text-[#555555] bg-[#F4F4F4] border-t border-b border-r border-[#666666] ${
                                                            isFirst ? "border-l rounded-tl-[8px]" : ""
                                                        } ${isLast ? "rounded-tr-[8px]" : ""}`}
                                                    >
                                                        <TextoAjustado>
                                                            {proporcoes[index] || ""}
                                                        </TextoAjustado>
                                                    </td>
                                                );
                                            })}
                                            <td className="bg-transparent" />
                                        </tr>

                                        {/* cabeçalho */}
                                        <tr>
                                            <th className="h-[35px] px-4 text-left font-medium bg-[#C9EAF6] text-[#4696AD] rounded-l-[8px]">
                                                <span className="flex items-center gap-3 h-full translate-x-[43px] print:translate-x-0">
                                                    <TextoAjustado>Cores</TextoAjustado>
                                                </span>
                                            </th>
                                            {tamanhos.map((tam, index) => {
                                                const isFirst = index === 0;
                                                return (
                                                    <th
                                                        key={`header-${tam}`}
                                                        className={`h-[35px] text-center text-[14px] font-medium text-[#4696AD] bg-[#C9EAF6] border-r border-[#666666] ${
                                                            isFirst ? "border-l" : ""
                                                        }`}
                                                    >
                                                        <TextoAjustado>{tam}</TextoAjustado>
                                                    </th>
                                                );
                                            })}
                                            <th className="h-[35px] text-center text-[14px] font-medium text-[#4696AD] bg-[#C9EAF6] rounded-r-[8px]">
                                                <TextoAjustado>Total (cor)</TextoAjustado>
                                            </th>
                                        </tr>
                                    </thead>

                                    <tbody>
                                        {itens.length > 0 ? (
                                            itens.map((item, index) => {
                                                const rowBg =
                                                    index % 2 === 1 ? "bg-[#F9F9F9]" : "bg-white";
                                                return (
                                                    <tr
                                                        key={item.id || item.corNome || index}
                                                        className="grade-row"
                                                    >
                                                        <td className={`h-[35px] pl-4 pr-4 ${rowBg}`}>
                                                            <span className="flex items-center gap-3">
                                                                <span
                                                                    className="w-[18px] h-[18px] rounded-[4px] shrink-0 shadow-sm border border-black/30"
                                                                    style={{
                                                                        backgroundColor:
                                                                            item.hexColor ||
                                                                            item.corHex ||
                                                                            "#E5E5E5",
                                                                    }}
                                                                />
                                                                <span className="text-[14px] font-light text-[#333333]">
                                                                    <TextoAjustado>
                                                                        {item.corNome || item.cor}
                                                                    </TextoAjustado>
                                                                </span>
                                                            </span>
                                                        </td>
                                                        {tamanhos.map((tam, tIdx) => {
                                                            const isFirst = tIdx === 0;
                                                            const val = item.quantidades?.[tam] ?? "";
                                                            return (
                                                                <td
                                                                    key={`qty-${item.id || index}-${tam}`}
                                                                    className={`h-[35px] text-center text-[14px] font-light text-[#333333] ${rowBg} border-r border-[#666666] ${
                                                                        isFirst ? "border-l" : ""
                                                                    }`}
                                                                >
                                                                    <TextoAjustado>{val}</TextoAjustado>
                                                                </td>
                                                            );
                                                        })}
                                                        <td
                                                            className={`h-[35px] text-center text-[14px] font-normal text-[#333333] ${rowBg}`}
                                                        >
                                                            <TextoAjustado>
                                                                {item.totalCor ?? item.total ?? ""}
                                                            </TextoAjustado>
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td className="h-[35px] pl-4 bg-white text-[13px] text-[#555555]">
                                                    <TextoAjustado>Nenhuma cor vinculada</TextoAjustado>
                                                </td>
                                                {tamanhos.map((tam, tIdx) => (
                                                    <td
                                                        key={`empty-${tam}`}
                                                        className={`h-[35px] bg-white border-r border-[#666666] ${
                                                            tIdx === 0 ? "border-l" : ""
                                                        }`}
                                                    />
                                                ))}
                                                <td className="h-[35px] bg-white" />
                                            </tr>
                                        )}
                                    </tbody>

                                    <tfoot>
                                        <tr>
                                            <th className="h-[35px] px-4 text-left text-[14px] font-medium text-[#4696AD] bg-[#C9EAF6] rounded-l-[8px]">
                                                <span className="flex items-center gap-3 h-full translate-x-[15px] print:translate-x-0">
                                                    <TextoAjustado>Total (tamanho)</TextoAjustado>
                                                </span>
                                            </th>
                                            {tamanhos.map((tam, index) => {
                                                const isFirst = index === 0;
                                                const isLast = index === tamanhos.length - 1;
                                                return (
                                                    <td
                                                        key={`total-rodape-${tam}`}
                                                        className={`h-[35px] text-center text-[14px] font-normal text-[#333333] ${footerRowBg} border-b border-r border-[#666666] ${
                                                            isFirst ? "border-l rounded-bl-[8px]" : ""
                                                        } ${isLast ? "rounded-br-[8px]" : ""}`}
                                                    >
                                                        <TextoAjustado>
                                                            {totaisPorTamanho[tam] || ""}
                                                        </TextoAjustado>
                                                    </td>
                                                );
                                            })}
                                            <td className="h-[35px] text-center text-[14px] font-medium text-[#2c6e80] bg-[#C9EAF6] rounded-r-[8px]">
                                                <TextoAjustado>{totalGeral || ""}</TextoAjustado>
                                            </td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>

                            {/* ANOTAÇÕES */}
                            <div className="mx-[30px] relative mt-5 break-inside-avoid">
                                <fieldset className="border border-[#666666] rounded-[10px] p-4 bg-white min-h-[200px]">
                                    <legend className="px-2 text-[12px] text-[#555555] ml-2 font-light bg-white">
                                        <TextoAjustado>
                                            <span className="inline-block -translate-y-[10px] print:translate-y-0">
                                                Anotações
                                            </span>
                                        </TextoAjustado>
                                    </legend>
                                    <p className="text-[13px] text-[#333333] whitespace-pre-line font-light px-2 pt-1">
                                        {dados.anotacoes}
                                    </p>
                                </fieldset>
                            </div>
                        </div>

                        {/* FOOTER */}
                        <div className="print-footer mt-auto pt-6 pb-2 opacity-70">
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
