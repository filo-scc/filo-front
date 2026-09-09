import { useCallback, useEffect, useMemo, useState } from "react";
import {
    deleteAviamento,
    getAviamentoById,
    getAviamentosByFabrico,
} from "../services/aviamentoService";
import ModalExclusao from "../components/geral/ModalExclusao";
import ModalConfirmacao from "../components/geral/ModalConfirmacao";
import MenuOpcoes from "../components/geral/MenuOpcoes";
import AviamentoModal from "../components/aviamentos/AviamentoModal";

const formatarData = (dataString) => {
    if (!dataString) return "-";
    return new Date(dataString).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
};

const formatarUnidade = (aviamento) => {
    const unidades = {
        METRO: "Metro (m)",
        CENTIMETRO: "Centímetro (cm)",
        GRAMA: "Grama (g)",
        QUILOGRAMA: "Quilograma (kg)",
        UNIDADE: "Unidade (un)",
        PAR: "Par (par)",
    };
    return unidades[String(aviamento.unidade_de_medida || "").toUpperCase()] || "-";
};

const formatarCusto = (aviamento) => {
    const custo = aviamento.custo_unitario ?? aviamento.custo ?? aviamento.preco;
    if (custo == null || custo === "") return "-";
    const valor = Number(custo);
    if (!Number.isFinite(valor)) return "-";
    return `R$${valor.toFixed(2).replace(".", ",")}`;
};

const Aviamentos = () => {
    const userString = localStorage.getItem("user");
    const fabrico_id = userString ? JSON.parse(userString).fabrico_id : null;

    const [aviamentos, setAviamentos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [carregandoEdicao, setCarregandoEdicao] = useState(false);
    const [busca, setBusca] = useState("");

    const [modalExclusaoAberto, setModalExclusaoAberto] = useState(false);
    const [modalAviamentoAberto, setModalAviamentoAberto] = useState(false);
    const [modoModalAviamento, setModoModalAviamento] = useState("create");
    const [aviamentoSelecionado, setAviamentoSelecionado] = useState(null);
    const [modalConfirmacaoAberto, setModalConfirmacaoAberto] = useState(false);

    const carregarAviamentos = useCallback(async () => {
        if (!fabrico_id) {
            setLoading(false);
            return;
        }
        try {
            setLoading(true);
            const data = await getAviamentosByFabrico(fabrico_id);
            setAviamentos(Array.isArray(data) ? data : data?.data || []);
        } catch (error) {
            console.error("Erro ao carregar os aviamentos", error);
            setAviamentos([]);
        } finally {
            setLoading(false);
        }
    }, [fabrico_id]);

    useEffect(() => {
        carregarAviamentos();
    }, [carregarAviamentos]);

    const aviamentosFiltrados = useMemo(() => {
        const termo = busca.trim().toLowerCase();
        if (!termo) return aviamentos;
        return aviamentos.filter((aviamento) => {
            const nome = String(aviamento.nome || "").toLowerCase();
            const unidade = formatarUnidade(aviamento).toLowerCase();
            return nome.includes(termo) || unidade.includes(termo);
        });
    }, [aviamentos, busca]);

    const abrirModalCadastro = () => {
        setAviamentoSelecionado(null);
        setModoModalAviamento("create");
        setModalAviamentoAberto(true);
    };

    const fecharModalAviamento = () => {
        setModalAviamentoAberto(false);
        setAviamentoSelecionado(null);
        setModoModalAviamento("create");
    };

    const handleEdit = async (id) => {
        try {
            setCarregandoEdicao(true);
            const aviamento = await getAviamentoById(id);
            setAviamentoSelecionado(aviamento);
            setModoModalAviamento("edit");
            setModalAviamentoAberto(true);
        } catch (error) {
            console.error("Erro ao carregar aviamento para edição:", error);
            alert("Erro ao carregar aviamento para edição.");
        } finally {
            setCarregandoEdicao(false);
        }
    };

    const handleAviamentoSalvo = async () => {
        await carregarAviamentos();
    };

    const abrirModalExclusao = (aviamento) => {
        setAviamentoSelecionado(aviamento);
        setModalExclusaoAberto(true);
    };

    const handleConfirmarExclusao = async () => {
        if (!aviamentoSelecionado) return;

        try {
            await deleteAviamento(aviamentoSelecionado.id);
            setAviamentos(aviamentos.filter((a) => a.id !== aviamentoSelecionado.id));
            setModalExclusaoAberto(false);
            setAviamentoSelecionado(null);
            setModalConfirmacaoAberto(true);
        } catch (error) {
            console.error("Erro ao excluir aviamento:", error);
            alert("Erro ao excluir aviamento.");
        }
    };

    return (
        <div className="p-6 pt-0 mt-6 relative flex justify-start w-full font-['Outfit']">
            <div className="bg-white px-10 py-8 rounded-[24px] shadow-sm w-full flex flex-col relative h-fit">
                {/* Cabeçalho */}
                <div className="flex justify-between items-center mb-8">
                    <h1 className="ml-6 font-light text-[30px] text-[#404040] flex items-center gap-4">
                        <img
                            src="/aviamentos-ativado.png"
                            alt="Ícone Aviamentos"
                            className="w-[34px] h-[34px] object-contain"
                        />
                        Aviamentos
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
                            type="button"
                            onClick={abrirModalCadastro}
                            className="w-[196px] h-[39px] bg-[#A9E2F2] text-[#4696AD] font-light text-[16px] rounded-full flex items-center justify-center gap-2 hover:bg-[#A2DCED] transition-colors shrink-0 cursor-pointer"
                        >
                            <img
                                src="/aviamentos-azul.png"
                                alt="Adicionar aviamento ícone"
                                className="w-6 h-6 object-contain"
                            />
                            Novo Aviamento
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex-1 flex items-center justify-center text-gray-400 py-10 font-light">
                        Carregando aviamentos...
                    </div>
                ) : (
                    <div className="w-full overflow-visible">
                        <div className="min-w-max border border-[#DEDEDE] rounded-xl font-light text-[16px] overflow-hidden">
                            <table className="w-full text-center border-collapse relative z-10">
                                <thead>
                                    <tr className="bg-[#C9EAF6] text-[#4696AD] h-[64px]">
                                        <th className="py-4 px-6 font-light">Nome</th>
                                        <th className="py-4 px-6 font-light">Unidade de medida</th>
                                        <th className="py-4 px-6 font-light">Custo unitário</th>
                                        <th className="py-4 px-6 font-light">Data de cadastro</th>
                                        <th className="py-4 px-6 font-light">Opções</th>
                                    </tr>
                                </thead>
                                <tbody className="text-[#404040]">
                                    {aviamentosFiltrados.map((aviamento, index) => {
                                        const isLast = index === aviamentosFiltrados.length - 1;
                                        const isPar = index % 2 === 0;

                                        return (
                                            <tr
                                                key={aviamento.id}
                                                className={`h-[60px] border-b border-[#E8E8E8] last:border-none transition-colors text-center hover:text-[#4696AD] ${
                                                    isPar
                                                        ? "bg-white hover:bg-[#FBFBFB]"
                                                        : "bg-[#F4F4F4] hover:bg-[#EDEDED]"
                                                }`}
                                            >
                                                <td className="py-4 px-6 font-light">
                                                    {aviamento.nome || "-"}
                                                </td>
                                                <td className="py-4 px-6 font-light">
                                                    {formatarUnidade(aviamento)}
                                                </td>
                                                <td className="py-4 px-6 font-light">
                                                    {formatarCusto(aviamento)}
                                                </td>
                                                <td className="py-4 px-6 font-light">
                                                    {formatarData(
                                                        aviamento.created_at ||
                                                            aviamento.data_cadastro,
                                                    )}
                                                </td>
                                                <td className="py-4 px-6">
                                                    <div className="flex justify-center items-center">
                                                        <MenuOpcoes
                                                            onEdit={() => handleEdit(aviamento.id)}
                                                            onDelete={() =>
                                                                abrirModalExclusao(aviamento)
                                                            }
                                                            isLast={isLast}
                                                        />
                                                    </div>
                                                </td>
                                            </tr>
                                        );
                                    })}

                                    {aviamentosFiltrados.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan="5"
                                                className="text-center py-10 text-gray-400 font-light"
                                            >
                                                Nenhum aviamento encontrado.
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                )}
            </div>

            {carregandoEdicao && (
                <div className="fixed inset-0 z-[1090] flex items-center justify-center bg-black/20 backdrop-blur-sm font-['Outfit'] text-[#4696AD]">
                    Carregando aviamento...
                </div>
            )}

            <AviamentoModal
                isOpen={modalAviamentoAberto}
                onClose={fecharModalAviamento}
                onSuccess={handleAviamentoSalvo}
                mode={modoModalAviamento}
                fabricoId={fabrico_id}
                aviamento={aviamentoSelecionado}
            />

            <ModalExclusao
                isOpen={modalExclusaoAberto}
                onClose={() => setModalExclusaoAberto(false)}
                onConfirm={handleConfirmarExclusao}
                titulo="Excluir aviamento"
                mensagem={
                    <>
                        Deseja mesmo prosseguir com esta ação e excluir {aviamentoSelecionado?.nome}
                        ?
                    </>
                }
            />

            <ModalConfirmacao
                isOpen={modalConfirmacaoAberto}
                onClose={() => setModalConfirmacaoAberto(false)}
                type="excluído"
                message="Aviamento excluído com sucesso!"
                compactButton
            />
        </div>
    );
};

export default Aviamentos;
