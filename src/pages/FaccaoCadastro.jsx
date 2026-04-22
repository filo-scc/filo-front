import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createFaccao } from "../services/faccaoService";

const FaccaoCadastro = () => {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [dropdownAberto, setDropdownAberto] = useState(false);

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
    });

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
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

            if (formData.telefone) payload.telefone = formData.telefone;
            if (formData.responsavel) payload.responsavel = formData.responsavel;

            const endereco = {};
            if (formData.rua) endereco.rua = formData.rua;
            if (formData.numero) endereco.numero = formData.numero;
            if (formData.bairro) endereco.bairro = formData.bairro;
            if (formData.complemento) endereco.complemento = formData.complemento;
            if (formData.cidade) endereco.cidade = formData.cidade;
            if (formData.estado) endereco.estado = formData.estado;
            if (formData.cep) endereco.cep = formData.cep;

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

            await createFaccao(payload);
            navigate("/faccoes");
        } catch (err) {
            console.error(err);
            setError(
                err.response?.data?.message || "Erro ao cadastrar facção. Verifique os dados.",
            );
        } finally {
            setLoading(false);
        }
    };

    const inputClass =
        "border border-[#D3D3D3] rounded-[10px] px-5 py-3 text-sm text-gray-600 focus:outline-none focus:border-[#A9E2F2] placeholder-gray-400";

    return (
        <div className="w-full flex justify-center p-6">
            <div className="bg-white p-6 rounded-[24px] shadow-sm w-full mx-auto">
                {/* Título */}
                <div className="flex items-center gap-3 mb-10 text-gray-800">
                    <img
                        src="/maquina-costura-preta.png"
                        alt="Ícone"
                        className="w-[30px] h-[30px]"
                    />
                    <h1 className="text-[30px] font-light text-gray-800">Cadastrar facção</h1>
                </div>

                {error && <div className="bg-red-50 text-red-500 p-4 rounded-xl mb-6">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-8 w-full">
                    {/* Dados gerais */}
                    <div>
                        <h2 className="text-[#404040] font-light mb-4">Dados gerais</h2>
                        <div className="flex flex-wrap gap-4">
                            <input
                                required
                                type="text"
                                name="nome"
                                value={formData.nome}
                                onChange={handleChange}
                                placeholder="Nome"
                                className={`${inputClass} w-full flex-1 min-w-[200px]`}
                            />
                            <input
                                type="text"
                                name="responsavel"
                                value={formData.responsavel}
                                onChange={handleChange}
                                placeholder="Nome do responsável"
                                className={`${inputClass} w-full flex-[1.5] min-w-[250px]`}
                            />
                            <input
                                type="text"
                                name="telefone"
                                value={formData.telefone}
                                onChange={handleChange}
                                placeholder="Telefone"
                                maxLength={11}
                                className={`${inputClass} w-full flex-1 min-w-[200px]`}
                            />
                        </div>
                    </div>

                    {/* Endereço */}
                    <div>
                        <h2 className="text-[#404040] font-light mb-4">Endereço</h2>
                        <div className="flex flex-col gap-4">
                            {/* Linha 1 do Endereço */}
                            <div className="flex flex-wrap gap-4">
                                <input
                                    type="text"
                                    name="cep"
                                    value={formData.cep}
                                    onChange={handleChange}
                                    placeholder="CEP"
                                    className={`${inputClass} w-full flex-1 min-w-[150px]`}
                                />
                                <input
                                    type="text"
                                    name="rua"
                                    value={formData.rua}
                                    onChange={handleChange}
                                    placeholder="Rua"
                                    className={`${inputClass} w-full flex-[2] min-w-[250px]`}
                                />
                                <input
                                    type="text"
                                    name="numero"
                                    value={formData.numero}
                                    onChange={handleChange}
                                    placeholder="Nº"
                                    className={`${inputClass} w-[100px] flex-shrink-0`}
                                />
                                <input
                                    type="text"
                                    name="bairro"
                                    value={formData.bairro}
                                    onChange={handleChange}
                                    placeholder="Bairro"
                                    className={`${inputClass} w-full flex-1 min-w-[200px]`}
                                />
                            </div>

                            {/* Linha 2 do Endereço */}
                            <div className="flex flex-wrap gap-4">
                                <input
                                    type="text"
                                    name="complemento"
                                    value={formData.complemento}
                                    onChange={handleChange}
                                    placeholder="Complemento"
                                    className={`${inputClass} w-full flex-[1.5] min-w-[200px]`}
                                />
                                <input
                                    type="text"
                                    name="cidade"
                                    value={formData.cidade}
                                    onChange={handleChange}
                                    placeholder="Cidade"
                                    className={`${inputClass} w-full flex-[1.5] min-w-[200px]`}
                                />
                                <input
                                    type="text"
                                    name="estado"
                                    value={formData.estado}
                                    onChange={handleChange}
                                    placeholder="Estado"
                                    className={`${inputClass} w-full flex-1 min-w-[150px]`}
                                />
                            </div>
                        </div>
                    </div>

                    {/* Financeiro */}
                    <div>
                        <h2 className="text-[#404040] font-light mb-4">Financeiro</h2>
                        <div className="flex flex-col gap-4">
                            <div className="flex flex-wrap gap-4">
                                {/* Dropdown Customizado */}
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
                                            {formData.forma_pagamento || "Dado de pagamento"}
                                        </span>
                                        {/* Ícone de setinha para baixo */}
                                        <svg
                                            className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${dropdownAberto ? "rotate-180" : ""}`}
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

                                    {/* Menu que se abre */}
                                    {dropdownAberto && (
                                        <>
                                            <div
                                                className="fixed inset-0 z-10"
                                                onClick={() => setDropdownAberto(false)}
                                            ></div>

                                            {/* A caixinha com as opções */}
                                            <div className="absolute z-20 mt-2 w-full bg-white border border-[#D3D3D3] rounded-[10px] shadow-lg overflow-hidden">
                                                <div
                                                    className="px-5 py-3 text-sm text-gray-600 hover:bg-[#A9E2F2]/30 cursor-pointer transition-colors"
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
                                                    PIX
                                                </div>
                                                <div
                                                    className="px-5 py-3 text-sm text-gray-600 hover:bg-[#A9E2F2]/30 cursor-pointer transition-colors border-t border-gray-100"
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
                                                    TED (Transferência)
                                                </div>
                                            </div>
                                        </>
                                    )}
                                </div>

                                {/* Mostra o campo PIX ocupando o resto do espaço (flex-1) */}
                                {formData.forma_pagamento !== "TED" && (
                                    <input
                                        type="text"
                                        name="chave_pix"
                                        value={formData.chave_pix}
                                        onChange={handleChange}
                                        placeholder="Inserir chave PIX"
                                        className={`${inputClass}  min-w-[328px]`}
                                        disabled={!formData.forma_pagamento}
                                    />
                                )}
                            </div>

                            {/* Campos TED usando tamanhos proporcionais (flex-1) */}
                            {formData.forma_pagamento === "TED" && (
                                <div className="flex flex-wrap gap-4">
                                    <input
                                        type="text"
                                        name="banco"
                                        value={formData.banco}
                                        onChange={handleChange}
                                        placeholder="Banco"
                                        className={`${inputClass} w-full flex-1 min-w-[200px]`}
                                    />
                                    <input
                                        type="text"
                                        name="agencia"
                                        value={formData.agencia}
                                        onChange={handleChange}
                                        placeholder="Agência"
                                        className={`${inputClass} w-full flex-1 min-w-[200px]`}
                                    />
                                    <input
                                        type="text"
                                        name="conta"
                                        value={formData.conta}
                                        onChange={handleChange}
                                        placeholder="Conta"
                                        className={`${inputClass} w-full flex-1 min-w-[200px]`}
                                    />
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Botão Concluir */}
                    <div className="flex justify-end pt-4">
                        <button
                            type="submit"
                            disabled={loading}
                            className="bg-[#A9E2F2] hover:bg-[#8acbdc] text-[#4696ad] px-8 py-3 rounded-full text-sm font-medium transition-colors disabled:opacity-50 shadow-sm"
                        >
                            {loading ? "Salvando..." : "Concluir cadastro"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default FaccaoCadastro;
