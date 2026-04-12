import { useEffect, useMemo, useState } from "react";
import {
    CartesianGrid,
    Line,
    LineChart,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import { Download } from "lucide-react";
import { dashboardService, type DashboardChartPoint } from "@/apis/dashboard.service";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { formatVND } from "@/utils/currency";
import { exportRowsToExcel } from "@/utils/excel";

type RevenueLineChartProps = {
    mode: "admin" | "supplier";
    supplierId?: number;
    title?: string;
};

type RevenueFilter = {
    mode: "day" | "month";
    month: string;
    year: string;
};

function formatChartLabel(value: string, mode: "day" | "month") {
    if (!value) return "-";

    const monthMatch = value.match(/^(\d{4})-(\d{2})$/);
    if (monthMatch) {
        const [, year, month] = monthMatch;
        return `${month}/${year}`;
    }

    const dayMatch = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (dayMatch) {
        const [, year, month, day] = dayMatch;
        if (mode === "month") return `${month}/${year}`;
        return `${day}/${month}`;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    if (mode === "month") {
        return date.toLocaleDateString("en-US", { month: "2-digit", year: "numeric" });
    }
    return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
}

function parsePositiveInt(value: string) {
    if (!value.trim()) return undefined;
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0) return undefined;
    return parsed;
}

export function RevenueLineChart({ mode, supplierId, title = "Total Revenue Trend" }: RevenueLineChartProps) {
    const now = new Date();
    const currentMonth = String(now.getMonth() + 1).padStart(2, "0");
    const currentYear = String(now.getFullYear());
    const currentMonthYear = `${currentYear}-${currentMonth}`;

    const [filter, setFilter] = useState<RevenueFilter>({ mode: "day", month: currentMonthYear, year: currentYear });
    const [data, setData] = useState<DashboardChartPoint[]>([]);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const yearOptions = useMemo(() => {
        const yearNumber = Number(currentYear);
        return Array.from({ length: 2 }, (_, index) => String(yearNumber - 1 + index));
    }, [currentYear]);

    const monthOptions = useMemo(
        () =>
            yearOptions.flatMap((year) =>
                Array.from({ length: 12 }, (_, index) => {
                    const month = String(index + 1).padStart(2, "0");
                    return {
                        value: `${year}-${month}`,
                        label: `${month}/${year}`,
                    };
                }),
            ),
        [yearOptions],
    );

    const parseMonthYear = (value: string) => {
        const [yearPart, monthPart] = value.split("-");
        const parsedYear = parsePositiveInt(yearPart ?? "");
        const parsedMonth = parsePositiveInt(monthPart ?? "");

        if (!parsedYear || !parsedMonth) {
            return { month: undefined, year: undefined };
        }

        return { month: parsedMonth, year: parsedYear };
    };

    const fetchChart = async (nextFilter?: RevenueFilter) => {
        const target = nextFilter ?? filter;
        const monthYearParams = parseMonthYear(target.month);
        const month = target.mode === "day" ? monthYearParams.month : undefined;
        const year = target.mode === "day" ? monthYearParams.year : parsePositiveInt(target.year);

        try {
            setLoading(true);
            setError(null);

            let result: DashboardChartPoint[] = [];
            if (mode === "admin") {
                result = await dashboardService.getTotalRevenue({ month, year });
            } else {
                if (!supplierId) {
                    setError("Supplier information is not available.");
                    setData([]);
                    setTotalRevenue(0);
                    return;
                }
                result = await dashboardService.getSupplierTotalRevenue(supplierId, { month, year });
            }

            const nextData = result ?? [];
            setData(nextData);
            setTotalRevenue(nextData.reduce((sum, item) => sum + Number(item.totalRevenue ?? 0), 0));
        } catch {
            setError("Failed to load total revenue chart.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchChart();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [mode, supplierId, filter.mode, filter.month, filter.year]);

    const chartData = useMemo(
        () =>
            data
                .map((item) => ({
                    time: item.time,
                    revenue: Number(item.totalRevenue ?? 0),
                }))
                .sort((a, b) => a.time.localeCompare(b.time)),
        [data],
    );

    const monthTicks = useMemo(() => {
        if (filter.mode !== "month") return undefined;
        const yearNumber = parsePositiveInt(filter.year);
        if (!yearNumber) return undefined;

        return Array.from({ length: 12 }, (_, index) => {
            const month = String(index + 1).padStart(2, "0");
            return `${yearNumber}-${month}`;
        });
    }, [filter.mode, filter.year]);

    const handleExportExcel = () => {
        const rows = chartData.map((item) => ({
            Time: formatChartLabel(item.time, filter.mode),
            TotalRevenue: item.revenue,
        }));

        exportRowsToExcel({
            rows,
            fileName: `${mode}-total-revenue-${filter.mode}-${filter.mode === "day" ? filter.month : filter.year}`,
            sheetName: "TotalRevenue",
        });
    };

    return (
        <div className="rounded-xl border border-[#EFEAE5] bg-white p-6 shadow-sm">
            <div className="mb-4 flex items-center justify-between gap-3">
                <p className="text-base font-medium text-[#1F1F1F]">{title}</p>
                <div className="flex flex-wrap items-center gap-2">
                    <div className="inline-flex items-center rounded-lg border border-gray-200 bg-white p-0.5">
                        <button
                            type="button"
                            className={`rounded-md px-3 py-1 text-xs font-semibold transition ${filter.mode === "day" ? "bg-[#573E32] text-white" : "text-[#573E32] hover:bg-[#F5F1EE]"}`}
                            onClick={() => setFilter((prev) => ({ ...prev, mode: "day" }))}
                        >
                            By day
                        </button>
                        <button
                            type="button"
                            className={`rounded-md px-3 py-1 text-xs font-semibold transition ${filter.mode === "month" ? "bg-[#573E32] text-white" : "text-[#573E32] hover:bg-[#F5F1EE]"}`}
                            onClick={() => setFilter((prev) => ({ ...prev, mode: "month" }))}
                        >
                            By month
                        </button>
                    </div>

                    {filter.mode === "day" ? (
                        <Select
                            value={filter.month}
                            onValueChange={(value) => setFilter((prev) => ({ ...prev, month: value }))}
                        >
                            <SelectTrigger className="h-8 w-36 rounded-lg border-gray-200 bg-gray-50 px-2 text-xs text-gray-900">
                                <SelectValue placeholder="Month/Year" />
                            </SelectTrigger>
                            <SelectContent className="max-h-52 overflow-y-auto">
                                {monthOptions.map((monthOption) => (
                                    <SelectItem key={monthOption.value} value={monthOption.value}>
                                        {monthOption.label}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    ) : (
                        <Select
                            value={filter.year}
                            onValueChange={(value) => setFilter((prev) => ({ ...prev, year: value }))}
                        >
                            <SelectTrigger className="h-8 w-28 rounded-lg border-gray-200 bg-gray-50 px-2 text-xs text-gray-900">
                                <SelectValue placeholder="Year" />
                            </SelectTrigger>
                            <SelectContent className="max-h-52 overflow-y-auto">
                                {yearOptions.map((yearOption) => (
                                    <SelectItem key={yearOption} value={yearOption}>
                                        {yearOption}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    )}

                    <button
                        type="button"
                        onClick={handleExportExcel}
                        disabled={loading || chartData.length === 0}
                        aria-label="Export chart data to Excel"
                        className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-gray-300 bg-white text-[#573E32] hover:bg-gray-50 disabled:opacity-50"
                    >
                        <Download size={14} />
                    </button>
                </div>
            </div>

            <div className="mb-4 flex items-end gap-2">
                <p className="text-[32px] font-bold leading-tight text-[#1F1F1F]">{formatVND(totalRevenue)}</p>
            </div>

            {loading ? (
                <div className="flex h-65 w-full items-center justify-center text-sm text-[#707070]">Loading chart...</div>
            ) : error ? (
                <div className="flex h-65 w-full items-center justify-center text-sm text-red-600">{error}</div>
            ) : chartData.length === 0 ? (
                <div className="flex h-65 w-full items-center justify-center text-sm text-[#707070]">No data available.</div>
            ) : (
                <div className="h-65 w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} margin={{ top: 8, right: 20, left: -12, bottom: 0 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#EFEAE5" vertical={false} />
                            <XAxis
                                dataKey="time"
                                ticks={monthTicks}
                                interval={filter.mode === "month" ? 0 : "preserveEnd"}
                                minTickGap={filter.mode === "month" ? 0 : 8}
                                padding={filter.mode === "month" ? { left: 6, right: 16 } : undefined}
                                tickFormatter={(value) => formatChartLabel(String(value), filter.mode)}
                                tick={{ fill: "#8B7E75", fontSize: 12 }}
                                axisLine={false}
                                tickLine={false}
                            />
                            <YAxis
                                tick={{ fill: "#8B7E75", fontSize: 12 }}
                                axisLine={false}
                                tickLine={false}
                                tickFormatter={(value) => Number(value).toLocaleString("vi-VN")}
                            />
                            <Tooltip
                                cursor={{ stroke: "#D8CFC8", strokeWidth: 1 }}
                                contentStyle={{ borderRadius: 12, borderColor: "#E7DDD4", color: "#3D2E25" }}
                                labelFormatter={(label) => formatChartLabel(String(label), filter.mode)}
                                formatter={(value) => [formatVND(Number(value)), "Total Revenue"]}
                            />
                            <Line
                                type="monotone"
                                dataKey="revenue"
                                name="Total Revenue"
                                stroke="#573E32"
                                strokeWidth={2.5}
                                dot={{ r: 3, fill: "#573E32" }}
                                activeDot={{ r: 5, fill: "#573E32" }}
                            />
                        </LineChart>
                    </ResponsiveContainer>
                </div>
            )}
        </div>
    );
}
