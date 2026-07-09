import { SkeletonBox } from "../geral/Loading";

export default function ProdutoDetalhesSkeleton() {
    return (
        <div className="mt-8 space-y-8">
            {/* Espelho de SecaoDadosProduto */}
            <section className="flex flex-col md:flex-row gap-10 pr-4 md:pr-[15%]">
                {/* Bloco da Imagem — w-[260px] h-[170px] igual ao original */}
                <div className="flex flex-col shrink-0">
                    <SkeletonBox className="h-[28px] w-24 mb-4 rounded-[8px]" />{" "}
                    {/* título "Imagem" */}
                    <SkeletonBox className="w-[248px] h-[187px] rounded-[10px]" />
                </div>

                {/* Bloco de Dados */}
                <div className="flex flex-col gap-8 w-full max-w-[600px]">
                    {/* Subseção Geral */}
                    <div>
                        <SkeletonBox className="h-[28px] w-16 mb-4 rounded-[8px]" />{" "}
                        {/* título "Geral" */}
                        <div className="grid grid-cols-[220px_220px] gap-x-12">
                            <div className="space-y-2">
                                <SkeletonBox className="h-[20px] w-36" /> {/* label */}
                                <SkeletonBox className="h-[16px] w-28" /> {/* valor */}
                            </div>
                            <div className="space-y-2">
                                <SkeletonBox className="h-[20px] w-20" />
                                <SkeletonBox className="h-[16px] w-24" />
                            </div>
                        </div>
                    </div>

                    {/* Subseção Detalhes do produto */}
                    <div>
                        <SkeletonBox className="h-[28px] w-48 mb-4 rounded-[8px]" />{" "}
                        {/* título "Detalhes do produto" */}
                        <div className="grid grid-cols-[220px_220px] gap-x-12">
                            <div className="space-y-2">
                                <SkeletonBox className="h-[20px] w-24" />
                                <SkeletonBox className="h-[16px] w-32" />
                            </div>
                            <div className="space-y-2">
                                <SkeletonBox className="h-[20px] w-16" />
                                <SkeletonBox className="h-[16px] w-28" />
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Espelho de TabelaClientesDoProduto */}
            <section>
                <SkeletonBox className="h-[28px] w-72 mb-4 rounded-[8px]" />
                <div className="flex flex-col w-full">
                    <div className="flex flex-row items-stretch gap-4 w-full">
                        <div className="flex-1 rounded-t-[10px] border border-[#D9D9D9] overflow-hidden">
                            <div className="grid grid-cols-4 bg-[#D9D9D9] h-[52px] items-center">
                                {[0, 1, 2, 3].map((item) => (
                                    <div
                                        key={item}
                                        className={`h-full flex items-center justify-center px-4 ${
                                            item > 0 ? "border-l border-[#D9D9D9]" : ""
                                        }`}
                                    >
                                        <SkeletonBox className="h-[16px] w-28 rounded-[8px] bg-white/70" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    <div className="flex flex-row items-stretch gap-4 w-full">
                        <div className="flex-1 border-l border-r border-b rounded-b-[10px] overflow-hidden border-[#D9D9D9]">
                            <div className="grid grid-cols-4 w-full text-[16px]">
                                <div className="flex items-center justify-center px-4 bg-white">
                                    <SkeletonBox className="h-[16px] w-32 rounded-[8px]" />
                                </div>

                                <div className="col-span-3 border-l border-[#D9D9D9]">
                                    {[0, 1, 2].map((row) => (
                                        <div
                                            key={row}
                                            className={`grid grid-cols-3 min-h-[64px] items-stretch ${
                                                row % 2 === 0 ? "bg-white" : "bg-[#F4F4F4]"
                                            } ${row !== 2 ? "border-b border-[#D9D9D9]" : ""}`}
                                        >
                                            {[0, 1, 2].map((cell) => (
                                                <div
                                                    key={cell}
                                                    className={`flex items-center justify-center px-4 ${
                                                        cell > 0 ? "border-l border-[#D9D9D9]" : ""
                                                    }`}
                                                >
                                                    <SkeletonBox className="h-[16px] w-28 rounded-[8px]" />
                                                </div>
                                            ))}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>
        </div>
    );
}
