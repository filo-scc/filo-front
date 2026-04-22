import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { getFaccaoById } from "../services/faccaoService";

// Sub-components
import SecaoEndereco from "../components/faccoes/SecaoEndereco";

const FaccaoDetalhes = () => {
    const { id } = useParams();
    const navigate = useNavigate();

    const [faccao, setFaccao] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchFaccao = async () => {
            try {
                const data = await getFaccaoById(id);
                setFaccao(data);
            } catch (error) {
                console.error("Erro ao buscar facção", error);
            } finally {
                setLoading(false);
            }
        };

        fetchFaccao();
    }, [id]);

    if (loading) return <p>Carregando...</p>;
    if (!faccao) return <p>Facção não encontrada</p>;

    return (
        <div className="p-6 pt-0 w-full">
            <div className="bg-white p-8 rounded-[24px] shadow-sm w-full mx-auto">
                <h1 className="flex items-center gap-3 text-[28px] font-light mb-6">
                    <img
                        src="/maquina-costura-preta.png"
                        alt="Ícone"
                        className="w-[30px] h-[30px]"
                    />
                    Detalhes de facção
                </h1>

                {/* Dados gerais */}
                <div className="mb-6">
                    <h3 className="text-[20px] font-Outfit font-light text-[#404040] mb-4">
                        Dados gerais
                    </h3>
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                        <div>
                            <p className="text-[20px] font-Outfit font-light text-[#4696AD] block">
                                Nome
                            </p>
                            <p className="text-[16px] font-Outfit font-light text-[#898c8f] leading-none">
                                {faccao.nome}
                            </p>
                        </div>

                        <div>
                            <p className="text-[20px] font-Outfit font-light text-[#4696AD] block">
                                Nome do responsável
                            </p>
                            <p className="text-[16px] font-Outfit font-light text-[#898c8f] leading-none">
                                {faccao.responsavel || "Não informado"}
                            </p>
                        </div>

                        <div>
                            <p className="text-[20px] font-Outfit font-light text-[#4696AD] block">
                                Telefone
                            </p>
                            <p className="text-[16px] font-Outfit font-light text-[#898c8f] leading-none">
                                {faccao.telefone || "Não informado"}
                            </p>
                        </div>
                    </div>
                </div>

                <SecaoEndereco endereco={faccao.endereco} />

                {/* financeiro */}
                <div className="mt-7 mb-6">
                    <h3 className="text-[20px] font-Outfit font-light text-[#404040] mb-4">
                        Financeiro
                    </h3>

                    <div>
                        <p className="text-[20px] font-Outfit font-light text-[#4696AD] block">
                            {faccao.forma_pagamento || "Forma de pagamento"}
                        </p>

                        {/* Lógica para PIX */}
                        {faccao.forma_pagamento === "PIX" && (
                            <p className="text-[16px] font-Outfit font-light text-[#898c8f] leading-none">
                                {faccao.chave_pix || "Chave pix não informada"}
                            </p>
                        )}

                        {/* Lógica para TED */}
                        {faccao.forma_pagamento === "TED" && (
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                                <p className="text-[16px] font-Outfit font-light text-[#898c8f]">
                                    <strong>Banco:</strong> {faccao.banco}
                                </p>
                                <p className="text-[16px] font-Outfit font-light text-[#898c8f]">
                                    <strong>Agência:</strong> {faccao.agencia}
                                </p>
                                <p className="text-[16px] font-Outfit font-light text-[#898c8f]">
                                    <strong>Conta:</strong> {faccao.conta}
                                </p>
                            </div>
                        )}
                    </div>

                    {/* Lógica para quando NÃO for nem PIX nem TED */}
                    {faccao.forma_pagamento !== "PIX" && faccao.forma_pagamento !== "TED" && (
                        <p className="text-[16px] font-Outfit font-light text-[#898c8f]">
                            Forma de pagamento não informada
                        </p>
                    )}
                </div>

                {/* Ações */}
                <div className="flex justify-between items-center mt-10 w-full">
                    <button
                        onClick={() => navigate("/faccoes")}
                        className="w-[147px] h-[39px] rounded-[18.9px] bg-[#F3F4FA] border border-[#4696ad] text-[#4696ad] font-Outfit text-[16px] transition-colors hover:bg-[#E1F1F6]"
                    >
                        Voltar
                    </button>

                    <div className="flex gap-4">
                        <button className="w-[189px] h-[39px] rounded-[18.9px] bg-[#D75757] text-white font-Outfit text-[16px] transition-colors hover:bg-[#d74646]">
                            Excluir cadastro
                        </button>

                        <button className="w-[189px] h-[39px] rounded-[18.9px] bg-[#a9e2f2] text-[#4696ad] font-Outfit text-[16px] transition-colors hover:bg-[#A2DCED]">
                            Editar cadastro
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FaccaoDetalhes;
