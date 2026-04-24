const Label = ({ children }) => (
    <span className="text-[20px] font-Outfit font-light text-[#4696AD] block leading-none">
        {children}
    </span>
);

const Valor = ({ children }) => (
    <p className="text-[16px] font-Outfit font-light text-[#898c8f] leading-tight mt-1 break-words">
        {children || "-"}
    </p>
);

export default function SecaoDadosProduto({ produto }) {
    return (
        <section className="flex flex-col md:flex-row gap-10 pr-4 md:pr-[15%]">
            {/* Bloco da Imagem */}
            <div className="flex flex-col shrink-0">
                <h3 className="text-[20px] font-Outfit font-light text-[#404040] mb-4">Imagem</h3>
                <div className="w-[260px] h-[170px] rounded-[10px] overflow-hidden border border-gray-200">
                    <img
                        src={produto.foto}
                        alt={produto.nome}
                        className="w-full h-full object-cover"
                    />
                </div>
            </div>

            {/* Bloco de Dados - Organizado em Grids para Alinhamento Vertical */}
            <div className="flex flex-col gap-8 w-full max-w-[600px]">
                {/* Subseção: Geral */}
                <div>
                    <h3 className="text-[20px] font-Outfit font-light text-[#404040] mb-4">
                        Geral
                    </h3>
                    {/* Definimos colunas de 220px para garantir que Modelo e Tecido se alinhem */}
                    <div className="grid grid-cols-[220px_220px] gap-x-12">
                        <div className="overflow-hidden">
                            <Label>Referência Interna</Label>
                            <Valor>{produto.nome}</Valor>
                        </div>
                        <div className="overflow-hidden">
                            <Label>Modelo</Label>
                            <Valor>{produto.tipo}</Valor>
                        </div>
                    </div>
                </div>

                {/* Subseção: Detalhes do produto */}
                <div>
                    <h3 className="text-[20px] font-Outfit font-light text-[#404040] mb-4">
                        Detalhes do produto
                    </h3>
                    <div className="grid grid-cols-[220px_220px] gap-x-12">
                        {/* Aviamentos agora pode crescer para baixo naturalmente */}
                        <div className="overflow-hidden">
                            <Label>Aviamentos</Label>
                            <Valor>
                                {Array.isArray(produto.aviamentos)
                                    ? produto.aviamentos.join(", ")
                                    : produto.aviamentos}
                            </Valor>
                        </div>
                        <div className="overflow-hidden">
                            <Label>Tecido</Label>
                            <Valor>{produto.tecido}</Valor>
                        </div>
                    </div>
                </div>
            </div>
        </section>
    );
}
