import React, { useState } from "react";
import { parsePreco } from "../../utils/preco";

export default function TabelaReferenciaFichaTecnica({
    fichas = [],
    isSobDemanda = true,
    onRemoverFicha,
    onAtualizarFicha,
    onSalvarClienteProduto,
    onEditarFicha,
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
        ? "grid grid-cols-7 w-full items-stretch"
        : "grid grid-cols-5 w-full items-stretch";

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

    const totalPedido = fichas.reduce((acc, ficha) => {
        const qtd = Number(ficha.quantidade) || Number(ficha.quantidade_pecas) || 0;
        const valPrecoRaw = ficha.preco_padrao ?? ficha.preco_unitario ?? ficha.preco ?? 0;
        const preco = parsePreco(valPrecoRaw);
        const subtotal = ficha.subtotal !== undefined ? parsePreco(ficha.subtotal) : qtd * preco;
        return acc + subtotal;
    }, 0);

    const handleAlternarEdicao = (itemKey) => {
        const estaEditando = idEmEdicao === itemKey;
        if (estaEditando) {
            onSalvarClienteProduto?.(itemKey);
        }
        setIdEmEdicao((prevKey) => (prevKey === itemKey ? null : itemKey));
        onEditarFicha?.(itemKey);
    };

    const handleInputBlur = (e, itemKey) => {
        const proximoFoco = e.relatedTarget;
        if (!proximoFoco || proximoFoco.getAttribute("data-itemkey") !== String(itemKey)) {
            if (idEmEdicao === itemKey) {
                onSalvarClienteProduto?.(itemKey);
                setIdEmEdicao(null);
            }
        }
    };

    return (
        <section className="w-full">
            <div className="flex flex-col w-full">
                {/* 1. CABEÇALHO DA TABELA */}
                <div className="flex flex-row items-center w-full">
                    <div className="flex-1 rounded-t-[16px] border-t border-l border-r border-[#d9d9d9] bg-[#d9d9d9] overflow-hidden">
                        <div
                            className={`${gridColsClass} text-[#898C8F] text-light md:text-light font-['Outfit'] font-light min-h-[48px]`}
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
                            {isSobDemanda && (
                                <div className="flex items-center justify-center text-center px-2">
                                    Preço unit.
                                </div>
                            )}
                            <div className="flex items-center justify-center text-center px-2">
                                Subtotal
                            </div>
                        </div>
                    </div>
                    <div className="w-9" />
                </div>

                {/* 2. CORPO DA TABELA */}
                {fichas.length > 0 ? (
                    <div className="flex flex-col w-full">
                        {fichas.map((ficha, index) => {
                            const itemKey = ficha.id ?? index;
                            const qtd =
                                Number(ficha.quantidade) || Number(ficha.quantidade_pecas) || 0;
                            const valPrecoRaw =
                                ficha.preco_padrao ?? ficha.preco_unitario ?? ficha.preco ?? "";
                            const precoUnit = parsePreco(valPrecoRaw);

                            const subtotal =
                                ficha.subtotal !== undefined
                                    ? parsePreco(ficha.subtotal)
                                    : qtd * precoUnit;
                            const refClienteValor =
                                ficha.referenciaCliente ?? ficha.ref_cliente ?? "";
                            const isEditando = idEmEdicao === itemKey;

                            return (
                                <div
                                    key={itemKey}
                                    className="group flex flex-row items-center w-full"
                                >
                                    {/* Linha da Tabela */}
                                    <div className="flex-1 border-l border-r border-b border-[#d9d9d9] bg-white">
                                        <div
                                            className={`${gridColsClass} text-[#404040] font-['Outfit'] font-light min-h-[120px] md:min-h-[140px]`}
                                        >
                                            {/* 1. Foto */}
                                            <div className="border-r border-[#d9d9d9] p-3 flex items-center justify-center bg-white">
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
                                            <div className="border-r border-[#d9d9d9] flex items-center justify-center text-center px-2 break-all text-light md:text-base text-[#404040]">
                                                {ficha.referenciaInterna ||
                                                    ficha.ref_interna ||
                                                    "-"}
                                            </div>

                                            {/* 3. Ref. cliente */}
                                            {isSobDemanda && (
                                                <div className="border-r border-[#d9d9d9] flex items-center justify-center px-2 text-center text-light md:text-base text-[#404040]">
                                                    {isEditando ? (
                                                        <input
                                                            type="text"
                                                            data-itemkey={itemKey}
                                                            value={refClienteValor}
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
                                                            className="w-full text-center bg-transparent outline-none focus:outline-none text-light md:text-base font-['Outfit'] text-[#404040] min-w-0 p-0"
                                                        />
                                                    ) : (
                                                        refClienteValor || "-"
                                                    )}
                                                </div>
                                            )}

                                            {/* 4. Cores */}
                                            <div className="border-r border-[#d9d9d9] flex items-center justify-center text-center px-2 break-words text-light md:text-base text-[#404040]">
                                                {formatarCores(ficha.cores)}
                                            </div>

                                            {/* 5. Quantidade */}
                                            <div className="border-r border-[#d9d9d9] flex items-center justify-center text-center px-2 font-light text-light md:text-base text-[#404040]">
                                                {qtd}
                                            </div>

                                            {/* 6. Preço unit. */}
                                            {isSobDemanda && (
                                                <div className="border-r border-[#d9d9d9] flex flex-col items-center justify-center px-2 text-center text-light md:text-base text-[#404040]">
                                                    {isEditando ? (
                                                        <div className="relative w-full min-w-0 flex items-center justify-center">
                                                            <input
                                                                type="text"
                                                                data-itemkey={itemKey}
                                                                value={`R$ ${formatarInputMoeda(valPrecoRaw)}`}
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
                                                                className="w-full text-center bg-transparent outline-none focus:outline-none text-light md:text-base font-['Outfit'] text-[#404040] p-0"
                                                            />
                                                        </div>
                                                    ) : (
                                                        formatarMoeda(precoUnit)
                                                    )}
                                                </div>
                                            )}

                                            {/* 7. Subtotal */}
                                            <div className="flex items-center justify-center text-center px-2 font-light text-light md:text-base text-[#404040]">
                                                {formatarMoeda(subtotal)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Botões de Ação */}
                                    <div className="w-9 flex flex-col items-center justify-center gap-2 pl-2 transition-opacity duration-200">
                                        <button
                                            type="button"
                                            onClick={() => handleAlternarEdicao(itemKey)}
                                            className={`group/edit p-1 transition-transform hover:scale-110 ${
                                                isEditando ? "opacity-100 scale-110" : ""
                                            }`}
                                            title={isEditando ? "Concluir edição" : "Editar ficha"}
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
                                            onClick={() => onRemoverFicha?.(itemKey)}
                                            className="group/delete p-1 transition-transform hover:scale-110"
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
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="flex flex-row items-center w-full">
                        <div className="flex-1 border-l border-r border-b border-[#d9d9d9] py-12 text-center text-[#898C8F] font-['Outfit'] font-light bg-[#F9F9F9] text-light md:text-base">
                            Nenhuma ficha técnica adicionada ao pedido.
                        </div>
                        <div className="w-9" />
                    </div>
                )}

                {/* 3. RODAPÉ DA TABELA */}
                {fichas.length > 0 && (
                    <div className="flex flex-row items-center w-full">
                        <div className="flex-1 rounded-b-[16px] border-l border-r border-b border-[#d9d9d9] bg-[#d9d9d9] px-6 py-3.5 flex flex-row items-center justify-between text-[#898C8F] font-['Outfit'] text-light md:text-base">
                            <span className="font-['Outfit'] text-[#898C8F]">Resumo do pedido</span>
                            <div className="flex items-center font-['Outfit'] gap-6 text-[#898C8F]">
                                <div>
                                    Total de peças:{" "}
                                    <span className="font-light font-['Outfit']">
                                        {totalQuantidade}
                                    </span>
                                </div>
                                <div className="h-4 w-[1px] bg-[#a0a3a6] font-['Outfit']" />
                                <div>
                                    Total do pedido:{" "}
                                    <span className="font-light font-['Outfit']">
                                        {formatarMoeda(totalPedido)}
                                    </span>
                                </div>
                            </div>
                        </div>
                        <div className="w-9" />
                    </div>
                )}
            </div>
        </section>
    );
}
