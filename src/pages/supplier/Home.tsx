import { useEffect, useMemo, useState } from "react";
import type { LucideIcon } from "lucide-react";
import { CircleDollarSign, Handshake, ShoppingCart, WalletCards } from "lucide-react";
import { dashboardService } from "@/apis/dashboard.service";
import { orderService } from "@/apis/order.service";
import { transactionService, type TransactionItem } from "@/apis/transaction.service";
import { RevenueLineChart } from "@/components/RevenueLineChart";
import { SupplierOnboardingDialog } from "@/components/SupplierOnboardingDialog";
import { InlineLoading } from "@/components/Loading";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useAuthStore } from "@/stores/auth.store";
import { formatVND } from "@/utils/currency";

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

export function SupplierHome() {
    const { currentUser } = useAuthStore();

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

    useEffect(() => {
        void fetchSummary();
        void fetchRecentTransactions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser?.supplierId, currentUser?.accountId]);

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
                    <h2 className="text-xl font-bold text-[#1F1F1F]">Transaction, Fees &amp; Finance Management</h2>
                    {summaryError && <p className="text-sm text-red-600">{summaryError}</p>}
                    <SummaryGrid cards={cards} />

                    <RevenueLineChart
                        mode="supplier"
                        supplierId={currentUser?.supplierId ?? undefined}
                        title="Total Revenue Line Chart"
                    />

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
        </div>
    );
}
