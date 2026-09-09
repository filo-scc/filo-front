import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { createParceiro } from "../services/parceiroService";
import { getAllEtapasByFabricoId } from "../services/etapaService";
import { LoadingButton, SkeletonBox } from "../components/geral/Loading";
import { getEnderecoByCep } from "../services/apiCep";

// Componente para inputs com Label Flutuante
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

// Componente do Dropdown de Etapa de Produção
const EtapaSelect = ({ value, onChange, inputClass }) => {
    const [dropdownEtapaAberto, setDropdownEtapaAberto] = useState(false);
    const [etapas, setEtapas] = useState([]);
    const [loadingEtapas, setLoadingEtapas] = useState(true);

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
                        const etapasAtivas = (dados || []).filter((etapa) => etapa.ativa === true);
                        setEtapas(etapasAtivas);
                    }
                }
            } catch (err) {
                console.error("Erro ao buscar etapas de produção:", err);
            } finally {
                setLoadingEtapas(false);
            }
        };
        fetchEtapas();
    }, []);

    return (
        <div className="w-full md:w-[212px]">
            <h2 className="text-[#404040] font-light mb-4">Etapa de produção</h2>
            <div className="relative w-full">
                <div
                    className={`${inputClass} bg-white flex justify-between items-center ${
                        loadingEtapas ? "cursor-not-allowed opacity-60" : "cursor-pointer"
                    }`}
                    onClick={() => {
                        if (!loadingEtapas) {
                            setDropdownEtapaAberto(!dropdownEtapaAberto);
                        }
                    }}
                >
                    {loadingEtapas ? (
                        <SkeletonBox className="h-[14px] w-24 rounded-[7px]" />
                    ) : (
                        <span className={value ? "text-gray-600" : "text-gray-400"}>
                            {value || "Selecionar"}
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
                    <>
                        <div
                            className="fixed inset-0 z-10"
                            onClick={() => setDropdownEtapaAberto(false)}
                        ></div>

                        <div className="absolute z-20 mt-1 w-full bg-white border border-[#D3D3D3] rounded-[10px] shadow-lg overflow-hidden max-h-60 overflow-y-auto scrollbar-sutil">
                            {etapas.map((etapa) => (
                                <div
                                    key={etapa.id}
                                    className={`px-4 py-2 text-sm cursor-pointer transition-colors ${
                                        value === etapa.nome
                                            ? "border-l-[3px] border-[#C4F042] text-gray-700 bg-white"
                                            : "border-l-[3px] border-transparent text-gray-600 hover:bg-[#F5F5F5]"
                                    }`}
                                    onClick={() => {
                                        onChange(etapa.nome);
                                        setDropdownEtapaAberto(false);
                                    }}
                                >
                                    {etapa.nome}
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
};

// Componente Principal
export default function ParceiroCadastro() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [dropdownAberto, setDropdownAberto] = useState(false);

    const [formData, setFormData] = useState({
        categoria: "",
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
    });

    useEffect(() => {
        const cleanCep = (formData.cep || "").replace(/\D/g, "");
        const controller = new AbortController();

        if (cleanCep.length === 8) {
            const fetchEndereco = async () => {
                const endereco = await getEnderecoByCep(cleanCep, {
                    signal: controller.signal,
                });

                if (endereco && !controller.signal.aborted) {
                    setFormData((prev) =>
                        (prev.cep || "").replace(/\D/g, "") === cleanCep
                            ? {
                                  ...prev,
                                  ...endereco,
                              }
                            : prev,
                    );
                }
            };

            fetchEndereco();
        }

        return () => controller.abort();
    }, [formData.cep]);

    const maskTelefone = (value) => {
        return value
            .replace(/\D/g, "")
            .slice(0, 11)
            .replace(/^(\d{2})(\d)/, "($1) $2")
            .replace(/(\d{5})(\d{1,4})$/, "$1-$2");
    };

    const maskCep = (value) => {
        return value
            .replace(/\D/g, "")
            .slice(0, 8)
            .replace(/(\d{5})(\d{1,3})$/, "$1-$2");
    };

    const maskAgencia = (value) => {
        const numeros = value.replace(/\D/g, "").slice(0, 5);
        if (numeros.length <= 4) return numeros;
        return `${numeros.slice(0, 4)}-${numeros.slice(4)}`;
    };

    const maskConta = (value) => {
        const numeros = value.replace(/\D/g, "").slice(0, 13);
        if (numeros.length <= 1) return numeros;
        return `${numeros.slice(0, -1)}-${numeros.slice(-1)}`;
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        let masked = value;

        if (name === "telefone") {
            masked = maskTelefone(value);
        } else if (name === "cep") {
            masked = maskCep(value);
        } else if (name === "agencia" && formData.forma_pagamento === "TED") {
            masked = maskAgencia(value);
        } else if (name === "conta" && formData.forma_pagamento === "TED") {
            masked = maskConta(value);
        }

        setFormData((prev) => ({ ...prev, [name]: masked }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError("");

        try {
            const userString = localStorage.getItem("user");
            const usuarioLogado = JSON.parse(userString);
            const fabricoId = usuarioLogado.fabrico_id;

            const payload = {
                nome: formData.nome,
                fabrico_id: Number(fabricoId),
            };

            if (formData.categoria) payload.categoria = formData.categoria;
            if (formData.telefone) payload.telefone = formData.telefone.replace(/\D/g, "");
            if (formData.responsavel) payload.responsavel = formData.responsavel;

            const endereco = {};
            if (formData.rua) endereco.rua = formData.rua;
            if (formData.numero) endereco.numero = formData.numero;
            if (formData.bairro) endereco.bairro = formData.bairro;
            if (formData.complemento) endereco.complemento = formData.complemento;
            if (formData.cidade) endereco.cidade = formData.cidade;
            if (formData.estado) endereco.estado = formData.estado;
            if (formData.cep) endereco.cep = formData.cep.replace(/\D/g, "");

            if (Object.keys(endereco).length > 0) {
                payload.endereco = endereco;
            }

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

            await createParceiro(payload);
            navigate("/parceiros");
        } catch (err) {
            console.error(err);
            setError(
                err.response?.data?.message || "Erro ao cadastrar parceiro. Verifique os dados.",
            );
        } finally {
            setLoading(false);
        }
    };

    const inputClass =
        "border border-[#D3D3D3] rounded-[10px] px-3 h-[39px] text-sm text-gray-600 focus:outline-none";

    return (
        <div className="w-full flex justify-center px-6 mt-6">
            <div className="bg-white p-14 lg:px-19 lg:py-8 rounded-[24px] shadow-sm w-full max-w-[1400px] mx-auto">
                {/* Título */}
                <div className="flex items-center gap-3 mb-10 text-gray-800">
                    <img
                        src="/maquina+-costura-icone-preto.png"
                        alt="Ícone"
                        className="w-[30px] h-[30px]"
                    />
                    <h1 className="text-[30px] font-light text-gray-800">Cadastrar parceiro</h1>
                </div>

                {error && <div className="bg-red-50 text-red-500 p-4 rounded-xl mb-6">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-8 w-full">
                    {/* Linha Superior: Etapa de produção + Dados gerais */}
                    <div className="flex flex-wrap gap-6 items-start">
                        <EtapaSelect
                            value={formData.categoria}
                            onChange={(nome) =>
                                setFormData((prev) => ({ ...prev, categoria: nome }))
                            }
                            inputClass={inputClass}
                        />

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
                                    onChange={handleChange}
                                    containerClass="w-full flex-1 min-w-[200px]"
                                    maxLength={15}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Endereço */}
                    <div>
                        <h2 className="text-[#404040] font-light mb-4">Endereço</h2>
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-wrap gap-4">
                                <FloatingInput
                                    label="CEP"
                                    name="cep"
                                    value={formData.cep}
                                    onChange={handleChange}
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
                        <h2 className="text-[#404040] font-light mb-4">Financeiro</h2>
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-wrap gap-4">
                                <div className="relative w-full md:w-[212px]">
                                    <div
                                        className={`${inputClass} bg-white flex justify-between items-center cursor-pointer`}
                                        onClick={() => setDropdownAberto(!dropdownAberto)}
                                    >
                                        <span
                                            className={
                                                formData.forma_pagamento
                                                    ? "text-gray-600"
                                                    : "text-gray-400"
                                            }
                                        >
                                            {formData.forma_pagamento === "PIX"
                                                ? "Pix"
                                                : formData.forma_pagamento === "TED"
                                                  ? "Conta bancária"
                                                  : "Dado de pagamento"}
                                        </span>
                                        <svg
                                            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${
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
                                    </div>

                                    {dropdownAberto && (
                                        <>
                                            <div
                                                className="fixed inset-0 z-10"
                                                onClick={() => setDropdownAberto(false)}
                                            ></div>

                                            <div className="absolute z-20 mt-1 w-full bg-white border border-[#D3D3D3] rounded-[10px] shadow-lg overflow-hidden">
                                                <div
                                                    className={`px-4 py-2 text-sm cursor-pointer transition-colors ${
                                                        formData.forma_pagamento === "PIX"
                                                            ? "border-l-[3px] border-[#C4F042] text-gray-700 bg-white"
                                                            : "border-l-[3px] border-transparent text-gray-600 hover:bg-[#F5F5F5]"
                                                    }`}
                                                    onClick={() => {
                                                        handleChange({
                                                            target: {
                                                                name: "forma_pagamento",
                                                                value: "PIX",
                                                            },
                                                        });
                                                        setDropdownAberto(false);
                                                    }}
                                                >
                                                    Pix
                                                </div>
                                                <div
                                                    className={`px-4 py-2 text-sm cursor-pointer transition-colors ${
                                                        formData.forma_pagamento === "TED"
                                                            ? "border-l-[3px] border-[#C4F042] text-gray-700"
                                                            : "border-l-[3px] border-transparent text-gray-600 hover:bg-[#F5F5F5]"
                                                    }`}
                                                    onClick={() => {
                                                        handleChange({
                                                            target: {
                                                                name: "forma_pagamento",
                                                                value: "TED",
                                                            },
                                                        });
                                                        setDropdownAberto(false);
                                                    }}
                                                >
                                                    Conta bancária
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {formData.forma_pagamento === "PIX" && (
                                    <FloatingInput
                                        label="Chave Pix"
                                        name="chave_pix"
                                        value={formData.chave_pix}
                                        onChange={handleChange}
                                        containerClass="w-[328px]"
                                    />
                                )}
                            </div>

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
                                        onChange={handleChange}
                                        containerClass="w-full flex-1 min-w-[200px]"
                                        maxLength={6}
                                    />
                                    <FloatingInput
                                        label="Conta"
                                        name="conta"
                                        value={formData.conta}
                                        onChange={handleChange}
                                        containerClass="w-full flex-1 min-w-[200px]"
                                        maxLength={9}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Botão Concluir */}
                    <div className="flex justify-end pt-4">
                        <LoadingButton
                            type="submit"
                            loading={loading}
                            loadingText="Salvando..."
                            className="bg-[#A9E2F2] hover:bg-[#A2DCED] text-[#4696ad] justify-center items-center rounded-full text-sm font-medium transition-colors disabled:opacity-50 shadow-sm w-[189px] h-[39px]"
                        >
                            Concluir cadastro
                        </LoadingButton>
                    </div>
                </form>
            </div>
        </div>
    );
}
