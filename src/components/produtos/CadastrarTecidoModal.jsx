import { useCallback, useEffect, useState } from "react";
import FloatingLabelInput from "../FloatingLabelInput";
import { criarTecido } from "../../services/tecidoService";

// Função para formatar as unidades de medida
function formatarUnidadeDeMedida(unidade) {
    if (!unidade) return "";
    const unidadesMapeadas = {
        METRO: "m",
        CENTIMETRO: "cm",
        GRAMA: "g",
        QUILOGRAMA: "kg",
        UNIDADE: "und",
        PAR: "par",
    };
    return unidadesMapeadas[unidade.toUpperCase()] || unidade.toLowerCase();
}

const UNIDADES_OPCOES = ["METRO", "CENTIMETRO", "GRAMA", "QUILOGRAMA", "UNIDADE", "PAR"];

export function CadastrarTecidoModal({ isOpen, onClose, onSuccess, fabricoId }) {
    const [nome, setNome] = useState("");
    const [unidadeMedida, setUnidadeMedida] = useState("");
    const [tipoCusto, setTipoCusto] = useState("unitario");

    // Estados para Custo Unitário Direto
    const [custoUnitario, setCustoUnitario] = useState("");

    // Estados para Cálculo a partir da Compra
    const [valorPago, setValorPago] = useState("");
    const [quantidadeAdquirida, setQuantidadeAdquirida] = useState("");

    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");
    const [isDropdownOpen, setIsDropdownOpen] = useState(false);

    // Cálculo do Resultado da Divisão em Tempo Real
    const calcularResultado = () => {
        const valor = parseFloat(valorPago.replace(",", ".")) || 0;
        const qtd = parseFloat(quantidadeAdquirida.replace(",", ".")) || 0;

        if (valor > 0 && qtd > 0) {
            const resultado = valor / qtd;
            return resultado.toLocaleString("pt-BR", {
                style: "currency",
                currency: "BRL",
            });
        }
        return "R$0,00";
    };

    // Limpa o formulário ao fechar/abrir
    const resetForm = useCallback(() => {
        setNome("");
        setUnidadeMedida("");
        setCustoUnitario("");
        setValorPago("");
        setQuantidadeAdquirida("");
        setTipoCusto("unitario");
        setSubmitting(false);
        setError("");
        setIsDropdownOpen(false);
    }, []);

    const handleClose = useCallback(() => {
        resetForm();
        onClose?.();
    }, [onClose, resetForm]);

    useEffect(() => {
        if (!isOpen) resetForm();
    }, [isOpen, resetForm]);

    const handleSubmit = async () => {
        const nomeTrim = nome.trim();
        if (!nomeTrim) {
            setError("Informe o nome do tecido.");
            return;
        }
        if (!unidadeMedida) {
            setError("Selecione uma unidade de medida.");
            return;
        }

        // Calcula o valor final do custo unitário
        let custoFinal = 0;
        if (tipoCusto === "unitario") {
            custoFinal = parseFloat(custoUnitario.replace(",", ".")) || 0;
        } else {
            const valor = parseFloat(valorPago.replace(",", ".")) || 0;
            const qtd = parseFloat(quantidadeAdquirida.replace(",", ".")) || 1;
            custoFinal = valor / qtd;
        }

        setSubmitting(true);
        setError("");

        try {
            const payload = {
                nome: nomeTrim,
                unidade_de_medida: unidadeMedida, // ou o nome exato esperado no CreateTecidosDto
                custo_unitario: custoFinal,
                fabrico_id: Number(fabricoId), // certifique-se de passar o ID do fabrico atual
            };

            const novoTecido = await criarTecido(payload);

            onSuccess?.(novoTecido);
            handleClose();
        } catch (err) {
            console.error(err);
            setError(
                err.response?.data?.message ||
                    "Não foi possível cadastrar o tecido. Tente novamente.",
            );
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm font-['Outfit',_sans-serif]"
            onClick={handleClose}
        >
            <div
                className="relative w-full max-w-[680px] rounded-[26px] bg-white px-10 py-9 shadow-[4px_4px_18px_rgba(0,0,0,0.12)] font-light"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Cabeçalho */}
                <div className="mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img
                            src="/adicionar-produtos-preto.png"
                            alt=""
                            className="h-[28px] w-[28px] object-contain"
                        />
                        <h2 className="text-[26px] font-light text-[#404040]">Cadastrar tecido</h2>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="transition opacity-80 hover:opacity-100 cursor-pointer"
                        aria-label="Fechar"
                    >
                        <img src="/fechar-cinza.png" className="w-3 h-3" alt="Fechar" />
                    </button>
                </div>

                {/* Mensagem de Erro */}
                {error ? (
                    <div className="mb-4 rounded-[10px] border border-red-200 bg-red-50 px-4 py-2 text-[13px] text-red-700">
                        {error}
                    </div>
                ) : null}

                <div className="space-y-6">
                    {/* Seção 1: Informações */}
                    <div>
                        <label className="mb-3 block text-[14px] font-light text-[#4696AD]">
                            Informações
                        </label>
                        <div className="grid grid-cols-2 gap-4 items-center">
                            {/* Input FloatingLabel */}
                            <FloatingLabelInput
                                label="Nome do tecido"
                                value={nome}
                                onChange={(e) => setNome(e.target.value)}
                                inputClassName="border-[#898C8F] text-[14px] text-[#898C8F]"
                                onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                        e.preventDefault();
                                        handleSubmit();
                                    }
                                }}
                            />

                            {/* Dropdown Customizado de Unidade de Medida */}
                            <div className="relative w-full">
                                <button
                                    type="button"
                                    onClick={() => setIsDropdownOpen((prev) => !prev)}
                                    className="flex h-[39px] w-full items-center justify-between rounded-[10px] border border-[#898C8F] px-3 text-[14px] font-light text-[#898C8F] focus:outline-none cursor-pointer"
                                >
                                    <span
                                        className={
                                            unidadeMedida ? "text-[#898C8F]" : "text-[#898C8F]"
                                        }
                                    >
                                        {unidadeMedida
                                            ? formatarUnidadeDeMedida(unidadeMedida)
                                            : "Unidade de medida"}
                                    </span>

                                    <svg
                                        className={`h-4 w-4 text-[#898C8F] transition-transform duration-200 ${
                                            isDropdownOpen ? "rotate-180" : ""
                                        }`}
                                        fill="none"
                                        viewBox="0 0 24 24"
                                        stroke="currentColor"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M19 9l-7 7-7-7"
                                        />
                                    </svg>
                                </button>

                                {isDropdownOpen && (
                                    <div className="absolute left-0 top-[43px] z-50 max-h-[180px] w-full overflow-y-auto rounded-[10px] border border-[#898C8F] bg-white py-1 shadow-lg">
                                        {UNIDADES_OPCOES.map((unidade) => (
                                            <button
                                                key={unidade}
                                                type="button"
                                                onClick={() => {
                                                    setUnidadeMedida(unidade);
                                                    setIsDropdownOpen(false);
                                                }}
                                                className={`w-full px-3 py-2 text-left text-[14px] font-light transition hover:bg-gray-50 cursor-pointer ${
                                                    unidadeMedida === unidade
                                                        ? "bg-gray-100 font-normal text-[#4696AD]"
                                                        : "text-[#898C8F]"
                                                }`}
                                            >
                                                {formatarUnidadeDeMedida(unidade)}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Seção 2: Como deseja informar o custo? */}
                    <div>
                        <label className="mb-3 block text-[14px] font-light text-[#4696AD]">
                            Como deseja informar o custo?
                        </label>
                        <div className="flex items-center gap-6 text-[14px] font-light text-[#404040]">
                            {/* Opção 1: Já sei o custo unitário */}
                            <label
                                className="flex items-center gap-2 cursor-pointer select-none"
                                onClick={() => setTipoCusto("unitario")}
                            >
                                {/* Contêiner Pai com tamanho fixo e quadrado (ajuste aqui o tamanho desejado) */}
                                <div className="relative flex h-6 w-6 items-center justify-center">
                                    {tipoCusto === "unitario" ? (
                                        <img
                                            src="/checkmark.png"
                                            alt="Selecionado"
                                            className="h-full w-full object-contain scale-125 pointer-events-none"
                                        />
                                    ) : (
                                        <img
                                            src="/Rectangle 382.png"
                                            alt="Não selecionado"
                                            className="h-full w-full object-contain scale-90"
                                        />
                                    )}
                                </div>
                                Já sei o custo unitário
                            </label>

                            {/* Opção 2: Calcular a partir da compra */}
                            <label
                                className="flex items-center gap-2 cursor-pointer select-none"
                                onClick={() => setTipoCusto("compra")}
                            >
                                {/* Contêiner Pai com tamanho fixo e quadrado */}
                                <div className="relative flex h-6 w-6 items-center justify-center">
                                    {tipoCusto === "compra" ? (
                                        <img
                                            src="/checkmark.png"
                                            alt="Selecionado"
                                            className="h-full w-full object-contain scale-125 pointer-events-none"
                                        />
                                    ) : (
                                        <img
                                            src="/Rectangle 382.png"
                                            alt="Não selecionado"
                                            className="h-full w-full object-contain scale-90"
                                        />
                                    )}
                                </div>
                                Calcular a partir da compra
                            </label>
                        </div>
                    </div>

                    {/* CASO 1: Já sei o custo unitário */}
                    {tipoCusto === "unitario" && (
                        <div className="w-1/2 pr-2">
                            <FloatingLabelInput
                                label="Custo unitário"
                                value={custoUnitario}
                                onChange={(e) => setCustoUnitario(e.target.value)}
                                inputClassName="border-[#898C8F] text-[14px] text-[#898C8F]"
                            />
                        </div>
                    )}

                    {/* CASO 2: Calcular a partir da compra */}
                    {tipoCusto === "compra" && (
                        <div className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <FloatingLabelInput
                                    label="Valor pago"
                                    value={valorPago}
                                    onChange={(e) => setValorPago(e.target.value)}
                                    inputClassName="border-[#898C8F] text-[14px] text-[#898C8F]"
                                />
                                <FloatingLabelInput
                                    label="Quantidade adquirida"
                                    value={quantidadeAdquirida}
                                    onChange={(e) => setQuantidadeAdquirida(e.target.value)}
                                    inputClassName="border-[#898C8F] text-[14px] text-[#898C8F]"
                                />
                            </div>

                            {/* Campo Não Editável mostrando o Resultado (Divisão) */}
                            <div className="w-1/2 pr-2">
                                <input
                                    type="text"
                                    readOnly
                                    value={calcularResultado()}
                                    className="h-[39px] w-full rounded-[10px] border border-[#C4C8CD] bg-gray-50 px-3 text-[14px] font-light text-[#C4C8CD] focus:outline-none cursor-not-allowed select-none"
                                />
                            </div>
                        </div>
                    )}

                    {/* Botão de Conclusão */}
                    <div className="mt-8 flex justify-end">
                        <button
                            type="button"
                            disabled={submitting}
                            onClick={handleSubmit}
                            className="h-[39px] shrink-0 rounded-full bg-[#A9E2F2] px-6 text-[15px] font-light text-[#4696AD] transition hover:bg-[#94d6eb] disabled:opacity-60 whitespace-nowrap cursor-pointer"
                        >
                            {submitting ? "Salvando..." : "Concluir cadastro"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
