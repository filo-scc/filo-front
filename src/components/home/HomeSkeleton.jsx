import { SkeletonBox } from "../geral/Loading";

function SkeletonCard({ compact = false }) {
    return (
        <div className="bg-white p-4 rounded-[10px] shadow-sm border border-gray-100 border-l-4 border-l-[#E8E9F0] flex flex-col gap-2 shrink-0">
            <div className="flex justify-between items-start gap-3">
                <SkeletonBox className="h-[18px] w-[145px] rounded-[8px]" />
                <SkeletonBox className="h-[12px] w-[34px] rounded-[6px]" />
            </div>

            <div className="space-y-2">
                <SkeletonBox className="h-[12px] w-[160px] rounded-[6px]" />
                <SkeletonBox className="h-[12px] w-[96px] rounded-[6px]" />
            </div>

            {!compact && (
                <div className="flex justify-between items-center gap-4 pt-1">
                    <SkeletonBox className="h-[12px] w-[104px] rounded-[6px]" />
                    <SkeletonBox className="h-[12px] w-[48px] rounded-[6px]" />
                </div>
            )}
        </div>
    );
}

function SkeletonColumn({ rounded, cardCount }) {
    return (
        <div
            className={`flex max-h-full min-w-[260px] flex-1 flex-col bg-[#F4F4F4] ${rounded} px-3 pb-2 pt-1`}
        >
            <div className="mb-4 flex shrink-0 items-center justify-between px-2 pt-3">
                <div className="flex items-center gap-2">
                    <SkeletonBox className="w-5 h-5 rounded-[6px]" />
                    <SkeletonBox className="h-[18px] w-[120px] rounded-[8px]" />
                </div>
                <SkeletonBox className="hidden h-4 w-4 rounded-[6px]" />
            </div>

            <div className="scrollbar-sutil -mr-2 flex min-h-0 flex-1 flex-col gap-1 overflow-y-scroll pb-2 pr-1">
                {[...Array(cardCount)].map((_, index) => (
                    <SkeletonCard key={index} compact={index === cardCount - 1} />
                ))}
            </div>
        </div>
    );
}

export default function HomeSkeleton() {
    const columns = [
        { rounded: "rounded-l-[24px] rounded-r-xl", cardCount: 3 },
        { rounded: "rounded-xl", cardCount: 2 },
        { rounded: "rounded-xl", cardCount: 3 },
        { rounded: "rounded-l-xl rounded-r-[24px]", cardCount: 2 },
    ];

    return (
        <>
            <div className="mb-6 flex shrink-0 items-center justify-between lg:ml-[18px]">
                <div className="flex items-center gap-2">
                    <SkeletonBox className="w-5 h-5 rounded-[6px]" />
                    <SkeletonBox className="h-[18px] w-[150px] rounded-[8px]" />
                </div>

                <SkeletonBox className="w-[169px] h-[39px] rounded-full" />
            </div>

            <div className="relative flex-1 min-h-0 min-w-0 overflow-hidden">
                <div className="flex h-full w-full gap-3.5 overflow-x-auto overflow-y-hidden pb-4 no-scrollbar">
                    {columns.map((column, index) => (
                        <SkeletonColumn
                            key={index}
                            rounded={column.rounded}
                            cardCount={column.cardCount}
                        />
                    ))}
                </div>
            </div>
        </>
    );
}
