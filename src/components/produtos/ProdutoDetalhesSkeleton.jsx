function SkeletonBox({ className }) {
    return (
        <div className={`bg-[#E8E9F0] rounded-[12px] animate-pulse ${className}`} />
    );
}

export default function ProdutoDetalhesSkeleton() {
    return (
        <div className="mt-8 space-y-8">

            {/* Espelho de SecaoDadosProduto */}
            <section className="flex flex-col md:flex-row gap-10 pr-4 md:pr-[15%]">

                {/* Bloco da Imagem — w-[260px] h-[170px] igual ao original */}
                <div className="flex flex-col shrink-0">
                    <SkeletonBox className="h-[28px] w-24 mb-4 rounded-[8px]" /> {/* título "Imagem" */}
                    <SkeletonBox className="w-[260px] h-[170px] rounded-[10px]" />
                </div>

                {/* Bloco de Dados */}
                <div className="flex flex-col gap-8 w-full max-w-[600px]">

                    {/* Subseção Geral */}
                    <div>
                        <SkeletonBox className="h-[28px] w-16 mb-4 rounded-[8px]" /> {/* título "Geral" */}
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
                        <SkeletonBox className="h-[28px] w-48 mb-4 rounded-[8px]" /> {/* título "Detalhes do produto" */}
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
                <SkeletonBox className="h-[28px] w-72 mb-4 rounded-[8px]" /> {/* título da seção */}
                <div className="w-full rounded-[10px] overflow-hidden">
                    {/* Cabeçalho */}
                    <SkeletonBox className="h-[46px] w-full rounded-none rounded-t-[10px]" />
                    {/* Linhas */}
                    {[...Array(3)].map((_, i) => (
                        <SkeletonBox
                            key={i}
                            className={`h-[46px] w-full rounded-none ${i === 2 ? "rounded-b-[10px]" : ""}`}
                            style={{ opacity: 1 - i * 0.15 }}
                        />
                    ))}
                </div>
            </section>

        </div>
    );
}