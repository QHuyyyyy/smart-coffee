import { useEffect, useMemo, useState } from "react";
import {
    Bar,
    BarChart,
    Legend,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import type { LucideIcon } from "lucide-react";
import { dashboardService } from "@/apis/dashboard.service";
import { transactionService, type TransactionItem } from "@/apis/transaction.service";
import { InlineLoading } from "@/components/Loading";
import { RevenueLineChart } from "@/components/RevenueLineChart";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatVND } from "@/utils/currency";
import {
    BookOpenText,
    CircleDollarSign,
    Download,
    Handshake,
    Server,
    ShieldCheck,
    Users,
    WalletCards,
} from "lucide-react";
import { exportRowsToExcel } from "@/utils/excel";

type SummaryCard = {
    title: string;
    value: string;
    icon: LucideIcon;
    iconColor: string;
    iconBg: string;
    progress: number;
    progressColor: string;
};

type RevenueFilter = {
    mode: "day" | "month";
    month: string;
    year: string;
};

type DashboardSummary = {
    totalCoffeeShops: number;
    totalStaffs: number;
    totalSuppliers: number;
    totalActiveSubscriptions: number;
};

type FinanceSummary = {
    totalTransactions: number;
    commissionRevenue: number;
    subscriptionRevenue: number;
};


function formatDateTime(value: string | null | undefined) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("vi-VN");
}

function getStatusClasses(status: string | null | undefined) {
    const normalized = (status ?? "").toLowerCase();
    if (normalized === "completed") return "bg-emerald-50 text-emerald-700 border border-emerald-100";
    if (normalized === "processing" || normalized === "pending") return "bg-amber-50 text-amber-700 border border-amber-100";
    if (normalized === "failed" || normalized === "rejected" || normalized === "cancelled") {
        return "bg-red-50 text-red-700 border border-red-100";
    }
    return "bg-gray-100 text-gray-700 border border-gray-200";
}

function formatChartDayLabel(value: string, mode: "day" | "month") {
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

function formatExportTimeLabel(value: string, mode: "day" | "month") {
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
        return `${day}/${month}/${year}`;
    }

    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    if (mode === "month") {
        return date.toLocaleDateString("en-US", { month: "2-digit", year: "numeric" });
    }
    return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });
}

function SummaryGrid({ cards }: { cards: SummaryCard[] }) {
    return (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
            {cards.map((card) => {
                const Icon = card.icon;
                return (
                    <div key={card.title} className="rounded-xl border border-[#EFEAE5] bg-white p-5">
                        <div className="mb-3 flex items-center justify-between gap-3">
                            <div>
                                <p className="text-sm text-[#707070]">{card.title}</p>
                                <p className="mt-1 text-2xl font-bold text-[#1F1F1F]">{card.value}</p>
                            </div>
                            <div className={`rounded-lg p-2 ${card.iconBg}`}>
                                <Icon size={16} className={card.iconColor} />
                            </div>
                        </div>
                        <div className="mb-2 h-1.5 w-full rounded-full bg-[#ECE6E1]">
                            <div className={`h-1.5 rounded-full ${card.progressColor}`} style={{ width: `${card.progress}%` }} />
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

export function AdminHome() {
    const [commissionRevenueData, setCommissionRevenueData] = useState<{ time: string; totalRevenue: number }[]>([]);
    const [subscriptionRevenueData, setSubscriptionRevenueData] = useState<{ time: string; totalRevenue: number }[]>([]);
    const [totalCommission, setTotalCommission] = useState(0);
    const [totalSubscription, setTotalSubscription] = useState(0);
    const [revenueLoading, setRevenueLoading] = useState(false);
    const [revenueError, setRevenueError] = useState<string | null>(null);
    const currentDate = new Date();
    const currentMonth = String(currentDate.getMonth() + 1).padStart(2, "0");
    const currentYear = String(currentDate.getFullYear());
    const currentMonthYear = `${currentYear}-${currentMonth}`;
    const [filter, setFilter] = useState<RevenueFilter>({ mode: "day", month: currentMonthYear, year: currentYear });
    const [isFinancialExportOpen, setIsFinancialExportOpen] = useState(false);
    const [exportFilter, setExportFilter] = useState<RevenueFilter>({ mode: "day", month: currentMonthYear, year: currentYear });
    const [exportLoading, setExportLoading] = useState(false);

    const [monitoringSummary, setMonitoringSummary] = useState<DashboardSummary>({
        totalCoffeeShops: 0,
        totalStaffs: 0,
        totalSuppliers: 0,
        totalActiveSubscriptions: 0,
    });
    const [monitoringLoading, setMonitoringLoading] = useState(false);
    const [monitoringError, setMonitoringError] = useState<string | null>(null);

    const [financeSummary, setFinanceSummary] = useState<FinanceSummary>({
        totalTransactions: 0,
        commissionRevenue: 0,
        subscriptionRevenue: 0,
    });
    const [financeLoading, setFinanceLoading] = useState(false);
    const [financeError, setFinanceError] = useState<string | null>(null);

    const [recentTransactions, setRecentTransactions] = useState<TransactionItem[]>([]);
    const [transactionsLoading, setTransactionsLoading] = useState(false);
    const [transactionsError, setTransactionsError] = useState<string | null>(null);

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

    const monitoringCards = useMemo<SummaryCard[]>(
        () => [
            {
                title: "Total Coffee Shops",
                value: monitoringLoading ? "..." : monitoringSummary.totalCoffeeShops.toLocaleString("en-US"),
                icon: Users,
                iconColor: "text-blue-500",
                iconBg: "bg-blue-50",
                progress: 100,
                progressColor: "bg-blue-500",
            },
            {
                title: "Total Staffs",
                value: monitoringLoading ? "..." : monitoringSummary.totalStaffs.toLocaleString("en-US"),
                icon: BookOpenText,
                iconColor: "text-amber-500",
                iconBg: "bg-amber-50",
                progress: 100,
                progressColor: "bg-amber-500",
            },
            {
                title: "Total Suppliers",
                value: monitoringLoading ? "..." : monitoringSummary.totalSuppliers.toLocaleString("en-US"),
                icon: Handshake,
                iconColor: "text-purple-500",
                iconBg: "bg-purple-50",
                progress: 100,
                progressColor: "bg-purple-500",
            },
            {
                title: "Active Subscriptions",
                value: monitoringLoading ? "..." : monitoringSummary.totalActiveSubscriptions.toLocaleString("en-US"),
                icon: Server,
                iconColor: "text-emerald-500",
                iconBg: "bg-emerald-50",
                progress: 100,
                progressColor: "bg-emerald-500",
            },
        ],
        [monitoringLoading, monitoringSummary],
    );

    const financeCards = useMemo<SummaryCard[]>(() => {
        const totalRevenueSummary = financeSummary.commissionRevenue + financeSummary.subscriptionRevenue;

        return [
            {
                title: "Total Transactions",
                value: financeLoading ? "..." : financeSummary.totalTransactions.toLocaleString("en-US"),
                icon: WalletCards,
                iconColor: "text-blue-500",
                iconBg: "bg-blue-50",
                progress: 100,
                progressColor: "bg-blue-500",
            },
            {
                title: "Commission Revenue",
                value: financeLoading ? "..." : formatVND(financeSummary.commissionRevenue),
                icon: ShieldCheck,
                iconColor: "text-orange-500",
                iconBg: "bg-orange-50",
                progress: 100,
                progressColor: "bg-orange-500",
            },
            {
                title: "Subscription Revenue",
                value: financeLoading ? "..." : formatVND(financeSummary.subscriptionRevenue),
                icon: Handshake,
                iconColor: "text-violet-500",
                iconBg: "bg-violet-50",
                progress: 100,
                progressColor: "bg-violet-500",
            },
            {
                title: "Total Revenue",
                value: financeLoading ? "..." : formatVND(totalRevenueSummary),
                icon: CircleDollarSign,
                iconColor: "text-emerald-500",
                iconBg: "bg-emerald-50",
                progress: 100,
                progressColor: "bg-emerald-500",
            },
        ];
    }, [financeLoading, financeSummary]);

    const parsePositiveInt = (value: string) => {
        if (value === "all") return undefined;
        if (!value.trim()) return undefined;
        const parsed = Number(value);
        if (!Number.isInteger(parsed) || parsed <= 0) return undefined;
        return parsed;
    };

    const parseMonthYear = (value: string) => {
        const [yearPart, monthPart] = value.split("-");
        const parsedYear = parsePositiveInt(yearPart ?? "");
        const parsedMonth = parsePositiveInt(monthPart ?? "");

        if (!parsedYear || !parsedMonth) {
            return {
                month: undefined,
                year: undefined,
            };
        }

        return {
            month: parsedMonth,
            year: parsedYear,
        };
    };

    const getRevenueQueryParams = (target: RevenueFilter) => {
        const monthYearParams = parseMonthYear(target.month);
        return {
            month: target.mode === "day" ? monthYearParams.month : undefined,
            year: target.mode === "day" ? monthYearParams.year : parsePositiveInt(target.year),
        };
    };

    const fetchRevenueOverview = async (nextFilter?: RevenueFilter) => {
        const target = nextFilter ?? filter;

        try {
            setRevenueLoading(true);
            setRevenueError(null);

            const { month, year } = getRevenueQueryParams(target);

            const [commissionResult, subscriptionResult] = await Promise.all([
                dashboardService.getCommissionRevenue({ month, year }),
                dashboardService.getSubscriptionRevenue({ month, year }),
            ]);

            setCommissionRevenueData(commissionResult.data ?? []);
            setSubscriptionRevenueData(subscriptionResult.data ?? []);
            setTotalCommission(commissionResult.totalCommission ?? 0);
            setTotalSubscription(subscriptionResult.totalSubscription ?? 0);
        } catch {
            setRevenueError("Failed to load revenue overview.");
        } finally {
            setRevenueLoading(false);
        }
    };

    const fetchMonitoringSummary = async () => {
        try {
            setMonitoringLoading(true);
            setMonitoringError(null);

            const [totalCoffeeShops, totalStaffs, totalSuppliers, totalActiveSubscriptions] = await Promise.all([
                dashboardService.getTotalCoffeeShops(),
                dashboardService.getTotalStaffs(),

                dashboardService.getTotalSuppliers(),
                dashboardService.getTotalActiveSubscriptions(),
            ]);

            setMonitoringSummary({
                totalCoffeeShops,
                totalStaffs,
                totalSuppliers,
                totalActiveSubscriptions,
            });
        } catch {
            setMonitoringError("Failed to load platform monitoring summary.");
        } finally {
            setMonitoringLoading(false);
        }
    };

    const fetchFinanceSummary = async () => {
        try {
            setFinanceLoading(true);
            setFinanceError(null);

            const [totalTransactions, commissionRevenue, subscriptionRevenue] = await Promise.all([
                dashboardService.getTotalTransaction(),
                dashboardService.getCommissionRevenueTotal(),
                dashboardService.getSubscriptionRevenueTotal(),
            ]);

            setFinanceSummary({
                totalTransactions,
                commissionRevenue,
                subscriptionRevenue,
            });
        } catch {
            setFinanceError("Failed to load finance summary.");
        } finally {
            setFinanceLoading(false);
        }
    };

    const fetchRecentTransactions = async () => {
        try {
            setTransactionsLoading(true);
            setTransactionsError(null);

            const result = await transactionService.getPaginated({ page: 1, pageSize: 5 });
            setRecentTransactions(result.items ?? []);
        } catch {
            setTransactionsError("Failed to load recent transactions.");
        } finally {
            setTransactionsLoading(false);
        }
    };

    useEffect(() => {
        void fetchFinanceSummary();
        void fetchMonitoringSummary();
        void fetchRecentTransactions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        void fetchRevenueOverview();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [filter.mode, filter.month, filter.year]);

    const revenueBars = useMemo(
        () => {
            const map = new Map<string, { day: string; commission: number; subscription: number }>();

            commissionRevenueData.forEach((item) => {
                const key = item.time;
                const existing = map.get(key);
                if (existing) {
                    existing.commission = Number(item.totalRevenue ?? 0);
                } else {
                    map.set(key, {
                        day: key,
                        commission: Number(item.totalRevenue ?? 0),
                        subscription: 0,
                    });
                }
            });

            subscriptionRevenueData.forEach((item) => {
                const key = item.time;
                const existing = map.get(key);
                if (existing) {
                    existing.subscription = Number(item.totalRevenue ?? 0);
                } else {
                    map.set(key, {
                        day: key,
                        commission: 0,
                        subscription: Number(item.totalRevenue ?? 0),
                    });
                }
            });

            return Array.from(map.values()).sort((a, b) => a.day.localeCompare(b.day));
        },
        [commissionRevenueData, subscriptionRevenueData],
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

    const totalRevenue = totalCommission + totalSubscription;

    const handleExportFinancialReport = async () => {
        try {
            setExportLoading(true);

            const { month, year } = getRevenueQueryParams(exportFilter);
            const [totalRevenueData, commissionResult, subscriptionResult] = await Promise.all([
                dashboardService.getTotalRevenue({ month, year }),
                dashboardService.getCommissionRevenue({ month, year }),
                dashboardService.getSubscriptionRevenue({ month, year }),
            ]);

            const map = new Map<string, { time: string; totalRevenueValue: number; commission: number; subscription: number }>();

            (totalRevenueData ?? []).forEach((item) => {
                const key = item.time;
                const current = map.get(key);
                if (current) {
                    current.totalRevenueValue = Number(item.totalRevenue ?? 0);
                } else {
                    map.set(key, {
                        time: key,
                        totalRevenueValue: Number(item.totalRevenue ?? 0),
                        commission: 0,
                        subscription: 0,
                    });
                }
            });

            (commissionResult.data ?? []).forEach((item) => {
                const key = item.time;
                const current = map.get(key);
                if (current) {
                    current.commission = Number(item.totalRevenue ?? 0);
                } else {
                    map.set(key, {
                        time: key,
                        totalRevenueValue: 0,
                        commission: Number(item.totalRevenue ?? 0),
                        subscription: 0,
                    });
                }
            });

            (subscriptionResult.data ?? []).forEach((item) => {
                const key = item.time;
                const current = map.get(key);
                if (current) {
                    current.subscription = Number(item.totalRevenue ?? 0);
                } else {
                    map.set(key, {
                        time: key,
                        totalRevenueValue: 0,
                        commission: 0,
                        subscription: Number(item.totalRevenue ?? 0),
                    });
                }
            });

            const dateKey = exportFilter.mode === "day" ? "Date" : "Month";
            const rows = Array.from(map.values())
                .sort((a, b) => a.time.localeCompare(b.time))
                .map((item) => ({
                    [dateKey]: formatExportTimeLabel(item.time, exportFilter.mode),
                    TotalRevenue: item.totalRevenueValue,
                    Comission: item.commission,
                    Subscription: item.subscription,
                }));

            exportRowsToExcel({
                rows,
                fileName: `admin-financial-report-${exportFilter.mode}-${exportFilter.mode === "day" ? exportFilter.month : exportFilter.year}`,
                sheetName: "FinancialReport",
            });

            setIsFinancialExportOpen(false);
        } finally {
            setExportLoading(false);
        }
    };

    return (
        <div className="mt-24 w-full overflow-y-auto px-10 pb-10">
            <div className="w-full space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-[-0.015em] text-[#1F1F1F]">Admin Dashboard</h1>
                        <p className="text-base text-[#707070]">Overview &amp; Management</p>
                    </div>
                </div>

                <section className="space-y-6">
                    <h2 className="text-xl font-bold text-[#1F1F1F]">Transaction, Fees &amp; Finance Management</h2>
                    {financeError && <p className="text-sm text-red-600">{financeError}</p>}
                    <SummaryGrid cards={financeCards} />

                    <section className="space-y-6">
                        <h2 className="text-xl font-bold text-[#1F1F1F]">Platform Monitoring &amp; Operations</h2>
                        {monitoringError && <p className="text-sm text-red-600">{monitoringError}</p>}
                        <SummaryGrid cards={monitoringCards} />



                    </section>
                    <div className="flex items-center justify-between gap-3">
                        <h2 className="text-xl font-bold text-[#1F1F1F]">Revenue &amp; Financial Report</h2>
                        <button
                            type="button"
                            onClick={() => {
                                setExportFilter({
                                    mode: filter.mode,
                                    month: filter.month,
                                    year: filter.year,
                                });
                                setIsFinancialExportOpen(true);
                            }}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-[#573E32] hover:bg-gray-50"
                        >
                            <Download size={14} />
                            Export Report
                        </button>
                    </div>
                    <RevenueLineChart mode="admin" title="Total Revenue" />
                    <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
                        <div className="rounded-xl border border-[#EFEAE5] bg-white p-6 shadow-sm">
                            <div className="mb-4 flex items-center justify-between gap-3">
                                <p className="text-base font-medium text-[#1F1F1F]">Revenue Overview (Commission &amp; Subscription)</p>
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
                                                {monthOptions.map((month) => (
                                                    <SelectItem key={month.value} value={month.value}>
                                                        {month.label}
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
                                                {yearOptions.map((year) => (
                                                    <SelectItem key={year} value={year}>
                                                        {year}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}

                                </div>
                            </div>
                            <div className="mb-4 flex items-end gap-2">
                                <p className="text-[32px] font-bold leading-tight text-[#1F1F1F]">
                                    {formatVND(totalRevenue)}
                                </p>
                                {/* <p className="pb-1.5 text-xs font-medium text-[#707070]">{rangeLabel || "Current period"}</p> */}
                            </div>
                            <div className="mb-4 flex flex-wrap items-center gap-4 text-xs text-[#707070]">
                                <p>
                                    Commission: <span className="font-semibold text-[#573E32]">{formatVND(totalCommission)}</span>
                                </p>
                                <p>
                                    Subscription: <span className="font-semibold text-[#F47A1F]">{formatVND(totalSubscription)}</span>
                                </p>
                            </div>
                            {revenueLoading ? (
                                <div className="flex h-65 w-full items-center justify-center text-sm text-[#707070]">Loading chart...</div>
                            ) : revenueError ? (
                                <div className="flex h-65 w-full items-center justify-center text-sm text-red-600">{revenueError}</div>
                            ) : revenueBars.length === 0 ? (
                                <div className="flex h-65 w-full items-center justify-center text-sm text-[#707070]">No data available.</div>
                            ) : (
                                <div className="h-65 w-full">
                                    <ResponsiveContainer width="100%" height="100%">
                                        <BarChart data={revenueBars} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                                            <XAxis
                                                dataKey="day"
                                                ticks={monthTicks}
                                                interval={filter.mode === "month" ? 0 : "preserveEnd"}
                                                minTickGap={filter.mode === "month" ? 0 : 8}
                                                tickFormatter={(value) => formatChartDayLabel(String(value), filter.mode)}
                                                tick={{ fill: "#8B7E75", fontSize: 12 }}
                                                axisLine={false}
                                                tickLine={false}
                                            />
                                            <YAxis tick={{ fill: "#8B7E75", fontSize: 12 }} axisLine={false} tickLine={false} />
                                            <Tooltip
                                                cursor={{ fill: "rgba(87,62,50,0.08)" }}
                                                contentStyle={{ borderRadius: 12, borderColor: "#E7DDD4", color: "#3D2E25" }}
                                                labelFormatter={(label) => formatChartDayLabel(String(label), filter.mode)}
                                                formatter={(value, name) => [formatVND(Number(value)), name === "Commission" ? "Commission" : "Subscription"]}
                                            />
                                            <Legend />
                                            <Bar dataKey="commission" name="Commission" fill="#573E32" radius={[6, 6, 0, 0]} maxBarSize={24} />
                                            <Bar dataKey="subscription" name="Subscription" fill="#F47A1F" radius={[6, 6, 0, 0]} maxBarSize={24} />
                                        </BarChart>
                                    </ResponsiveContainer>
                                </div>
                            )}
                        </div>
                    </div>



                    <div className="overflow-hidden rounded-xl border border-[#EFEAE5] bg-white">
                        <div className="flex items-center justify-between border-b border-[#EFEAE5] p-6">
                            <h3 className="text-base font-semibold text-[#573E32]">Recent Transactions</h3>
                        </div>
                        <div className="px-6 py-4">
                            {transactionsError && <p className="mb-2 text-xs text-red-500">{transactionsError}</p>}

                            <div className="overflow-x-auto">
                                <Table>
                                    <TableHeader>
                                        <TableRow className="bg-transparent">
                                            <TableHead className="w-24">ID</TableHead>
                                            <TableHead>Transaction Type</TableHead>
                                            <TableHead className="w-24">User ID</TableHead>
                                            <TableHead className="text-center">Amount</TableHead>
                                            <TableHead className="text-center">Notes</TableHead>
                                            <TableHead className="text-center">Status</TableHead>
                                            <TableHead className="text-center">Transaction Date</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {!transactionsLoading && recentTransactions.map((item) => (
                                            <TableRow key={item.transactionId}>
                                                <TableCell className="font-medium text-[#573E32]">#{item.transactionId}</TableCell>
                                                <TableCell>{item.transactionType ?? "-"}</TableCell>
                                                <TableCell className="w-24">#{item.userId}</TableCell>
                                                <TableCell className="text-center font-medium text-[#573E32]">
                                                    {item.totalPrice != null ? formatVND(item.totalPrice) : "-"}
                                                </TableCell>
                                                <TableCell className="max-w-60 truncate text-center text-[#707070]" title={item.notes ?? ""}>
                                                    {item.notes ?? "-"}
                                                </TableCell>
                                                <TableCell className="text-center">
                                                    <span className={`inline-flex items-center justify-center rounded-full px-2.5 py-1 text-[11px] font-medium capitalize ${getStatusClasses(item.status)}`}>
                                                        {item.status ?? "Unknown"}
                                                    </span>
                                                </TableCell>
                                                <TableCell className="text-center text-xs text-[#707070]">
                                                    {formatDateTime(item.transactionDate)}
                                                </TableCell>
                                            </TableRow>
                                        ))}

                                        {transactionsLoading && (
                                            <TableRow>
                                                <TableCell colSpan={7} className="py-6 text-center">
                                                    <InlineLoading text="Loading transactions..." />
                                                </TableCell>
                                            </TableRow>
                                        )}

                                        {!transactionsLoading && recentTransactions.length === 0 && !transactionsError && (
                                            <TableRow>
                                                <TableCell colSpan={7} className="py-6 text-center text-[#707070]">
                                                    No transactions found.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </div>
                </section>

            </div >

            <Dialog open={isFinancialExportOpen} onOpenChange={setIsFinancialExportOpen}>
                <DialogContent className="max-w-md p-6">
                    <DialogHeader>
                        <DialogTitle>Export Financial Report</DialogTitle>
                    </DialogHeader>

                    <div className="mt-2 space-y-4">
                        <div className="inline-flex items-center rounded-lg border border-gray-200 bg-white p-0.5">
                            <button
                                type="button"
                                className={`rounded-md px-3 py-1 text-xs font-semibold transition ${exportFilter.mode === "day" ? "bg-[#573E32] text-white" : "text-[#573E32] hover:bg-[#F5F1EE]"}`}
                                onClick={() => setExportFilter((prev) => ({ ...prev, mode: "day" }))}
                            >
                                By day
                            </button>
                            <button
                                type="button"
                                className={`rounded-md px-3 py-1 text-xs font-semibold transition ${exportFilter.mode === "month" ? "bg-[#573E32] text-white" : "text-[#573E32] hover:bg-[#F5F1EE]"}`}
                                onClick={() => setExportFilter((prev) => ({ ...prev, mode: "month" }))}
                            >
                                By month
                            </button>
                        </div>

                        {exportFilter.mode === "day" ? (
                            <Select
                                value={exportFilter.month}
                                onValueChange={(value) => setExportFilter((prev) => ({ ...prev, month: value }))}
                            >
                                <SelectTrigger className="h-10 w-full rounded-lg border-gray-200 bg-gray-50 px-3 text-sm text-gray-900">
                                    <SelectValue placeholder="Month/Year" />
                                </SelectTrigger>
                                <SelectContent className="max-h-52 overflow-y-auto">
                                    {monthOptions.map((month) => (
                                        <SelectItem key={month.value} value={month.value}>
                                            {month.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        ) : (
                            <Select
                                value={exportFilter.year}
                                onValueChange={(value) => setExportFilter((prev) => ({ ...prev, year: value }))}
                            >
                                <SelectTrigger className="h-10 w-full rounded-lg border-gray-200 bg-gray-50 px-3 text-sm text-gray-900">
                                    <SelectValue placeholder="Year" />
                                </SelectTrigger>
                                <SelectContent className="max-h-52 overflow-y-auto">
                                    {yearOptions.map((year) => (
                                        <SelectItem key={year} value={year}>
                                            {year}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        )}

                        <div className="flex justify-end gap-2 pt-2">
                            <button
                                type="button"
                                onClick={() => setIsFinancialExportOpen(false)}
                                className="rounded-lg border border-gray-300 px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                            >
                                Cancel
                            </button>
                            <button
                                type="button"
                                onClick={() => void handleExportFinancialReport()}
                                disabled={exportLoading}
                                className="rounded-lg bg-[#573E32] px-4 py-2 text-sm font-medium text-white hover:bg-[#4B342A] disabled:opacity-50"
                            >
                                {exportLoading ? "Exporting..." : "Download"}
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div >
    );
}
