export function SkeletonBox({ className = "", ...props }) {
    return <div className={`bg-[#E8E9F0] rounded-[12px] animate-pulse ${className}`} {...props} />;
}

export function InlineLoading({ label = "Carregando", className = "" }) {
    return (
        <span
            className={`inline-flex items-center justify-center gap-2 text-[#4696AD] font-Outfit ${className}`}
            aria-live="polite"
        >
            <span className="h-2 w-2 rounded-full bg-[#4696AD] animate-pulse" />
            <span className="animate-filo-text-shimmer">{label}</span>
        </span>
    );
}

export function ReferenceCardsSkeleton({ count = 4, label = "Buscando produtos" }) {
    return (
        <div className="grid grid-cols-4 gap-4 py-1">
            {[...Array(count)].map((_, index) => (
                <div key={index} className="rounded-[16px] p-1 flex flex-col gap-1 bg-[#D7D7D7]">
                    <SkeletonBox className="h-[135px] rounded-[13px] bg-white/80" />
                    <div className="flex items-center justify-between px-1.5 p-1">
                        <div className="flex items-center gap-1">
                            <SkeletonBox className="h-[16px] w-[16px] rounded-[5px]" />
                            <SkeletonBox className="h-[12px] w-20 rounded-[6px]" />
                        </div>
                        <SkeletonBox className="h-[20px] w-[20px] rounded-[6px]" />
                    </div>
                </div>
            ))}
            {label ? (
                <div className="col-span-4 flex justify-center pt-2">
                    <InlineLoading label={label} className="text-sm" />
                </div>
            ) : null}
        </div>
    );
}

export function DropdownOptionsSkeleton({ rows = 3 }) {
    return (
        <div className="py-1">
            {[...Array(rows)].map((_, index) => (
                <div
                    key={index}
                    className="flex h-[48px] items-center border-l-[3px] border-transparent px-3"
                >
                    <SkeletonBox
                        className={`h-[14px] rounded-[7px] ${
                            index % 3 === 0 ? "w-32" : index % 3 === 1 ? "w-24" : "w-28"
                        }`}
                    />
                </div>
            ))}
        </div>
    );
}

export function SelectionListSkeleton({ rows = 6 }) {
    return (
        <div className="grid grid-cols-2 gap-3">
            {[...Array(rows)].map((_, index) => (
                <SkeletonBox key={index} className="h-[54px] rounded-[14px]" />
            ))}
        </div>
    );
}

export function ModalTableRowsSkeleton({ rows = 4 }) {
    return (
        <div className="max-h-[360px] overflow-y-auto overflow-x-hidden scrollbar-sutil rounded-b-[10px]">
            {[...Array(rows)].map((_, rowIndex) => (
                <div
                    key={rowIndex}
                    className={`grid grid-cols-3 px-6 py-5 items-center border-x-[0.5px] border-[#D9D9D9] ${
                        rowIndex % 2 === 0 ? "bg-white" : "bg-[#F4F4F4]"
                    } ${rowIndex === rows - 1 ? "border-b rounded-b-[10px]" : ""}`}
                >
                    {[0, 1, 2].map((cellIndex) => (
                        <div key={cellIndex} className="flex justify-center">
                            <SkeletonBox
                                className={`h-[16px] rounded-[8px] ${
                                    cellIndex === 0
                                        ? "w-[120px]"
                                        : cellIndex === 1
                                          ? "w-[76px]"
                                          : "w-[109px]"
                                }`}
                            />
                        </div>
                    ))}
                </div>
            ))}
        </div>
    );
}

export function LoadingButton({
    loading,
    loadingText = "Carregando...",
    children,
    className = "",
    disabled,
    ...props
}) {
    return (
        <button
            {...props}
            disabled={disabled || loading}
            aria-busy={loading}
            className={`${className} disabled:opacity-60 disabled:cursor-not-allowed`}
        >
            {loading ? (
                <span className="inline-flex items-center justify-center gap-2 text-current">
                    <span className="h-2 w-2 rounded-full bg-current animate-pulse" />
                    <span>{loadingText}</span>
                </span>
            ) : (
                children
            )}
        </button>
    );
}

function TextCellSkeleton({ className = "px-6 text-[14px]", width = "w-24" }) {
    return (
        <td className={className}>
            <SkeletonBox className={`inline-block h-[16px] ${width} rounded-[8px]`} />
        </td>
    );
}

function PhoneCellSkeleton({ className = "px-6 text-[14px]" }) {
    return (
        <td className={className}>
            <span className="inline-flex w-[140px] justify-center whitespace-nowrap">
                <SkeletonBox className="h-[16px] w-[112px] rounded-[8px]" />
            </span>
        </td>
    );
}

function StatusCellSkeleton({ className = "px-6" }) {
    return (
        <td className={className}>
            <div className="flex justify-center">
                <SkeletonBox className="w-[109px] h-[19px] rounded-[10px]" />
            </div>
        </td>
    );
}

function OptionsCellSkeleton({ className = "px-6" }) {
    return (
        <td className={className}>
            <div className="relative flex justify-center items-center">
                <div className="w-10 h-8 flex items-center justify-center">
                    <SkeletonBox className="w-5 h-5 rounded-[6px]" />
                </div>
            </div>
        </td>
    );
}

export function ClientesTableSkeleton({ rows = 5 }) {
    return (
        <>
            {[...Array(rows)].map((_, index) => {
                const isPar = index % 2 === 0;

                return (
                    <tr
                        key={index}
                        className={`h-[64px] border-b last:border-0 ${
                            isPar ? "bg-white" : "bg-[#F4F4F4]"
                        }`}
                    >
                        <TextCellSkeleton width="w-28" />
                        <TextCellSkeleton width="w-24" />
                        <PhoneCellSkeleton />
                        <StatusCellSkeleton />
                        <OptionsCellSkeleton />
                    </tr>
                );
            })}
        </>
    );
}

export function ParceirosTableSkeleton({ rows = 5 }) {
    return (
        <>
            {[...Array(rows)].map((_, index) => {
                const isPar = index % 2 === 0;

                return (
                    <tr
                        key={index}
                        className={`h-[64px] border-b last:border-0 ${
                            isPar ? "bg-white" : "bg-[#F4F4F4]"
                        }`}
                    >
                        <TextCellSkeleton width="w-28" />
                        <StatusCellSkeleton className="px-6 text-[14px]" />
                        <TextCellSkeleton width="w-24" />
                        <TextCellSkeleton width="w-20" />
                        <PhoneCellSkeleton />
                        <OptionsCellSkeleton />
                    </tr>
                );
            })}
        </>
    );
}

export function PedidosTableSkeleton({ rows = 5, mostrarCliente = true }) {
    return (
        <>
            {[...Array(rows)].map((_, index) => (
                <tr
                    key={index}
                    className={`border-b border-[#E8E8E8] last:border-none text-center ${
                        index % 2 === 1 ? "bg-[#E8E8E8]" : ""
                    }`}
                >
                    <TextCellSkeleton className="py-4 px-6" width="w-10" />
                    {mostrarCliente && <TextCellSkeleton className="py-4 px-6" width="w-28" />}
                    <TextCellSkeleton className="py-4 px-6" width="w-12" />
                    <TextCellSkeleton className="py-4 px-6" width="w-20" />
                    <TextCellSkeleton className="py-4 px-6" width="w-14" />
                    <TextCellSkeleton className="py-4 px-6" width="w-14" />
                    <OptionsCellSkeleton className="py-4 px-6" />
                </tr>
            ))}
        </>
    );
}

export function ProductGridSkeleton({ count = 8 }) {
    return (
        <>
            {[...Array(count)].map((_, index) => (
                <div
                    key={index}
                    className="w-full bg-[#F3F4FA] rounded-[16px] p-[6px] flex flex-col"
                >
                    <SkeletonBox className="w-full h-[155px] rounded-t-[14px] rounded-b-[4px]" />
                    <div className="flex flex-col px-1 pt-1.5 pb-1">
                        <SkeletonBox className="h-[12px] w-24 rounded-[6px]" />
                        <SkeletonBox className="h-[12px] w-20 rounded-[6px]" />
                    </div>
                </div>
            ))}
        </>
    );
}

function DetailFieldSkeleton({ className = "" }) {
    return (
        <div className={className}>
            <SkeletonBox className="h-[20px] w-32 rounded-[8px]" />
            <SkeletonBox className="mt-2 h-[16px] w-28 rounded-[8px]" />
        </div>
    );
}

function ReferenceTableSkeleton({ rows = 2, showActions = false }) {
    return (
        <section>
            <SkeletonBox className="h-[22px] w-64 mb-4 rounded-[8px]" />
            <div className="flex flex-col w-full">
                <div className={`flex flex-row items-stretch w-full ${showActions ? "gap-4" : ""}`}>
                    <div
                        className={`${showActions ? "flex-1" : "w-full"} rounded-t-[10px] border border-[#D9D9D9] overflow-hidden`}
                    >
                        <div className="grid grid-cols-[180px_1fr_1fr_1fr] h-[64px] bg-[#D9D9D9] items-center">
                            <div />
                            {[0, 1, 2].map((item) => (
                                <div
                                    key={item}
                                    className="h-full flex items-center justify-center border-l border-[#D9D9D9]"
                                >
                                    <SkeletonBox className="h-[16px] w-28 rounded-[8px] bg-white/70" />
                                </div>
                            ))}
                        </div>
                    </div>
                    {showActions ? <div className="w-[30px] shrink-0" /> : null}
                </div>
                {[...Array(rows)].map((_, rowIndex) => (
                    <div
                        key={rowIndex}
                        className={`flex flex-row items-center w-full ${showActions ? "gap-4" : ""}`}
                    >
                        <div
                            className={`${showActions ? "flex-1" : "w-full"} grid grid-cols-[180px_1fr_1fr_1fr] h-[152px] border-x border-b border-[#D9D9D9] ${
                                rowIndex === rows - 1 ? "rounded-b-[10px] overflow-hidden" : ""
                            }`}
                        >
                            <div className="flex items-center justify-center">
                                <SkeletonBox className="h-[115px] w-[158px] rounded-[10px]" />
                            </div>
                            {[0, 1, 2].map((item) => (
                                <div
                                    key={item}
                                    className="flex items-center justify-center border-l border-[#D9D9D9]"
                                >
                                    <SkeletonBox className="h-[16px] w-28 rounded-[8px]" />
                                </div>
                            ))}
                        </div>
                        {showActions ? (
                            <div className="w-[30px] shrink-0 flex flex-col items-center gap-3">
                                <SkeletonBox className="h-[24px] w-[24px] rounded-[6px]" />
                                <SkeletonBox className="h-[24px] w-[24px] rounded-[6px]" />
                            </div>
                        ) : null}
                    </div>
                ))}
            </div>
            <SkeletonBox className="mt-3 h-[48px] w-full rounded-[10px]" />
        </section>
    );
}

export function DetailPageSkeleton({ rows = 2, variant = "cliente" }) {
    if (variant === "parceiro") {
        return (
            <div className="mt-8 space-y-8">
                <section className="mb-6">
                    <div className="flex">
                        <div className="w-[250px] shrink-0">
                            <SkeletonBox className="h-[24px] w-44 mb-4 rounded-[8px]" />
                            <DetailFieldSkeleton />
                        </div>
                        <div className="flex-1">
                            <SkeletonBox className="h-[24px] w-36 mb-4 rounded-[8px]" />
                            <div className="flex gap-6">
                                <DetailFieldSkeleton className="w-[200px] shrink-0" />
                                <DetailFieldSkeleton className="w-[250px] shrink-0" />
                                <DetailFieldSkeleton className="ml-10" />
                            </div>
                        </div>
                    </div>
                </section>

                <section>
                    <SkeletonBox className="h-[24px] w-28 mb-4 rounded-[8px]" />
                    <div className="flex flex-wrap gap-y-8 gap-x-20">
                        {[0, 1, 2, 3].map((item) => (
                            <DetailFieldSkeleton
                                key={item}
                                className={
                                    item === 1
                                        ? "min-w-[150px]"
                                        : item === 2
                                          ? "min-w-[60px]"
                                          : "min-w-[120px]"
                                }
                            />
                        ))}
                    </div>
                    <div className="flex flex-wrap gap-y-8 gap-x-20 pt-8">
                        {[0, 1, 2].map((item) => (
                            <DetailFieldSkeleton key={item} />
                        ))}
                    </div>
                </section>

                <section>
                    <SkeletonBox className="h-[24px] w-28 mb-4 rounded-[8px]" />
                    <DetailFieldSkeleton />
                </section>
            </div>
        );
    }

    return (
        <div className="mt-8 space-y-8">
            <section>
                <SkeletonBox className="h-[24px] w-36 mb-4 rounded-[8px]" />
                <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                    {[0, 1, 2, 3].map((item) => (
                        <DetailFieldSkeleton key={item} />
                    ))}
                </div>
            </section>

            <section>
                <SkeletonBox className="h-[24px] w-28 mb-4 rounded-[8px]" />
                <div className="flex flex-wrap gap-y-8 gap-x-20">
                    {[0, 1, 2, 3].map((item) => (
                        <DetailFieldSkeleton
                            key={item}
                            className={
                                item === 1
                                    ? "min-w-[150px]"
                                    : item === 2
                                      ? "min-w-[60px]"
                                      : "min-w-[120px]"
                            }
                        />
                    ))}
                </div>
                <div className="flex flex-wrap gap-y-8 gap-x-20 pt-8">
                    {[0, 1, 2].map((item) => (
                        <DetailFieldSkeleton key={item} />
                    ))}
                </div>
            </section>

            <ReferenceTableSkeleton rows={rows} />
        </div>
    );
}

export function FormPageSkeleton() {
    return (
        <div className="mt-8 space-y-10">
            {[...Array(2)].map((_, sectionIndex) => (
                <section key={sectionIndex}>
                    <SkeletonBox className="h-[28px] w-44 mb-4 rounded-[8px]" />
                    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                        {[...Array(sectionIndex === 0 ? 4 : 6)].map((__, itemIndex) => (
                            <SkeletonBox key={itemIndex} className="h-[39px] rounded-[10px]" />
                        ))}
                    </div>
                </section>
            ))}
            <SkeletonBox className="h-[160px] w-full rounded-[12px]" />
        </div>
    );
}

export function ProductEditPageSkeleton() {
    return (
        <div className="mt-8 flex flex-col min-h-[520px]">
            <div className="flex flex-col xl:flex-row gap-9 xl:gap-10">
                <div className="w-[260px] shrink-0">
                    <SkeletonBox className="h-[24px] w-20 mb-3 rounded-[8px]" />
                    <SkeletonBox className="w-[260px] h-[170px] rounded-[10px]" />
                </div>

                <div className="flex-1 max-w-[780px]">
                    <div className="grid grid-cols-1 md:grid-cols-[220px_220px] gap-x-10 gap-y-6">
                        {[0, 1].map((item) => (
                            <div key={item}>
                                <SkeletonBox className="h-[24px] w-24 mb-3 rounded-[8px]" />
                                <SkeletonBox className="h-[35px] w-full rounded-[10px]" />
                            </div>
                        ))}
                    </div>

                    <div className="mt-7">
                        <SkeletonBox className="h-[24px] w-44 mb-3 rounded-[8px]" />
                        <div className="grid grid-cols-1 md:grid-cols-[220px_220px_220px] gap-x-4 gap-y-5">
                            {[0, 1, 2].map((item) => (
                                <div key={item}>
                                    <SkeletonBox className="h-[13px] w-28 mb-1 rounded-[7px]" />
                                    <SkeletonBox className="h-[39px] w-full rounded-[10px]" />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            <div className="mt-8 w-full">
                <ProductClientsTableSkeleton />
            </div>

            <div className="mt-auto flex justify-between items-center pt-12">
                <SkeletonBox className="h-[39px] w-[147px] rounded-full" />
                <div className="flex gap-4">
                    <SkeletonBox className="h-[39px] w-[189px] rounded-full" />
                    <SkeletonBox className="h-[39px] w-[189px] rounded-full" />
                </div>
            </div>
        </div>
    );
}

function ProductClientsTableSkeleton() {
    return (
        <section className="w-full">
            <SkeletonBox className="h-[24px] w-72 mb-4 rounded-[8px]" />
            <div className="flex flex-col w-full">
                <div className="flex flex-row items-stretch gap-4 w-full">
                    <div className="flex-1 rounded-t-[10px] border border-[#D9D9D9] overflow-hidden">
                        <div className="grid grid-cols-4 bg-[#D9D9D9] h-[52px] items-center">
                            {[0, 1, 2, 3].map((item) => (
                                <div
                                    key={item}
                                    className={`h-full flex items-center justify-center px-4 ${
                                        item > 0 ? "border-l border-[#D9D9D9]" : ""
                                    }`}
                                >
                                    <SkeletonBox className="h-[16px] w-28 rounded-[8px] bg-white/70" />
                                </div>
                            ))}
                        </div>
                    </div>
                    <div className="w-[56px] shrink-0" />
                </div>

                <div className="flex flex-row items-stretch gap-4 w-full">
                    <div className="flex-1 border-l border-r border-b rounded-b-[10px] overflow-hidden border-[#D9D9D9]">
                        <div className="grid grid-cols-4 w-full">
                            <div className="flex items-center justify-center px-4 bg-white">
                                <SkeletonBox className="h-[16px] w-32 rounded-[8px]" />
                            </div>
                            <div className="col-span-3 border-l border-[#D9D9D9]">
                                {[0, 1].map((row) => (
                                    <div
                                        key={row}
                                        className={`grid grid-cols-3 min-h-[64px] items-stretch ${
                                            row % 2 === 0 ? "bg-white" : "bg-[#F4F4F4]"
                                        } ${row !== 1 ? "border-b border-[#D9D9D9]" : ""}`}
                                    >
                                        {[0, 1, 2].map((cell) => (
                                            <div
                                                key={cell}
                                                className={`flex items-center justify-center px-4 ${
                                                    cell > 0 ? "border-l border-[#D9D9D9]" : ""
                                                }`}
                                            >
                                                <SkeletonBox className="h-[16px] w-28 rounded-[8px]" />
                                            </div>
                                        ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    <div className="w-[56px] shrink-0 space-y-10 pt-5">
                        <SkeletonBox className="h-[24px] w-[24px] rounded-[6px]" />
                        <SkeletonBox className="h-[24px] w-[24px] rounded-[6px]" />
                    </div>
                </div>
            </div>
        </section>
    );
}

export function ClientEditPageSkeleton() {
    return (
        <div className="space-y-10">
            <section>
                <SkeletonBox className="h-[24px] w-32 mb-4 rounded-[8px]" />
                <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                    {[0, 1, 2, 3].map((item) => (
                        <SkeletonBox key={item} className="h-[39px] rounded-[10px]" />
                    ))}
                </div>
            </section>

            <section>
                <SkeletonBox className="h-[24px] w-24 mb-4 rounded-[8px]" />
                <div className="grid grid-cols-1 sm:grid-cols-12 gap-4 mb-4">
                    <SkeletonBox className="h-[39px] rounded-[10px] sm:col-span-2" />
                    <SkeletonBox className="h-[39px] rounded-[10px] sm:col-span-5" />
                    <SkeletonBox className="h-[39px] rounded-[10px] sm:col-span-2" />
                    <SkeletonBox className="h-[39px] rounded-[10px] sm:col-span-3" />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                    <SkeletonBox className="h-[39px] rounded-[10px] md:col-span-5" />
                    <SkeletonBox className="h-[39px] rounded-[10px] md:col-span-4" />
                    <SkeletonBox className="h-[39px] rounded-[10px] md:col-span-3" />
                </div>
            </section>

            <ReferenceTableSkeleton rows={2} showActions />

            <div className="flex justify-end pt-2">
                <SkeletonBox className="h-[42px] w-[180px] rounded-full" />
            </div>
        </div>
    );
}
