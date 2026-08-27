import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
    Bar,
    BarChart,
    CartesianGrid,
    Cell,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { getProductionSeries } from "../../services/dashboardService";
import { SkeletonBox } from "../geral/Loading";

const GREEN = "#D7FE65";
const RED = "#D75757";
const MIN_INTERVALS = 4;
const MAX_INTERVALS = 14;
const INTERVAL_MIN_WIDTH = 68;
const Y_AXIS_WIDTH = 64;
const numberFormatter = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });

const INDICATORS = {
    production: { label: "Produção" },
    mixed: { label: "Produção/Perdas" },
    losses: { label: "Perdas" },
};

const PERIODS = [
    { value: "semanal", label: "Semanal" },
    { value: "mensal", label: "Mensal" },
    { value: "trimestral", label: "Trimestral" },
    { value: "anual", label: "Anual" },
];

function ChartSkeleton() {
    return (
        <div className="mt-3 flex min-h-0 flex-1 items-end gap-2 px-2 sm:gap-2.5 sm:px-8">
            {[42, 60, 48, 75, 68, 88, 72].map((height, index) => (
                <div key={index} className="flex flex-1 flex-col items-center justify-end gap-3">
                    <SkeletonBox
                        className="w-full max-w-[64px] rounded-[10px]"
                        style={{ height: `${height}%` }}
                    />
                    <SkeletonBox className="h-3 w-full max-w-[54px] rounded-md" />
                </div>
            ))}
        </div>
    );
}

function CustomTooltip({ active, payload, label, indicator }) {
    if (!active || !payload?.length) return null;
    const point = payload[0]?.payload;
    if (!point) return null;

    return (
        <div className="min-w-[180px] rounded-xl border border-[#E6E6E6] bg-white p-3 text-xs shadow-lg">
            <p className="mb-2 font-medium text-[#404040]">{label}</p>
            {indicator !== "losses" && (
                <p className="flex justify-between gap-5 text-[#7B7D80]">
                    <span>Produção total</span>
                    <strong className="font-medium">
                        {numberFormatter.format(point.production)}
                    </strong>
                </p>
            )}
            {indicator === "mixed" && (
                <p className="flex justify-between gap-5 text-[#7B7D80]">
                    <span>Aproveitadas</span>
                    <strong className="font-medium">
                        {numberFormatter.format(point.netProduction)}
                    </strong>
                </p>
            )}
            {indicator !== "production" && (
                <p className="flex justify-between gap-5 text-[#D75757]">
                    <span>Perdas</span>
                    <strong className="font-medium">{numberFormatter.format(point.losses)}</strong>
                </p>
            )}
        </div>
    );
}

function ChartError({ onRetry }) {
    return (
        <div className="flex min-h-0 flex-1 flex-col items-center justify-center text-center">
            <p className="text-sm text-[#7B7D80]">
                Não foi possível carregar o gráfico de produção.
            </p>
            <button
                type="button"
                onClick={onRetry}
                className="mt-3 rounded-full bg-[#A9E2F2] px-5 py-2 text-sm text-[#4696AD] hover:bg-[#9AD9EB]"
            >
                Tentar novamente
            </button>
        </div>
    );
}

function DashboardSelect({ label, value, onChange, options, className = "" }) {
    const [open, setOpen] = useState(false);
    const containerRef = useRef(null);
    const selectedOption = options.find((option) => option.value === value) ?? options[0];

    useEffect(() => {
        if (!open) return undefined;

        const handlePointerDown = (event) => {
            if (!containerRef.current?.contains(event.target)) setOpen(false);
        };
        const handleKeyDown = (event) => {
            if (event.key === "Escape") setOpen(false);
        };

        document.addEventListener("mousedown", handlePointerDown);
        document.addEventListener("keydown", handleKeyDown);

        return () => {
            document.removeEventListener("mousedown", handlePointerDown);
            document.removeEventListener("keydown", handleKeyDown);
        };
    }, [open]);

    return (
        <div ref={containerRef} className={`relative min-w-0 ${className}`}>
            <button
                type="button"
                aria-label={label}
                aria-haspopup="listbox"
                aria-expanded={open}
                onClick={() => setOpen((current) => !current)}
                className="flex h-[33px] w-full items-center gap-2 rounded-[10px] border-[0.5px] border-[#898C8F] bg-white pl-4 pr-3 text-left text-xs font-normal text-[#7B7D80] outline-none transition-colors hover:bg-[#F4F4F4] focus-visible:ring-2 focus-visible:ring-[#D7FE65]"
            >
                <span className="min-w-0 flex-1 truncate">{selectedOption?.label}</span>
                <svg
                    viewBox="0 0 20 20"
                    aria-hidden="true"
                    className={`h-3 w-3 shrink-0 fill-none stroke-[#7B7D80] stroke-[1.7] transition-transform ${open ? "rotate-180" : ""}`}
                >
                    <path strokeLinecap="round" strokeLinejoin="round" d="m6 8 4 4 4-4" />
                </svg>
            </button>

            {open && (
                <div
                    role="listbox"
                    aria-label={label}
                    className="absolute inset-x-0 top-[calc(100%+4px)] z-50 overflow-hidden rounded-[8px] border-[0.5px] border-[#898C8F] bg-white py-0.5 shadow-[0_4px_8px_rgba(0,0,0,0.08)]"
                >
                    {options.map((option) => {
                        const selected = option.value === value;

                        return (
                            <button
                                key={option.value}
                                type="button"
                                role="option"
                                aria-selected={selected}
                                onClick={() => {
                                    onChange(option.value);
                                    setOpen(false);
                                }}
                                className={`relative flex min-h-[34px] w-full items-center px-4 py-2 text-left text-xs font-normal text-[#7B7D80] transition-colors hover:bg-[#F4F4F4] focus-visible:bg-[#F4F4F4] focus-visible:outline-none ${
                                    selected
                                        ? "before:absolute before:inset-y-0 before:left-0 before:w-[4px] before:bg-[#D7FE65]"
                                        : ""
                                }`}
                            >
                                {option.label}
                            </button>
                        );
                    })}
                </div>
            )}
        </div>
    );
}

export default function ProductionChart({ refreshKey = 0, fetchSeries = getProductionSeries }) {
    const sectionRef = useRef(null);
    const [indicator, setIndicator] = useState("production");
    const [period, setPeriod] = useState("semanal");
    const [intervalCount, setIntervalCount] = useState(7);
    const [series, setSeries] = useState(null);
    const [loadedQuery, setLoadedQuery] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [retryKey, setRetryKey] = useState(0);

    useEffect(() => {
        const section = sectionRef.current;
        if (!section || typeof ResizeObserver === "undefined") return undefined;

        const updateIntervalCount = ([entry]) => {
            const plotWidth = Math.max(0, entry.contentRect.width - Y_AXIS_WIDTH);
            const nextCount = Math.min(
                MAX_INTERVALS,
                Math.max(MIN_INTERVALS, Math.floor(plotWidth / INTERVAL_MIN_WIDTH)),
            );
            setIntervalCount((current) => (current === nextCount ? current : nextCount));
        };

        const observer = new ResizeObserver(updateIntervalCount);
        observer.observe(section);

        return () => observer.disconnect();
    }, []);

    const loadSeries = useCallback(
        async (signal) => {
            setLoading(true);
            setError(false);
            try {
                const result = await fetchSeries(period, intervalCount);
                if (!signal.cancelled) {
                    setSeries(result);
                    setLoadedQuery({ period, intervalCount });
                }
            } catch (requestError) {
                console.error("Erro ao carregar série de produção", requestError);
                if (!signal.cancelled) setError(true);
            } finally {
                if (!signal.cancelled) setLoading(false);
            }
        },
        [fetchSeries, intervalCount, period],
    );

    useEffect(() => {
        const signal = { cancelled: false };
        loadSeries(signal);
        return () => {
            signal.cancelled = true;
        };
    }, [loadSeries, refreshKey, retryKey]);

    const chartData = useMemo(() => {
        if (Array.isArray(series)) return series;
        return Array.isArray(series?.data) ? series.data : [];
    }, [series]);
    const hasData =
        typeof series?.hasData === "boolean"
            ? series.hasData
            : chartData.some(
                  (item) => Number(item.production ?? 0) > 0 || Number(item.losses ?? 0) > 0,
              );
    const requestedPeriodLabel = PERIODS.find((option) => option.value === period)?.label ?? period;
    const loadedPeriodLabel =
        PERIODS.find((option) => option.value === loadedQuery?.period)?.label ??
        loadedQuery?.period;
    const showingAnotherPeriod = Boolean(series && loadedQuery) && loadedQuery.period !== period;

    return (
        <section
            ref={sectionRef}
            className="flex h-[370px] min-w-0 flex-col rounded-[24px] bg-white px-3 py-4 sm:h-[380px] sm:pb-[17px] sm:pl-[37px] sm:pr-[30px] sm:pt-5"
            aria-labelledby="production-chart-title"
            aria-busy={loading}
        >
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                <div className="flex items-center gap-2 text-[#404040]">
                    <svg
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                        className="h-5 w-5 fill-none stroke-current stroke-[1.4]"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M4 19V5M4 19h16M7 15l4-5 3 3 5-7"
                        />
                    </svg>
                    <h2 id="production-chart-title" className="text-sm font-normal sm:text-base">
                        Gráfico de desempenho
                    </h2>
                </div>

                <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-[13px]">
                    <DashboardSelect
                        label="Indicador"
                        value={indicator}
                        onChange={setIndicator}
                        options={Object.entries(INDICATORS).map(([value, item]) => ({
                            value,
                            label: item.label,
                        }))}
                        className="sm:w-[148px]"
                    />
                    <DashboardSelect
                        label="Período"
                        value={period}
                        onChange={setPeriod}
                        options={PERIODS}
                        className="sm:w-[120px]"
                    />
                </div>
            </div>

            {loading && !series ? (
                <ChartSkeleton />
            ) : error && !series ? (
                <ChartError onRetry={() => setRetryKey((key) => key + 1)} />
            ) : (
                <div
                    className="-mb-1 mt-3 min-h-0 flex-1 overflow-x-auto pb-1 scrollbar-sutil sm:-ml-5 sm:-mr-1 sm:overflow-visible"
                    tabIndex={0}
                    aria-label="Gráfico com rolagem horizontal em telas menores"
                >
                    <div className="relative h-full min-w-[500px] sm:min-w-0">
                        <ResponsiveContainer width="100%" height="100%">
                            <BarChart
                                data={chartData}
                                margin={{ top: 18, right: 0, left: 0, bottom: 2 }}
                                barCategoryGap="4%"
                            >
                                <CartesianGrid vertical={false} stroke="#E6E7E9" />
                                <XAxis
                                    dataKey="label"
                                    axisLine={false}
                                    tickLine={false}
                                    interval={0}
                                    tick={{ fill: "#7B7D80", fontSize: 10 }}
                                    dy={8}
                                />
                                <YAxis
                                    axisLine={false}
                                    tickLine={false}
                                    width={64}
                                    tick={{ fill: "#7B7D80", fontSize: 10 }}
                                    tickFormatter={(value) => numberFormatter.format(value)}
                                    allowDecimals={false}
                                />
                                <Tooltip
                                    cursor={{ fill: "rgba(244,244,244,0.5)" }}
                                    content={<CustomTooltip indicator={indicator} />}
                                />
                                {indicator === "production" && (
                                    <Bar
                                        dataKey="production"
                                        name="Produção"
                                        fill={GREEN}
                                        radius={[10, 10, 10, 10]}
                                        maxBarSize={64}
                                    />
                                )}
                                {indicator === "mixed" && (
                                    <>
                                        <Bar
                                            dataKey="netProduction"
                                            name="Produção aproveitada"
                                            stackId="production"
                                            fill={GREEN}
                                            maxBarSize={64}
                                        >
                                            {chartData.map((item) => (
                                                <Cell
                                                    key={`production-${item.key}`}
                                                    radius={
                                                        Number(item.losses ?? 0) > 0
                                                            ? [0, 0, 10, 10]
                                                            : [10, 10, 10, 10]
                                                    }
                                                />
                                            ))}
                                        </Bar>
                                        <Bar
                                            dataKey="losses"
                                            name="Perdas"
                                            stackId="production"
                                            fill={RED}
                                            maxBarSize={64}
                                        >
                                            {chartData.map((item) => (
                                                <Cell
                                                    key={`losses-${item.key}`}
                                                    radius={
                                                        Number(item.netProduction ?? 0) > 0
                                                            ? [10, 10, 0, 0]
                                                            : [10, 10, 10, 10]
                                                    }
                                                />
                                            ))}
                                        </Bar>
                                    </>
                                )}
                                {indicator === "losses" && (
                                    <Bar
                                        dataKey="losses"
                                        name="Perdas"
                                        fill={RED}
                                        radius={[10, 10, 10, 10]}
                                        maxBarSize={64}
                                    />
                                )}
                            </BarChart>
                        </ResponsiveContainer>

                        {!hasData && (
                            <div className="pointer-events-none absolute inset-x-14 top-1/2 -translate-y-1/2 rounded-xl bg-white/90 px-4 py-3 text-center shadow-sm">
                                <p className="text-sm text-[#7B7D80]">
                                    Nenhuma produção neste período.
                                </p>
                                <p className="mt-1 text-xs font-light text-[#A0A2A5]">
                                    Todos os intervalos estão em zero.
                                </p>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {loading && series && (
                <p className="mt-2 self-end text-xs text-[#7B7D80]" aria-live="polite">
                    {showingAnotherPeriod
                        ? `Carregando ${requestedPeriodLabel}. Exibindo ${loadedPeriodLabel} temporariamente.`
                        : "Atualizando dados…"}
                </p>
            )}

            {error && series && (
                <div
                    className="mt-2 flex w-full items-center justify-end gap-2 text-xs text-[#D75757]"
                    aria-live="polite"
                >
                    <span>
                        {showingAnotherPeriod
                            ? `Não foi possível carregar ${requestedPeriodLabel}. Exibindo ${loadedPeriodLabel}.`
                            : "Atualização falhou. Exibindo os últimos dados disponíveis."}
                    </span>
                    <button
                        type="button"
                        onClick={() => setRetryKey((key) => key + 1)}
                        className="shrink-0 underline underline-offset-2"
                    >
                        Tentar novamente
                    </button>
                </div>
            )}
        </section>
    );
}
