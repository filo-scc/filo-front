import { useEffect, useState, useCallback } from "react";
import { findOne } from "../../services/fichasTecnicasService";
import { getProdutosDoCliente } from "../../services/clientesService";
import { getAviamentosDoProduto } from "../../services/produtoService";
import EdicaoFichaTecnicaModal from "./EdicaoFichaTecnicaModal";
import NotaDeSaidaPrintView from "../NotaDeSaidaPrintView";
import { useNavigate } from "react-router-dom";
import FichaTecnicaPrintView from "../FichaTecnicaPrintView";
import OpcoesImpressaoModal from "./OpcoesImpressaoModal";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const CampoDetalhe = ({ label, valor }) => (
    <div className="relative border border-[#898C8F] rounded-[10px] h-[39px] px-3 flex items-center mt-2 w-full bg-white">
        <span className="absolute -top-[9px] left-2 bg-white px-1 text-[12px] text-[#898C8F]">
            {label}
        </span>
        <span className="text-[#898C8F] text-[16px] truncate">{valor || "-"}</span>
    </div>
);

const calcularProporcao = (totaisPorTamanho) => {
    const valoresValidos = totaisPorTamanho.map(Number).filter((t) => t > 0);
    if (valoresValidos.length === 0) return totaisPorTamanho.map(() => 0);
    const base = Math.min(...valoresValidos);
    return totaisPorTamanho.map((t) => (t > 0 ? Math.round(t / base) : 0));
};

const simplificarUnidade = (unidade) => {
    const unidadesSimplificadas = {
        METRO: "m",
        CENTIMETRO: "cm",
        GRAMA: "g",
        QUILOGRAMA: "kg",
        UNIDADE: "un",
        PAR: "par",
    };
    return unidadesSimplificadas[unidade] || unidade;
};

const BORDER_DARK_05 = { borderWidth: "0.5px", borderStyle: "solid", borderColor: "#7B7D80" };
const BORDER_SHELL_05 = { borderWidth: "0.5px", borderStyle: "solid", borderColor: "#D9D9D9" };

export default function FichaTecnicaDetalhesModal({ isOpen, onClose, fichaId }) {
    const [ficha, setFicha] = useState(null);
    const [aviamentosProduto, setAviamentosProduto] = useState([]);
    const [loading, setLoading] = useState(false);
    const [referenciaCliente, setReferenciaCliente] = useState("-");
    const navigate = useNavigate();

    // Estados dos Modais
    const [modalEdicaoAberto, setModalEdicaoAberto] = useState(false);
    const [modalImpressaoAberto, setModalImpressaoAberto] = useState(false);
    const [printMode, setPrintMode] = useState(null);

    const carregarDados = useCallback(async () => {
        try {
            const dados = await findOne(fichaId);
            setFicha(dados);

            // Carregar aviamentos do produto
            if (dados?.produto?.id) {
                try {
                    const aviamentos = await getAviamentosDoProduto(dados.produto.id);
                    setAviamentosProduto(aviamentos);
                } catch (error) {
                    console.error("Erro ao carregar aviamentos do produto", error);
                    setAviamentosProduto([]);
                }
            }

            if (dados?.pedido?.cliente?.id && dados?.produto?.id) {
                const produtoDoCliente = await getProdutosDoCliente(dados.pedido.cliente.id);
                const produtoVinculado = produtoDoCliente.find(
                    (item) => item.produto?.id == dados.produto.id,
                );
                setReferenciaCliente(produtoVinculado?.nome_para_cliente || "-");
            }
        } catch (error) {
            console.error("Erro ao carregar os dados da ficha", error);
        } finally {
            setLoading(false);
        }
    }, [fichaId]);

    useEffect(() => {
        if (isOpen && fichaId) {
            setLoading(true);
            carregarDados();
        }
    }, [isOpen, fichaId, carregarDados]);

    useEffect(() => {
        if (!printMode) return undefined;

        const handleAfterPrint = () => {
            document.body.classList.remove("print-mode-ficha", "print-mode-nota");
            setPrintMode(null);
        };

        window.addEventListener("afterprint", handleAfterPrint);

        return () => {
            window.removeEventListener("afterprint", handleAfterPrint);
            document.body.classList.remove("print-mode-ficha", "print-mode-nota");
        };
    }, [printMode]);

    const handlePrintMode = useCallback((mode) => {
        document.body.classList.add(`print-mode-${mode}`);
        setPrintMode(mode);
        window.print();
    }, []);

    const handleDownloadNotaSaidaPdf = useCallback(async () => {
        console.log("[PDF] start handleDownloadNotaSaidaPdf", { ficha });
        if (!ficha) {
            console.error("[PDF] ficha não definida");
            return;
        }

        const sourceElement =
            document.getElementById("nota-print-view") ||
            document.getElementById("portal-impressao-nota");
        console.log("[PDF] source element", sourceElement);
        if (!sourceElement) {
            console.error("Elemento de nota de saída não encontrado para gerar PDF.");
            return;
        }

        const snapshot = sourceElement.cloneNode(true);
        snapshot.id = "nota-print-view-pdf-snapshot";
        snapshot.style.position = "absolute";
        snapshot.style.left = "0";
        snapshot.style.top = "0";
        snapshot.style.width = "210mm";
        snapshot.style.visibility = "visible";
        snapshot.style.zIndex = "99999";
        snapshot.style.pointerEvents = "none";
        snapshot.style.opacity = "1";
        snapshot.style.display = "block";
        snapshot.style.backgroundColor = "white";
        document.body.appendChild(snapshot);

        await new Promise((resolve) => window.setTimeout(resolve, 150));

        try {
            const rect = snapshot.getBoundingClientRect();
            console.log("[PDF] rendering canvas...", {
                width: rect.width,
                height: rect.height,
                x: rect.x,
                y: rect.y,
            });

            const canvas = await html2canvas(snapshot, {
                useCORS: true,
                allowTaint: true,
                scale: 2,
                backgroundColor: "#ffffff",
                scrollX: 0,
                scrollY: 0,
            });
            console.log("[PDF] canvas generated", { width: canvas.width, height: canvas.height });

            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
            const pageWidth = pdf.internal.pageSize.getWidth();
            const pageHeight = pdf.internal.pageSize.getHeight();
            const imgProps = pdf.getImageProperties(imgData);
            const imgWidth = pageWidth;
            const imgHeight = (imgProps.height * imgWidth) / imgProps.width;

            pdf.addImage(imgData, "PNG", 0, 0, imgWidth, imgHeight);

            let heightLeft = imgHeight - pageHeight;
            let pageNumber = 1;

            while (heightLeft > 0) {
                pdf.addPage();
                pdf.addImage(imgData, "PNG", 0, -pageHeight * pageNumber, imgWidth, imgHeight);
                heightLeft -= pageHeight;
                pageNumber += 1;
            }

            const fileName = `nota-de-saida-${ficha.numero || "export"}.pdf`;
            console.log("[PDF] saving file", fileName);
            pdf.save(fileName);
        } catch (error) {
            console.error("Erro ao gerar PDF da nota de saída", error);
        } finally {
            console.log("[PDF] cleanup styles");
            const snapshotElement = document.getElementById("nota-print-view-pdf-snapshot");
            if (snapshotElement && snapshotElement.parentNode) {
                snapshotElement.parentNode.removeChild(snapshotElement);
            }
        }
    }, [ficha]);

    const handleContentClick = (e) => {
        e.stopPropagation();
    };

    if (!isOpen) return null;

    const sizeItems = ficha?.grade_versao?.itens || [];

    const itensPorCor = {};
    (ficha?.ficha_tecnica_itens || []).forEach((item) => {
        const corId = item.cor?.id;
        if (!corId) return;
        if (!itensPorCor[corId]) {
            itensPorCor[corId] = {
                cor: item.cor,
                quantidades: {},
            };
        }
        const tamanhoId = item.grade_versao_item?.tamanho?.id || item.grade_versao_item_id;
        itensPorCor[corId].quantidades[tamanhoId] = item.quantidade;
    });

    const coresList = Object.values(itensPorCor);

    const totalsBySize = sizeItems.map((s) => {
        const tamanhoId = s.tamanho?.id || s.id;
        return coresList.reduce((sum, itemCor) => {
            return sum + Number(itemCor.quantidades[tamanhoId] || 0);
        }, 0);
    });

    const proporcoes = calcularProporcao(totalsBySize);

    const categoriasAceitas = ["costura", "faccao", "confeccao"];

    const normalizarCategoria = (categoria) =>
        (categoria || "")
            .normalize("NFD")
            .replace(/[\u0300-\u036f]/g, "")
            .toLowerCase();

    const parceirosFiltrados = (ficha?.ficha_parceiro || []).filter((vinculo) =>
        categoriasAceitas.includes(normalizarCategoria(vinculo.parceiro?.categoria)),
    );

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-4 backdrop-blur-sm"
            onClick={onClose}
        >
            <div
                className="bg-white rounded-[24px] w-full max-w-[850px] max-h-[90vh] flex flex-col shadow-2xl relative overflow-hidden font-['Outfit',_sans-serif]"
                onClick={handleContentClick}
            >
                <div className="flex justify-between items-center px-8 py-6 border-b border-gray-100 shrink-0">
                    <div className="flex items-center gap-3">
                        <img
                            src="/etiqueta-preta.png"
                            alt="Tag"
                            className="w-[30px] h-[30px] object-contain"
                        />
                        <h2 className="text-[26px] font-light text-[#404040]">
                            Ficha Técnica {ficha?.numero}
                        </h2>
                    </div>

                    <button onClick={onClose}>
                        <img
                            src="/fechar-cinza.png"
                            alt="icone de fechar"
                            className="w-[10.5px] h-[10.5px] object-contain"
                        />
                    </button>
                </div>

                <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-sutil">
                    {loading ? (
                        <div className="text-center text-[#4696AD]">
                            Carregando dados da ficha...
                        </div>
                    ) : (
                        <>
                            <div className="flex flex-col md:flex-row gap-8">
                                <div className="w-[209px] h-[160px] shrink-0 rounded-[10px] overflow-hidden border border-dashed border-[#898C8F]">
                                    <img
                                        src={ficha?.produto?.foto || "/image-delete-02-2.png"}
                                        alt="Foto do Produto"
                                        className={`w-full h-full ${ficha?.produto?.foto ? "object-cover" : "object-contain p-6 opacity-40"}`}
                                    />
                                </div>

                                <div className="flex-1 grid grid-cols-2 gap-x-6 gap-y-4 content-start pt-2">
                                    <CampoDetalhe
                                        label="Referência Interna"
                                        valor={ficha?.produto?.nome}
                                    />
                                    <CampoDetalhe
                                        label="Cliente"
                                        valor={ficha?.pedido?.cliente?.nome}
                                    />
                                    <CampoDetalhe
                                        label="Referência do Cliente"
                                        valor={referenciaCliente}
                                    />
                                    <CampoDetalhe
                                        label="Tecido"
                                        valor={ficha?.produto?.tecido?.nome}
                                    />
                                </div>
                            </div>

                            <div className="mt-4">
                                <div className="mb-2 text-center text-[16px] font-light text-[#737373]">
                                    Grade
                                </div>
                                <div className="w-full">
                                    <div className="flex w-full items-stretch min-h-[30px]">
                                        <div className="w-[160px] shrink-0" />
                                        <div className="flex flex-1 min-w-0">
                                            {sizeItems.map((s, i) => (
                                                <div
                                                    key={`prop-${s.id}`}
                                                    className="bg-[#F4F4F4] flex-1 min-w-0 text-center text-[14px] font-light flex items-center justify-center"
                                                    style={{
                                                        borderColor: "#7B7D80",
                                                        borderLeftWidth: "0.5px",
                                                        borderRightWidth:
                                                            i === sizeItems.length - 1
                                                                ? "0.5px"
                                                                : "0px",
                                                        borderTopWidth: "0.5px",
                                                        borderBottomWidth: "0.5px",
                                                        borderTopLeftRadius:
                                                            i === 0 ? "10px" : "0px",
                                                        borderTopRightRadius:
                                                            i === sizeItems.length - 1
                                                                ? "10px"
                                                                : "0px",
                                                        color:
                                                            totalsBySize[i] > 0
                                                                ? "#898C8F"
                                                                : "#D7D7D7",
                                                    }}
                                                >
                                                    {proporcoes[i]}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div className="flex h-[40px] items-stretch">
                                        <div className="w-[160px] shrink-0 rounded-tl-[10px] font-normal bg-[#C9EAF6] px-4 text-[#4696AD] flex items-center justify-center overflow-hidden">
                                            Cores
                                        </div>
                                        <div className="flex flex-1 min-w-0">
                                            {sizeItems.map((s, idx) => (
                                                <div
                                                    key={s.id}
                                                    className="flex-1 min-w-0 text-center font-normal text-[#4696AD] flex items-center justify-center bg-[#C9EAF6]"
                                                    style={{
                                                        borderLeftWidth:
                                                            idx === 0 ? "0.5px" : "0px",
                                                        borderRightWidth: "0.5px",
                                                        borderColor: "#7B7D80",
                                                    }}
                                                >
                                                    {s.tamanho?.codigo || "-"}
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    <div
                                        className="rounded-b-[10px] bg-white overflow-hidden"
                                        style={BORDER_SHELL_05}
                                    >
                                        <div className="flex flex-col w-full">
                                            {coresList.length > 0 ? (
                                                coresList.map((itemCor, index) => (
                                                    <div
                                                        key={itemCor.cor.id}
                                                        className={`flex w-full min-h-[40px] items-stretch ${index % 2 === 1 ? "bg-[#F4F4F4]" : "bg-[#FFFFFF]"}`}
                                                    >
                                                        <div
                                                            className="w-[160px] shrink-0 pl-2 pr-4 flex items-center gap-3"
                                                            style={{
                                                                ...BORDER_DARK_05,
                                                                borderTopWidth: "0px",
                                                                borderLeftWidth: "0px",
                                                                borderBottomWidth: "0px",
                                                                borderRightWidth: "0.5px",
                                                            }}
                                                        >
                                                            {String(
                                                                itemCor.cor.tipo,
                                                            ).toUpperCase() === "ESTAMPA" ? (
                                                                <img
                                                                    src={itemCor.cor.foto}
                                                                    alt={itemCor.cor.nome}
                                                                    className="w-[20px] h-[20px] rounded-[6px] shrink-0 border border-[#D9D9D9] object-cover"
                                                                />
                                                            ) : (
                                                                <span
                                                                    className="w-[20px] h-[20px] rounded-[6px] shrink-0 border border-[#D9D9D9]"
                                                                    style={{
                                                                        backgroundColor:
                                                                            itemCor.cor
                                                                                .codigo_hex ||
                                                                            "#E5E5E5",
                                                                    }}
                                                                />
                                                            )}
                                                            <span className="flex-1 text-center text-[14px] font-light text-[#898C8F] truncate leading-none">
                                                                {itemCor.cor.nome}
                                                            </span>
                                                        </div>

                                                        {sizeItems.map((s, sizeIndex) => {
                                                            const qtd =
                                                                itemCor.quantidades[
                                                                    s.tamanho?.id
                                                                ] || 0;
                                                            return (
                                                                <div
                                                                    key={s.id}
                                                                    className="flex-1 min-w-0 px-2 flex items-center justify-center text-[14px] font-light text-[#898C8F]"
                                                                    style={{
                                                                        ...BORDER_DARK_05,
                                                                        borderTopWidth: "0px",
                                                                        borderBottomWidth: "0px",
                                                                        borderLeftWidth: "0px",
                                                                        borderRightWidth:
                                                                            sizeIndex !==
                                                                            sizeItems.length - 1
                                                                                ? "0.5px"
                                                                                : "0px",
                                                                    }}
                                                                >
                                                                    {qtd > 0 ? qtd : "-"}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                ))
                                            ) : (
                                                <div className="px-4 py-4 text-[13px] text-center text-[#888] bg-white w-full rounded-b-[10px]">
                                                    Nenhuma cor vinculada a esta ficha.
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="border border-[#E8E8E8] rounded-[10px] overflow-hidden">
                                <table className="w-full text-center text-sm">
                                    <thead className="bg-[#C9EAF6] text-[#4696AD]">
                                        <tr>
                                            <th className="py-3 border-r border-white/50 font-normal">
                                                Facção
                                            </th>
                                            <th className="py-3 border-r border-white/50 font-normal">
                                                Operação
                                            </th>
                                            <th className="py-3 font-normal">Preço Unitário</th>
                                        </tr>
                                    </thead>
                                    <tbody className="text-[#707070]">
                                        {parceirosFiltrados.length > 0 ? (
                                            parceirosFiltrados.map((vinculo, index) => {
                                                const parceiro = vinculo.parceiro;
                                                const nome = parceiro?.nome || "-";
                                                const operacao = vinculo.operacao || "-";

                                                const preco =
                                                    parceiro?.parceiro_produto?.[0]?.preco;

                                                const precoFormatado =
                                                    preco !== undefined && preco !== null
                                                        ? `R$ ${Number(preco).toFixed(2).replace(".", ",")}`
                                                        : "-";

                                                return (
                                                    <tr
                                                        key={vinculo.id || index}
                                                        className="border-t border-[#E8E8E8] first:border-t-0"
                                                    >
                                                        <td className="py-3">{nome}</td>
                                                        <td className="py-3 text-[#D3D3D3]">
                                                            {operacao}
                                                        </td>
                                                        <td className="py-3">{precoFormatado}</td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td
                                                    colSpan="3"
                                                    className="py-4 text-center text-[13px] text-[#888]"
                                                >
                                                    Nenhuma facção vinculada a esta ficha.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            {/* Materiais Necessários - Gradiente 100% Opaco para Cobrir a Borda */}
                            <div className="relative bg-[#F4F4F4] border border-[#E2E2E2] rounded-[14px] p-5 pt-5 mt-6">
                                <span className="absolute -top-[12px] left-4 bg-gradient-to-b from-white via-white via-[35%] to-[#F4F4F4] px-3 py-0.5 text-[15px] font-normal text-[#666666] leading-none">
                                    Materiais necessários por peça:
                                </span>

                                {aviamentosProduto && aviamentosProduto.length > 0 ? (
                                    <div className="flex flex-col gap-1 text-[14px] mt-1">
                                        {aviamentosProduto.map((item, index) => {
                                            const qtd = item.quantidade ?? "";
                                            const unidade = simplificarUnidade(
                                                item.aviamento?.unidade_de_medida ?? "",
                                            );
                                            const nome = item.aviamento?.nome ?? "";

                                            return (
                                                <div
                                                    key={item.aviamento?.id ?? index}
                                                    className="leading-relaxed"
                                                >
                                                    <span className="font-bold text-[#898C8F]">
                                                        {qtd} {unidade}
                                                    </span>{" "}
                                                    <span className="text-[#A5A5AA] font-normal">
                                                        de {nome}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <div className="mt-1 text-[13px] text-[#888]">
                                        Nenhum material vinculado a este produto.
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </div>

                <div className="px-8 py-5 border-t border-gray-100 flex justify-between items-center shrink-0">
                    <button
                        type="button"
                        onClick={() => setModalImpressaoAberto(true)}
                        className="w-[71px] h-[39px] bg-[#A9E2F2] rounded-full flex items-center justify-center hover:bg-[#97D8EA] transition-colors shadow-sm focus:outline-none"
                    >
                        <img
                            src="/impressora-azul.png"
                            alt="Imprimir"
                            className="w-[20px] h-[20px] object-contain"
                        />
                    </button>

                    <div className="flex gap-4">
                        <button
                            onClick={() => setModalEdicaoAberto(true)}
                            className="px-8 h-[39px] rounded-full border border-[#4696AD] text-[#4696AD] bg-[#F3F4FA] hover:bg-[#F3FBFC] transition-colors text-sm"
                        >
                            Editar Ficha
                        </button>
                        <button
                            onClick={() => {
                                onClose();
                                navigate("/");
                            }}
                            className="px-10 h-[39px] rounded-full bg-[#A9E2F2] text-[#4696AD] hover:bg-[#97D8EA] transition-colors text-sm"
                        >
                            Concluir
                        </button>
                    </div>
                </div>
            </div>

            {/* Modal de Escolha do Tipo de Impressão */}
            <OpcoesImpressaoModal
                isOpen={modalImpressaoAberto}
                onClose={() => setModalImpressaoAberto(false)}
                onSelectFichaTecnica={() => {
                    setModalImpressaoAberto(false);
                    handlePrintMode("ficha");
                }}
                onSelectNotaSaida={async () => {
                    setModalImpressaoAberto(false);
                    if (ficha?.fabrico?.id === 3 || ficha?.fabrico_id === 3) {
                        await handleDownloadNotaSaidaPdf();
                        return false;
                    }

                    handlePrintMode("nota");
                    return true;
                }}
            />

            {/* Modal de Edição */}
            {modalEdicaoAberto && (
                <EdicaoFichaTecnicaModal
                    isOpen={modalEdicaoAberto}
                    fichaId={fichaId}
                    dadosFicha={ficha}
                    onClose={() => setModalEdicaoAberto(false)}
                    onSuccess={() => {
                        setModalEdicaoAberto(false);
                        carregarDados();
                    }}
                />
            )}

            {/* Layout de Impressão Oculto da Ficha Técnica */}
            <FichaTecnicaPrintView
                dadosFicha={ficha}
                fichaId={fichaId}
                referencia={referenciaCliente}
            />
            <NotaDeSaidaPrintView
                ficha={ficha}
                referenciaCliente={referenciaCliente}
                forceVisibleForPdf={Boolean(ficha?.fabrico?.id === 3 || ficha?.fabrico_id === 3)}
            />
        </div>
    );
}
