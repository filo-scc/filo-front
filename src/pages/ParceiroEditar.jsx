import React, { useState, useEffect, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { getParceiroById, updateParceiro } from "../services/parceiroService";
import ModalConfirmacao from "../components/geral/ModalConfirmacao";
import { getAllEtapasByFabricoId } from "../services/etapaService";
import { FormPageSkeleton, LoadingButton, SkeletonBox } from "../components/geral/Loading";
import { getEnderecoByCep } from "../services/apiCep";

const FloatingInput = ({ label, name, value, onChange, containerClass, ...rest }) => (
    <div className={`relative group ${containerClass}`}>
        <input
            name={name}
            value={value}
            onChange={onChange}
            className="w-full h-[39px] border border-[#D3D3D3] rounded-[10px] px-3 leading-[39px] text-sm text-gray-600 focus:outline-none"
            {...rest}
        />
        <label
            className={`absolute left-3 bg-white px-1 text-gray-400 transition-all duration-200 pointer-events-none ${
                value
                    ? "top-0 -translate-y-1/2 text-xs text-[#898C8F]"
                    : "top-1/2 -translate-y-1/2 text-sm"
            } group-focus-within:top-0 group-focus-within:-translate-y-1/2 group-focus-within:text-xs group-focus-within:text-[#898C8F]`}
        >
            {label}
        </label>
    </div>
);

const getEtapasSelecionaveis = (etapas = []) =>
    etapas
        .filter((etapa) => etapa.ativa === true)
        .sort((a, b) => Number(a.ordem ?? 0) - Number(b.ordem ?? 0))
        .slice(0, -1);

const EditarParceiro = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const [dropdownAberto, setDropdownAberto] = useState(false);
    const [modalConfirmacaoAberto, setModalConfirmacaoAberto] = useState(false);
    const [dropdownEtapaAberto, setDropdownEtapaAberto] = useState(false);
    const [etapas, setEtapas] = useState([]);
    const [loadingEtapas, setLoadingEtapas] = useState(true);
    const etapaDropdownRef = useRef(null);

    const [formData, setFormData] = useState({
        nome: "",
        responsavel: "",
        telefone: "",
        cep: "",
        rua: "",
        numero: "",
        bairro: "",
        complemento: "",
        cidade: "",
        estado: "",
        forma_pagamento: "",
        chave_pix: "",
        banco: "",
        agencia: "",
        conta: "",
        categoria: "",
    });
    const cepRequestRef = useRef(null);

    const maskTelefone = (value) => {
        return String(value ?? "")
            .replace(/\D/g, "")
            .slice(0, 11)
            .replace(/^(\d{2})(\d)/, "($1) $2")
            .replace(/(\d{5})(\d{1,4})$/, "$1-$2");
    };

    const maskCep = (value) => {
        return String(value ?? "")
            .replace(/\D/g, "")
            .slice(0, 8)
            .replace(/^(\d{5})(\d)/, "$1-$2");
    };

    const maskAgencia = (value) => {
        const numeros = String(value ?? "")
            .replace(/\D/g, "")
            .slice(0, 5);
        if (numeros.length <= 4) return numeros;
        return `${numeros.slice(0, 4)}-${numeros.slice(4)}`;
    };

    const maskConta = (value) => {
        const numeros = String(value ?? "")
            .replace(/\D/g, "")
            .slice(0, 13);
        if (numeros.length <= 1) return numeros;
        return `${numeros.slice(0, -1)}-${numeros.slice(-1)}`;
    };

    const handleMaskedChange = async (e) => {
        const { name, value } = e.target;
        let masked = value;

        if (name === "telefone") masked = maskTelefone(value);

        if (name === "cep") {
            masked = maskCep(value);
            const cepLimpo = value.replace(/\D/g, "");

            cepRequestRef.current?.abort();
            cepRequestRef.current = null;
            setFormData((prev) => ({ ...prev, cep: masked }));

            if (cepLimpo.length === 8) {
                const controller = new AbortController();
                cepRequestRef.current = controller;
                const endereco = await getEnderecoByCep(cepLimpo, {
                    signal: controller.signal,
                });
                if (endereco && !controller.signal.aborted) {
                    setFormData((prev) =>
                        (prev.cep || "").replace(/\D/g, "") === cepLimpo
                            ? {
                                  ...prev,
                                  ...endereco,
                              }
                            : prev,
                    );
                }
                if (cepRequestRef.current === controller) {
                    cepRequestRef.current = null;
                }
            }
            return;
        }

        if (name === "agencia" && formData.forma_pagamento === "TED") {
            masked = maskAgencia(value);
        }
        if (name === "conta" && formData.forma_pagamento === "TED") {
            masked = maskConta(value);
        }

        setFormData((prev) => ({ ...prev, [name]: masked }));
    };

    useEffect(() => () => cepRequestRef.current?.abort(), []);

    useEffect(() => {
        if (!dropdownEtapaAberto) return undefined;

        const handleClickOutside = (event) => {
            if (
                etapaDropdownRef.current &&
                !etapaDropdownRef.current.contains(event.target)
            ) {
                setDropdownEtapaAberto(false);
            }
        };

        const handleKeyDown = (event) => {
            if (event.key === "Escape") {
                setDropdownEtapaAberto(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [dropdownEtapaAberto]);

    useEffect(() => {
        const fetchParceiro = async () => {
            try {
                setLoading(true);
                const data = await getParceiroById(Number(id));
                setFormData({
                    nome: data.nome || "",
                    responsavel: data.responsavel || "",
                    telefone: data.telefone ? maskTelefone(data.telefone) : "",
                    cep: data.endereco?.cep ? maskCep(data.endereco.cep) : "",
                    rua: data.endereco?.rua || "",
                    numero: data.endereco?.numero || "",
                    bairro: data.endereco?.bairro || "",
                    complemento: data.endereco?.complemento || "",
                    cidade: data.endereco?.cidade || "",
                    estado: data.endereco?.estado || "",
                    forma_pagamento:
                        data.forma_pagamento === "Conta Bancária"
                            ? "TED"
                            : data.forma_pagamento || "",
                    chave_pix: data.chave_pix || "",
                    banco: data.banco || "",
                    agencia: maskAgencia(data.agencia || ""),
                    conta: maskConta(data.conta || ""),
                    categoria: data.categoria || "",
                });
            } catch (err) {
                console.error("Erro ao carregar parceiro:", err);
                setError("Erro ao carregar os dados do parceiro.");
            } finally {
                setLoading(false);
            }
        };

        if (id) fetchParceiro();
    }, [id]);

    useEffect(() => {
        const fetchEtapas = async () => {
            setLoadingEtapas(true);
            try {
                const userString = localStorage.getItem("user");
                if (userString) {
                    const usuarioLogado = JSON.parse(userString);
                    const fabricoId = usuarioLogado.fabrico_id;
                    if (fabricoId) {
                        const dados = await getAllEtapasByFabricoId(fabricoId);
                        setEtapas(getEtapasSelecionaveis(dados || []));
                    }
                }
            } catch (err) {
                console.error("Erro ao buscar etapas:", err);
            } finally {
                setLoadingEtapas(false);
            }
        };
        fetchEtapas();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSaving(true);
        setError("");

        try {
            const payload = { nome: formData.nome };

            if (formData.telefone) payload.telefone = formData.telefone.replace(/\D/g, "");
            if (formData.responsavel) payload.responsavel = formData.responsavel;
            if (formData.categoria) payload.categoria = formData.categoria;

            const endereco = {};
            if (formData.rua) endereco.rua = formData.rua;
            if (formData.numero) endereco.numero = formData.numero;
            if (formData.bairro) endereco.bairro = formData.bairro;
            if (formData.complemento) endereco.complemento = formData.complemento;
            if (formData.cidade) endereco.cidade = formData.cidade;
            if (formData.estado) endereco.estado = formData.estado;
            if (formData.cep) endereco.cep = formData.cep.replace(/\D/g, "");

            if (Object.keys(endereco).length > 0) payload.endereco = endereco;

            if (formData.forma_pagamento) {
                payload.forma_pagamento = formData.forma_pagamento;
                if (formData.forma_pagamento === "PIX" && formData.chave_pix) {
                    payload.chave_pix = formData.chave_pix;
                } else if (formData.forma_pagamento === "TED") {
                    if (formData.banco) payload.banco = formData.banco;
                    if (formData.agencia) payload.agencia = formData.agencia;
                    if (formData.conta) payload.conta = formData.conta;
                }
            }

            await updateParceiro(Number(id), payload);
            setModalConfirmacaoAberto(true);
        } catch (err) {
            console.error(err);
            setError(
                err.response?.data?.message || "Erro ao salvar as alterações. Verifique os dados.",
            );
        } finally {
            setSaving(false);
        }
    };

    const inputClass =
        "border border-[#D3D3D3] rounded-[10px] px-3 h-[39px] text-sm text-gray-600 focus:outline-none";

    if (loading) {
        return (
            <div className="p-6 pt-0 mt-6 w-full">
                <div className="bg-white p-8 rounded-[24px] shadow-sm w-full mx-auto">
                    <div className="flex items-center gap-3 mb-10">
                        <img
                            src="/maquina-costura-preta.png"
                            alt="Ícone"
                            className="w-[30px] h-[30px]"
                        />
                        <h1 className="text-[30px] font-light text-gray-800">Editar Parceiro</h1>
                    </div>
                    <FormPageSkeleton />
                </div>
            </div>
        );
    }

    return (
        <>
            <div className="p-6 pt-0 mt-6 w-full">
                <div className="bg-white p-8 rounded-[24px] shadow-sm w-full mx-auto">
                    {/* Título */}
                    <div className="flex items-center gap-3 mb-10 pl-6 text-gray-800">
                        <img
                            src="/maquina-costura-preta.png"
                            alt="Ícone"
                            className="w-[30px] h-[30px]"
                        />
                        <h1 className="text-[30px] font-light text-gray-800">Editar Parceiro</h1>
                    </div>

                    {error && (
                        <div className="bg-red-50 text-red-500 p-4 rounded-xl mb-6">{error}</div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-8 w-full px-6">
                        <div className="flex flex-wrap gap-6 items-start">
                            {/* Dropdown Etapa de Produção */}
                            <div className="w-full md:w-[212px]" ref={etapaDropdownRef}>
                                <h2 className="text-[#404040] font-light mb-4">
                                    Etapa de produção
                                </h2>
                                <div className="relative w-full">
                                    <div
                                        className={`${inputClass} bg-white flex justify-between items-center ${
                                            loadingEtapas
                                                ? "cursor-not-allowed opacity-60"
                                                : "cursor-pointer"
                                        }`}
                                        onClick={() => {
                                            if (!loadingEtapas) {
                                                setDropdownEtapaAberto((aberto) => !aberto);
                                            }
                                        }}
                                    >
                                        {loadingEtapas ? (
                                            <SkeletonBox className="h-[14px] w-24 rounded-[7px]" />
                                        ) : (
                                            <span
                                                className={
                                                    formData.categoria
                                                        ? "text-gray-600"
                                                        : "text-gray-400"
                                                }
                                            >
                                                {formData.categoria || "Selecionar"}
                                            </span>
                                        )}
                                        <svg
                                            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
                                                dropdownEtapaAberto ? "rotate-180" : ""
                                            }`}
                                            fill="none"
                                            stroke="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth="2"
                                                d="M19 9l-7 7-7-7"
                                            />
                                        </svg>
                                    </div>

                                    {dropdownEtapaAberto && (
                                        <div className="absolute z-20 mt-1 w-full bg-white border border-[#D3D3D3] rounded-[10px] shadow-lg overflow-hidden max-h-60 overflow-y-auto scrollbar-sutil">
                                            {etapas.length > 0 ? (
                                                etapas.map((etapa) => (
                                                    <div
                                                        key={etapa.id}
                                                        className={`px-4 py-2 text-sm cursor-pointer transition-colors ${
                                                            formData.categoria === etapa.nome
                                                                ? "border-l-[3px] border-[#C4F042] text-gray-700 bg-white"
                                                                : "border-l-[3px] border-transparent text-gray-600 hover:bg-[#F5F5F5]"
                                                        }`}
                                                        onClick={() => {
                                                            setFormData((prev) => ({
                                                                ...prev,
                                                                categoria: etapa.nome,
                                                            }));
                                                            setDropdownEtapaAberto(false);
                                                        }}
                                                    >
                                                        {etapa.nome}
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="border-l-[3px] border-transparent px-4 py-2 text-sm text-gray-400">
                                                    Nenhuma etapa disponível
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>

                            {/* Dados gerais */}
                            <div className="flex-1 min-w-[300px]">
                                <h2 className="text-[#404040] font-light mb-4">Dados gerais</h2>
                                <div className="flex flex-wrap gap-4">
                                    <FloatingInput
                                        label="Nome"
                                        name="nome"
                                        value={formData.nome}
                                        onChange={handleChange}
                                        containerClass="w-full flex-1 min-w-[200px]"
                                        required
                                    />
                                    <FloatingInput
                                        label="Nome do responsável"
                                        name="responsavel"
                                        value={formData.responsavel}
                                        onChange={handleChange}
                                        containerClass="w-full flex-[1.5] min-w-[250px]"
                                    />
                                    <FloatingInput
                                        label="Telefone"
                                        name="telefone"
                                        value={formData.telefone}
                                        onChange={handleMaskedChange}
                                        containerClass="w-full flex-1 min-w-[200px]"
                                        maxLength={15}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Endereço */}
                        <div>
                            <h2 className="text-[#404040] text-[20px] font-light mb-4">Endereço</h2>
                            <div className="flex flex-col gap-4">
                                <div className="flex flex-wrap gap-4">
                                    <FloatingInput
                                        label="CEP"
                                        name="cep"
                                        value={formData.cep}
                                        onChange={handleMaskedChange}
                                        containerClass="w-full flex-1 min-w-[150px]"
                                        maxLength={9}
                                    />
                                    <FloatingInput
                                        label="Rua"
                                        name="rua"
                                        value={formData.rua}
                                        onChange={handleChange}
                                        containerClass="w-full flex-[2] min-w-[250px]"
                                    />
                                    <FloatingInput
                                        label="Nº"
                                        name="numero"
                                        value={formData.numero}
                                        onChange={handleChange}
                                        containerClass="w-[100px] flex-shrink-0"
                                    />
                                    <FloatingInput
                                        label="Bairro"
                                        name="bairro"
                                        value={formData.bairro}
                                        onChange={handleChange}
                                        containerClass="w-full flex-1 min-w-[200px]"
                                    />
                                </div>
                                <div className="flex flex-wrap gap-4">
                                    <FloatingInput
                                        label="Complemento"
                                        name="complemento"
                                        value={formData.complemento}
                                        onChange={handleChange}
                                        containerClass="w-full flex-[1.5] min-w-[200px]"
                                    />
                                    <FloatingInput
                                        label="Cidade"
                                        name="cidade"
                                        value={formData.cidade}
                                        onChange={handleChange}
                                        containerClass="w-full flex-[1.5] min-w-[200px]"
                                    />
                                    <FloatingInput
                                        label="Estado"
                                        name="estado"
                                        value={formData.estado}
                                        onChange={handleChange}
                                        containerClass="w-full flex-1 min-w-[150px]"
                                    />
                                </div>
                            </div>
                        </div>

                        {/* Financeiro */}
                        <div>
                            <h2 className="text-[#404040] text-[20px] font-light mb-4">
                                Financeiro
                            </h2>
                            <div className="flex flex-col gap-4">
                                <div className="flex flex-wrap gap-4">
                                    {/* Dropdown Forma de Pagamento */}
                                    <div className="relative w-full md:w-[212px]">
                                        <button
                                            type="button"
                                            onClick={() => setDropdownAberto(!dropdownAberto)}
                                            className="w-full bg-white flex items-center justify-between rounded-[10px] px-3 h-[39px] text-sm focus:outline-none border border-[#D3D3D3]"
                                        >
                                            <span
                                                className={
                                                    formData.forma_pagamento
                                                        ? "text-gray-600"
                                                        : "text-gray-400"
                                                }
                                            >
                                                {formData.forma_pagamento === "TED"
                                                    ? "Conta Bancária"
                                                    : formData.forma_pagamento ||
                                                      "Dado de pagamento"}
                                            </span>
                                            <svg
                                                className={`w-4 h-4 text-gray-400 transition-transform duration-300 ${
                                                    dropdownAberto ? "rotate-180" : ""
                                                }`}
                                                fill="none"
                                                stroke="currentColor"
                                                viewBox="0 0 24 24"
                                            >
                                                <path
                                                    strokeLinecap="round"
                                                    strokeLinejoin="round"
                                                    strokeWidth="2"
                                                    d="M19 9l-7 7-7-7"
                                                />
                                            </svg>
                                        </button>

                                        {/* Menu Forma de Pagamento */}
                                        <div
                                            className={`absolute z-20 mt-2 w-full bg-white border border-[#D3D3D3] rounded-[10px] shadow-lg overflow-hidden origin-top transition-all duration-300 ${
                                                dropdownAberto
                                                    ? "opacity-100 scale-y-100 visible"
                                                    : "opacity-0 scale-y-95 invisible pointer-events-none"
                                            }`}
                                        >
                                            {["PIX", "TED"].map((opcao) => (
                                                <button
                                                    key={opcao}
                                                    type="button"
                                                    className="w-full h-[35px] flex items-center px-4 text-sm relative text-[#898C8F] hover:bg-[#F5F5F5] transition-colors"
                                                    onClick={() => {
                                                        handleChange({
                                                            target: {
                                                                name: "forma_pagamento",
                                                                value: opcao,
                                                            },
                                                        });
                                                        setDropdownAberto(false);
                                                    }}
                                                >
                                                    {formData.forma_pagamento === opcao && (
                                                        <div className="absolute left-0 top-0 w-[4px] h-full bg-[#D7FE65]" />
                                                    )}
                                                    {opcao === "TED" ? "Conta Bancária" : opcao}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Campo PIX */}
                                    {formData.forma_pagamento === "PIX" && (
                                        <FloatingInput
                                            label="Chave pix"
                                            name="chave_pix"
                                            value={formData.chave_pix}
                                            onChange={handleChange}
                                            containerClass="w-[328px]"
                                            disabled={!formData.forma_pagamento}
                                        />
                                    )}
                                </div>

                                {/* Campos Conta Bancária */}
                                {formData.forma_pagamento === "TED" && (
                                    <div className="flex flex-wrap gap-4">
                                        <FloatingInput
                                            label="Banco"
                                            name="banco"
                                            value={formData.banco}
                                            onChange={handleChange}
                                            containerClass="w-full flex-1 min-w-[200px]"
                                        />
                                        <FloatingInput
                                            label="Agência"
                                            name="agencia"
                                            value={formData.agencia}
                                            onChange={handleMaskedChange}
                                            containerClass="w-full flex-1 min-w-[200px]"
                                            maxLength={6}
                                        />
                                        <FloatingInput
                                            label="Conta"
                                            name="conta"
                                            value={formData.conta}
                                            onChange={handleMaskedChange}
                                            containerClass="w-full flex-1 min-w-[200px]"
                                            maxLength={9}
                                        />
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Botão Finalizar edição */}
                        <div className="flex justify-end pt-4">
                            <LoadingButton
                                type="submit"
                                loading={saving}
                                loadingText="Salvando..."
                                className="bg-[#a9e2f2] hover:bg-[#A2DCED] text-[#4696ad] w-[189px] h-[39px] rounded-full text-sm font-medium transition-colors disabled:opacity-50 shadow-sm"
                            >
                                Concluir edição
                            </LoadingButton>
                        </div>
                    </form>
                </div>
            </div>

            <ModalConfirmacao
                isOpen={modalConfirmacaoAberto}
                onClose={() => {
                    setModalConfirmacaoAberto(false);
                    navigate("/Parceiros");
                }}
                type="atualizado"
            />
        </>
    );
};

export default EditarParceiro;
