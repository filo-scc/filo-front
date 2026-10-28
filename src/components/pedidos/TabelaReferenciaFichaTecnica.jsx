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
    usarTotalPersistido = false,
    valorTotalPersistido,
    possuiPerdasTecido = false,
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
        ? "grid grid-cols-6 lg:grid-cols-7 w-full items-stretch"
        : "grid grid-cols-6 w-full items-stretch";

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

    const exibirTotalPersistido = isSobDemanda && usarTotalPersistido;
    const rotuloSubtotal = isSobDemanda
        ? exibirTotalPersistido
            ? "Subtotal antes das perdas"
            : "Subtotal"
        : "Subcusto";
    const totalPedido = exibirTotalPersistido
        ? valorTotalPersistido
        : fichas.reduce((acc, ficha) => {
              const qtd = Number(ficha.quantidade) || Number(ficha.quantidade_pecas) || 0;
              const valorUnitario = obterValorUnitario(ficha);
              const subtotal =
                  isSobDemanda && ficha.subtotal !== undefined
                      ? parsePreco(ficha.subtotal)
                      : qtd * valorUnitario;
              return acc + subtotal;
          }, 0);

    const campoBloqueadoClass =
        "flex flex-col items-start lg:items-center justify-center gap-2 lg:gap-0 lg:text-center min-w-0 px-4 py-4 lg:px-2 lg:py-0 break-words [overflow-wrap:anywhere] text-base text-[#404040] cursor-not-allowed";
    const rotuloCardClass = "lg:hidden text-base font-light text-[#4696AD]";

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
        <section className="w-full min-w-0">
            <div className="flex flex-col w-full min-w-0">
                {/* 1. CABEÇALHO DA TABELA */}
                <div className="hidden lg:flex flex-row items-center w-full">
                    <div className="flex-1 rounded-t-[16px] border-t border-l border-r border-[#d9d9d9] bg-[#d9d9d9] overflow-hidden">
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
                                {rotuloSubtotal}
                            </div>
                        </div>
                    </div>
                    {!somenteLeitura && <div className="w-9" />}
                </div>

                {/* 2. CORPO DA TABELA */}
                {fichas.length > 0 ? (
                    <div className="flex flex-col gap-4 lg:gap-0 w-full">
                        {fichas.map((ficha, index) => {
                            const itemKey = ficha.id ?? index;
                            const fichaConcluida = ficha.concluida === true;
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
                                !somenteLeitura &&
                                !bloqueada &&
                                !fichaConcluida &&
                                idEmEdicao === itemKey;

                            const podeAbrirFicha =
                                Boolean(onAbrirFicha) && !bloqueada && !fichaConcluida;

                            return (
                                <div
                                    key={itemKey}
                                    className="group flex flex-col lg:flex-row lg:items-center w-full min-w-0 rounded-[16px] border border-[#d9d9d9] overflow-hidden lg:rounded-none lg:border-0 lg:overflow-visible"
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
                                        className={`w-full min-w-0 flex-1 lg:border-l lg:border-r lg:border-b border-[#d9d9d9] bg-white ${
                                            podeAbrirFicha
                                                ? "cursor-pointer hover:bg-[#F7FCFD] transition-colors"
                                                : ""
                                        }`}
                                    >
                                        <div
                                            className={`${gridColsClass} text-[#404040] font-['Outfit'] font-light lg:min-h-[140px]`}
                                        >
                                            {/* 1. Foto */}
                                            <div className="col-span-2 md:col-span-1 md:row-span-2 lg:row-span-1 lg:border-r border-[#d9d9d9] p-3 md:p-4 lg:p-3 flex items-center justify-center bg-white cursor-not-allowed">
                                                {ficha.foto ? (
                                                    <img
                                                        src={ficha.foto}
                                                        alt="Produto"
                                                        className="w-full max-w-[80px] md:max-w-[100px] lg:max-w-[145px] h-[90px] md:h-[110px] lg:h-[105px] object-cover rounded-[12px]"
                                                    />
                                                ) : (
                                                    <div className="w-full max-w-[80px] md:max-w-[100px] lg:max-w-[145px] h-[90px] md:h-[110px] lg:h-[105px] bg-gray-50 rounded-[12px] flex items-center justify-center text-xs text-gray-400 border border-dashed border-gray-200 text-center px-1">
                                                        Sem foto
                                                    </div>
                                                )}
                                            </div>

                                            {/* 2. Ref. interna */}
                                            <div
                                                className={`col-span-4 md:col-span-5 lg:col-span-1 lg:border-r border-[#d9d9d9] ${campoBloqueadoClass}`}
                                            >
                                                <span className={rotuloCardClass}>
                                                    Ref. interna
                                                </span>
                                                {ficha.referenciaInterna ||
                                                    ficha.ref_interna ||
                                                    "-"}
                                            </div>

                                            {/* 3. Ref. cliente */}
                                            {isSobDemanda && (
                                                <div
                                                    className="col-span-6 md:col-span-2 lg:col-span-1 lg:border-r border-[#d9d9d9] flex flex-col items-start lg:items-center justify-center gap-2 lg:gap-0 min-w-0 px-4 py-4 lg:px-2 lg:py-0 lg:text-center break-words [overflow-wrap:anywhere] text-base text-[#404040]"
                                                    onClick={(e) => e.stopPropagation()}
                                                    onKeyDown={(e) => e.stopPropagation()}
                                                >
                                                    <span className={rotuloCardClass}>
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
                                                            className="w-full min-h-11 lg:min-h-0 text-left lg:text-center bg-transparent outline-none focus:outline-none text-base font-['Outfit'] text-[#404040] min-w-0 p-0"
                                                        />
                                                    ) : (
                                                        refClienteValor || "-"
                                                    )}
                                                </div>
                                            )}

                                            {/* 4. Cores */}
                                            <div
                                                className={`col-span-6 ${isSobDemanda ? "md:col-span-3" : "md:col-span-5"} lg:col-span-1 lg:border-r border-[#d9d9d9] ${campoBloqueadoClass}`}
                                            >
                                                <span className={rotuloCardClass}>Cores</span>
                                                {formatarCores(ficha.cores)}
                                            </div>

                                            {/* 5. Quantidade */}
                                            <div
                                                className={`col-span-3 md:col-span-2 lg:col-span-1 border-t border-r lg:border-t-0 border-[#d9d9d9] bg-[#F9F9F9] md:bg-white ${campoBloqueadoClass} font-light`}
                                            >
                                                <span className={rotuloCardClass}>Quantidade</span>
                                                {qtd}
                                            </div>

                                            {/* 6. Preço unit. / Custo unit. */}
                                            <div
                                                className="col-span-3 md:col-span-2 lg:col-span-1 border-t md:border-r lg:border-t-0 border-[#d9d9d9] bg-[#F9F9F9] md:bg-white flex flex-col items-start lg:items-center justify-center gap-2 lg:gap-0 min-w-0 px-4 py-4 lg:px-2 lg:py-0 lg:text-center break-words [overflow-wrap:anywhere] text-base text-[#404040]"
                                                onClick={(e) => e.stopPropagation()}
                                                onKeyDown={(e) => e.stopPropagation()}
                                            >
                                                <span className={rotuloCardClass}>
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
                                                            className="w-full min-w-0 min-h-11 lg:min-h-0 text-left lg:text-center bg-transparent outline-none focus:outline-none text-base font-['Outfit'] text-[#404040] p-0"
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
                                            <div className="col-span-6 md:col-span-2 lg:col-span-1 flex flex-row md:flex-col lg:flex-row items-center md:items-start lg:items-center justify-between md:justify-center lg:justify-center gap-3 lg:gap-0 min-w-0 px-4 py-4 lg:px-2 lg:py-0 border-t lg:border-t-0 border-[#d9d9d9] text-base text-[#404040] font-light break-words [overflow-wrap:anywhere]">
                                                <span className="lg:hidden text-base md:text-[#4696AD]">
                                                    {rotuloSubtotal}
                                                </span>
                                                {formatarMoeda(subtotal)}
                                            </div>
                                        </div>
                                    </div>

                                    {!somenteLeitura && fichaConcluida && (
                                        <div className="hidden lg:block w-9 shrink-0" />
                                    )}
                                    {!somenteLeitura && !fichaConcluida && (
                                        <div
                                            className="w-full lg:w-9 shrink-0 flex flex-row lg:flex-col items-center justify-end lg:justify-center gap-2 p-2 lg:p-0 lg:pl-2 border-t lg:border-t-0 border-[#d9d9d9] transition-opacity duration-200"
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
                                                className={`group/edit min-w-11 min-h-11 lg:min-w-0 lg:min-h-0 flex items-center justify-center p-1 transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:opacity-50 ${
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
                                                className="group/delete min-w-11 min-h-11 lg:min-w-0 lg:min-h-0 flex items-center justify-center p-1 transition-transform hover:scale-110 disabled:cursor-not-allowed disabled:opacity-50"
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
                        <div className="min-w-0 flex-1 rounded-[16px] lg:rounded-none border lg:border-t-0 border-[#d9d9d9] px-4 py-12 text-center text-[#898C8F] font-['Outfit'] font-light bg-[#F9F9F9] text-base">
                            Nenhuma ficha técnica adicionada ao pedido.
                        </div>
                        {!somenteLeitura && <div className="hidden lg:block w-9 shrink-0" />}
                    </div>
                )}

                {/* 3. RODAPÉ DA TABELA */}
                {(fichas.length > 0 || exibirTotalPersistido) && (
                    <div className="flex flex-row items-center w-full mt-5 lg:mt-0">
                        <div className="min-w-0 flex-1 md:rounded-[16px] lg:rounded-t-none md:border lg:border-t-0 border-[#d9d9d9] bg-transparent md:bg-[#d9d9d9] px-0 md:px-6 py-3.5 flex flex-col md:flex-row md:flex-wrap items-start md:items-center justify-between gap-3 lg:gap-0 text-[#898C8F] font-['Outfit'] text-sm md:text-base">
                            <span className="hidden md:block font-['Outfit'] text-[#898C8F]">
                                {isSobDemanda ? "Resumo do pedido" : "Resumo da produção"}
                            </span>
                            <div className="flex flex-wrap items-center justify-between md:justify-end w-full md:w-auto min-w-0 font-['Outfit'] gap-x-4 gap-y-3 lg:gap-6 text-[#898C8F]">
                                <div>
                                    Total de peças:{" "}
                                    <span className="font-light font-['Outfit']">
                                        {totalQuantidade}
                                    </span>
                                </div>
                                <div className="hidden lg:block h-4 w-[1px] bg-[#a0a3a6] font-['Outfit']" />
                                <div>
                                    {isSobDemanda
                                        ? exibirTotalPersistido && !somenteLeitura
                                            ? "Total salvo do pedido: "
                                            : "Total do pedido: "
                                        : "Custo total: "}
                                    <span className="font-light font-['Outfit']">
                                        {exibirTotalPersistido && totalPedido == null
                                            ? "Indisponível"
                                            : formatarMoeda(totalPedido)}
                                    </span>
                                </div>
                            </div>
                        </div>
                        {!somenteLeitura && <div className="hidden lg:block w-9 shrink-0" />}
                    </div>
                )}
                {exibirTotalPersistido && (
                    <div className="mt-3 text-sm font-light text-[#606060]" role="note">
                        {possuiPerdasTecido && (
                            <p>
                                O total salvo considera as perdas de tecido informadas. Essas perdas
                                reduzem o faturamento, sem alterar o custo de produção.
                            </p>
                        )}
                        {!somenteLeitura && (
                            <p>
                                O total será atualizado após salvar as alterações. Os subtotais das
                                fichas mostram os valores antes das perdas.
                            </p>
                        )}
                    </div>
                )}
            </div>
        </section>
    );
}
