import React, { useState } from "react";
import { parsePreco } from "../../utils/preco";

export default function TabelaReferenciaFichaTecnica({
    fichas = [],
    isSobDemanda = true,
    onRemoverFicha,
    onAtualizarFicha,
    onEditarFicha,
    onAbrirFicha,
    somenteLeitura = false,
    bloqueada = false,
}) {
    const [idEmEdicao, setIdEmEdicao] = useState(null);

    // Formatação de moeda para exibição normal (Subtotal, Total)
    const formatarMoeda = (valor) => {
        const num = parsePreco(valor);
        return num.toLocaleString("pt-BR", {
            style: "currency",
            currency: "BRL",
            minimumFractionDigits: 2,
        });
    };

    // Formatação em tempo real para o input de preço (máscara acumulativa: 0,00 -> 0,01 -> 0,10 -> 1,00)
    const formatarInputMoeda = (valor) => {
        if (valor === "" || valor === null || valor === undefined) return "0,00";

        let str = "";
        if (typeof valor === "number") {
            if (!Number.isFinite(valor)) return "0,00";
            str = valor.toFixed(2);
        } else {
            str = String(valor).trim();
            if (/^\d+(\.\d+)?$/.test(str)) {
                str = Number(str).toFixed(2);
            }
        }

        const apenasNumeros = str.replace(/\D/g, "");
        if (!apenasNumeros) return "0,00";

        const valorEmCentavos = parseInt(apenasNumeros, 10) / 100;
        return valorEmCentavos.toLocaleString("pt-BR", {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
        });
    };

    const gridColsClass = isSobDemanda
        ? "grid grid-cols-1 md:grid-cols-7 w-full items-stretch"
        : "grid grid-cols-1 md:grid-cols-6 w-full items-stretch";

    const formatarCores = (cores) => {
        if (!cores || cores.length === 0) return "-";
        if (Array.isArray(cores)) {
            return cores.map((cor) => (typeof cor === "object" ? cor.nome : cor)).join(", ");
        }
        return String(cores);
    };

    const totalQuantidade = fichas.reduce(
        (acc, ficha) => acc + (Number(ficha.quantidade) || Number(ficha.quantidade_pecas) || 0),
        0,
    );

    const obterValorUnitario = (ficha) => {
        const valorRaw = isSobDemanda
            ? (ficha.preco_padrao ?? ficha.preco_unitario ?? ficha.preco ?? 0)
            : (ficha.custo_total ?? ficha.custo_unitario ?? ficha.custo ?? 0);
        return parsePreco(valorRaw);
    };

    const totalPedido = fichas.reduce((acc, ficha) => {
        const qtd = Number(ficha.quantidade) || Number(ficha.quantidade_pecas) || 0;
        const valorUnitario = obterValorUnitario(ficha);
        const subtotal =
            isSobDemanda && ficha.subtotal !== undefined
                ? parsePreco(ficha.subtotal)
                : qtd * valorUnitario;
        return acc + subtotal;
    }, 0);

    const campoBloqueadoClass =
        "flex flex-col items-start md:items-center justify-center md:text-center gap-1 md:gap-0 px-4 py-2 md:px-2 md:py-0 min-w-0 break-words [overflow-wrap:anywhere] text-sm md:text-base text-[#404040] cursor-not-allowed";

    const rotuloMobileClass = "md:hidden text-base font-light text-[#898C8F]";

    const handleAlternarEdicao = (itemKey) => {
        if (bloqueada) return;
        setIdEmEdicao((prevKey) => (prevKey === itemKey ? null : itemKey));
        onEditarFicha?.(itemKey);
    };

    const handleInputBlur = (e, itemKey) => {
        const proximoFoco = e.relatedTarget;
        if (!proximoFoco || proximoFoco.getAttribute("data-itemkey") !== String(itemKey)) {
            if (idEmEdicao === itemKey) {
                setIdEmEdicao(null);
            }
        }
    };

    return (
        <section className="w-full min-w-0 max-w-full overflow-x-auto">
            <div className="flex flex-col w-full md:min-w-[700px]">
                {/* 1. CABEÇALHO DA TABELA */}
                <div className="hidden md:flex flex-row items-center w-full">
                    <div className="flex-1 min-w-0 rounded-t-[16px] border-t border-l border-r border-[#d9d9d9] bg-[#d9d9d9] overflow-hidden">
                        <div
                            className={`${gridColsClass} text-[#898C8F] text-base font-['Outfit'] font-light min-h-[48px]`}
                        >
                            <div className="flex items-center justify-center px-2" />
                            <div className="flex items-center justify-center text-center px-2">
                                Ref. interna
                            </div>
                            {isSobDemanda && (
                                <div className="flex items-center justify-center text-center px-2">
                                    Ref. cliente
                                </div>
                            )}
                            <div className="flex items-center justify-center text-center px-2">
                                Cores
                            </div>
                            <div className="flex items-center justify-center text-center px-2">
                                Quantidade
                            </div>
                            <div className="flex items-center justify-center text-center px-2">
                                {isSobDemanda ? "Preço unit." : "Custo unit."}
                            </div>
                            <div className="flex items-center justify-center text-center px-2">
                                {isSobDemanda ? "Subtotal" : "Subcusto"}
                            </div>
                        </div>
                    </div>
                    {!somenteLeitura && <div className="w-9" />}
                </div>

                {/* 2. CORPO DA TABELA */}
                {fichas.length > 0 ? (
                    <div className="flex flex-col gap-4 md:gap-0 w-full">
                        {fichas.map((ficha, index) => {
                            const itemKey = ficha.id ?? index;
                            const qtd =
                                Number(ficha.quantidade) || Number(ficha.quantidade_pecas) || 0;
                            const valPrecoRaw =
                                ficha.preco_padrao ?? ficha.preco_unitario ?? ficha.preco ?? "";
                            const valorUnitario = obterValorUnitario(ficha);

                            const subtotal =
                                isSobDemanda && ficha.subtotal !== undefined
                                    ? parsePreco(ficha.subtotal)
                                    : qtd * valorUnitario;
                            const refClienteValor =
                                ficha.referenciaCliente ?? ficha.ref_cliente ?? "";
                            const isEditando =
                                !somenteLeitura && !bloqueada && idEmEdicao === itemKey;

                            const podeAbrirFicha = Boolean(onAbrirFicha) && !bloqueada;

                            return (
                                <div
                                    key={itemKey}
                                    className="group flex flex-col md:flex-row md:items-center w-full min-w-0 rounded-2xl border border-[#d9d9d9] overflow-hidden md:rounded-none md:border-0 md:overflow-visible"
                                >
                                    {/* Linha da Tabela */}
                                    <div
                                        role={podeAbrirFicha ? "button" : undefined}
                                        tabIndex={podeAbrirFicha ? 0 : undefined}
                                        onClick={() => {
                                            if (!podeAbrirFicha) return;
                                            onAbrirFicha?.(ficha, itemKey);
                                        }}
                                        onKeyDown={(e) => {
                                            if (!podeAbrirFicha) return;
                                            if (e.key === "Enter" || e.key === " ") {
                                                e.preventDefault();
                                                onAbrirFicha?.(ficha, itemKey);
                                            }
                                        }}
                                        className={`w-full min-w-0 flex-1 md:border-l md:border-r md:border-b border-[#d9d9d9] bg-white ${
                                            podeAbrirFicha
                                                ? "cursor-pointer hover:bg-[#F7FCFD] transition-colors"
                                                : ""
                                        }`}
                                    >
                                        <div
                                            className={`${gridColsClass} text-[#404040] font-['Outfit'] font-light min-h-[120px] md:min-h-[140px]`}
                                        >
                                            {/* 1. Foto */}
                                            <div className="md:border-r border-[#d9d9d9] p-3 flex items-center justify-center bg-white cursor-not-allowed">
                                                {ficha.foto ? (
                                                    <img
                                                        src={ficha.foto}
                                                        alt="Produto"
                                                        className="w-full max-w-[120px] md:max-w-[145px] h-[85px] md:h-[105px] object-cover rounded-[12px]"
                                                    />
                                                ) : (
                                                    <div className="w-full max-w-[120px] md:max-w-[145px] h-[85px] md:h-[105px] bg-gray-50 rounded-[12px] flex items-center justify-center text-xs text-gray-400 border border-dashed border-gray-200 text-center px-1">
                                                        Sem foto
                                                    </div>
                                                )}
                                            </div>

                                            {/* 2. Ref. interna */}
                                            <div
                                                className={`md:border-r border-[#d9d9d9] ${campoBloqueadoClass}`}
                                            >
                                                <span className={rotuloMobileClass}>
                                                    Ref. interna
                                                </span>
                                                {ficha.referenciaInterna ||
                                                    ficha.ref_interna ||
                                                    "-"}
                                            </div>

                                            {/* 3. Ref. cliente */}
                                            {isSobDemanda && (
                                                <div
                                                    className="md:border-r border-[#d9d9d9] flex flex-col items-start md:items-center justify-center gap-1 md:gap-0 px-4 py-2 md:px-2 md:py-0 min-w-0 break-words [overflow-wrap:anywhere] md:text-center text-sm md:text-base text-[#404040]"
                                                    onClick={(e) => e.stopPropagation()}
                                                    onKeyDown={(e) => e.stopPropagation()}
                                                >
                                                    <span className={rotuloMobileClass}>
                                                        Ref. cliente
                                                    </span>
                                                    {isEditando ? (
                                                        <input
                                                            type="text"
                                                            aria-label="Referência do cliente"
                                                            data-itemkey={itemKey}
                                                            value={refClienteValor}
                                                            onClick={(e) => e.stopPropagation()}
                                                            onChange={(e) => {
                                                                onAtualizarFicha?.(
                                                                    itemKey,
                                                                    "referenciaCliente",
                                                                    e.target.value,
                                                                );
                                                            }}
                                                            onBlur={(e) =>
                                                                handleInputBlur(e, itemKey)
                                                            }
                                                            placeholder="Ref. Cliente"
                                                            className="w-full min-h-11 md:min-h-0 text-left md:text-center bg-transparent outline-none focus:outline-none text-sm md:text-base font-['Outfit'] text-[#404040] min-w-0 p-0"
                                                        />
                                                    ) : (
                                                        refClienteValor || "-"
                                                    )}
                                                </div>
                                            )}

                                            {/* 4. Cores */}
                                            <div
                                                className={`md:border-r border-[#d9d9d9] ${campoBloqueadoClass}`}
                                            >
                                                <span className={rotuloMobileClass}>Cores</span>
                                                {formatarCores(ficha.cores)}
                                            </div>

                                            {/* 5. Quantidade */}
                                            <div
                                                className={`border-t md:border-t-0 md:border-r border-[#d9d9d9] ${campoBloqueadoClass} font-light`}
                                            >
                                                <span className={rotuloMobileClass}>
                                                    Quantidade
                                                </span>
                                                {qtd}
                                            </div>

                                            {/* 6. Preço unit. / Custo unit. */}
                                            <div
                                                className="md:border-r border-[#d9d9d9] flex flex-col items-start md:items-center justify-center gap-1 md:gap-0 px-4 py-2 md:px-2 md:py-0 min-w-0 break-words [overflow-wrap:anywhere] md:text-center text-sm md:text-base text-[#404040]"
                                                onClick={(e) => e.stopPropagation()}
                                                onKeyDown={(e) => e.stopPropagation()}
                                            >
                                                <span className={rotuloMobileClass}>
                                                    {isSobDemanda ? "Preço unit." : "Custo unit."}
                                                </span>
                                                {isSobDemanda && isEditando ? (
                                                    <div className="relative w-full min-w-0 flex items-center justify-center">
                                                        <input
                                                            type="text"
                                                            aria-label="Preço unitário"
                                                            inputMode="decimal"
                                                            data-itemkey={itemKey}
                                                            value={`R$ ${formatarInputMoeda(valPrecoRaw)}`}
                                                            onClick={(e) => e.stopPropagation()}
                                                            onChange={(e) => {
                                                                const valFormatado =
                                                                    formatarInputMoeda(
                                                                        e.target.value,
                                                                    );
                                                                onAtualizarFicha?.(
                                                                    itemKey,
                                                                    "preco_padrao",
                                                                    valFormatado,
                                                                );
                                                            }}
                                                            onBlur={(e) =>
                                                                handleInputBlur(e, itemKey)
                                                            }
                                                            placeholder="R$ 0,00"
                                                            className="w-full min-w-0 min-h-11 md:min-h-0 text-left md:text-center bg-transparent outline-none focus:outline-none text-sm md:text-base font-['Outfit'] text-[#404040] p-0"
                                                        />
                                                    </div>
                                                ) : (
                                                    <span
                                                        className={
                                                            !isSobDemanda
                                                                ? "cursor-not-allowed"
                                                                : undefined
                                                        }
                                                    >
                                                        {formatarMoeda(valorUnitario)}
                                                    </span>
                                                )}
                                            </div>

                                            {/* 7. Subtotal */}
                                            <div className={`${campoBloqueadoClass} font-light`}>
                                                <span className={rotuloMobileClass}>
                                                    {isSobDemanda ? "Subtotal" : "Subcusto"}
                                                </span>
                                                {formatarMoeda(subtotal)}
                                            </div>
                                        </div>
                                    </div>

                                    {!somenteLeitura && (
                                        <div
                                            className="w-full md:w-9 shrink-0 flex flex-row md:flex-col items-center justify-end md:justify-center gap-2 p-2 md:p-0 md:pl-2 border-t md:border-t-0 border-[#d9d9d9] transition-opacity duration-200"
                                            onClick={(e) => e.stopPropagation()}
                                        >
                                            <button
                                                type="button"
                                                data-itemkey={itemKey}
                                                disabled={bloqueada}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleAlternarEdicao(itemKey);
                                                }}
                                                className={`group/edit min-w-11 min-h-11 md:min-w-0 md:min-h-0 flex items-center justify-center p-1 transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:opacity-50 ${
                                                    isEditando ? "opacity-100 scale-110" : ""
                                                }`}
                                                title={
                                                    isEditando
                                                        ? "Concluir edição"
                                                        : "Editar preço/referência"
                                                }
                                            >
                                                <img
                                                    src="/editar-branco.png"
                                                    alt="Editar"
                                                    className="w-4 h-4 block group-hover/edit:hidden"
                                                />
                                                <img
                                                    src="/editar-azul.png"
                                                    alt="Editar"
                                                    className="w-4 h-4 hidden group-hover/edit:block"
                                                />
                                            </button>

                                            <button
                                                type="button"
                                                disabled={bloqueada}
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    onRemoverFicha?.(itemKey);
                                                }}
                                                className="group/delete min-w-11 min-h-11 md:min-w-0 md:min-h-0 flex items-center justify-center p-1 transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:opacity-50"
                                                title="Excluir ficha"
                                            >
                                                <img
                                                    src="/excluir-cinza-claro.png"
                                                    alt="Remover"
                                                    className="w-4 h-4 block group-hover/delete:hidden"
                                                />
                                                <img
                                                    src="/excluir-vermelho.png"
                                                    alt="Remover"
                                                    className="w-4 h-4 hidden group-hover/delete:block"
                                                />
                                            </button>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-row items-center w-full">
                        <div className="min-w-0 flex-1 rounded-2xl md:rounded-none border md:border-t-0 border-[#d9d9d9] px-4 py-12 text-center text-[#898C8F] font-['Outfit'] font-light bg-[#F9F9F9] text-sm md:text-base">
                            Nenhuma ficha técnica adicionada ao pedido.
                        </div>
                        {!somenteLeitura && <div className="hidden md:block w-9 shrink-0" />}
                    </div>
                )}

                {/* 3. RODAPÉ DA TABELA */}
                {fichas.length > 0 && (
                    <div className="flex flex-row items-center w-full mt-4 md:mt-0">
                        <div className="min-w-0 flex-1 rounded-2xl md:rounded-t-none border md:border-t-0 border-[#d9d9d9] bg-[#d9d9d9] px-4 md:px-6 py-3.5 flex flex-col md:flex-row md:flex-wrap items-start md:items-center gap-3 lg:gap-0 justify-between text-[#898C8F] font-['Outfit'] text-sm md:text-base">
                            <span className="font-['Outfit'] text-[#898C8F]">
                                {isSobDemanda ? "Resumo do pedido" : "Resumo da produção"}
                            </span>
                            <div className="flex flex-col md:flex-row md:items-center font-['Outfit'] gap-2 md:gap-6 text-[#898C8F]">
                                <div>
                                    Total de peças:{" "}
                                    <span className="font-light font-['Outfit']">
                                        {totalQuantidade}
                                    </span>
                                </div>
                                <div className="hidden md:block h-4 w-[1px] bg-[#a0a3a6] font-['Outfit']" />
                                <div>
                                    {isSobDemanda ? "Total do pedido: " : "Custo total: "}
                                    <span className="font-light font-['Outfit']">
                                        {formatarMoeda(totalPedido)}
                                    </span>
                                </div>
                            </div>
                        </div>
                        {!somenteLeitura && <div className="hidden md:block w-9 shrink-0" />}
                    </div>
                )}
            </div>
        </section>
    );
}
