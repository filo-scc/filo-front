export default function NotificationsPanel() {
    return (
        <aside
            className="flex h-[200px] flex-col rounded-[24px] bg-white px-5 py-5 sm:h-[380px] sm:px-[27px] sm:pb-[27px] sm:pt-[26px]"
            aria-labelledby="notifications-title"
        >
            <div className="flex items-center gap-2 text-[#404040]">
                <svg
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                    className="h-5 w-5 fill-none stroke-current stroke-[1.5]"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z"
                    />
                    <path strokeLinecap="round" d="M9.5 21h5" />
                </svg>
                <h2 id="notifications-title" className="text-base font-normal">
                    Notificações
                </h2>
            </div>

            <div className="flex flex-1 flex-col items-center justify-center px-4 py-8 text-center">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#F4F4F4] text-[#B5B7BA]">
                    <svg
                        viewBox="0 0 24 24"
                        aria-hidden="true"
                        className="h-6 w-6 fill-none stroke-current stroke-[1.5]"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            d="M18 9a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z"
                        />
                    </svg>
                </div>
                <p className="mt-4 text-sm font-light text-[#898C8F]">
                    Nenhuma notificação por enquanto.
                </p>
            </div>
        </aside>
    );
}
