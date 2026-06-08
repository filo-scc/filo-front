import React from "react";

const borderColor = "#d9d9d9";
const borderStyle = { borderColor };

export default function TabelaReferenciaFichaTecnica({
    fichas = [],
    isSobDemanda = true,
    onRemoverFicha,
}) {
    const gridColsClass = isSobDemanda ? "grid grid-cols-5 w-full" : "grid grid-cols-4 w-full";
    // Define quantas colunas ficarem vazias à esquerda do texto "Total:"
    const emptyColSpanClass = isSobDemanda ? "col-span-3" : "col-span-2";

    const formatarCores = (cores) => {
        if (!cores || cores.length === 0) return "-";
        if (Array.isArray(cores)) {
            return cores.map((cor) => (typeof cor === "object" ? cor.nome : cor)).join(", ");
        }
        return String(cores);
    };

    // Cálculo automático do Total
    const totalQuantidade = fichas.reduce(
        (acc, ficha) => acc + (Number(ficha.quantidade) || Number(ficha.quantidade_pecas) || 0),
        0,
    );

    return (
        <section className="w-full">
            <div className="flex flex-col w-full">
                {/* CABEÇALHO DA TABELA */}
                <div className="flex flex-row items-stretch w-full">
                    <div
                        className="flex-1 rounded-t-[10px] border overflow-hidden bg-[#d9d9d9]"
                        style={borderStyle}
                    >
                        <div
                            className={`${gridColsClass} text-[#898c8f] text-[14px] font-Outfit font-light min-h-[46px]`}
                        >
                            <div
                                className="border-r flex items-center justify-center px-4"
                                style={borderStyle}
                            ></div>
                            <div className="flex items-center justify-center text-center px-4">
                                Referência Interna
                            </div>
                            {isSobDemanda && (
                                <div className="flex items-center justify-center text-center px-4">
                                    Referência Cliente
                                </div>
                            )}
                            <div className="flex items-center justify-center text-center px-4">
                                Cores
                            </div>
                            <div className="flex items-center justify-center text-center px-4">
                                Quantidade
                            </div>
                        </div>
                    </div>
                </div>

                {/* CORPO DA TABELA */}
                {fichas.length > 0 ? (
                    <div className="flex flex-col w-full">
                        {/* 1. MAP DOS PRODUTOS (LINHAS INDEPENDENTES) */}
                        {fichas.map((ficha, index) => {
                            // Verifica se é a última ficha para arredondar apenas o canto esquerdo
                            const isLast = index === fichas.length - 1;

                            return (
                                <div
                                    key={ficha.id || index}
                                    className="relative group flex flex-row items-stretch w-full"
                                >
                                    <div
                                        className={`flex-1 border-l border-r border-b overflow-hidden bg-white transition-colors ${
                                            isLast ? "rounded-bl-[10px]" : ""
                                        }`}
                                        style={borderStyle}
                                    >
                                        <div
                                            className={`${gridColsClass} text-[#404040] text-[16px] font-Outfit font-light min-h-[130px]`}
                                        >
                                            {/* Coluna da Foto */}
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

                                            {/* Referência Interna */}
                                            <div className="border-r-[0.5px] border-[#898c8f] flex items-center justify-center text-center px-4 break-words text-[#404040]">
                                                {ficha.referenciaInterna || "-"}
                                            </div>

                                            {/* Referência Cliente */}
                                            {isSobDemanda && (
                                                <div className="border-r-[0.5px] border-[#898c8f] flex items-center justify-center text-center px-4 break-words text-[#404040]">
                                                    {ficha.referenciaCliente || "-"}
                                                </div>
                                            )}

                                            {/* Cores */}
                                            <div className="border-r-[0.5px] border-[#898c8f] flex items-center justify-center text-center px-4 break-words text-[#404040]">
                                                {formatarCores(ficha.cores)}
                                            </div>

                                            {/* Quantidade */}
                                            <div className="flex items-center justify-center text-center px-4 font-normal text-[#404040]">
                                                {ficha.quantidade || ficha.quantidade_pecas || "0"}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Lixeira Externa */}
                                    <button
                                        type="button"
                                        onClick={() => onRemoverFicha?.(ficha.id || index)}
                                        className="absolute -right-12 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 p-5 text-[#D75757] rounded-full"
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

                        {/* =========================================================================
                            2. LINHA DO TOTAL INDEPENDENTE (CAIXA PENDURADA CORRIGIDA)
                        ========================================================================= */}
                        <div className="flex flex-row items-stretch w-full">
                            {/* Wrapper com bordas laterais transparentes: garante que o espaço matemático 
                                da grelha é exatamente igual ao da tabela principal */}
                            <div className="flex-1 border-l border-r border-transparent">
                                <div
                                    className={`${gridColsClass} text-[16px] font-Outfit font-light min-h-[50px]`}
                                >
                                    {/* Espaço vazio invisível para preencher as colunas à esquerda */}
                                    <div className={emptyColSpanClass}></div>

                                    {/* Texto flutuando ao lado */}
                                    <div className="flex items-center justify-end pr-6">
                                        <span className="text-[#898c8f]">Total:</span>
                                    </div>

                                    {/* O SEGREDO: Container relativo preso à grelha, com a caixa em absoluto.
                                        Isto impede que o texto ou as bordas empurrem a tabela. */}
                                    <div className="relative w-full h-full">
                                        <div
                                            className="absolute bg-white border-l border-r border-b rounded-b-[10px] flex items-center justify-center font-normal text-[#404040]"
                                            style={{
                                                // Expande 1px para os lados para encaixar cirurgicamente
                                                // sob as bordas da tabela acima, sem distorcer o Grid
                                                left: "-0.5px",
                                                right: "-1px",
                                                top: "0",
                                                bottom: "0",
                                                // Aplica a mesma cor exata do container superior (#d9d9d9)
                                                borderColor: borderColor,
                                            }}
                                        >
                                            {totalQuantidade}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-row items-stretch w-full">
                        <div
                            className="flex-1 border-l border-r border-b rounded-b-[10px] overflow-hidden"
                            style={borderStyle}
                        >
                            <div className="py-14 text-center text-[#898c8f] font-Outfit font-light bg-white text-[16px]">
                                Nenhuma ficha técnica adicionada ao pedido.
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </section>
    );
}
