import { SkeletonBox } from "../geral/Loading";

export function TecidosTableSkeleton({ rows = 5 }) {
    return (
        <>
            {[...Array(rows)].map((_, index) => {
                const isPar = index % 2 === 0;

                return (
                    <tr
                        key={index}
                        className={`h-[60px] border-b border-[#E8E8E8] last:border-0 text-center ${
                            isPar ? "bg-white" : "bg-[#F4F4F4]"
                        }`}
                    >
                        {/* Nome do tecido */}
                        <td className="px-6 py-4">
                            <div className="flex justify-center">
                                <SkeletonBox className="h-[16px] w-28 rounded-[8px]" />
                            </div>
                        </td>

                        {/* Unidade de medida */}
                        <td className="px-6 py-4">
                            <div className="flex justify-center">
                                <SkeletonBox className="h-[16px] w-12 rounded-[8px]" />
                            </div>
                        </td>

                        {/* Preço */}
                        <td className="px-6 py-4">
                            <div className="flex justify-center">
                                <SkeletonBox className="h-[16px] w-20 rounded-[8px]" />
                            </div>
                        </td>

                        {/* Opções */}
                        <td className="px-6 py-4">
                            <div className="flex justify-center items-center">
                                <SkeletonBox className="w-5 h-5 rounded-[6px]" />
                            </div>
                        </td>
                    </tr>
                );
            })}
        </>
    );
}
