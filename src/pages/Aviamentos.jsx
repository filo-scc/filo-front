import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { deleteAviamento, getAviamentosByFabrico } from "../services/aviamentoService";
import ModalExclusao from "../components/geral/ModalExclusao";
import ModalConfirmacao from "../components/geral/ModalConfirmacao";
import MenuOpcoes from "../components/geral/MenuOpcoes";

const formatarData = (dataString) => {
    if (!dataString) return "-";
    return new Date(dataString).toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
    });
};

const formatarUnidade = (aviamento) => {
    const nome =
        aviamento.unidade_medida ||
        aviamento.unidade?.nome ||
        aviamento.unidade ||
        aviamento.tipo_unidade;
    const sigla =
        aviamento.sigla ||
        aviamento.unidade?.sigla ||
        aviamento.unidade_abrev ||
        aviamento.abreviacao;

    if (nome && sigla) return `${nome} (${sigla})`;
    if (nome) return nome;
    if (sigla) return sigla;
    return "-";
};

const formatarCusto = (aviamento) => {
    const custo = aviamento.custo_unitario ?? aviamento.custo ?? aviamento.preco;
    if (custo == null || custo === "") return "-";
    const valor = Number(custo);
    if (!Number.isFinite(valor)) return "-";
    return `R$${valor.toFixed(2).replace(".", ",")}`;
};

const Aviamentos = () => {
    const navigate = useNavigate();
    const userString = localStorage.getItem("user");
    const fabrico_id = userString ? JSON.parse(userString).fabrico_id : null;

    const [aviamentos, setAviamentos] = useState([]);
    const [loading, setLoading] = useState(true);
    const [busca, setBusca] = useState("");

    const [modalExclusaoAberto, setModalExclusaoAberto] = useState(false);
    const [aviamentoSelecionado, setAviamentoSelecionado] = useState(null);
    const [modalConfirmacaoAberto, setModalConfirmacaoAberto] = useState(false);

    useEffect(() => {
        const fetchAviamentos = async () => {
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
        };
        fetchAviamentos();
    }, [fabrico_id]);

    const aviamentosFiltrados = useMemo(() => {
        const termo = busca.trim().toLowerCase();
        if (!termo) return aviamentos;
        return aviamentos.filter((aviamento) => {
            const nome = String(aviamento.nome || "").toLowerCase();
            const unidade = formatarUnidade(aviamento).toLowerCase();
            return nome.includes(termo) || unidade.includes(termo);
        });
    }, [aviamentos, busca]);

    const handleEdit = (id) => {
        navigate(`/aviamentos/editar/${id}`);
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
        <div className="p-6 pt-0 mt-6 relative flex justify-start w-full">
            <div className="bg-white px-10 py-8 rounded-[24px] shadow-sm w-full flex flex-col relative h-fit">
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
                            className="w-[196px] h-[39px] bg-[#A9E2F2] text-[#FFFFFF] font-normal text-[16px] rounded-full flex items-center justify-center gap-2 hover:bg-[#8acbdc] transition-colors shrink-0"
                        >
                            <img
                                src="/add-aviamentos.png"
                                alt="Adicionar aviamento ícone"
                                className="w-6 h-6 object-contain"
                            />
                            Novo Aviamento
                        </button>
                    </div>
                </div>

                {loading ? (
                    <div className="flex-1 flex items-center justify-center text-gray-400">
                        Carregando aviamentos...
                    </div>
                ) : (
                    <div className="w-full overflow-visible">
                        <div className="min-w-max border border-[#D9D9D9] rounded-xl font-light text-[16px] overflow-hidden">
                            <table className="w-full text-left border-collapse relative z-10">
                                <thead>
                                    <tr className="bg-[#C9EAF6] text-[#4696AD]">
                                        <th className="py-4 px-6 text-center font-normal">Nome</th>
                                        <th className="py-4 px-6 text-center font-normal">
                                            Unidade de medida
                                        </th>
                                        <th className="py-4 px-6 text-center font-normal">
                                            Custo unitário
                                        </th>
                                        <th className="py-4 px-6 text-center font-normal">
                                            Data de cadastro
                                        </th>
                                        <th className="py-4 px-6 text-center font-normal">
                                            Opções
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="text-[#404040]">
                                    {aviamentosFiltrados.map((aviamento, index) => {
                                        const isLast = index === aviamentosFiltrados.length - 1;

                                        return (
                                            <tr
                                                key={aviamento.id}
                                                className="border-b border-[#E8E8E8] last:border-none even:bg-[#E8E8E8] transition-colors text-center"
                                            >
                                                <td className="py-4 px-6">
                                                    {aviamento.nome || "-"}
                                                </td>
                                                <td className="py-4 px-6">
                                                    {formatarUnidade(aviamento)}
                                                </td>
                                                <td className="py-4 px-6">
                                                    {formatarCusto(aviamento)}
                                                </td>
                                                <td className="py-4 px-6">
                                                    {formatarData(
                                                        aviamento.created_at ||
                                                            aviamento.data_cadastro,
                                                    )}
                                                </td>
                                                <td className="py-4 px-6">
                                                    <MenuOpcoes
                                                        onEdit={() => handleEdit(aviamento.id)}
                                                        onDelete={() =>
                                                            abrirModalExclusao(aviamento)
                                                        }
                                                        isLast={isLast}
                                                    />
                                                </td>
                                            </tr>
                                        );
                                    })}

                                    {aviamentosFiltrados.length === 0 && (
                                        <tr>
                                            <td
                                                colSpan="5"
                                                className="text-center py-10 text-gray-400"
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
            />
        </div>
    );
};

export default Aviamentos;
