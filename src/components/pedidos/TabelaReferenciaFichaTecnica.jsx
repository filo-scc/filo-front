import React from "react";

const borderColor = "#d9d9d9";
const borderStyle = { borderColor };

const formatarMoeda = (valor) => {
    const num = Number(valor) || 0;
    return num.toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
    });
};

export default function TabelaReferenciaFichaTecnica({
    fichas = [],
    isSobDemanda = true,
    onRemoverFicha,
    onAtualizarFicha,
    onSalvarRefCliente,
    onSalvarPreco,
}) {
    const gridColsClass = isSobDemanda ? "grid grid-cols-7 w-full" : "grid grid-cols-5 w-full";

    const formatarCores = (cores) => {
        if (!cores || cores.length === 0) return "-";
        if (Array.isArray(cores)) {
            return cores.map((cor) => (typeof cor === "object" ? cor.nome : cor)).join(", ");
        }
        return String(cores);
    };

    // Cálculos dos Totais
    const totalQuantidade = fichas.reduce(
        (acc, ficha) => acc + (Number(ficha.quantidade) || Number(ficha.quantidade_pecas) || 0),
        0,
    );

    const totalPedido = fichas.reduce((acc, ficha) => {
        const qtd = Number(ficha.quantidade) || Number(ficha.quantidade_pecas) || 0;
        const preco = Number(ficha.preco_padrao ?? ficha.preco_unitario ?? ficha.preco ?? 0);
        const subtotal = ficha.subtotal !== undefined ? Number(ficha.subtotal) : qtd * preco;
        return acc + (isNaN(subtotal) ? 0 : subtotal);
    }, 0);

    return (
        <section className="w-full">
            <div className="flex flex-col w-full gap-6">
                {/* TABELA PRINCIPAL */}
                <div className="flex flex-col w-full">
                    {/* CABEÇALHO DA TABELA */}
                    <div className="flex flex-row items-stretch w-full">
                        <div
                            className="flex-1 rounded-t-[10px] border overflow-hidden bg-[#d9d9d9]"
                            style={borderStyle}
                        >
                            <div
                                className={`${gridColsClass} text-[#898c8f] text-[14px] font-['Outfit',_sans-serif] font-light min-h-[46px]`}
                            >
                                <div
                                    className="border-r flex items-center justify-center px-4"
                                    style={borderStyle}
                                />

                                <div className="flex items-center justify-center text-center px-4">
                                    Ref. interna
                                </div>

                                {isSobDemanda && (
                                    <div className="flex items-center justify-center text-center px-4">
                                        Ref. cliente
                                    </div>
                                )}

                                <div className="flex items-center justify-center text-center px-4">
                                    Cores
                                </div>

                                <div className="flex items-center justify-center text-center px-4">
                                    Quantidade
                                </div>

                                {isSobDemanda && (
                                    <div className="flex items-center justify-center text-center px-4">
                                        Preço unit.
                                    </div>
                                )}

                                <div className="flex items-center justify-center text-center px-4">
                                    Subtotal
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* CORPO DA TABELA */}
                    {fichas.length > 0 ? (
                        <div className="flex flex-col w-full">
                            {fichas.map((ficha, index) => {
                                const itemKey = ficha.id ?? index;
                                const isLast = index === fichas.length - 1;
                                const qtd =
                                    Number(ficha.quantidade) || Number(ficha.quantidade_pecas) || 0;

                                const valPrecoRaw =
                                    ficha.preco_padrao ?? ficha.preco_unitario ?? ficha.preco ?? "";
                                const precoUnit = Number(valPrecoRaw) || 0;
                                const isPrecoInvalido = isSobDemanda && precoUnit <= 0;

                                const subtotal =
                                    ficha.subtotal !== undefined
                                        ? Number(ficha.subtotal)
                                        : qtd * precoUnit;

                                const refClienteValor =
                                    ficha.referenciaCliente ?? ficha.ref_cliente ?? "";

                                return (
                                    <div
                                        key={itemKey}
                                        className="relative group flex flex-row items-stretch w-full"
                                    >
                                        <div
                                            className={`flex-1 border-l border-r border-b overflow-hidden bg-white transition-colors ${
                                                isLast ? "rounded-b-[10px]" : ""
                                            }`}
                                            style={borderStyle}
                                        >
                                            <div
                                                className={`${gridColsClass} text-[#404040] text-[16px] font-['Outfit',_sans-serif] font-light min-h-[130px]`}
                                            >
                                                {/* 1. Foto */}
                                                <div className="border-r-[0.5px] border-[#898c8f] p-3 flex items-center justify-center bg-white">
                                                    {ficha.foto ? (
                                                        <img
                                                            src={ficha.foto}
                                                            alt="Produto"
                                                            className="w-full max-w-[150px] h-[106px] object-cover rounded-[10px] shadow-sm"
                                                        />
                                                    ) : (
                                                        <div className="w-full max-w-[150px] h-[106px] bg-gray-50 rounded-[10px] flex items-center justify-center text-xs text-gray-400 border border-dashed border-gray-200">
                                                            Sem foto
                                                        </div>
                                                    )}
                                                </div>

                                                {/* 2. Ref. interna (READ-ONLY) */}
                                                <div className="border-r-[0.5px] border-[#898c8f] flex items-center justify-center text-center px-4 break-words text-[#404040]">
                                                    {ficha.referenciaInterna ||
                                                        ficha.ref_interna ||
                                                        "-"}
                                                </div>

                                                {/* 3. Ref. cliente (EDITÁVEL) */}
                                                {isSobDemanda && (
                                                    <div className="border-r-[0.5px] border-[#898c8f] flex items-center justify-center px-3">
                                                        <input
                                                            type="text"
                                                            value={refClienteValor}
                                                            onChange={(e) =>
                                                                onAtualizarFicha?.(
                                                                    itemKey,
                                                                    "referenciaCliente",
                                                                    e.target.value,
                                                                )
                                                            }
                                                            onBlur={
                                                                (e) =>
                                                                    onSalvarRefCliente?.(
                                                                        itemKey,
                                                                        e.target.value,
                                                                    ) // <-- Chama a API ao perder o foco
                                                            }
                                                            placeholder="Ref. Cliente"
                                                            className="w-full text-center bg-transparent border border-gray-300 rounded focus:outline-none focus:border-blue-500 py-1.5 px-2 text-[15px] font-['Outfit',_sans-serif] text-[#404040]"
                                                        />
                                                    </div>
                                                )}

                                                {/* 4. Cores */}
                                                <div className="border-r-[0.5px] border-[#898c8f] flex items-center justify-center text-center px-4 break-words text-[#404040]">
                                                    {formatarCores(ficha.cores)}
                                                </div>

                                                {/* 5. Quantidade */}
                                                <div className="border-r-[0.5px] border-[#898c8f] flex items-center justify-center text-center px-4 font-normal text-[#404040]">
                                                    {qtd}
                                                </div>

                                                {/* 6. Preço unit. (EDITÁVEL) */}
                                                {/* 6. Preço unit. (EDITÁVEL) */}
                                                {isSobDemanda && (
                                                    <div className="border-r-[0.5px] border-[#898c8f] flex flex-col items-center justify-center px-3">
                                                        <div className="relative w-full max-w-[120px]">
                                                            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-gray-400 font-normal">
                                                                R$
                                                            </span>
                                                            <input
                                                                type="number"
                                                                step="0.01"
                                                                min="0"
                                                                value={valPrecoRaw}
                                                                onChange={(e) =>
                                                                    onAtualizarFicha?.(
                                                                        itemKey,
                                                                        "preco_padrao",
                                                                        e.target.value,
                                                                    )
                                                                }
                                                                onBlur={
                                                                    (e) =>
                                                                        onSalvarPreco?.(
                                                                            itemKey,
                                                                            e.target.value,
                                                                        ) 
                                                                }
                                                                className={`w-full pl-8 pr-2 text-center bg-transparent border rounded focus:outline-none py-1.5 text-[15px] font-['Outfit',_sans-serif] ${
                                                                    isPrecoInvalido
                                                                        ? "border-red-500 text-red-600 bg-red-50 font-medium"
                                                                        : "border-gray-300 focus:border-blue-500 text-[#404040]"
                                                                }`}
                                                            />
                                                        </div>
                                                    </div>
                                                )}

                                                {/* 7. Subtotal */}
                                                <div className="flex items-center justify-center text-center px-4 font-normal text-[#404040]">
                                                    {formatarMoeda(subtotal)}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Lixeira Externa */}
                                        <button
                                            type="button"
                                            onClick={() => onRemoverFicha?.(itemKey)}
                                            className="absolute -right-12 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-3 text-[#D75757] rounded-full hover:bg-gray-100"
                                            title="Excluir ficha"
                                        >
                                            <img
                                                src="/excluir-cinza-claro.png"
                                                alt="Remover"
                                                className="w-5 h-5"
                                            />
                                        </button>
                                    </div>
                                );
                            })}
                        </div>
                    ) : (
                        <div className="flex flex-row items-stretch w-full">
                            <div
                                className="flex-1 border-l border-r border-b rounded-b-[10px] overflow-hidden"
                                style={borderStyle}
                            >
                                <div className="py-14 text-center text-[#898c8f] font-['Outfit',_sans-serif] font-light bg-white text-[16px]">
                                    Nenhuma ficha técnica adicionada ao pedido.
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* RESUMO DO PEDIDO */}
                {fichas.length > 0 && (
                    <div className="flex flex-col items-end w-full mt-2">
                        <div className="w-full max-w-[460px]">
                            <h3 className="text-[18px] text-[#404040] font-['Outfit',_sans-serif] font-light mb-3 text-center sm:text-left">
                                Resumo do pedido
                            </h3>

                            <div
                                className="rounded-[10px] border overflow-hidden bg-white"
                                style={borderStyle}
                            >
                                {/* Cabeçalho do Resumo */}
                                <div className="grid grid-cols-2 bg-[#d9d9d9] text-[#898c8f] text-[14px] font-['Outfit',_sans-serif] font-light min-h-[40px]">
                                    <div
                                        className="border-r flex items-center justify-center px-4"
                                        style={borderStyle}
                                    >
                                        Quantidade total
                                    </div>
                                    <div className="flex items-center justify-center px-4">
                                        Total do pedido
                                    </div>
                                </div>

                                {/* Valores do Resumo */}
                                <div className="grid grid-cols-2 text-[#404040] text-[16px] font-['Outfit',_sans-serif] font-light min-h-[46px]">
                                    <div
                                        className="border-r flex items-center justify-center px-4"
                                        style={borderStyle}
                                    >
                                        {totalQuantidade} (peças)
                                    </div>
                                    <div className="flex items-center justify-center px-4">
                                        {formatarMoeda(totalPedido)}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
