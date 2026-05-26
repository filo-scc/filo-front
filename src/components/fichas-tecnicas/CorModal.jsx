import React, { useCallback, useEffect, useRef, useState } from "react";
import FloatingLabelInput from "../FloatingLabelInput";
import { createCor, getApiErrorMessage } from "../../services/corService";

function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
}

function hexToRgb(hex) {
    const normalized = String(hex || "")
        .replace("#", "")
        .trim();
    if (!/^[0-9A-Fa-f]{6}$/.test(normalized)) return null;
    return {
        r: parseInt(normalized.slice(0, 2), 16),
        g: parseInt(normalized.slice(2, 4), 16),
        b: parseInt(normalized.slice(4, 6), 16),
    };
}

function rgbToHex(r, g, b) {
    const toHex = (n) => clamp(Math.round(n), 0, 255).toString(16).padStart(2, "0");
    return `#${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
}

function rgbToHsv(r, g, b) {
    const rn = r / 255;
    const gn = g / 255;
    const bn = b / 255;
    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    const delta = max - min;
    let h = 0;

    if (delta !== 0) {
        if (max === rn) h = ((gn - bn) / delta) % 6;
        else if (max === gn) h = (bn - rn) / delta + 2;
        else h = (rn - gn) / delta + 4;
        h *= 60;
        if (h < 0) h += 360;
    }

    const s = max === 0 ? 0 : delta / max;
    const v = max;
    return { h, s, v };
}

function hsvToRgb(h, s, v) {
    const c = v * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = v - c;
    let rp = 0;
    let gp = 0;
    let bp = 0;

    if (h < 60) [rp, gp, bp] = [c, x, 0];
    else if (h < 120) [rp, gp, bp] = [x, c, 0];
    else if (h < 180) [rp, gp, bp] = [0, c, x];
    else if (h < 240) [rp, gp, bp] = [0, x, c];
    else if (h < 300) [rp, gp, bp] = [x, 0, c];
    else [rp, gp, bp] = [c, 0, x];

    return {
        r: Math.round((rp + m) * 255),
        g: Math.round((gp + m) * 255),
        b: Math.round((bp + m) * 255),
    };
}

function ColorPickerPopover({ hsv, hex, rgb, onHsvChange, onHexChange, onRgbChannelChange }) {
    const svRef = useRef(null);
    const hueRef = useRef(null);

    const updateSv = useCallback(
        (clientX, clientY) => {
            const rect = svRef.current?.getBoundingClientRect();
            if (!rect) return;
            const s = clamp((clientX - rect.left) / rect.width, 0, 1);
            const v = clamp(1 - (clientY - rect.top) / rect.height, 0, 1);
            onHsvChange({ ...hsv, s, v });
        },
        [hsv, onHsvChange],
    );

    const updateHue = useCallback(
        (clientX) => {
            const rect = hueRef.current?.getBoundingClientRect();
            if (!rect) return;
            const h = clamp(((clientX - rect.left) / rect.width) * 360, 0, 360);
            onHsvChange({ ...hsv, h });
        },
        [hsv, onHsvChange],
    );

    const bindDrag = useCallback((moveFn) => {
        const onMove = (e) => moveFn(e.clientX, e.clientY);
        const onUp = () => {
            document.removeEventListener("mousemove", onMove);
            document.removeEventListener("mouseup", onUp);
        };
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
    }, []);

    const hueColor = `hsl(${hsv.h}, 100%, 50%)`;

    return (
        <div className="absolute left-[calc(100%+14px)] top-0 z-[20] w-[268px]">
            <div className="absolute -left-[7px] top-[28px] h-0 w-0 border-y-[7px] border-y-transparent border-r-[8px] border-r-white drop-shadow-sm" />
            <div className="rounded-[14px] border border-[#E8E8E8] bg-white p-3 shadow-[0_8px_24px_rgba(0,0,0,0.12)]">
                <div
                    ref={svRef}
                    className="relative h-[150px] w-full cursor-crosshair overflow-hidden rounded-[10px]"
                    style={{ backgroundColor: hueColor }}
                    onMouseDown={(e) => {
                        updateSv(e.clientX, e.clientY);
                        bindDrag(updateSv);
                    }}
                >
                    <div className="absolute inset-0 bg-gradient-to-r from-white to-transparent" />
                    <div className="absolute inset-0 bg-gradient-to-t from-black to-transparent" />
                    <div
                        className="pointer-events-none absolute h-[14px] w-[14px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
                        style={{
                            left: `${hsv.s * 100}%`,
                            top: `${(1 - hsv.v) * 100}%`,
                            backgroundColor: (() => {
                                const { r, g, b } = hsvToRgb(hsv.h, hsv.s, hsv.v);
                                return rgbToHex(r, g, b);
                            })(),
                        }}
                    />
                </div>

                <div
                    ref={hueRef}
                    className="relative mt-3 h-[12px] w-full cursor-pointer rounded-full"
                    style={{
                        background:
                            "linear-gradient(to right, #ff0000, #ffff00, #00ff00, #00ffff, #0000ff, #ff00ff, #ff0000)",
                    }}
                    onMouseDown={(e) => {
                        updateHue(e.clientX);
                        bindDrag((x) => updateHue(x));
                    }}
                >
                    <div
                        className="pointer-events-none absolute top-1/2 h-[16px] w-[16px] -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-white shadow"
                        style={{
                            left: `${(hsv.h / 360) * 100}%`,
                            backgroundColor: hueColor,
                        }}
                    />
                </div>

                <div className="mt-3 grid grid-cols-[1.4fr_repeat(3,1fr)] gap-2">
                    <div>
                        <span className="mb-1 block text-[11px] font-light text-[#B0B0B0]">
                            HEX
                        </span>
                        <input
                            type="text"
                            value={hex}
                            onChange={(e) => onHexChange(e.target.value)}
                            className="h-[34px] w-full rounded-[8px] border border-[#E0E0E0] px-2 text-[12px] text-[#7B7D80] outline-none transition hover:border-[#C8C8C8] focus:border-[#4696AD]"
                        />
                    </div>
                    {["r", "g", "b"].map((channel) => (
                        <div key={channel}>
                            <span className="mb-1 block text-center text-[11px] font-light uppercase text-[#B0B0B0]">
                                {channel}
                            </span>
                            <input
                                type="number"
                                min="0"
                                max="255"
                                value={rgb[channel]}
                                onChange={(e) => onRgbChannelChange(channel, e.target.value)}
                                className="h-[34px] w-full rounded-[8px] border border-[#E0E0E0] px-2 text-center text-[12px] text-[#7B7D80] outline-none transition hover:border-[#C8C8C8] focus:border-[#4696AD] [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                            />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}

export default function CorModal({ isOpen, onClose, fabricoId, onSuccess }) {
    const [nome, setNome] = useState("");
    const [hex, setHex] = useState("#");
    const [rgb, setRgb] = useState({ r: 255, g: 255, b: 255 });
    const [hsv, setHsv] = useState({ h: 0, s: 0, v: 1 });
    const [pickerOpen, setPickerOpen] = useState(false);
    const [hasChosenColor, setHasChosenColor] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState("");

    const syncFromHsv = useCallback((nextHsv, markChosen = true) => {
        const nextRgb = hsvToRgb(nextHsv.h, nextHsv.s, nextHsv.v);
        const nextHex = rgbToHex(nextRgb.r, nextRgb.g, nextRgb.b);
        setHsv(nextHsv);
        setRgb(nextRgb);
        setHex(nextHex);
        if (markChosen) setHasChosenColor(true);
    }, []);

    const syncFromHex = useCallback((value) => {
        const digits = String(value || "")
            .replace("#", "")
            .replace(/[^0-9A-Fa-f]/g, "")
            .slice(0, 6)
            .toUpperCase();
        const formatted = `#${digits}`;
        setHex(formatted);
        if (digits.length !== 6) return;
        const parsed = hexToRgb(formatted);
        if (!parsed) return;
        const nextHsv = rgbToHsv(parsed.r, parsed.g, parsed.b);
        setRgb(parsed);
        setHsv(nextHsv);
        setHasChosenColor(true);
    }, []);

    const handleHexInputChange = (e) => {
        syncFromHex(e.target.value);
    };

    const syncFromRgbChannel = useCallback(
        (channel, value) => {
            const numeric = clamp(Number.parseInt(String(value || 0), 10) || 0, 0, 255);
            const nextRgb = { ...rgb, [channel]: numeric };
            const nextHex = rgbToHex(nextRgb.r, nextRgb.g, nextRgb.b);
            const nextHsv = rgbToHsv(nextRgb.r, nextRgb.g, nextRgb.b);
            setRgb(nextRgb);
            setHex(nextHex);
            setHsv(nextHsv);
            setHasChosenColor(true);
        },
        [rgb],
    );

    const resetForm = useCallback(() => {
        setNome("");
        setHex("#");
        setRgb({ r: 255, g: 255, b: 255 });
        setHsv({ h: 0, s: 0, v: 1 });
        setPickerOpen(false);
        setHasChosenColor(false);
        setSubmitting(false);
        setError("");
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
            setError("Informe o nome da cor.");
            return;
        }
        if (!hasChosenColor) {
            setError("Escolha um tom para a cor.");
            return;
        }
        const parsed = hexToRgb(hex);
        if (!parsed) {
            setError("Código HEX inválido.");
            return;
        }

        const fabricoIdNumerico = Number(fabricoId);
        if (!Number.isFinite(fabricoIdNumerico) || fabricoIdNumerico <= 0) {
            setError("Fabrico inválido. Recarregue a página e tente novamente.");
            return;
        }

        const codigoHex = rgbToHex(parsed.r, parsed.g, parsed.b);

        setSubmitting(true);
        setError("");
        try {
            const created = await createCor({
                fabrico_id: fabricoIdNumerico,
                nome: nomeTrim,
                codigo_hex: codigoHex,
                tipo: "COR",
            });
            onSuccess?.(created);
            handleClose();
        } catch (err) {
            console.error(err);
            setError(getApiErrorMessage(err, "Não foi possível cadastrar a cor. Tente novamente."));
        } finally {
            setSubmitting(false);
        }
    };

    if (!isOpen) return null;

    const previewColor = hasChosenColor ? hex : "transparent";

    return (
        <div
            className="fixed inset-0 z-[1100] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm font-['Outfit',_sans-serif]"
            onClick={handleClose}
        >
            <div
                className="relative w-full max-w-[620px] rounded-[28px] bg-white px-10 py-9 shadow-[4px_4px_18px_rgba(0,0,0,0.12)]"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="mb-8 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img
                            src="/add-color-icon.png"
                            alt=""
                            className="h-[28px] w-[28px] object-contain"
                        />
                        <h2 className="text-[26px] font-light text-[#404040]">Cadastrar cor</h2>
                    </div>
                    <button
                        type="button"
                        onClick={handleClose}
                        className="transition opacity-80 hover:opacity-100"
                        aria-label="Fechar"
                    >
                        <img src="/fechar-cinza.png" className="w-3 h-3" alt="Fechar" />
                    </button>
                </div>

                {error ? (
                    <div className="mb-4 rounded-[10px] border border-red-200 bg-red-50 px-4 py-2 text-[13px] text-red-700">
                        {error}
                    </div>
                ) : null}

                <div className="grid grid-cols-1 gap-6 sm:grid-cols-5 sm:grid-rows-[auto_1fr] sm:items-stretch sm:gap-x-10 sm:gap-y-2">
                    <p className="text-[14px] font-light text-[#4696AD] sm:col-span-2 sm:row-start-1">
                        Escolher tom
                    </p>

                    <div className="relative min-h-[116px] sm:col-span-2 sm:row-start-2 sm:min-h-0">
                        <button
                            type="button"
                            onClick={() => setPickerOpen((prev) => !prev)}
                            className="flex h-full min-h-[116px] w-full items-center justify-center rounded-[14px] border border-dashed border-[#D0D0D0] bg-white transition hover:border-[#4696AD]/60 sm:absolute sm:inset-0 sm:min-h-0"
                            style={{ backgroundColor: previewColor }}
                        >
                            {!hasChosenColor ? (
                                <span className="text-[42px] font-light leading-none text-[#D0D0D0]">
                                    +
                                </span>
                            ) : null}
                        </button>
                        {pickerOpen ? (
                            <ColorPickerPopover
                                hsv={hsv}
                                hex={hex}
                                rgb={rgb}
                                onHsvChange={(next) => syncFromHsv(next)}
                                onHexChange={syncFromHex}
                                onRgbChannelChange={syncFromRgbChannel}
                            />
                        ) : null}
                    </div>

                    <div className="flex flex-col gap-4 sm:col-span-3 sm:col-start-3 sm:row-start-2">
                        <FloatingLabelInput
                            label="Nome da cor"
                            value={nome}
                            onChange={(e) => setNome(e.target.value)}
                            inputClassName="border-[#898C8F] text-[14px] text-[#404040]"
                        />

                        <div>
                            <label className="mb-2 block text-[14px] font-light text-[#4696AD]">
                                Código HEX
                            </label>
                            <div className="relative w-full">
                                <span className="pointer-events-none absolute left-3 top-1/2 z-10 -translate-y-1/2 text-[14px] font-light text-[#7B7D80]">
                                    #
                                </span>
                                <input
                                    type="text"
                                    value={hex.replace("#", "")}
                                    onChange={handleHexInputChange}
                                    onFocus={(e) => e.target.select()}
                                    placeholder="FFFFFF"
                                    maxLength={6}
                                    inputMode="text"
                                    autoComplete="off"
                                    spellCheck={false}
                                    className="w-full h-[39px] border border-[#D3D3D3] rounded-[10px] pl-7 pr-3 text-[14px] font-light uppercase leading-[39px] text-[#7B7D80] focus:outline-none transition-colors bg-white border-[#898C8F] tracking-wide placeholder:normal-case placeholder:text-[#C8C8C8]"
                                />
                            </div>
                        </div>
                    </div>
                </div>

                <div className="mt-8 flex justify-end">
                    <button
                        type="button"
                        disabled={submitting}
                        onClick={handleSubmit}
                        className="h-[39px] rounded-full bg-[#A9E2F2] px-8 text-[15px] font-light text-[#4696AD] transition hover:bg-[#94d6eb] disabled:opacity-60"
                    >
                        {submitting ? "Salvando..." : "Concluir cadastro"}
                    </button>
                </div>
            </div>
        </div>
    );
}
