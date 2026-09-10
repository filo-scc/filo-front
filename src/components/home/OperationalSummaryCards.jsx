import { useCallback, useEffect, useState } from "react";
import { getOperationalSummary } from "../../services/dashboardService";
import { SkeletonBox } from "../geral/Loading";

const numberFormatter = new Intl.NumberFormat("pt-BR", { maximumFractionDigits: 0 });

function SummaryCardSkeleton() {
    return (
        <div className="flex h-[88px] min-w-0 flex-col justify-between rounded-[18px] bg-white px-2.5 py-3 sm:h-[108px] sm:rounded-[24px] sm:px-8 sm:py-[19px]">
            <div className="flex min-w-0 items-start gap-1.5 sm:items-center sm:gap-2">
                <SkeletonBox className="h-4 w-4 shrink-0 rounded sm:h-5 sm:w-5 sm:rounded-md" />
                <SkeletonBox className="h-6 min-w-0 flex-1 rounded-md sm:h-5 sm:max-w-52 sm:rounded-lg" />
            </div>
            <SkeletonBox className="h-4 w-4/5 rounded-lg sm:h-8 sm:w-40 sm:rounded-xl" />
        </div>
    );
}

function RetryState({ onRetry }) {
    return (
        <div className="col-span-full flex min-h-[88px] flex-col items-center justify-center rounded-[18px] border border-red-100 bg-white px-4 text-center sm:min-h-[108px] sm:rounded-[24px]">
            <p className="text-xs text-[#7B7D80] sm:text-sm">
                Não foi possível carregar o resumo operacional.
            </p>
            <button
                type="button"
                onClick={onRetry}
                className="mt-2 rounded-full bg-[#A9E2F2] px-4 py-1.5 text-xs text-[#4696AD] transition-colors hover:bg-[#9AD9EB] sm:mt-3 sm:px-5 sm:py-2 sm:text-sm"
            >
                Tentar novamente
            </button>
        </div>
    );
}

function PiecesIcon() {
    return (
        <img
            src="/camisa_cinza.png"
            alt=""
            aria-hidden="true"
            className="h-4 w-4 object-contain opacity-90 sm:h-5 sm:w-5"
        />
    );
}

function OrdersIcon() {
    return (
        <img
            src="/pedidos_andamento.png"
            alt=""
            aria-hidden="true"
            className="h-4 w-4 object-contain opacity-90 sm:h-5 sm:w-5"
        />
    );
}

function ClockIcon() {
    return (
        <img
            src="/relogio.png"
            alt=""
            aria-hidden="true"
            className="h-4 w-4 object-contain opacity-90 sm:h-5 sm:w-5"
        />
    );
}

function SummaryCard({ icon, title, value, suffix }) {
    return (
        <article className="flex h-[88px] min-w-0 flex-col justify-between rounded-[18px] bg-white px-2.5 py-3 sm:h-[108px] sm:rounded-[24px] sm:px-8 sm:py-[19px]">
            <div className="flex min-w-0 items-start gap-1.5 text-[#404040] sm:items-center sm:gap-2">
                <span className="shrink-0">{icon}</span>
                <h2 className="line-clamp-3 text-[9px] font-normal leading-[10px] sm:line-clamp-1 sm:text-sm sm:leading-normal">
                    {title}
                </h2>
            </div>
            <p className="whitespace-nowrap text-[18px] font-normal leading-none text-[#7B7D80] sm:text-[26px] sm:leading-normal">
                {numberFormatter.format(value)}
                <span className="ml-1 text-[8px] sm:text-[20px]">{suffix}</span>
            </p>
        </article>
    );
}

export default function OperationalSummaryCards({
    refreshKey = 0,
    fetchSummary = getOperationalSummary,
}) {
    const [summary, setSummary] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);
    const [retryKey, setRetryKey] = useState(0);

    const loadSummary = useCallback(
        async (signal) => {
            setLoading(true);
            setError(false);
            try {
                const result = await fetchSummary();
                if (!signal.cancelled) setSummary(result);
            } catch (requestError) {
                console.error("Erro ao carregar resumo operacional", requestError);
                if (!signal.cancelled) setError(true);
            } finally {
                if (!signal.cancelled) setLoading(false);
            }
        },
        [fetchSummary],
    );

    useEffect(() => {
        const signal = { cancelled: false };
        loadSummary(signal);
        return () => {
            signal.cancelled = true;
        };
    }, [loadSummary, refreshKey, retryKey]);

    if (loading && !summary) {
        return (
            <section
                className="grid grid-cols-3 gap-2 sm:gap-[13px]"
                aria-label="Carregando resumo operacional"
            >
                {[0, 1, 2].map((item) => (
                    <SummaryCardSkeleton key={item} />
                ))}
            </section>
        );
    }

    if (error && !summary) {
        return (
            <section className="grid grid-cols-1 gap-4" aria-live="polite">
                <RetryState onRetry={() => setRetryKey((key) => key + 1)} />
            </section>
        );
    }

    const entitySingular = summary?.terminology?.entitySingular ?? "Pedido";
    const entityPlural = summary?.terminology?.entityPlural ?? "Pedidos";
    const inProgressCount = summary?.inProgressCount ?? 0;
    const overdueCount = summary?.overdueCount ?? 0;

    return (
        <section
            className="grid grid-cols-3 gap-2 sm:gap-[13px]"
            aria-label="Resumo operacional"
            aria-busy={loading}
        >
            <SummaryCard
                icon={<PiecesIcon />}
                title="Média semanal de produção"
                value={summary?.weeklyAverageProducedPieces ?? 0}
                suffix="peças"
            />
            <SummaryCard
                icon={<OrdersIcon />}
                title={summary?.terminology?.inProgressLabel ?? "Pedidos em andamento"}
                value={inProgressCount}
                suffix={inProgressCount === 1 ? entitySingular : entityPlural}
            />
            <SummaryCard
                icon={<ClockIcon />}
                title={summary?.terminology?.overdueLabel ?? "Pedidos em atraso"}
                value={overdueCount}
                suffix={overdueCount === 1 ? entitySingular : entityPlural}
            />
            {error && (
                <button
                    type="button"
                    onClick={() => setRetryKey((key) => key + 1)}
                    className="col-span-full justify-self-end text-xs text-[#D75757] underline underline-offset-2"
                >
                    Atualização falhou. Tentar novamente
                </button>
            )}
        </section>
    );
}
