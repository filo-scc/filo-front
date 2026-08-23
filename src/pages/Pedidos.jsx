import { useEffect, useState } from "react";
import { getPedidosByFabricoId, deletPedido } from "../services/pedidoService";
import { getFabricoById } from "../services/fabricoService";
import { useNavigate } from "react-router-dom";
import ModalExclusao from "../components/geral/ModalExclusao";
import ModalConfirmacao from "../components/geral/ModalConfirmacao";
import MenuOpcoes from "../components/geral/MenuOpcoes";
import { PedidosTableSkeleton } from "../components/geral/Loading";

const Pedidos = () => {
    const navigate = useNavigate();
    const userString = localStorage.getItem("user");
    const fabrico_id = userString ? JSON.parse(userString).fabrico_id : null;

    const [pedidos, setPedidos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busca, setBusca] = useState("");
    const [producaoSobDemanda, setProducaoSobDemanda] = useState(null);

    const [modalExclusaoAberto, setModalExclusaoAberto] = useState(false);
    const [pedidoSelecionado, setPedidoSelecionado] = useState(null);

    const [modalConfirmacaoAberto, setModalConfirmacaoAberto] = useState(false);
    const [excluindo, setExcluindo] = useState(false);

    useEffect(() => {
        const fetchPedidos = async () => {
            if (!fabrico_id) {
                setLoading(false);
                return;
            }
            try {
                setLoading(true);

                const [data, fabrico] = await Promise.all([
                    getPedidosByFabricoId(fabrico_id),
                    getFabricoById(fabrico_id),
                ]);
                setProducaoSobDemanda(fabrico?.fabricacao_sob_demanda === true);
                const pedidosOrdenados = [...data].sort(
                    (a, b) => (Number(b.numero) || b.id) - (Number(a.numero) || a.id),
                );
                setPedidos(pedidosOrdenados);
            } catch (error) {
                console.error("Erro ao carregar os pedids", error);
            } finally {
                setLoading(false);
            }
        };
        fetchPedidos();
    }, [fabrico_id]);

    const formatarData = (dataString) => {
        if (!dataString) return "-";
        return new Date(dataString).toLocaleDateString("pt-br", {
            day: "2-digit",
            month: "2-digit",
        });
    };

    const handleEdit = (id) => {
        navigate(`/pedidos/editar/${id}`);
    };

    const abrirModalExclusao = (pedido) => {
        setPedidoSelecionado(pedido);
        setModalExclusaoAberto(true);
    };

    const handleConfirmarExclusao = async () => {
        if (!pedidoSelecionado || excluindo) return;

        try {
            setExcluindo(true);
            await deletPedido(pedidoSelecionado.id);

            setPedidos(pedidos.filter((c) => c.id !== pedidoSelecionado.id));
            setModalExclusaoAberto(false);
            setPedidoSelecionado(null);
            setModalConfirmacaoAberto(true);
        } catch (error) {
            console.error("Erro ao excluir pedido:", error);
            alert(producaoSobDemanda ? "Erro ao excluir pedido." : "Erro ao excluir produção.");
        } finally {
            setExcluindo(false);
        }
    };

    const tituloLista =
        producaoSobDemanda == null ? "" : producaoSobDemanda ? "Pedidos" : "Produções";
    const labelNova =
        producaoSobDemanda == null ? "" : producaoSobDemanda ? "Novo pedido" : "Nova produção";
    const labelItemColuna = producaoSobDemanda ? "Pedido" : "Produção";
    const labelVazio = producaoSobDemanda
        ? "Nenhum pedido encontrado."
        : "Nenhuma produção encontrada.";

    return (
        <div className="p-6 pt-0 mt-6 relative flex justify-start w-full">
            <div className="bg-white px-10 py-8 rounded-[24px] shadow-sm w-full flex flex-col relative h-fit">
                {/* Cabeçalho da Página */}
                <div className="flex justify-between items-center mb-8">
                    <h1 className="ml-6 font-light text-[30px] text-[#404040] flex items-center gap-4">
                        <img
                            src="/pedidos-ativado.png"
                            alt=""
                            className="w-[34px] h-[34px] object-contain"
                        />
                        {tituloLista}
                    </h1>

                    <div className="flex items-center gap-4">
                        <div className="relative">
                            <input
                                type="text"
                                placeholder="Buscar"
                                value={busca}
                                onChange={(e) => setBusca(e.target.value)}
                                className="pl-4 pr-10 border border-[#D3D3D3] rounded-[16px] text-sm focus:outline-none w-[196px] h-[39px] shrink-0 font-light"
                            />
                            <svg
                                className="w-4 h-4 text-gray-400 absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth="2"
                                    d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                                />
                            </svg>
                        </div>

                        <button
                            onClick={() => navigate("/pedidos/cadastrar")}
                            className="w-[169px] h-[39px] bg-[#A9E2F2] text-[#4696AD] font-normal text-[16px] rounded-full flex items-center justify-center gap-2 hover:bg-[#A2DCED] transition-colors shrink-0"
                        >
                            <img
                                src="/pedidos-azul.png"
                                alt=""
                                className="w-6 h-6 object-contain"
                            />
                            {labelNova}
                        </button>
                    </div>
                </div>

                {/* Tabela de Pedidos */}
                <div className="w-full overflow-visible">
                    <div className="min-w-max border border-[#D9D9D9] rounded-xl font-light text-[16px] overflow-hidden">
                        <table className="w-full text-left border-collapse relative z-10">
                            <thead>
                                <tr className="bg-[#C9EAF6] text-[#4696AD]">
                                    <th className="py-4 px-6 text-center font-normal">
                                        {labelItemColuna}
                                    </th>
                                    {producaoSobDemanda && (
                                        <th className="py-4 px-6 text-center font-normal">
                                            Cliente
                                        </th>
                                    )}
                                    <th className="py-4 px-6 text-center font-normal">
                                        Total de peças
                                    </th>
                                    <th className="py-4 px-6 text-center font-normal">
                                        {producaoSobDemanda ? "Valor" : "Custo"}
                                    </th>
                                    <th className="py-4 px-6 text-center font-normal">Criado</th>
                                    <th className="py-4 px-6 text-center font-normal">
                                        Finalizado
                                    </th>
                                    <th className="py-4 px-6 text-center font-normal">Opções</th>
                                </tr>
                            </thead>
                            <tbody className="text-[#404040]">
                                {loading ? (
                                    <PedidosTableSkeleton
                                        rows={5}
                                        mostrarCliente={producaoSobDemanda !== false}
                                    />
                                ) : (
                                    <>
                                        {pedidos.map((pedido, index) => {
                                            const totalPecas =
                                                pedido.fichas_tecnicas?.reduce(
                                                    (acc, ficha) => acc + ficha.quantidade,
                                                    0,
                                                ) || 0;

                                            let textoDataFinalizado = "-";

                                            const isLast = index === pedidos.length - 1;

                                            if (pedido.finalizado) {
                                                let ultimaDataFim = null;

                                                pedido.fichas_tecnicas?.forEach((ficha) => {
                                                    ficha.fichas_etapas?.forEach((etapa) => {
                                                        if (etapa.data_fim) {
                                                            const dataAtual = new Date(
                                                                etapa.data_fim,
                                                            );
                                                            if (
                                                                !ultimaDataFim ||
                                                                dataAtual > ultimaDataFim
                                                            ) {
                                                                ultimaDataFim = dataAtual;
                                                            }
                                                        }
                                                    });
                                                });

                                                if (ultimaDataFim) {
                                                    textoDataFinalizado =
                                                        formatarData(ultimaDataFim);
                                                } else {
                                                    textoDataFinalizado = formatarData(
                                                        pedido.updated_at,
                                                    );
                                                }
                                            }

                                            const valorMonetario = producaoSobDemanda
                                                ? pedido.valor_total
                                                : pedido.custo_total;

                                            return (
                                                <tr
                                                    key={pedido.id}
                                                    className="border-b border-[#E8E8E8] last:border-none even:bg-[#E8E8E8] transition-colors text-center"
                                                >
                                                    <td className="py-4 px-6">
                                                        {pedido.numero ?? pedido.id}
                                                    </td>

                                                    {producaoSobDemanda && (
                                                        <td className="py-4 px-6">
                                                            {pedido.cliente?.nome || "-"}
                                                        </td>
                                                    )}
                                                    <td className="py-4 px-6 ">{totalPecas}</td>
                                                    <td className="py-4 px-6 ">
                                                        {producaoSobDemanda && !pedido.cliente
                                                            ? "-"
                                                            : valorMonetario != null
                                                              ? `R$ ${Number(valorMonetario)
                                                                    .toFixed(2)
                                                                    .replace(".", ",")}`
                                                              : "R$ 0,00"}
                                                    </td>

                                                    <td className="py-4 px-6">
                                                        {formatarData(pedido.created_at)}
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        {textoDataFinalizado}
                                                    </td>
                                                    <td className="py-4 px-6">
                                                        <MenuOpcoes
                                                            onEdit={() => handleEdit(pedido.id)}
                                                            onDelete={() =>
                                                                abrirModalExclusao(pedido)
                                                            }
                                                            isLast={isLast}
                                                        />
                                                    </td>
                                                </tr>
                                            );
                                        })}

                                        {pedidos.length === 0 && (
                                            <tr>
                                                <td
                                                    colSpan={producaoSobDemanda ? 7 : 6}
                                                    className="text-center py-10 text-gray-400"
                                                >
                                                    {labelVazio}
                                                </td>
                                            </tr>
                                        )}
                                    </>
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            <ModalExclusao
                isOpen={modalExclusaoAberto}
                onClose={() => setModalExclusaoAberto(false)}
                onConfirm={handleConfirmarExclusao}
                titulo={producaoSobDemanda ? "Excluir pedido" : "Excluir produção"}
                nomeItem={pedidoSelecionado?.id.toString()}
                tipoItem={producaoSobDemanda ? "o pedido" : "a produção"}
                loading={excluindo}
            />

            <ModalConfirmacao
                isOpen={modalConfirmacaoAberto}
                onClose={() => setModalConfirmacaoAberto(false)}
                type="excluído"
            />
        </div>
    );
};

export default Pedidos;
