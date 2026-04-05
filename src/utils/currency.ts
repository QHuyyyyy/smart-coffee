type CurrencyInput = number | string | readonly (number | string)[] | null | undefined;

export function formatVND(value: CurrencyInput, fallback = "-"): string {
    const normalized = Array.isArray(value) ? value[0] : value;
    if (normalized === null || normalized === undefined || normalized === "") return fallback;

    const numeric = typeof normalized === "number"
        ? normalized
        : Number(String(normalized).replace(/[^\d.-]/g, ""));

    if (!Number.isFinite(numeric)) return fallback;
    return `${numeric.toLocaleString("vi-VN")} VND`;
}
