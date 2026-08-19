import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import TabelaReferencias from "../components/clientes/TabelaReferencias";
import FloatingLabelInput from "../components/FloatingLabelInput";
import ModalReferencias from "../components/clientes/ModalReferencias";
import ModalConfirmacao from "../components/geral/ModalConfirmacao";
import { ClientEditPageSkeleton, LoadingButton } from "../components/geral/Loading";
import {
    getClienteById,
    getProdutosDoCliente,
    atualizarCliente,
    desvincularProdutoDoCliente,
    atualizarClientesProdutos,
} from "../services/clientesService";

const sectionTitleClass = "text-[20px] font-light text-[#404040] mb-4 font-['Outfit',_sans-serif]";

// Funções utilitárias mantidas...
const apenasNumeros = (valor) => String(valor || "").replace(/\D/g, "");
const formatarCnpj = (valor) => {
    const digitos = apenasNumeros(valor).slice(0, 14);
    return digitos
        .replace(/^(\d{2})(\d)/, "$1.$2")
        .replace(/^(\d{2})\.(\d{3})(\d)/, "$1.$2.$3")
        .replace(/\.(\d{3})(\d)/, ".$1/$2")
        .replace(/(\d{4})(\d)/, "$1-$2");
};
const formatarTelefone = (valor) => {
    const digitos = apenasNumeros(valor).slice(0, 11);
    if (!digitos) return "";
    if (digitos.length <= 2) return `(${digitos}`;
    if (digitos.length <= 6) return `(${digitos.slice(0, 2)}) ${digitos.slice(2)}`;
    if (digitos.length <= 10)
        return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 6)}-${digitos.slice(6)}`;
    return `(${digitos.slice(0, 2)}) ${digitos.slice(2, 7)}-${digitos.slice(7)}`;
};
const formatarCep = (valor) => {
    const digitos = apenasNumeros(valor).slice(0, 8);
    return digitos.length <= 5 ? digitos : `${digitos.slice(0, 5)}-${digitos.slice(5)}`;
};
const valorOuUndefined = (valor) => {
    const limpo = String(valor || "").trim();
    return limpo.length > 0 ? limpo : undefined;
};
const numeroOuUndefined = (valor) => {
    const texto = String(valor).trim();
    if (!texto) return undefined;
    const numero = Number(texto);
    return Number.isFinite(numero) ? numero : undefined;
};
const primeiroNumeroValido = (...valores) => {
    for (const valor of valores) {
        const num = numeroOuUndefined(valor);
        if (num !== undefined) return num;
    }
    return undefined;
};

export default function ClientesEditar() {
    const { id } = useParams();
    const navigate = useNavigate();
    const usuarioLogado = JSON.parse(localStorage.getItem("user") || "{}");

    const [loading, setLoading] = useState(true);
    const [salvando, setSalvando] = useState(false);
    const [erro, setErro] = useState("");
    const [statusCliente, setStatusCliente] = useState(true);
    const [form, setForm] = useState({
        nomeEmpresa: "",
        cnpj: "",
        proprietario: "",
        telefone: "",
        cep: "",
        rua: "",
        numero: "",
        bairro: "",
        complemento: "",
        cidade: "",
        estado: "",
    });

    const [produtosAssociados, setProdutosAssociados] = useState([]);
    const [modalReferenciasAberto, setModalReferenciasAberto] = useState(false);
    const [modalConfirmacaoAberto, setModalConfirmacaoAberto] = useState(false);

    // Novo estado para controlar qual item estamos editando na tabela
    const [itemParaEditar, setItemParaEditar] = useState(null);

    const fabricoId = primeiroNumeroValido(
        usuarioLogado?.fabrico_id,
        usuarioLogado?.fabricoId,
        usuarioLogado?.fabrico?.id,
    );
    const handleChange = (campo) => (e) =>
        setForm((prev) => ({ ...prev, [campo]: e.target.value }));
    const handleChangeCnpj = (e) =>
        setForm((prev) => ({ ...prev, cnpj: formatarCnpj(e.target.value) }));
    const handleChangeTelefone = (e) =>
        setForm((prev) => ({ ...prev, telefone: formatarTelefone(e.target.value) }));
    const handleChangeCep = (e) =>
        setForm((prev) => ({ ...prev, cep: formatarCep(e.target.value) }));

    const recarregarProdutos = async () => {
        if (!id) return;

        const dados = await getProdutosDoCliente(id);
        setProdutosAssociados(dados);
    };

    useEffect(() => {
        async function carregar() {
            if (!id) return navigate("/clientes");
            try {
                setLoading(true);
                const [dadosCliente, dadosProdutos] = await Promise.all([
                    getClienteById(id),
                    getProdutosDoCliente(id),
                ]);

                const end = dadosCliente.endereco || {};
                setStatusCliente(Boolean(dadosCliente.status));
                setForm({
                    nomeEmpresa: dadosCliente.nome ?? "",
                    cnpj: dadosCliente.cnpj ? formatarCnpj(dadosCliente.cnpj) : "",
                    proprietario: dadosCliente.responsavel ?? "",
                    telefone: dadosCliente.telefone ? formatarTelefone(dadosCliente.telefone) : "",
                    cep: end.cep ? formatarCep(String(end.cep)) : "",
                    rua: end.rua ?? "",
                    numero: String(end.numero ?? ""),
                    bairro: end.bairro ?? "",
                    complemento: end.complemento ?? "",
                    cidade: end.cidade ?? "",
                    estado: end.estado ?? "",
                });
                setProdutosAssociados(dadosProdutos);
            } catch (e) {
                navigate("/clientes", { state: { error: "Erro ao carregar cliente." } });
                throw e;
            } finally {
                setLoading(false);
            }
        }
        carregar();
    }, [id, navigate]);

    const handleFinalizar = async () => {
        setErro("");
        if (!id) return;

        const payload = {
            nome: valorOuUndefined(form.nomeEmpresa),
            cnpj: apenasNumeros(form.cnpj),
            telefone: apenasNumeros(form.telefone),
            status: statusCliente,
            responsavel: valorOuUndefined(form.proprietario),
            fabrico_id: fabricoId,
            endereco: {
                cep: apenasNumeros(form.cep),
                rua: valorOuUndefined(form.rua),
                numero: valorOuUndefined(form.numero),
                bairro: valorOuUndefined(form.bairro),
                complemento: valorOuUndefined(form.complemento),
                cidade: valorOuUndefined(form.cidade),
                estado: valorOuUndefined(form.estado),
            },
        };

        try {
            setSalvando(true);
            await atualizarCliente(id, payload);
            setModalConfirmacaoAberto(true);
        } catch (e) {
            setErro("Erro ao salvar alterações.");
            throw e;
        } finally {
            setSalvando(false);
        }
    };

    const removerLinha = async (item, index) => {
        const pId = item?.produto?.id || item?.produto_id;
        await desvincularProdutoDoCliente(id, pId);
        setProdutosAssociados((prev) => prev.filter((_, i) => i !== index));
    };

    const editarLinha = async (dadosEditados) => {
        const pId = dadosEditados.produto_id;

        try {
            await atualizarClientesProdutos(id, pId, {
                nome_para_cliente: dadosEditados.nome_para_cliente,
                preco_padrao: dadosEditados.preco_padrao,
            });

            setProdutosAssociados((listaAnterior) => {
                const novaLista = listaAnterior.map((item) => {
                    const itemId = item?.produto?.id || item?.produto_id;

                    if (itemId === pId) {
                        return {
                            ...item,
                            nome_para_cliente: dadosEditados.nome_para_cliente,
                            preco_padrao: dadosEditados.preco_padrao,
                        };
                    }
                    return item;
                });

                return novaLista;
            });
        } catch (error) {
            console.error("❌ ERRO AO SALVAR:", error);
        }
    };
    return (
        <div className="p-6 pt-0 mt-6 w-full font-['Outfit',_sans-serif]">
            <div className="bg-white p-8 sm:p-10 rounded-[32px] shadow-[0_8px_40px_rgba(70,150,173,0.08)] border border-[#F0F4F6] w-full">
                <div className="flex flex-wrap items-center gap-3 mb-10">
                    <img src="/star.png" alt="" className="w-8 h-8 shrink-0" />
                    <h1 className="text-[28px] sm:text-[30px] font-light text-[#404040]">
                        Editar cliente
                    </h1>
                </div>

                {loading ? (
                    <ClientEditPageSkeleton />
                ) : (
                    <>
                        <section className="mb-10">
                            <h2 className={sectionTitleClass}>Dados gerais</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                                <FloatingLabelInput
                                    label="Nome da empresa"
                                    value={form.nomeEmpresa}
                                    onChange={handleChange("nomeEmpresa")}
                                />
                                <FloatingLabelInput
                                    label="CNPJ"
                                    value={form.cnpj}
                                    onChange={handleChangeCnpj}
                                />
                                <FloatingLabelInput
                                    label="Proprietário"
                                    value={form.proprietario}
                                    onChange={handleChange("proprietario")}
                                />
                                <FloatingLabelInput
                                    label="Telefone"
                                    value={form.telefone}
                                    onChange={handleChangeTelefone}
                                />
                            </div>
                        </section>

                        <section className="mb-10">
                            <h2 className={sectionTitleClass}>Endereço</h2>
                            <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 mb-4">
                                <div className="sm:col-span-2">
                                    <FloatingLabelInput
                                        label="CEP"
                                        value={form.cep}
                                        onChange={handleChangeCep}
                                    />
                                </div>
                                <div className="sm:col-span-5">
                                    <FloatingLabelInput
                                        label="Rua"
                                        value={form.rua}
                                        onChange={handleChange("rua")}
                                    />
                                </div>
                                <div className="sm:col-span-2">
                                    <FloatingLabelInput
                                        label="Nº"
                                        value={form.numero}
                                        onChange={handleChange("numero")}
                                    />
                                </div>
                                <div className="sm:col-span-3">
                                    <FloatingLabelInput
                                        label="Bairro"
                                        value={form.bairro}
                                        onChange={handleChange("bairro")}
                                    />
                                </div>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                                <div className="md:col-span-5">
                                    <FloatingLabelInput
                                        label="Complemento"
                                        value={form.complemento}
                                        onChange={handleChange("complemento")}
                                    />
                                </div>
                                <div className="md:col-span-4">
                                    <FloatingLabelInput
                                        label="Cidade"
                                        value={form.cidade}
                                        onChange={handleChange("cidade")}
                                    />
                                </div>
                                <div className="md:col-span-3">
                                    <FloatingLabelInput
                                        label="Estado"
                                        value={form.estado}
                                        onChange={handleChange("estado")}
                                    />
                                </div>
                            </div>
                        </section>

                        <div className="mb-10">
                            <TabelaReferencias
                                title="Associar produtos e referências"
                                produtos={produtosAssociados}
                                onAbrirModal={() => {
                                    setItemParaEditar(null);
                                    setModalReferenciasAberto(true);
                                }}
                                onRemoverLinha={removerLinha}
                                onSalvarEdicao={editarLinha}
                            />
                        </div>

                        <div className="flex flex-wrap justify-end gap-4 pt-2">
                            <LoadingButton
                                type="button"
                                onClick={handleFinalizar}
                                loading={salvando}
                                loadingText="Salvando..."
                                className="bg-[#A9E2F2] hover:bg-[#A2DCED] text-[#4696AD] h-[42px] px-8 rounded-full min-w-[180px]"
                            >
                                Finalizar edição
                            </LoadingButton>
                        </div>
                        {erro && <p className="pt-4 text-sm text-[#D75757] text-right">{erro}</p>}
                    </>
                )}
            </div>

            {/* Modal de Referências - Note as novas props */}
            {modalReferenciasAberto && (
                <ModalReferencias
                    isOpen={modalReferenciasAberto}
                    onClose={() => {
                        setModalReferenciasAberto(false);
                        setItemParaEditar(null);
                    }}
                    clienteId={id}
                    fabricoId={fabricoId}
                    itemParaEditar={itemParaEditar} // Passa o item se for edição
                    produtosExistentes={produtosAssociados}
                    onSuccess={recarregarProdutos}
                />
            )}

            <ModalConfirmacao
                isOpen={modalConfirmacaoAberto}
                onClose={() => {
                    setModalConfirmacaoAberto(false);
                    navigate("/clientes");
                }}
                type="atualizado"
            />
        </div>
    );
}
