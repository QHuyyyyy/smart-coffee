import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { CircleDollarSign, Download, Handshake, ShoppingCart, WalletCards } from "lucide-react";
import { Bar, BarChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { dashboardService } from "@/apis/dashboard.service";
import { orderService } from "@/apis/order.service";
import { transactionService, type TransactionItem } from "@/apis/transaction.service";
import { RevenueLineChart } from "@/components/RevenueLineChart";
import { SupplierOnboardingDialog } from "@/components/SupplierOnboardingDialog";
import { InlineLoading } from "@/components/Loading";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuthStore } from "@/stores/auth.store";
import { formatVND } from "@/utils/currency";
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

type SupplierSummary = {
    totalRevenue: number;
    totalOrder: number;
    totalTransaction: number;
    totalCommissionFee: number;
};

type RevenueFilter = {
    mode: "day" | "month";
    month: string;
    year: string;
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

function parsePositiveInt(value: string) {
    if (!value.trim()) return undefined;
    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed <= 0) return undefined;
    return parsed;
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

export function SupplierHome() {
    const { currentUser } = useAuthStore();
    const currentDate = new Date();
    const currentMonth = String(currentDate.getMonth() + 1).padStart(2, "0");
    const currentYear = String(currentDate.getFullYear());
    const currentMonthYear = `${currentYear}-${currentMonth}`;

    const [summary, setSummary] = useState<SupplierSummary>({
        totalRevenue: 0,
        totalOrder: 0,
        totalTransaction: 0,
        totalCommissionFee: 0,
    });
    const [summaryLoading, setSummaryLoading] = useState(false);
    const [summaryError, setSummaryError] = useState<string | null>(null);

    const [recentTransactions, setRecentTransactions] = useState<TransactionItem[]>([]);
    const [transactionsLoading, setTransactionsLoading] = useState(false);
    const [transactionsError, setTransactionsError] = useState<string | null>(null);

    const [commissionRevenueData, setCommissionRevenueData] = useState<{ time: string; totalRevenue: number }[]>([]);
    const [totalCommission, setTotalCommission] = useState(0);
    const [commissionLoading, setCommissionLoading] = useState(false);
    const [commissionError, setCommissionError] = useState<string | null>(null);
    const [commissionFilter, setCommissionFilter] = useState<RevenueFilter>({
        mode: "day",
        month: currentMonthYear,
        year: currentYear,
    });
    const [isFinancialExportOpen, setIsFinancialExportOpen] = useState(false);
    const [exportFilter, setExportFilter] = useState<RevenueFilter>({
        mode: "day",
        month: currentMonthYear,
        year: currentYear,
    });
    const [exportLoading, setExportLoading] = useState(false);

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

    const cards = useMemo<SummaryCard[]>(
        () => [
            {
                title: "Total Revenue",
                value: summaryLoading ? "..." : formatVND(summary.totalRevenue),
                icon: CircleDollarSign,
                iconColor: "text-emerald-500",
                iconBg: "bg-emerald-50",
                progress: 100,
                progressColor: "bg-emerald-500",
            },
            {
                title: "Total Orders",
                value: summaryLoading ? "..." : summary.totalOrder.toLocaleString("en-US"),
                icon: ShoppingCart,
                iconColor: "text-blue-500",
                iconBg: "bg-blue-50",
                progress: 100,
                progressColor: "bg-blue-500",
            },
            {
                title: "Total Transactions",
                value: summaryLoading ? "..." : summary.totalTransaction.toLocaleString("en-US"),
                icon: WalletCards,
                iconColor: "text-orange-500",
                iconBg: "bg-orange-50",
                progress: 100,
                progressColor: "bg-orange-500",
            },
            {
                title: "Total Commission Fee",
                value: summaryLoading ? "..." : formatVND(summary.totalCommissionFee),
                icon: Handshake,
                iconColor: "text-violet-500",
                iconBg: "bg-violet-50",
                progress: 100,
                progressColor: "bg-violet-500",
            },
        ],
        [summary, summaryLoading],
    );

    const fetchSummary = async () => {
        if (!currentUser?.supplierId) {
            setSummaryError("Supplier information is not available.");
            return;
        }

        try {
            setSummaryLoading(true);
            setSummaryError(null);

            const [totalRevenue, totalOrder, totalTransaction, totalCommissionFee] = await Promise.all([
                orderService.getSupplierRevenue(currentUser.supplierId),
                dashboardService.getSupplierTotalOrder(currentUser.supplierId),
                dashboardService.getSupplierTotalTransaction(currentUser.supplierId),
                dashboardService.getSupplierTotalCommissionFee(currentUser.supplierId),
            ]);

            setSummary({
                totalRevenue,
                totalOrder,
                totalTransaction,
                totalCommissionFee,
            });
        } catch {
            setSummaryError("Failed to load supplier dashboard summary.");
        } finally {
            setSummaryLoading(false);
        }
    };

    const fetchRecentTransactions = async () => {
        if (!currentUser?.accountId) {
            setTransactionsError("Account information is not available.");
            return;
        }

        try {
            setTransactionsLoading(true);
            setTransactionsError(null);

            const data = await transactionService.getListByUserId(currentUser.accountId);
            const sorted = [...data].sort((a, b) => {
                const aTime = new Date(a.transactionDate ?? a.createAt ?? 0).getTime();
                const bTime = new Date(b.transactionDate ?? b.createAt ?? 0).getTime();
                return bTime - aTime;
            });
            setRecentTransactions(sorted.slice(0, 5));
        } catch (err: any) {
            const message = err?.response?.data?.message ?? err?.message ?? "Failed to load recent transactions.";
            setTransactionsError(message);
        } finally {
            setTransactionsLoading(false);
        }
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

    const fetchCommissionRevenueOverview = async (nextFilter?: RevenueFilter) => {
        if (!currentUser?.supplierId) {
            setCommissionError("Supplier information is not available.");
            return;
        }

        const target = nextFilter ?? commissionFilter;

        try {
            setCommissionLoading(true);
            setCommissionError(null);

            const { month, year } = getRevenueQueryParams(target);

            const result = await dashboardService.getSupplierCommissionRevenueCompleted(currentUser.supplierId, {
                month,
                year,
            });

            setCommissionRevenueData(result.data ?? []);
            setTotalCommission(result.totalCommission ?? 0);
        } catch {
            setCommissionError("Failed to load commission fee overview.");
        } finally {
            setCommissionLoading(false);
        }
    };

    useEffect(() => {
        void fetchSummary();
        void fetchRecentTransactions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser?.supplierId, currentUser?.accountId]);

    useEffect(() => {
        void fetchCommissionRevenueOverview();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser?.supplierId, commissionFilter.mode, commissionFilter.month, commissionFilter.year]);

    const commissionBars = useMemo(
        () =>
            (commissionRevenueData ?? [])
                .map((item) => ({
                    day: item.time,
                    commission: Number(item.totalRevenue ?? 0),
                }))
                .sort((a, b) => a.day.localeCompare(b.day)),
        [commissionRevenueData],
    );

    const monthTicks = useMemo(() => {
        if (commissionFilter.mode !== "month") return undefined;
        const yearNumber = parsePositiveInt(commissionFilter.year);
        if (!yearNumber) return undefined;

        return Array.from({ length: 12 }, (_, index) => {
            const month = String(index + 1).padStart(2, "0");
            return `${yearNumber}-${month}`;
        });
    }, [commissionFilter.mode, commissionFilter.year]);

    const handleExportFinancialReport = async () => {
        if (!currentUser?.supplierId) return;

        try {
            setExportLoading(true);

            const { month, year } = getRevenueQueryParams(exportFilter);
            const [revenueData, commissionResponse] = await Promise.all([
                dashboardService.getSupplierTotalRevenue(currentUser.supplierId, { month, year }),
                dashboardService.getSupplierCommissionRevenueCompleted(currentUser.supplierId, { month, year }),
            ]);

            const map = new Map<string, { time: string; revenue: number; commission: number }>();

            revenueData.forEach((item) => {
                const key = item.time;
                const current = map.get(key);
                if (current) {
                    current.revenue = Number(item.totalRevenue ?? 0);
                } else {
                    map.set(key, {
                        time: key,
                        revenue: Number(item.totalRevenue ?? 0),
                        commission: 0,
                    });
                }
            });

            (commissionResponse.data ?? []).forEach((item) => {
                const key = item.time;
                const current = map.get(key);
                if (current) {
                    current.commission = Number(item.totalRevenue ?? 0);
                } else {
                    map.set(key, {
                        time: key,
                        revenue: 0,
                        commission: Number(item.totalRevenue ?? 0),
                    });
                }
            });

            const dateKey = exportFilter.mode === "day" ? "Date" : "Month";
            const rows = Array.from(map.values())
                .sort((a, b) => a.time.localeCompare(b.time))
                .map((item) => {
                    const receiveAmount = item.revenue - item.commission;
                    return {
                        [dateKey]: formatExportTimeLabel(item.time, exportFilter.mode),
                        Revenue: item.revenue,
                        "Comission Fee": item.commission,
                        "Receive Amount": receiveAmount,
                    };
                });

            exportRowsToExcel({
                rows,
                fileName: `supplier-financial-report-${exportFilter.mode}-${exportFilter.mode === "day" ? exportFilter.month : exportFilter.year}`,
                sheetName: "FinancialReport",
            });

            setIsFinancialExportOpen(false);
        } finally {
            setExportLoading(false);
        }
    };

    return (
        <div className="mt-24 w-full overflow-y-auto px-10 pb-10">
            <SupplierOnboardingDialog />
            <div className="w-full space-y-8">
                <div className="flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl font-bold tracking-[-0.015em] text-[#1F1F1F]">Supplier Dashboard</h1>
                        <p className="text-base text-[#707070]">Overview &amp; Management</p>
                    </div>
                </div>

                <section className="space-y-6">
                    <h2 className="text-xl font-bold text-[#1F1F1F]">Your Statistics</h2>
                    {summaryError && <p className="text-sm text-red-600">{summaryError}</p>}
                    <SummaryGrid cards={cards} />
                    <div className="flex items-center justify-between gap-3">
                        <h2 className="text-xl font-bold text-[#1F1F1F]"> Revenue &amp; Financial Report</h2>
                        <button
                            type="button"
                            onClick={() => {
                                setExportFilter({
                                    mode: commissionFilter.mode,
                                    month: commissionFilter.month,
                                    year: commissionFilter.year,
                                });
                                setIsFinancialExportOpen(true);
                            }}
                            className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-[#573E32] hover:bg-gray-50"
                        >
                            <Download size={14} />
                            Export Report
                        </button>
                    </div>
                    <RevenueLineChart
                        mode="supplier"
                        supplierId={currentUser?.supplierId ?? undefined}
                        title="Total Revenue Line Chart"
                    />

                    <div className="rounded-xl border border-[#EFEAE5] bg-white p-6 shadow-sm">
                        <div className="mb-4 flex items-center justify-between gap-3">
                            <p className="text-base font-medium text-[#1F1F1F]">Commission Fee (Completed Orders)</p>
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="inline-flex items-center rounded-lg border border-gray-200 bg-white p-0.5">
                                    <button
                                        type="button"
                                        className={`rounded-md px-3 py-1 text-xs font-semibold transition ${commissionFilter.mode === "day" ? "bg-[#573E32] text-white" : "text-[#573E32] hover:bg-[#F5F1EE]"}`}
                                        onClick={() => setCommissionFilter((prev) => ({ ...prev, mode: "day" }))}
                                    >
                                        By day
                                    </button>
                                    <button
                                        type="button"
                                        className={`rounded-md px-3 py-1 text-xs font-semibold transition ${commissionFilter.mode === "month" ? "bg-[#573E32] text-white" : "text-[#573E32] hover:bg-[#F5F1EE]"}`}
                                        onClick={() => setCommissionFilter((prev) => ({ ...prev, mode: "month" }))}
                                    >
                                        By month
                                    </button>
                                </div>

                                {commissionFilter.mode === "day" ? (
                                    <Select
                                        value={commissionFilter.month}
                                        onValueChange={(value) => setCommissionFilter((prev) => ({ ...prev, month: value }))}
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
                                        value={commissionFilter.year}
                                        onValueChange={(value) => setCommissionFilter((prev) => ({ ...prev, year: value }))}
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
                            <p className="text-[32px] font-bold leading-tight text-[#1F1F1F]">{formatVND(totalCommission)}</p>
                        </div>

                        {commissionLoading ? (
                            <div className="flex h-65 w-full items-center justify-center text-sm text-[#707070]">Loading chart...</div>
                        ) : commissionError ? (
                            <div className="flex h-65 w-full items-center justify-center text-sm text-red-600">{commissionError}</div>
                        ) : commissionBars.length === 0 ? (
                            <div className="flex h-65 w-full items-center justify-center text-sm text-[#707070]">No data available.</div>
                        ) : (
                            <div className="h-65 w-full">
                                <ResponsiveContainer width="100%" height="100%">
                                    <BarChart data={commissionBars} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                                        <XAxis
                                            dataKey="day"
                                            ticks={monthTicks}
                                            interval={commissionFilter.mode === "month" ? 0 : "preserveEnd"}
                                            minTickGap={commissionFilter.mode === "month" ? 0 : 8}
                                            tickFormatter={(value) => formatChartDayLabel(String(value), commissionFilter.mode)}
                                            tick={{ fill: "#8B7E75", fontSize: 12 }}
                                            axisLine={false}
                                            tickLine={false}
                                        />
                                        <YAxis tick={{ fill: "#8B7E75", fontSize: 12 }} axisLine={false} tickLine={false} />
                                        <Tooltip
                                            cursor={{ fill: "rgba(87,62,50,0.08)" }}
                                            contentStyle={{ borderRadius: 12, borderColor: "#E7DDD4", color: "#3D2E25" }}
                                            labelFormatter={(label) => formatChartDayLabel(String(label), commissionFilter.mode)}
                                            formatter={(value) => [formatVND(Number(value)), "Commission Fee"]}
                                        />
                                        <Bar dataKey="commission" name="Commission Fee" fill="#573E32" radius={[6, 6, 0, 0]} maxBarSize={24} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        )}
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
                                            <TableHead className="w-24">Doc No</TableHead>
                                            <TableHead>Doc Type</TableHead>
                                            <TableHead>Type</TableHead>
                                            <TableHead className="text-center">Notes</TableHead>
                                            <TableHead className="text-center">Status</TableHead>
                                            <TableHead className="text-center">Transaction Date</TableHead>
                                            <TableHead className="text-center">Amount</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {!transactionsLoading && recentTransactions.map((item) => (
                                            <TableRow key={item.transactionId}>
                                                <TableCell className="font-medium text-[#573E32]">#{item.transactionId}</TableCell>
                                                <TableCell>{item.docNo ?? "-"}</TableCell>
                                                <TableCell>{item.docType ?? "-"}</TableCell>
                                                <TableCell>{item.transactionType ?? "-"}</TableCell>
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
                                                <TableCell className="text-center font-medium text-[#573E32]">
                                                    {item.totalPrice != null ? formatVND(item.totalPrice) : "-"}
                                                </TableCell>
                                            </TableRow>
                                        ))}

                                        {transactionsLoading && (
                                            <TableRow>
                                                <TableCell colSpan={8} className="py-6 text-center">
                                                    <InlineLoading text="Loading transactions..." />
                                                </TableCell>
                                            </TableRow>
                                        )}

                                        {!transactionsLoading && recentTransactions.length === 0 && !transactionsError && (
                                            <TableRow>
                                                <TableCell colSpan={8} className="py-6 text-center text-[#707070]">
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
            </div>

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
        </div>
    );
}
