import { useEffect, useMemo, useState } from "react";
import {
    Bar,
    BarChart,
    Cell,
    ResponsiveContainer,
    Tooltip,
    XAxis,
    YAxis,
} from "recharts";
import type { LucideIcon } from "lucide-react";
import { dashboardService, type DashboardChartPoint } from "@/apis/dashboard.service";
import { transactionService, type TransactionItem } from "@/apis/transaction.service";
import { InlineLoading } from "@/components/Loading";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatVND } from "@/utils/currency";
import {
    BookOpenText,
    CircleDollarSign,
    Handshake,
    Server,
    ShieldCheck,
    Users,
    WalletCards,
} from "lucide-react";

type SummaryCard = {
    title: string;
    value: string;
    icon: LucideIcon;
    iconColor: string;
    iconBg: string;
    progress: number;
    progressColor: string;
};

const financeCards: SummaryCard[] = [
    {
        title: "Total Revenue",
        value: "100.000.000 VND",
        icon: CircleDollarSign,
        iconColor: "text-emerald-500",
        iconBg: "bg-emerald-50",
        progress: 82,
        progressColor: "bg-emerald-500",
    },
    {
        title: "Platform Fees Collected",
        value: "90.000.000 VND",
        icon: WalletCards,
        iconColor: "text-orange-500",
        iconBg: "bg-orange-50",
        progress: 68,
        progressColor: "bg-orange-500",
    },
    {
        title: "Total Transactions",
        value: "15,480",
        icon: WalletCards,
        iconColor: "text-blue-500",
        iconBg: "bg-blue-50",
        progress: 55,
        progressColor: "bg-blue-500",
    },
    {
        title: "Subscription Revenue",
        value: "10.000.000 VND",
        icon: ShieldCheck,
        iconColor: "text-violet-500",
        iconBg: "bg-violet-50",
        progress: 40,
        progressColor: "bg-violet-500",
    },
];

type RevenueFilter = {
    month: string;
    year: string;
};

type DashboardSummary = {
    totalCoffeeShops: number;
    totalStaffs: number;
    totalSuppliers: number;
    totalActiveSubscriptions: number;
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
    const [revenueData, setRevenueData] = useState<DashboardChartPoint[]>([]);
    const [totalCommission, setTotalCommission] = useState(0);
    const [rangeLabel, setRangeLabel] = useState<string>("");
    const [revenueLoading, setRevenueLoading] = useState(false);
    const [revenueError, setRevenueError] = useState<string | null>(null);
    const [filter, setFilter] = useState<RevenueFilter>({ month: "all", year: "all" });

    const [monitoringSummary, setMonitoringSummary] = useState<DashboardSummary>({
        totalCoffeeShops: 0,
        totalStaffs: 0,
        totalSuppliers: 0,
        totalActiveSubscriptions: 0,
    });
    const [monitoringLoading, setMonitoringLoading] = useState(false);
    const [monitoringError, setMonitoringError] = useState<string | null>(null);

    const [recentTransactions, setRecentTransactions] = useState<TransactionItem[]>([]);
    const [transactionsLoading, setTransactionsLoading] = useState(false);
    const [transactionsError, setTransactionsError] = useState<string | null>(null);

    const monthOptions = useMemo(
        () =>
            Array.from({ length: 12 }, (_, index) => ({
                value: String(index + 1),
                label: `Month ${index + 1}`,
            })),
        [],
    );

    const yearOptions = useMemo(() => {
        const currentYear = new Date().getFullYear();
        return Array.from({ length: 7 }, (_, index) => String(currentYear - 5 + index));
    }, []);

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

    const parsePositiveInt = (value: string) => {
        if (value === "all") return undefined;
        if (!value.trim()) return undefined;
        const parsed = Number(value);
        if (!Number.isInteger(parsed) || parsed <= 0) return undefined;
        return parsed;
    };

    const fetchCommissionRevenue = async (nextFilter?: RevenueFilter) => {
        const target = nextFilter ?? filter;

        try {
            setRevenueLoading(true);
            setRevenueError(null);

            const month = parsePositiveInt(target.month);
            const year = parsePositiveInt(target.year);

            const result = await dashboardService.getCommissionRevenue({ month, year });
            setRevenueData(result.data ?? []);
            setTotalCommission(result.totalCommission ?? 0);
            setRangeLabel(result.range ?? "");
        } catch {
            setRevenueError("Failed to load commission revenue.");
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
        void fetchCommissionRevenue({ month: "all", year: "all" });
        void fetchMonitoringSummary();
        void fetchRecentTransactions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const revenueBars = useMemo(
        () =>
            revenueData.map((item) => ({
                day: item.time,
                revenue: Number(item.totalRevenue ?? 0),
            })),
        [revenueData],
    );

    const handleApplyFilter = () => {
        void fetchCommissionRevenue();
    };

    const handleClearFilter = () => {
        const cleared = { month: "all", year: "all" };
        setFilter(cleared);
        void fetchCommissionRevenue(cleared);
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
                    <SummaryGrid cards={financeCards} />

                    <section className="space-y-6">
                        <h2 className="text-xl font-bold text-[#1F1F1F]">Platform Monitoring &amp; Operations</h2>
                        {monitoringError && <p className="text-sm text-red-600">{monitoringError}</p>}
                        <SummaryGrid cards={monitoringCards} />



                    </section>
                    <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
                        <div className="rounded-xl border border-[#EFEAE5] bg-white p-6 shadow-sm">
                            <div className="mb-4 flex items-center justify-between gap-3">
                                <p className="text-base font-medium text-[#1F1F1F]">Commission Overview</p>
                                <div className="flex flex-wrap items-center gap-2">
                                    <Select
                                        value={filter.month}
                                        onValueChange={(value) => setFilter((prev) => ({ ...prev, month: value }))}
                                    >
                                        <SelectTrigger className="h-8 w-32 rounded-lg border-gray-200 bg-gray-50 px-2 text-xs text-gray-900">
                                            <SelectValue placeholder="Month" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All months</SelectItem>
                                            {monthOptions.map((month) => (
                                                <SelectItem key={month.value} value={month.value}>
                                                    {month.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <Select
                                        value={filter.year}
                                        onValueChange={(value) => setFilter((prev) => ({ ...prev, year: value }))}
                                    >
                                        <SelectTrigger className="h-8 w-28 rounded-lg border-gray-200 bg-gray-50 px-2 text-xs text-gray-900">
                                            <SelectValue placeholder="Year" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="all">All years</SelectItem>
                                            {yearOptions.map((year) => (
                                                <SelectItem key={year} value={year}>
                                                    {year}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>

                                    <button
                                        type="button"
                                        onClick={handleApplyFilter}
                                        disabled={revenueLoading}
                                        className="rounded-lg bg-[#573E32] px-3 py-1.5 text-xs font-semibold text-white hover:opacity-90 disabled:opacity-60"
                                    >
                                        Apply
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleClearFilter}
                                        disabled={revenueLoading}
                                        className="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-semibold text-[#573E32] hover:bg-gray-50 disabled:opacity-60"
                                    >
                                        Clear
                                    </button>
                                </div>
                            </div>
                            <div className="mb-4 flex items-end gap-2">
                                <p className="text-[32px] font-bold leading-tight text-[#1F1F1F]">
                                    {formatVND(totalCommission)}
                                </p>
                                <p className="pb-1.5 text-xs font-medium text-[#707070]">{rangeLabel || "Current period"}</p>
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
                                            <XAxis dataKey="day" tick={{ fill: "#8B7E75", fontSize: 12 }} axisLine={false} tickLine={false} />
                                            <YAxis tick={{ fill: "#8B7E75", fontSize: 12 }} axisLine={false} tickLine={false} />
                                            <Tooltip
                                                cursor={{ fill: "rgba(87,62,50,0.08)" }}
                                                contentStyle={{ borderRadius: 12, borderColor: "#E7DDD4", color: "#3D2E25" }}
                                                formatter={(value) => [formatVND(value), "Revenue"]}
                                            />
                                            <Bar dataKey="revenue" radius={[8, 8, 0, 0]} maxBarSize={42}>
                                                {revenueBars.map((entry, index) => (
                                                    <Cell
                                                        key={`${entry.day}-${index}`}
                                                        fill={index === revenueBars.length - 1 ? "#573E32" : "#7F6657"}
                                                    />
                                                ))}
                                            </Bar>
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
        </div >
    );
}
