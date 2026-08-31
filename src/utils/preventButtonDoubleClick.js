const DEFAULT_DELAY_MS = 800;
const buttonClickTimestamps = new WeakMap();

function getEventButton(event) {
    const path = typeof event.composedPath === "function" ? event.composedPath() : [];
    const buttonFromPath = path.find((element) => element instanceof HTMLButtonElement);

    if (buttonFromPath) return buttonFromPath;

    return event.target instanceof Element ? event.target.closest("button") : null;
}

function shouldIgnoreButton(button) {
    return (
        !button ||
        button.disabled ||
        button.dataset.allowDoubleClick === "true" ||
        button.getAttribute("aria-disabled") === "true"
    );
}

export function setupPreventButtonDoubleClick(delayMs = DEFAULT_DELAY_MS) {
    if (typeof document === "undefined") return () => {};

    const handleClickCapture = (event) => {
        const button = getEventButton(event);

        if (shouldIgnoreButton(button)) return;

        const now = Date.now();
        const lastClick = buttonClickTimestamps.get(button) || 0;

        if (now - lastClick < delayMs) {
            event.preventDefault();
            event.stopPropagation();
            event.stopImmediatePropagation();
            return;
        }

        buttonClickTimestamps.set(button, now);
    };

    document.addEventListener("click", handleClickCapture, true);

    return () => {
        document.removeEventListener("click", handleClickCapture, true);
    };
}
