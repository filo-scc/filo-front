import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import TabelaReferencias from "../components/clientes/TabelaReferencias";
import FloatingLabelInput from "../components/FloatingLabelInput";
import {
    cadastrarCliente,
    getClientes,
    getProdutosPorFabrico,
    vincularProdutoAoCliente,
} from "../services/clientesService";
import { apenasNumeros, formatarCep, formatarCnpj, formatarTelefone } from "../utils/formatters";

const sectionTitleClass = "text-[20px] font-light text-[#404040] mb-4 font-['Outfit',_sans-serif]";

export default function ClientesCadastrar() {
    const navigate = useNavigate();
    const usuarioLogado = JSON.parse(localStorage.getItem("user") || "{}");
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
    const [produtosDisponiveis, setProdutosDisponiveis] = useState([]);
    const [selecionados, setSelecionados] = useState([]);
    const [buscaReferencia, setBuscaReferencia] = useState("");
    const [loadingReferencias, setLoadingReferencias] = useState(false);
    const [salvando, setSalvando] = useState(false);
    const [erroCadastro, setErroCadastro] = useState("");

    const handleChange = (campo) => (e) => {
        setForm((prev) => ({ ...prev, [campo]: e.target.value }));
    };

    const handleChangeCnpj = (e) => {
        setForm((prev) => ({ ...prev, cnpj: formatarCnpj(e.target.value) }));
    };

    const handleChangeTelefone = (e) => {
        setForm((prev) => ({ ...prev, telefone: formatarTelefone(e.target.value) }));
    };

    const handleChangeCep = (e) => {
        setForm((prev) => ({ ...prev, cep: formatarCep(e.target.value) }));
    };

    const handleChangeNumeroEndereco = (e) => {
        setForm((prev) => ({ ...prev, numero: e.target.value }));
    };

    const handleAdicionarProdutos = (produtosSelecionados) => {
        if (!produtosSelecionados?.length) return;

        setProdutosAssociados((prev) => {
            const idsExistentes = new Set(
                prev
                    .map((item) => item?.produto?.id ?? item?.produto_id ?? item?.id_produto)
                    .filter((id) => id !== null && id !== undefined)
                    .map(String),
            );

            const novosProdutos = produtosSelecionados
                .filter((produto) => !idsExistentes.has(String(produto.id)))
                .map((produto) => ({
                    produto: {
                        id: produto.id,
                        foto: produto.foto,
                        nome: produto.nome,
                    },
                    nome_para_cliente: produto.nome,
                    preco_padrao: 0,
                }));

            return [...prev, ...novosProdutos];
        });
    };

    const valorOuUndefined = (valor) => {
        const limpo = String(valor || "").trim();
        return limpo.length > 0 ? limpo : undefined;
    };

    const numeroOuUndefined = (valor) => {
        if (valor === null || valor === undefined) return undefined;
        const texto = String(valor).trim();
        if (!texto) return undefined;
        const numero = Number(texto);
        return Number.isFinite(numero) ? numero : undefined;
    };

    const primeiroNumeroValido = (...valores) => {
        for (const valor of valores) {
            const numero = numeroOuUndefined(valor);
            if (numero !== undefined) return numero;
        }
        return undefined;
    };

    const fabricoId = primeiroNumeroValido(
        usuarioLogado?.fabrico_id,
        usuarioLogado?.fabricoId,
        usuarioLogado?.fabrico?.id,
    );

    const parceiroId = primeiroNumeroValido(
        usuarioLogado?.parceiro_id,
        usuarioLogado?.parceiroId,
        usuarioLogado?.parceiro?.id,
        usuarioLogado?.parceiro?.parceiro_id,
        usuarioLogado?.parceiro?.[0]?.id,
        usuarioLogado?.parceiro?.[0]?.parceiro_id,
        usuarioLogado?.usuario?.parceiro_id,
    );

    useEffect(() => {
        if (!modalReferenciasAberto || !fabricoId) return;

        let ignorar = false;

        const carregarReferencias = async () => {
            setLoadingReferencias(true);
            try {
                const produtos = await getProdutosPorFabrico(fabricoId, buscaReferencia);
                if (ignorar) return;

                const idsAssociados = new Set(
                    produtosAssociados
                        .map((item) => item?.produto?.id ?? item?.produto_id ?? item?.id_produto)
                        .filter((id) => id !== null && id !== undefined)
                        .map(String),
                );

                setProdutosDisponiveis(
                    (produtos || []).filter((produto) => !idsAssociados.has(String(produto?.id))),
                );
            } catch (error) {
                if (!ignorar) {
                    console.error("Erro ao buscar referências:", error);
                    setProdutosDisponiveis([]);
                }
            } finally {
                if (!ignorar) {
                    setLoadingReferencias(false);
                }
            }
        };

        const debounce = setTimeout(carregarReferencias, 300);

        return () => {
            ignorar = true;
            clearTimeout(debounce);
        };
    }, [modalReferenciasAberto, fabricoId, buscaReferencia, produtosAssociados]);

    const fecharModalReferencias = () => {
        setModalReferenciasAberto(false);
        setBuscaReferencia("");
        setSelecionados([]);
    };

    const toggleSelecaoProduto = (produtoId) => {
        setSelecionados((prev) =>
            prev.includes(produtoId)
                ? prev.filter((item) => item !== produtoId)
                : [...prev, produtoId],
        );
    };

    const adicionarReferenciasSelecionadas = () => {
        const produtosSelecionados = produtosDisponiveis.filter((produto) =>
            selecionados.includes(produto.id),
        );

        handleAdicionarProdutos(produtosSelecionados);
        fecharModalReferencias();
    };

    const handleCadastrar = async () => {
        setErroCadastro("");

        const nome = valorOuUndefined(form.nomeEmpresa);
        if (!nome) {
            setErroCadastro("Informe o nome da empresa.");
            return;
        }

        const fabricoIdNumerico = numeroOuUndefined(fabricoId);
        if (!fabricoIdNumerico) {
            setErroCadastro("Não foi possível identificar a fábrica do usuário.");
            return;
        }

        const cnpjNumerico = valorOuUndefined(apenasNumeros(form.cnpj));
        const telefoneNumerico = valorOuUndefined(apenasNumeros(form.telefone));

        if (cnpjNumerico && cnpjNumerico.length !== 14) {
            setErroCadastro("CNPJ inválido. Informe 14 dígitos.");
            return;
        }
        if (telefoneNumerico && (telefoneNumerico.length < 9 || telefoneNumerico.length > 11)) {
            setErroCadastro("Telefone inválido. Informe entre 9 e 11 dígitos.");
            return;
        }

        const cepNumerico = valorOuUndefined(apenasNumeros(form.cep));
        if (cepNumerico && cepNumerico.length !== 8) {
            setErroCadastro("CEP inválido. Informe 8 dígitos.");
            return;
        }

        const endereco = {
            cep: cepNumerico,
            rua: valorOuUndefined(form.rua),
            numero: valorOuUndefined(form.numero),
            bairro: valorOuUndefined(form.bairro),
            complemento: valorOuUndefined(form.complemento),
            cidade: valorOuUndefined(form.cidade),
            estado: valorOuUndefined(form.estado),
            parceiro_id: numeroOuUndefined(parceiroId),
        };

        const payload = {
            nome,
            cnpj: cnpjNumerico,
            telefone: telefoneNumerico,
            status: true,
            responsavel: valorOuUndefined(form.proprietario),
            fabrico_id: fabricoIdNumerico,
            endereco: Object.values(endereco).some((valor) => valor !== undefined)
                ? endereco
                : undefined,
        };

        try {
            setSalvando(true);
            const clienteCriado = await cadastrarCliente(payload);
            let clienteId = primeiroNumeroValido(
                clienteCriado?.id,
                clienteCriado?.cliente_id,
                clienteCriado?.clienteId,
                clienteCriado?.cliente?.id,
                clienteCriado?.cliente?.cliente_id,
                clienteCriado?.data?.id,
                clienteCriado?.data?.cliente_id,
                clienteCriado?.data?.clienteId,
                clienteCriado?.data?.cliente?.id,
                clienteCriado?.data?.cliente?.cliente_id,
            );

            if (!clienteId) {
                const clientes = await getClientes(fabricoIdNumerico);
                const clienteRecemCriado = [...(clientes || [])].reverse().find((cliente) => {
                    const cnpjCliente = valorOuUndefined(apenasNumeros(cliente?.cnpj));

                    const correspondenciaCnpj = cnpjCliente === cnpjNumerico;

                    const mesmoNome = String(cliente?.nome || "").trim() === nome;

                    return correspondenciaCnpj && mesmoNome;
                });

                clienteId = primeiroNumeroValido(
                    clienteRecemCriado?.id,
                    clienteRecemCriado?.cliente_id,
                    clienteRecemCriado?.clienteId,
                );
            }

            if (clienteId && produtosAssociados.length > 0) {
                await Promise.all(
                    produtosAssociados.map((item) => {
                        const produtoId = primeiroNumeroValido(
                            item?.produto?.id,
                            item?.produto_id,
                            item?.id_produto,
                        );

                        if (!produtoId) return Promise.resolve();

                        return vincularProdutoAoCliente(clienteId, produtoId, {
                            nome_para_cliente:
                                item?.nome_para_cliente ?? item?.produto?.nome ?? "-",
                            preco_padrao: item?.preco_padrao ?? 0,
                        });
                    }),
                );
            } else if (produtosAssociados.length > 0) {
                throw new Error(
                    "Nao foi possivel identificar o cliente criado para vincular os produtos.",
                );
            }

            navigate("/clientes", {
                replace: true,
                state: { success: "Cliente cadastrado com sucesso." },
            });
        } catch (error) {
            console.error("Erro ao cadastrar cliente com referências:", error);
            setErroCadastro(
                "O cliente foi criado, mas não foi possível confirmar a associação dos produtos.",
            );
        } finally {
            setSalvando(false);
        }
    };

    return (
        <div className="p-6 pt-0 mt-6 w-full">
            <div className="bg-white p-8 rounded-[24px] shadow-sm w-full mx-auto">
                <div className="flex items-center gap-3 mb-8 pl-6 font-['Outfit',_sans-serif]">
                    <img
                        src="/add-star-preto.png"
                        alt=""
                        className="h-8 w-8 shrink-0 object-contain brightness-0 opacity-[0.85]"
                    />
                    <h1 className="text-[28px] sm:text-[30px] font-light text-[#404040] tracking-tight">
                        Cadastrar cliente
                    </h1>
                </div>

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
                                onChange={handleChangeNumeroEndereco}
                                autoComplete="off"
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
                        onAbrirModal={() => setModalReferenciasAberto(true)}
                    />
                </div>

                <div className="flex flex-wrap justify-end gap-4 pt-2">
                    <button
                        type="button"
                        onClick={() => navigate("/clientes")}
                        className="bg-[#D75757] hover:bg-[#c94a4a] text-white h-[42px] px-8 rounded-full text-sm font-normal transition-colors shadow-sm min-w-[180px]"
                    >
                        Cancelar
                    </button>
                    <button
                        type="button"
                        onClick={handleCadastrar}
                        disabled={salvando}
                        className="bg-[#A9E2F2] hover:bg-[#94d6eb] disabled:opacity-60 disabled:cursor-not-allowed text-white h-[42px] px-8 rounded-full text-sm font-normal transition-colors shadow-sm min-w-[180px]"
                    >
                        {salvando ? "Salvando..." : "Concluir cadastro"}
                    </button>
                </div>
                {erroCadastro ? (
                    <p className="pt-4 text-sm text-[#D75757] text-right">{erroCadastro}</p>
                ) : null}
            </div>

            {modalReferenciasAberto ? (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
                    onClick={fecharModalReferencias}
                >
                    <div
                        className="bg-[#F3F4FA] w-full max-w-[730px] rounded-[24px] shadow-[4px_4px_10px_2px_rgba(0,0,0,0.15)] p-8"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <div className="flex items-center justify-between mb-6 pl-6 font-['Outfit',_sans-serif]">
                            <div className="flex items-center gap-3">
                                <img
                                    src="/etiqueta_cinza.png"
                                    alt="Ícone Referências"
                                    className="w-[26px] h-[26px] object-contain"
                                />
                                <h2 className="text-[26px] font-light text-[#404040]">
                                    Referências
                                </h2>
                            </div>

                            <div className="relative">
                                <input
                                    type="text"
                                    placeholder="Buscar"
                                    value={buscaReferencia}
                                    onChange={(e) => setBuscaReferencia(e.target.value)}
                                    className="pl-4 pr-10 border border-[#898c8e] bg-[#f3f4fa] rounded-[12px] text-sm placeholder-[#898c8e] focus:outline-none focus:border-[#4696AD] w-[196px] h-[34px]"
                                />
                                <svg
                                    className="w-4 h-4 text-[#898c8e] absolute right-4 top-1/2 -translate-y-1/2"
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
                        </div>

                        <div className="max-h-[280px] overflow-y-auto pr-2 scrollbar-sutil">
                            {loadingReferencias ? (
                                <div className="flex justify-center items-center h-[150px] text-[#4696AD]">
                                    Buscando produtos...
                                </div>
                            ) : produtosDisponiveis.length === 0 ? (
                                <div className="flex justify-center items-center h-[150px] text-gray-500 font-light font-Outfit">
                                    Nenhuma nova referência encontrada.
                                </div>
                            ) : (
                                <div className="grid grid-cols-4 gap-4">
                                    {produtosDisponiveis.map((produto) => {
                                        const isSelected = selecionados.includes(produto.id);

                                        return (
                                            <div
                                                key={produto.id}
                                                onClick={() => toggleSelecaoProduto(produto.id)}
                                                className={`rounded-[16px] p-1 flex flex-col gap-1 cursor-pointer transition-all duration-200 ${
                                                    isSelected
                                                        ? "bg-[#cbe8f0] text-[#4696ad]"
                                                        : "bg-[#d7d7d7] text-[#7b7d80]"
                                                }`}
                                            >
                                                <div className="w-full h-[135px] bg-white rounded-[13px] overflow-hidden relative">
                                                    <img
                                                        src={produto.foto}
                                                        alt={produto.nome}
                                                        className="w-full h-full object-cover"
                                                    />
                                                    <div
                                                        className={`absolute inset-0 z-10 bg-gradient-to-t to-transparent via-transparent via-50% transition-colors duration-200 ${
                                                            isSelected
                                                                ? "from-[#4696AD]/40"
                                                                : "from-[#898C8F]/50"
                                                        }`}
                                                    />
                                                </div>

                                                <div className="flex items-center justify-between px-1.5 p-1 relative z-20">
                                                    <div className="flex items-center gap-1 overflow-hidden">
                                                        <img
                                                            src={
                                                                isSelected
                                                                    ? "/etiqueta_azul.png"
                                                                    : "/etiqueta_cinza_claro.png"
                                                            }
                                                            alt="Ícone"
                                                            className="w-[16px] h-[16px] shrink-0 object-contain"
                                                        />
                                                        <span className="text-[12px] truncate font-['Outfit',_sans-serif] font-light">
                                                            {produto.nome}
                                                        </span>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        className="shrink-0 flex items-center justify-center w-[20px] h-[20px]"
                                                    >
                                                        <img
                                                            src={
                                                                isSelected
                                                                    ? "/check_azul.png"
                                                                    : "/mais_cinza.png"
                                                            }
                                                            alt={
                                                                isSelected
                                                                    ? "Selecionado"
                                                                    : "Adicionar"
                                                            }
                                                            className="w-[11px] h-[11px] object-contain"
                                                        />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            )}
                        </div>

                        <div className="mt-8 flex justify-end">
                            <button
                                type="button"
                                onClick={adicionarReferenciasSelecionadas}
                                disabled={selecionados.length === 0}
                                className={`w-[189px] h-[39px] rounded-[18.9px] font-['Outfit',_sans-serif] text-[16px] transition-colors bg-[#A9E2F2] text-[#4696AD] ${
                                    selecionados.length > 0
                                        ? "hover:bg-[#8acbdc]"
                                        : "opacity-50 cursor-not-allowed"
                                }`}
                            >
                                Adicionar
                            </button>
                        </div>
                    </div>
                </div>
            ) : null}
        </div>
    );
}
