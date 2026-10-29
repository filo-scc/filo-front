import { useState } from "react";
import MenuOpcoes from "../geral/MenuOpcoes";

export default function PedidoCard({
    pedido,
    label,
    sobDemanda,
    valor,
    criado,
    finalizado,
    onDetails,
    onEdit,
    onDelete,
}) {
    const [aberto, setAberto] = useState(false);
    const quantidade =
        pedido.fichas_tecnicas?.reduce((total, ficha) => total + ficha.quantidade, 0) || 0;
    const menu = (
        <MenuOpcoes
            touchTarget
            onEdit={onEdit}
            onDelete={onDelete}
            editDisabled={pedido.finalizado === true}
            deleteDisabled={pedido.finalizado === true}
            disabledReason={`${sobDemanda ? "Pedidos" : "Produções"} finalizados não podem ser alterados ou excluídos.`}
        />
    );

    return (
        <article className="min-w-0 rounded-[18px] border border-[#DEDEDE] bg-white text-[#404040]">
            <div className="hidden md:flex items-center justify-between gap-2 rounded-t-[18px] bg-[#C9EAF6] px-4 py-3 text-[#4696AD]">
                <h2 className="text-xl">
                    {label} {pedido.numero ?? pedido.id}
                </h2>
                {menu}
            </div>
            <button
                type="button"
                aria-expanded={aberto}
                aria-controls={`pedido-card-${pedido.id}`}
                onClick={() => setAberto(!aberto)}
                className="flex w-full items-center justify-between gap-3 rounded-[18px] p-4 text-left md:hidden focus-visible:outline-[#4696AD]"
            >
                <span className="min-w-0">
                    <span className="block text-xl">
                        {label} {pedido.numero ?? pedido.id}
                    </span>
                    {sobDemanda && (
                        <span className="mt-1 block break-words font-light">
                            {pedido.cliente?.nome || "-"}
                        </span>
                    )}
                </span>
                <span className="flex shrink-0 items-center gap-2 text-sm font-light">
                    {valor}
                    <svg
                        aria-hidden="true"
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        className={`h-4 w-4 ${aberto ? "rotate-180" : ""}`}
                    >
                        <path d="m6 9 6 6 6-6" strokeWidth="1.5" />
                    </svg>
                </span>
            </button>
            <div
                id={`pedido-card-${pedido.id}`}
                className={`${aberto ? "block" : "hidden"} border-t border-[#DEDEDE] md:block md:border-t-0`}
            >
                <div className="p-4">
                    {sobDemanda && (
                        <div className="mb-5 hidden md:block">
                            <p className="text-sm font-light text-[#7B7D80]">Cliente</p>
                            <p className="mt-1 break-words text-lg font-light">
                                {pedido.cliente?.nome || "-"}
                            </p>
                        </div>
                    )}
                    <dl className="flex flex-wrap justify-between gap-3">
                        <div>
                            <dt className="text-sm font-light text-[#7B7D80]">Total de peças</dt>
                            <dd className="mt-1 text-xl">{quantidade}</dd>
                        </div>
                        <div className="text-right">
                            <dt className="text-sm font-light text-[#7B7D80]">
                                {sobDemanda ? "Valor" : "Custo"}
                            </dt>
                            <dd className="mt-1 text-xl">{valor}</dd>
                        </div>
                    </dl>
                </div>
                <div className="mx-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#DEDEDE] py-3 md:mx-0 md:px-4">
                    <div className="text-sm font-light text-[#7B7D80]">
                        <p>Criado {criado}</p>
                        <p className="mt-1">Finalizado {finalizado}</p>
                    </div>
                    <div className="flex items-center gap-1">
                        <button
                            type="button"
                            onClick={onDetails}
                            className="min-h-11 px-2 text-[#4696AD] hover:underline"
                        >
                            Ver detalhes
                        </button>
                        <div className="md:hidden">{menu}</div>
                    </div>
                </div>
            </div>
        </article>
    );
}
