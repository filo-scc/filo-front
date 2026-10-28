import { useEffect, useState } from "react";
import { getPedidosByFabricoId, deletPedido } from "../services/pedidoService";
import { getFabricoById } from "../services/fabricoService";
import { useNavigate } from "react-router-dom";
import ModalExclusao from "../components/geral/ModalExclusao";
import ModalConfirmacao from "../components/geral/ModalConfirmacao";
import PedidoCard from "../components/pedidos/PedidoCard";
import MenuOpcoes from "../components/geral/MenuOpcoes";
import { PedidosTableSkeleton } from "../components/geral/Loading";
import { parsePreco } from "../utils/preco";
import { extrairMensagemDeErro } from "../utils/mensagemApi";

const formatarMoeda = (valor) =>
    parsePreco(valor).toLocaleString("pt-BR", {
        style: "currency",
        currency: "BRL",
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    });

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
    const [erroExclusao, setErroExclusao] = useState("");

    useEffect(() => {
        const fetchPedidos = async () => {
            if (!fabrico_id) {
                setLoading(false);
                return;
            }
            try {
                setLoading(true);

                const [data, fabrico] = await Promise.all([
                    getPedidosByFabricoId(),
                    getFabricoById(fabrico_id),
                ]);
                setProducaoSobDemanda(fabrico?.fabricacao_sob_demanda === true);
                const pedidosOrdenados = [...data].sort(
                    (a, b) => (Number(b.numero) || b.id) - (Number(a.numero) || a.id),
                );
                setPedidos(pedidosOrdenados);
            } catch (error) {
                console.error("Erro ao carregar os pedidos", error);
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

    const dataFinalizado = (pedido) => {
        let textoDataFinalizado = "-";

        if (pedido.finalizado) {
            let ultimaDataFim = null;

            pedido.fichas_tecnicas?.forEach((ficha) => {
                ficha.fichas_etapas?.forEach((etapa) => {
                    if (etapa.data_fim) {
                        const dataAtual = new Date(etapa.data_fim);
                        if (!ultimaDataFim || dataAtual > ultimaDataFim) {
                            ultimaDataFim = dataAtual;
                        }
                    }
                });
            });

            if (ultimaDataFim) {
                textoDataFinalizado = formatarData(ultimaDataFim);
            } else {
                textoDataFinalizado = formatarData(pedido.updated_at);
            }
        }

        return textoDataFinalizado;
    };

    const handleEdit = (pedido) => {
        if (pedido.finalizado) return;
        navigate(`/pedidos/editar/${pedido.id}`);
    };

    const abrirModalExclusao = (pedido) => {
        if (pedido.finalizado) return;
        setErroExclusao("");
        setPedidoSelecionado(pedido);
        setModalExclusaoAberto(true);
    };

    const handleConfirmarExclusao = async () => {
        if (!pedidoSelecionado || pedidoSelecionado.finalizado || excluindo) return;

        try {
            setExcluindo(true);
            setErroExclusao("");
            await deletPedido(pedidoSelecionado.id);

            setPedidos(pedidos.filter((c) => c.id !== pedidoSelecionado.id));
            setModalExclusaoAberto(false);
            setPedidoSelecionado(null);
            setModalConfirmacaoAberto(true);
        } catch (error) {
            console.error("Erro ao excluir pedido:", error);
            if (error?.response?.status === 409) {
                setErroExclusao(
                    extrairMensagemDeErro(error) ||
                        "Não foi possível excluir: o pedido não permite exclusão.",
                );
                return;
            }
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
        <div className="p-3 md:p-6 pt-0 mt-6 relative flex justify-start w-full min-w-0 font-['Outfit']">
            <div className="bg-white px-4 py-6 xl:px-10 xl:py-8 rounded-[24px] shadow-sm w-full flex flex-col relative h-fit">
                {/* Cabeçalho da Página */}
                <div className="flex flex-col gap-4 md:flex-row md:flex-wrap md:justify-between md:items-center mb-8">
                    <h1 className="xl:ml-6 font-light text-[30px] text-[#404040] flex items-center gap-4">
                        <img
                            src="/pedidos-ativado.png"
                            alt=""
                            className="w-[34px] h-[34px] object-contain"
                        />
                        {tituloLista}
                    </h1>

                    <div className="flex w-full flex-col gap-3 md:w-auto md:flex-row md:items-center md:gap-4">
                        <div className="relative w-full md:w-auto">
                            <input
                                type="text"
                                placeholder="Buscar"
                                aria-label="Buscar pedidos ou produções"
                                value={busca}
                                onChange={(e) => setBusca(e.target.value)}
                                className="pl-4 pr-10 border border-[#D3D3D3] rounded-[16px] text-sm focus:outline-none w-full md:w-[196px] h-11 md:h-[39px] shrink-0 font-light"
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
                            className="w-full md:w-[169px] h-11 md:h-[39px] bg-[#A9E2F2] text-[#4696AD] font-light text-[16px] rounded-full flex items-center justify-center gap-2 hover:bg-[#A2DCED] transition-colors shrink-0 cursor-pointer"
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

                <div className="xl:hidden">
                    {loading ? (
                        <div
                            role="status"
                            aria-label="Carregando"
                            className="grid grid-cols-1 gap-4 md:grid-cols-2"
                        >
                            {Array.from({ length: 4 }, (_, index) => (
                                <div
                                    key={index}
                                    aria-hidden="true"
                                    className="h-28 md:h-72 animate-pulse rounded-[18px] border border-[#DEDEDE] bg-[#F4F4F4] motion-reduce:animate-none"
                                />
                            ))}
                        </div>
                    ) : pedidos.length === 0 ? (
                        <p className="py-10 text-center text-[#7B7D80]">{labelVazio}</p>
                    ) : (
                        <>
                            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                                {pedidos.map((pedido) => (
                                    <PedidoCard
                                        key={pedido.id}
                                        pedido={pedido}
                                        label={labelItemColuna}
                                        sobDemanda={producaoSobDemanda}
                                        valor={
                                            producaoSobDemanda && !pedido.cliente
                                                ? "-"
                                                : formatarMoeda(
                                                      producaoSobDemanda
                                                          ? pedido.valor_total
                                                          : pedido.custo_total,
                                                  )
                                        }
                                        criado={formatarData(pedido.created_at)}
                                        finalizado={dataFinalizado(pedido)}
                                        onDetails={() => navigate(`/pedidos/${pedido.id}`)}
                                        onEdit={() => handleEdit(pedido)}
                                        onDelete={() => abrirModalExclusao(pedido)}
                                    />
                                ))}
                            </div>
                            <p className="mt-5 text-sm font-light text-[#7B7D80]">
                                {pedidos.length}{" "}
                                {pedidos.length === 1
                                    ? labelItemColuna.toLowerCase()
                                    : tituloLista.toLowerCase()}
                            </p>
                        </>
                    )}
                </div>

                {/* Tabela de Pedidos */}
                <div className="hidden xl:block w-full overflow-x-auto">
                    <div className="min-w-max border border-[#DEDEDE] rounded-xl font-light text-[16px] overflow-hidden">
                        <table className="w-full text-left border-collapse relative z-10">
                            <thead className="font-['Outfit']">
                                <tr className="bg-[#C9EAF6] text-[#4696AD] h-[64px]">
                                    <th className="py-4 px-6 text-center font-light">
                                        {labelItemColuna}
                                    </th>
                                    {producaoSobDemanda && (
                                        <th className="py-4 px-6 text-center font-light">
                                            Cliente
                                        </th>
                                    )}
                                    <th className="py-4 px-6 text-center font-light">
                                        Total de peças
                                    </th>
                                    <th className="py-4 px-6 text-center font-light">
                                        {producaoSobDemanda ? "Valor" : "Custo"}
                                    </th>
                                    <th className="py-4 px-6 text-center font-light">Criado</th>
                                    <th className="py-4 px-6 text-center font-light">Finalizado</th>
                                    <th className="py-4 px-6 text-center font-light">Opções</th>
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

                                            const textoDataFinalizado = dataFinalizado(pedido);
                                            const isLast = index === pedidos.length - 1;

                                            const valorMonetario = producaoSobDemanda
                                                ? pedido.valor_total
                                                : pedido.custo_total;

                                            return (
                                                <tr
                                                    key={pedido.id}
                                                    onClick={() =>
                                                        navigate(`/pedidos/${pedido.id}`)
                                                    }
                                                    className={`border-b border-[#E8E8E8] last:border-none transition-colors text-center cursor-pointer hover:text-[#4696ad] ${index % 2 === 0 ? "bg-white hover:bg-[#FBFBFB]" : "bg-[#F4F4F4] hover:bg-[#EDEDED]"}`}
                                                >
                                                    <td className="py-4 px-6 font-light">
                                                        {pedido.numero ?? pedido.id}
                                                    </td>

                                                    {producaoSobDemanda && (
                                                        <td className="py-4 px-6 font-light">
                                                            {pedido.cliente?.nome || "-"}
                                                        </td>
                                                    )}
                                                    <td className="py-4 px-6 font-light">
                                                        {totalPecas}
                                                    </td>
                                                    <td className="py-4 px-6 font-light">
                                                        {producaoSobDemanda && !pedido.cliente
                                                            ? "-"
                                                            : formatarMoeda(valorMonetario)}
                                                    </td>

                                                    <td className="py-4 px-6 font-light">
                                                        {formatarData(pedido.created_at)}
                                                    </td>
                                                    <td className="py-4 px-6 font-light">
                                                        {textoDataFinalizado}
                                                    </td>
                                                    <td
                                                        className="py-4 px-6"
                                                        onClick={(e) => e.stopPropagation()}
                                                    >
                                                        <MenuOpcoes
                                                            onEdit={() => handleEdit(pedido)}
                                                            onDelete={() =>
                                                                abrirModalExclusao(pedido)
                                                            }
                                                            isLast={isLast}
                                                            editDisabled={
                                                                pedido.finalizado === true
                                                            }
                                                            deleteDisabled={
                                                                pedido.finalizado === true
                                                            }
                                                            disabledReason={
                                                                producaoSobDemanda
                                                                    ? "Pedidos finalizados não podem ser alterados ou excluídos."
                                                                    : "Produções finalizadas não podem ser alteradas ou excluídas."
                                                            }
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
                nomeItem={pedidoSelecionado?.numero}
                tipoItem={producaoSobDemanda ? "o pedido" : "a produção"}
                loading={excluindo}
                erro={erroExclusao}
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
