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
import RelatorioDeAcabamento from "./RelatorioDeAcabamento";
import { getAllEtapas } from "../../services/etapaService";
import {
    anexarEtapaAosParceiros,
    ehParceiroDeCostura,
    indexarEtapasPorId,
} from "../../utils/etapaDoParceiro.js";
import { getFabricoById } from "../../services/fabricoService";

// Celular: texto corrido (rótulo pequeno acima do valor, sem caixa), por ser só visualização.
// Tablet e desktop mantêm o campo com borda.
const CampoDetalhe = ({ label, valor }) => (
    <div className="w-full min-w-0 bg-white md:relative md:mt-0.5 md:flex md:h-[44px] md:items-center md:rounded-[10px] md:border md:border-[#898C8F] md:px-3 lg:h-[39px]">
        <span className="block text-[11px] leading-4 text-[#898C8F] md:absolute md:-top-[9px] md:left-2 md:bg-white md:px-1 md:text-[12px] md:leading-normal">
            {label}
        </span>
        <span
            className="block break-words text-[14px] leading-[18px] text-[#404040] line-clamp-2 md:line-clamp-none md:truncate md:text-[16px] md:leading-normal md:text-[#898C8F]"
            title={valor || undefined}
        >
            {valor || "-"}
        </span>
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
        UNIDADE: "und",
        PAR: "par",
    };
    return unidadesSimplificadas[unidade] || unidade;
};

const BORDER_DARK_05 = { borderWidth: "0.5px", borderStyle: "solid", borderColor: "#7B7D80" };

// Coluna da cor na grade: fixa (com sombra na borda) enquanto a grade rola no celular; a partir do
// tablet volta ao fluxo normal.
const COLUNA_FIXA =
    "sticky left-0 z-10 shadow-[1px_0_0_#CBD3D6,6px_0_8px_-6px_rgba(0,0,0,0.22)] md:static md:shadow-none";

export default function FichaTecnicaDetalhesModal({ isOpen, onClose, fichaId, onFichaAtualizada }) {
    const [ficha, setFicha] = useState(null);
    const [aviamentosProduto, setAviamentosProduto] = useState([]);
    const [loading, setLoading] = useState(false);
    const [referenciaCliente, setReferenciaCliente] = useState("-");
    const navigate = useNavigate();

    // Estados dos Modais
    const [modalEdicaoAberto, setModalEdicaoAberto] = useState(false);
    const [modalImpressaoAberto, setModalImpressaoAberto] = useState(false);
    const [printMode, setPrintMode] = useState(null);
    const [ultimaEtapaId, setUltimaEtapaId] = useState(null);
    const [relatorioAcabamento, setRelatorioAcabamento] = useState({
        defeitoCostura: 0,
        defeitoTecido: 0,
        retiradas: 0,
        sobras: 0,
    });

    const carregarDados = useCallback(async () => {
        try {
            // O parceiro da ficha vem só com etapa_id; a etapa é anexada aqui, uma vez, para os
            // filtros de costura (esta tela, a edição e a impressão) olharem parceiro.etapa.
            const [fichaCarregada, etapas] = await Promise.all([findOne(fichaId), getAllEtapas()]);
            const dados = anexarEtapaAosParceiros(fichaCarregada, indexarEtapasPorId(etapas));
            if (dados && dados.fabrico?.fabricacao_sob_demanda == null && dados.fabrico_id) {
                dados.fabrico = await getFabricoById(dados.fabrico_id);
            }
            setFicha(dados);
            setRelatorioAcabamento({
                defeitoCostura: dados?.defeitos_costura ?? 0,
                defeitoTecido: dados?.defeitos_tecido ?? 0,
                retiradas: dados?.retiradas ?? 0,
                sobras: dados?.sobras ?? 0,
            });

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

    useEffect(() => {
        let isCurrent = true;

        getAllEtapas()
            .then((etapas) => {
                if (!isCurrent) return;
                const etapasAtivas = (etapas || []).filter((e) => e.ativa);
                const etapasOrdenadas = etapasAtivas.sort((a, b) => a.ordem - b.ordem);
                const ultima = etapasOrdenadas[etapasOrdenadas.length - 1];
                setUltimaEtapaId(ultima?.id ?? null);
            })
            .catch((error) => {
                console.error("Erro ao verificar última etapa", error);
                setUltimaEtapaId(null);
            });

        return () => {
            isCurrent = false;
        };
    }, [ficha?.fabrico_id]);
    const isUltimaEtapa = ultimaEtapaId != null && ficha?.etapa_atual_id == ultimaEtapaId;

    const handlePrintMode = useCallback((mode) => {
        document.body.classList.add(`print-mode-${mode}`);
        setPrintMode(mode);
        window.print();
    }, []);

    const handleDownloadNotaSaidaPdf = useCallback(async () => {
        if (!ficha) {
            console.error("[PDF] ficha não definida");
            return;
        }

        const sourceElement =
            document.getElementById("nota-print-view") ||
            document.getElementById("portal-impressao-nota");

        if (!sourceElement) {
            console.error("Elemento de nota de saída não encontrado para gerar PDF.");
            return;
        }

        const snapshot = sourceElement.cloneNode(true);
        snapshot.id = "nota-print-view-pdf-snapshot";

        snapshot.className = snapshot.className
            .split(" ")
            .filter((cls) => cls !== "hidden" && cls !== "print:block")
            .join(" ");

        // Usamos absolute para garantir que o html2canvas capture toda a altura sem limitar pela janela
        Object.assign(snapshot.style, {
            position: "absolute",
            top: "0",
            left: "0",
            width: "210mm",
            boxSizing: "border-box",
            backgroundColor: "#ffffff",
            zIndex: "99999",
            opacity: "1",
            visibility: "visible",
            pointerEvents: "none",
        });

        document.body.appendChild(snapshot);

        // A rotina do PDF captura tudo como uma única imagem. Para preservar a
        // regra visual de impressão, empurramos as Anotações para a página
        // seguinte quando o bloco não couber integralmente na página atual.
        const observacoes = snapshot.querySelector(".nota-observacoes");
        if (observacoes) {
            const cssPageHeight = (297 / 25.4) * 96;
            const observacoesTop = observacoes.offsetTop;
            const observacoesHeight = observacoes.offsetHeight;
            const pageOffset = observacoesTop % cssPageHeight;
            const remainingPageSpace = cssPageHeight - pageOffset;

            if (observacoesHeight > remainingPageSpace) {
                observacoes.style.marginTop = `${parseFloat(getComputedStyle(observacoes).marginTop) + remainingPageSpace + 8}px`;
            }
        }

        const images = snapshot.querySelectorAll("img");
        await Promise.all(
            Array.from(images).map(
                (img) =>
                    new Promise((resolve) => {
                        if (img.complete) resolve();
                        else {
                            img.onload = resolve;
                            img.onerror = resolve;
                        }
                    }),
            ),
        );

        try {
            const canvas = await html2canvas(snapshot, {
                useCORS: true,
                allowTaint: true,
                scale: 2,
                backgroundColor: "#ffffff",
                scrollX: 0,
                scrollY: 0,
                x: 0,
                y: 0,
                width: snapshot.offsetWidth,
                height: snapshot.offsetHeight,
                windowWidth: snapshot.offsetWidth,
                windowHeight: snapshot.offsetHeight,
            });

            const imgData = canvas.toDataURL("image/png");
            const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });

            const pageWidth = pdf.internal.pageSize.getWidth(); // 210mm
            const pageHeight = pdf.internal.pageSize.getHeight(); // 297mm

            const imgProps = pdf.getImageProperties(imgData);
            const imgHeight = (imgProps.height * pageWidth) / imgProps.width;

            if (imgHeight <= pageHeight + 20) {
                pdf.addImage(imgData, "PNG", 0, 0, pageWidth, Math.min(imgHeight, pageHeight));
            } else {
                let heightLeft = imgHeight;
                let position = 0;

                pdf.addImage(imgData, "PNG", 0, position, pageWidth, imgHeight);
                heightLeft -= pageHeight;

                while (heightLeft > 0) {
                    position -= pageHeight;
                    pdf.addPage();
                    pdf.addImage(imgData, "PNG", 0, position, pageWidth, imgHeight);
                    heightLeft -= pageHeight;
                }
            }

            const fileName = `${ficha.fabrico?.fabricacao_sob_demanda === false ? "nota-de-conferencia" : "nota-de-saida"}-${ficha.numero || "export"}.pdf`;
            pdf.save(fileName);
        } catch (error) {
            console.error("Erro ao gerar PDF da nota de saída", error);
        } finally {
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

    const totalsByColor = coresList.reduce((totals, itemCor) => {
        totals[itemCor.cor.id] = sizeItems.reduce((sum, size) => {
            const tamanhoId = size.tamanho?.id || size.id;
            return sum + Number(itemCor.quantidades[tamanhoId] || 0);
        }, 0);
        return totals;
    }, {});

    const totalGeral = totalsBySize.reduce((sum, total) => sum + Number(total || 0), 0);

    const proporcoes = calcularProporcao(totalsBySize);

    const parceirosFiltrados = (ficha?.ficha_parceiro || []).filter((vinculo) =>
        ehParceiroDeCostura(vinculo.parceiro),
    );

    // fabricacao_sob_demanda = true: "Pedido" / "Ver pedido"; = false: "Produção" / "Ver produção".
    // Os dois modos abrem o mesmo detalhe (/pedidos/:id).
    const isSobDemanda = ficha?.fabrico?.fabricacao_sob_demanda !== false;
    const rotuloOrigem = isSobDemanda ? "Pedido" : "Produção";
    const rotuloVerOrigem = isSobDemanda ? "Ver pedido" : "Ver produção";
    const irParaOrigem = () => navigate(`/pedidos/${ficha?.pedido?.id ?? ficha?.pedido_id}`);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/35 p-0 backdrop-blur-sm md:p-4"
            onClick={onClose}
        >
            <div
                className="relative flex h-[100dvh] max-h-[100dvh] w-full max-w-[850px] flex-col overflow-hidden rounded-none bg-white shadow-2xl font-['Outfit',_sans-serif] md:h-auto md:max-h-[90vh] md:rounded-[24px]"
                onClick={handleContentClick}
            >
                <div className="flex shrink-0 items-center justify-between gap-2 py-2 pl-4 pr-1 md:px-8 md:py-6 lg:gap-0">
                    <div className="flex min-w-0 items-center gap-3">
                        <img
                            src="/etiqueta-preta.png"
                            alt="Tag"
                            className="hidden h-[26px] w-[26px] object-contain md:block lg:h-[30px] lg:w-[30px]"
                        />
                        <div className="flex min-w-0 flex-col">
                            <h2 className="truncate text-[18px] font-normal leading-tight text-[#404040] md:text-[22px] md:font-light lg:text-[26px]">
                                Ficha Técnica {ficha?.numero}
                            </h2>
                            {ficha?.pedido ? (
                                <p className="hidden text-[14px] font-light text-[#404040] md:-mt-2 md:block">
                                    {rotuloOrigem} Nº{ficha?.pedido?.numero}{" "}
                                    <span className="mx-1 text-[25px] align-middle">•</span>{" "}
                                    <button
                                        type="button"
                                        onClick={irParaOrigem}
                                        className="-my-3 inline-block px-1 py-3 text-[14px] font-light text-[#4696AD] lg:my-0 lg:px-0 lg:py-0"
                                    >
                                        {rotuloVerOrigem}
                                    </button>
                                </p>
                            ) : null}
                        </div>
                    </div>

                    <button
                        type="button"
                        onClick={onClose}
                        aria-label="Fechar"
                        className="flex h-11 w-11 shrink-0 items-center justify-center md:-my-2 md:-mr-3 lg:m-0 lg:h-auto lg:w-auto"
                    >
                        <img
                            src="/fechar-cinza.png"
                            alt="icone de fechar"
                            className="w-[10.5px] h-[10.5px] object-contain"
                        />
                    </button>
                </div>

                <div className="flex-1 space-y-5 overflow-y-auto px-4 pb-6 pt-1 scrollbar-sutil sm:px-8 md:space-y-8 md:pb-8 md:pt-1">
                    {loading ? (
                        <div className="text-center text-[#4696AD]">
                            Carregando dados da ficha...
                        </div>
                    ) : (
                        <>
                            {/* Celular: o vínculo com pedido/produção sai do cabeçalho e vira uma barra no corpo */}
                            {ficha?.pedido ? (
                                <div className="flex h-[52px] items-center justify-between rounded-[12px] border border-[#DCEBF1] bg-[#F5FAFC] pl-3.5 pr-1 md:hidden">
                                    <span className="text-[15px] text-[#404040]">
                                        {rotuloOrigem} Nº{ficha?.pedido?.numero}
                                    </span>
                                    <button
                                        type="button"
                                        onClick={irParaOrigem}
                                        className="flex h-11 items-center gap-1.5 px-2.5 text-[15px] font-medium text-[#4696AD]"
                                    >
                                        {rotuloVerOrigem}
                                        <svg
                                            width="14"
                                            height="14"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="currentColor"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            aria-hidden="true"
                                        >
                                            <path d="M9 6l6 6-6 6" />
                                        </svg>
                                    </button>
                                </div>
                            ) : null}

                            <div className="flex flex-row items-start gap-5 md:!mt-0 md:gap-6 lg:gap-8">
                                {/* Foto em pé (3:4) até o tablet, com os campos ao lado direito; no desktop segue a medida original */}
                                <div className="aspect-[3/4] w-[112px] min-[360px]:w-[132px] shrink-0 rounded-[12px] overflow-hidden md:border md:border-dashed md:border-[#898C8F] md:h-[176px] md:w-[132px] md:rounded-[10px] lg:h-[160px] lg:w-[209px]">
                                    <img
                                        src={ficha?.produto?.foto || "/image-delete-02-2.png"}
                                        alt="Foto do Produto"
                                        className={`w-full h-full ${ficha?.produto?.foto ? "object-cover" : "object-contain p-6 opacity-40"}`}
                                    />
                                </div>

                                <div className="grid min-w-0 flex-1 grid-cols-1 content-start gap-x-6 gap-y-2.5 md:grid-cols-2 md:gap-y-4">
                                    <CampoDetalhe
                                        label="Referência Interna"
                                        valor={ficha?.produto?.nome}
                                    />
                                    <CampoDetalhe
                                        label="Cliente"
                                        valor={ficha?.pedido?.cliente?.nome}
                                    />
                                    {ficha?.fabrico?.fabricacao_sob_demanda !== false && (
                                        <CampoDetalhe
                                            label="Referência do Cliente"
                                            valor={referenciaCliente}
                                        />
                                    )}
                                    <CampoDetalhe
                                        label="Tecido"
                                        valor={ficha?.produto?.tecido?.nome}
                                    />
                                </div>
                            </div>

                            <div className="mt-2">
                                <div className="mb-2 text-center text-[16px] font-light text-[#737373]">
                                    Grade
                                </div>
                                {/* Celular: o bloco rola na horizontal e a coluna da cor fica fixa */}
                                <div className="w-full overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden md:overflow-visible">
                                    <div
                                        className="w-full min-w-[var(--grade-min)] md:min-w-0"
                                        style={{
                                            "--grade-min": `${112 + 56 + 64 * sizeItems.length}px`,
                                        }}
                                    >
                                        <div className="flex w-full items-stretch min-h-[44px] md:min-h-[30px]">
                                            {/* Célula vazia: fica fixa e branca no celular para cobrir a rolagem horizontal, mas sem a borda/sombra da coluna fixa */}
                                            <div className="sticky left-0 z-10 flex w-[112px] shrink-0 items-center bg-white md:static md:w-[160px] md:bg-transparent" />
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
                                            <div className="w-[56px] shrink-0 md:w-[90px]" />
                                        </div>

                                        <div className="flex h-[44px] items-stretch md:h-[40px]">
                                            <div
                                                className={`${COLUNA_FIXA} w-[112px] shrink-0 rounded-tl-[10px] font-normal bg-[#C9EAF6] px-2.5 text-[#4696AD] flex items-center justify-center overflow-hidden md:w-[160px] md:px-4`}
                                            >
                                                Cores
                                            </div>
                                            <div className="flex flex-1 min-w-0">
                                                {sizeItems.map((s, sizeIndex) => (
                                                    <div
                                                        key={s.id}
                                                        className="flex-1 min-w-0 text-center font-normal text-[#4696AD] flex items-center justify-center bg-[#C9EAF6]"
                                                        style={{
                                                            borderLeftWidth: "0.5px",
                                                            borderRightWidth:
                                                                sizeIndex === sizeItems.length - 1
                                                                    ? "0.5px"
                                                                    : "0px",
                                                            borderColor: "#7B7D80",
                                                        }}
                                                    >
                                                        {s.tamanho?.codigo || "-"}
                                                    </div>
                                                ))}
                                            </div>
                                            <div
                                                className="w-[56px] shrink-0 rounded-tr-[10px] bg-[#C9EAF6] px-2 text-center text-[14px] font-normal text-[#4696AD] flex items-center justify-center md:w-[90px]"
                                                style={{
                                                    borderRight: "0.5px solid #D9D9D9",
                                                }}
                                            >
                                                <span className="md:hidden">Total</span>
                                                <span className="hidden md:inline">
                                                    Total (cor)
                                                </span>
                                            </div>
                                        </div>

                                        <div className="rounded-b-[10px] bg-white overflow-clip">
                                            <div className="flex flex-col w-full">
                                                {coresList.length > 0 ? (
                                                    coresList.map((itemCor, index) => (
                                                        <div
                                                            key={itemCor.cor.id}
                                                            className={`flex w-full min-h-[48px] items-stretch md:min-h-[40px] ${index % 2 === 1 ? "bg-[#F4F4F4]" : "bg-[#FFFFFF]"}`}
                                                        >
                                                            <div
                                                                className={`${COLUNA_FIXA} w-[112px] shrink-0 pl-2 pr-2 flex items-center gap-1.5 md:w-[160px] md:gap-3 md:pr-4 ${index % 2 === 1 ? "bg-[#F4F4F4]" : "bg-[#FFFFFF]"}`}
                                                                style={{
                                                                    borderLeftWidth: "0.5px",
                                                                    borderLeftColor: "#D9D9D9",
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
                                                                <span
                                                                    title={itemCor.cor.nome}
                                                                    className="min-w-0 flex-1 line-clamp-2 text-left text-[13px] font-light leading-4 text-[#898C8F] md:block md:truncate md:text-center md:text-[14px] md:leading-none"
                                                                >
                                                                    {itemCor.cor.nome}
                                                                </span>
                                                            </div>

                                                            {sizeItems.map((s, sizeIndex) => {
                                                                const tamanhoId =
                                                                    s.tamanho?.id || s.id;
                                                                const qtd =
                                                                    itemCor.quantidades[
                                                                        tamanhoId
                                                                    ] || 0;
                                                                return (
                                                                    <div
                                                                        key={s.id}
                                                                        className="flex-1 min-w-0 px-2 flex items-center justify-center text-[14px] font-light"
                                                                        style={{
                                                                            ...BORDER_DARK_05,
                                                                            borderTopWidth: "0px",
                                                                            borderBottomWidth:
                                                                                "0px",
                                                                            borderLeftWidth:
                                                                                "0.5px",
                                                                            borderRightWidth:
                                                                                sizeIndex ===
                                                                                sizeItems.length - 1
                                                                                    ? "0.5px"
                                                                                    : "0px",
                                                                        }}
                                                                    >
                                                                        <span
                                                                            className={
                                                                                qtd > 0
                                                                                    ? "text-[#4696AD]"
                                                                                    : "text-[#898C8F]"
                                                                            }
                                                                        >
                                                                            {qtd > 0 ? qtd : "-"}
                                                                        </span>
                                                                    </div>
                                                                );
                                                            })}
                                                            <div
                                                                className="w-[56px] shrink-0 px-2 flex items-center justify-center text-[14px] font-normal md:w-[90px]"
                                                                style={{
                                                                    borderRight:
                                                                        "0.5px solid #D9D9D9",
                                                                }}
                                                            >
                                                                <span
                                                                    className={
                                                                        totalsByColor[
                                                                            itemCor.cor.id
                                                                        ]
                                                                            ? "text-[#4696AD]"
                                                                            : "text-[#898C8F]"
                                                                    }
                                                                >
                                                                    {totalsByColor[
                                                                        itemCor.cor.id
                                                                    ] || "-"}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))
                                                ) : (
                                                    <div className="px-4 py-4 text-[13px] text-center text-[#888] bg-white w-full rounded-b-[10px]">
                                                        Nenhuma cor vinculada a esta ficha.
                                                    </div>
                                                )}
                                                <div className="flex w-full min-h-[44px] items-stretch md:min-h-[40px]">
                                                    <div
                                                        className={`${COLUNA_FIXA} w-[112px] shrink-0 bg-[#C9EAF6] px-2.5 text-center text-[12px] leading-[14px] font-normal text-[#4696AD] flex items-center justify-center md:w-[160px] md:px-3 md:text-[14px] md:leading-[1.5]`}
                                                    >
                                                        Total (tamanho)
                                                    </div>
                                                    <div className="flex flex-1 min-w-0">
                                                        {sizeItems.map((size, sizeIndex) => (
                                                            <div
                                                                key={`total-tamanho-${size.id}`}
                                                                className={`flex-1 min-w-0 px-2 flex items-center justify-center text-[14px] font-normal border-l-[0.5px] border-[#7B7D80] ${
                                                                    coresList.length % 2 === 1
                                                                        ? "bg-[#F4F4F4]"
                                                                        : "bg-[#FFFFFF]"
                                                                }`}
                                                                style={{
                                                                    borderLeftWidth: "0.5px",
                                                                    borderRightWidth:
                                                                        sizeIndex ===
                                                                        sizeItems.length - 1
                                                                            ? "0.5px"
                                                                            : "0px",
                                                                    borderColor: "#7B7D80",
                                                                }}
                                                            >
                                                                <span
                                                                    className={
                                                                        totalsBySize[sizeIndex]
                                                                            ? "text-[#4696AD]"
                                                                            : "text-[#898C8F]"
                                                                    }
                                                                >
                                                                    {totalsBySize[sizeIndex] || "-"}
                                                                </span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <div className="w-[56px] shrink-0 bg-[#C9EAF6] px-2 flex items-center justify-center text-[14px] font-normal md:w-[90px]">
                                                        <span
                                                            className={
                                                                totalGeral
                                                                    ? "text-[#4696AD]"
                                                                    : "text-[#898C8F]"
                                                            }
                                                        >
                                                            {totalGeral || "-"}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                                <p className="mt-2 flex items-center gap-1.5 text-[12px] text-[#6B6E72] md:hidden">
                                    <svg
                                        width="12"
                                        height="12"
                                        viewBox="0 0 24 24"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        aria-hidden="true"
                                    >
                                        <path d="M5 12h14M13 6l6 6-6 6" />
                                    </svg>
                                    Deslize para ver todos os tamanhos
                                </p>
                            </div>

                            <div className="overflow-hidden">
                                <table className="w-full table-fixed border-separate border-spacing-0 text-center text-sm">
                                    <thead className="bg-[#C9EAF6] text-[#4696AD]">
                                        <tr>
                                            <th className="w-1/3 rounded-tl-[10px] py-3 border-r border-[#7B7D80] font-normal">
                                                Facção
                                            </th>

                                            <th className="w-1/3 py-3 border-r border-[#7B7D80] font-normal">
                                                Operação
                                            </th>

                                            <th className="w-1/3 rounded-tr-[10px] py-3 font-normal">
                                                Preço Unitário
                                            </th>
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
                                                        ? `R$ ${Number(preco)
                                                              .toFixed(2)
                                                              .replace(".", ",")}`
                                                        : "-";

                                                const isLastRow =
                                                    index === parceirosFiltrados.length - 1;

                                                return (
                                                    <tr
                                                        key={vinculo.id || index}
                                                        className="odd:bg-[#FFFFFF] even:bg-[#F4F4F4]"
                                                    >
                                                        {/* FACÇÃO */}
                                                        <td
                                                            className={`
                                    w-1/3
                                    py-3
                                    border-l border-[#D9D9D9]
                                    border-r border-r-[#7B7D80]
                                    text-[#4696AD]
                                    ${
                                        isLastRow
                                            ? "rounded-bl-[10px] border-b border-[#D9D9D9]"
                                            : ""
                                    }
                                `}
                                                        >
                                                            {nome}
                                                        </td>

                                                        {/* OPERAÇÃO */}
                                                        <td
                                                            className={`
                                    w-1/3
                                    py-3
                                    border-r border-[#7B7D80]
                                    ${isLastRow ? "border-b border-b-[#D9D9D9]" : ""}
                                `}
                                                        >
                                                            <span className="text-[#D3D3D3]">
                                                                {operacao}
                                                            </span>
                                                        </td>

                                                        {/* PREÇO UNITÁRIO */}
                                                        <td
                                                            className={`
                                    w-1/3
                                    py-3
                                    border-r border-[#D9D9D9]
                                    text-[#4696AD]
                                    ${
                                        isLastRow
                                            ? "rounded-br-[10px] border-b border-[#D9D9D9]"
                                            : ""
                                    }
                                `}
                                                        >
                                                            {precoFormatado}
                                                        </td>
                                                    </tr>
                                                );
                                            })
                                        ) : (
                                            <tr>
                                                <td
                                                    colSpan="3"
                                                    className="
                            rounded-bl-[10px]
                            rounded-br-[10px]
                            border-l
                            border-r
                            border-b
                            border-[#D9D9D9]
                            py-4
                            text-center
                            text-[13px]
                            text-[#888]
                        "
                                                >
                                                    Nenhuma facção vinculada a esta ficha.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>

                            {/* Relatório de acabamento */}
                            {isUltimaEtapa && (
                                <RelatorioDeAcabamento
                                    defeitoCostura={relatorioAcabamento.defeitoCostura}
                                    defeitoTecido={relatorioAcabamento.defeitoTecido}
                                    retiradas={relatorioAcabamento.retiradas}
                                    sobras={relatorioAcabamento.sobras}
                                    readonly
                                    responsivo
                                />
                            )}

                            <div className="relative bg-[#F4F4F4] border border-[#D9D9D9] rounded-[14px] p-5 pt-5 mt-6">
                                <span className="absolute -top-[12px] left-4 bg-gradient-to-b from-white via-white via-[35%] to-[#F4F4F4] px-3 py-0.5 text-[15px] font-normal text-[#898C8F] leading-none">
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
                                                    <span className="font-bold text-[#B0B4B8]">
                                                        {qtd} {unidade}
                                                    </span>{" "}
                                                    <span className="text-[#B0B4B8] font-normal">
                                                        de {nome}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-[13px] text-[#898C8F] font-light px-2 pt-1">
                                        Nenhum material cadastrado.
                                    </p>
                                )}
                            </div>
                        </>
                    )}
                </div>

                <div className="flex shrink-0 items-center gap-2.5 border-t border-[#EEEEEE] px-4 pb-4 pt-3 shadow-[0_-6px_16px_rgba(0,0,0,0.06)] md:justify-between md:gap-3 md:px-8 md:py-5 md:shadow-none lg:border-0">
                    <button
                        type="button"
                        onClick={() => setModalImpressaoAberto(true)}
                        disabled={loading}
                        className="flex h-[52px] w-[52px] shrink-0 items-center justify-center rounded-full bg-[#A9E2F2] shadow-sm transition-colors hover:bg-[#A2DCED] focus:outline-none md:h-12 md:w-[72px] lg:h-[39px] lg:w-[71px]"
                    >
                        <img
                            src="/impressora-azul.png"
                            alt="Imprimir"
                            className="w-[20px] h-[20px] object-contain"
                        />
                    </button>

                    <div className="flex min-w-0 flex-1 md:flex-none">
                        <button
                            onClick={() => setModalEdicaoAberto(true)}
                            className="h-[52px] w-full rounded-full border border-[#4696AD] bg-[#F3F4FA] px-8 text-base text-[#4696AD] transition-colors hover:bg-[#F3FBFC] md:h-12 md:w-[180px] md:text-sm lg:h-[39px] lg:w-auto"
                        >
                            Editar Ficha
                        </button>
                    </div>
                </div>
            </div>

            <OpcoesImpressaoModal
                isSobDemanda={ficha?.fabrico?.fabricacao_sob_demanda !== false}
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

            {modalEdicaoAberto && (
                <EdicaoFichaTecnicaModal
                    isOpen={modalEdicaoAberto}
                    fichaId={fichaId}
                    dadosFicha={ficha}
                    onClose={() => setModalEdicaoAberto(false)}
                    onSuccess={async () => {
                        await Promise.all([carregarDados(), onFichaAtualizada?.()]);
                    }}
                />
            )}

            {ficha && (
                <>
                    <FichaTecnicaPrintView
                        dadosFicha={ficha}
                        fichaId={fichaId}
                        referencia={referenciaCliente}
                        aviamentosProduto={aviamentosProduto}
                    />
                    <NotaDeSaidaPrintView
                        ficha={ficha}
                        referenciaCliente={referenciaCliente}
                        forceVisibleForPdf={Boolean(
                            ficha?.fabrico?.id === 3 || ficha?.fabrico_id === 3,
                        )}
                    />
                </>
            )}
        </div>
    );
}
