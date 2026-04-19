import { useEffect, useState } from "react";
import { WalletCards } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { transactionService, type TransactionItem } from "@/services/apis/transaction.service";
import { InlineLoading } from "@/components/Loading";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TablePagination } from "@/components/ui/pagination";
import { orderService } from "@/services/apis/order.service";
import { dashboardService } from "@/services/apis/dashboard.service";
import { DollarSign, Package, RefreshCw } from "lucide-react";
import { formatVND } from "@/utils/currency";


function formatDateTime(value: string | null | undefined) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("vi-VN");
}

function formatDocType(docType: string | null | undefined) {
    if (!docType) return "-";
    switch (docType) {
        case "1": return "Wallet";
        case "2": return "Order";
        case "3": return "Withdrawal/Settlement";
        case "4": return "Subscription";
        default: return docType;
    }
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

export function Transaction() {
    const currentUser = useAuthStore((state) => state.currentUser);
    const [transactions, setTransactions] = useState<TransactionItem[]>([]);
    const [transactionsLoading, setTransactionsLoading] = useState(false);
    const [transactionsError, setTransactionsError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);

    const [statusFilter, setStatusFilter] = useState("all");
    const [typeFilter, setTypeFilter] = useState("all");

    const [commissionRevenue, setCommissionRevenue] = useState<number | null>(null);
    const [subscriptionRevenue, setSubscriptionRevenue] = useState<number | null>(null);
    const [shippingRevenue, setShippingRevenue] = useState<number | null>(null);
    const [revenueLoading, setRevenueLoading] = useState(false);

    const fetchRevenues = async () => {
        try {
            setRevenueLoading(true);
            const [comm, sub, ship] = await Promise.all([
                dashboardService.getCommissionRevenueTotal(),
                dashboardService.getSubscriptionRevenueTotal(),
                orderService.getShippingRevenue(),
            ]);
            setCommissionRevenue(comm);
            setSubscriptionRevenue(sub);
            setShippingRevenue(ship);
        } catch (error) {
            console.error("Failed to load revenues:", error);
        } finally {
            setRevenueLoading(false);
        }
    };

    const fetchTransactions = async (targetPage = page) => {
        try {
            setTransactionsLoading(true);
            setTransactionsError(null);

            const params: any = { page: targetPage, pageSize };
            if (statusFilter !== "all") params.status = statusFilter;
            if (typeFilter !== "all") params.transactionType = typeFilter;

            const response = await transactionService.getPaginated(params);
            setTransactions(response.items ?? []);
            setTotalCount(response.totalCount ?? 0);
        } catch (error: any) {
            setTransactionsError(error?.message || "Failed to load transactions.");
        } finally {
            setTransactionsLoading(false);
        }
    };

    useEffect(() => {
        void fetchRevenues();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        void fetchTransactions(page);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, pageSize, statusFilter, typeFilter]);

    const totalPages = totalCount > 0 ? Math.max(1, Math.ceil(totalCount / pageSize)) : 1;
    const fromItem = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
    const toItem = totalCount === 0 ? 0 : Math.min(totalCount, page * pageSize);

    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > totalPages || newPage === page) return;
        setPage(newPage);
    };

    if (!currentUser) {
        return (
            <div className="p-6">
                <p className="text-red-500">You must be logged in to view transaction information.</p>
            </div>
        );
    }



    return (
        <div className="mt-24 px-10 pb-10 w-full overflow-y-auto">
            <div className="w-full space-y-6">
                <div className="mb-2 flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold leading-tight tracking-[-0.015em] text-[#1F1F1F] flex items-center gap-2">
                            <WalletCards size={22} className="text-[#573E32]" />
                            Transactions
                        </h1>
                        <p className="mt-1 text-sm text-[#707070]">
                            Manage and review all transactions
                        </p>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-white rounded-2xl shadow-sm border border-[#EFEAE5] p-6 flex flex-col justify-between">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-emerald-50 text-emerald-600">
                                <DollarSign size={20} />
                            </div>
                            <h2 className="text-sm font-medium text-[#707070]">Commission Revenue</h2>
                        </div>
                        {revenueLoading ? (
                            <div className="h-8 w-24 bg-gray-200 animate-pulse rounded mt-2"></div>
                        ) : (
                            <p className="text-2xl font-bold text-[#1F1F1F] mt-2">
                                {commissionRevenue != null ? formatVND(commissionRevenue) : "-"}
                            </p>
                        )}
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-[#EFEAE5] p-6 flex flex-col justify-between">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-purple-50 text-purple-600">
                                <RefreshCw size={20} />
                            </div>
                            <h2 className="text-sm font-medium text-[#707070]">Subscription Revenue</h2>
                        </div>
                        {revenueLoading ? (
                            <div className="h-8 w-24 bg-gray-200 animate-pulse rounded mt-2"></div>
                        ) : (
                            <p className="text-2xl font-bold text-[#1F1F1F] mt-2">
                                {subscriptionRevenue != null ? formatVND(subscriptionRevenue) : "-"}
                            </p>
                        )}
                    </div>

                    <div className="bg-white rounded-2xl shadow-sm border border-[#EFEAE5] p-6 flex flex-col justify-between">
                        <div className="flex items-center gap-3 mb-2">
                            <div className="h-10 w-10 flex items-center justify-center rounded-full bg-blue-50 text-blue-600">
                                <Package size={20} />
                            </div>
                            <h2 className="text-sm font-medium text-[#707070]">Shipping Fees</h2>
                        </div>
                        {revenueLoading ? (
                            <div className="h-8 w-24 bg-gray-200 animate-pulse rounded mt-2"></div>
                        ) : (
                            <p className="text-2xl font-bold text-[#1F1F1F] mt-2">
                                {shippingRevenue != null ? formatVND(shippingRevenue) : "-"}
                            </p>
                        )}
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-[#EFEAE5]">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between px-6 py-4 border-b border-[#EFEAE5]">
                        <h2 className="text-base font-semibold text-[#573E32]">Recent Transactions</h2>
                        <div className="flex items-center gap-2">
                            {/* <select 
                               className="h-9 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none hover:border-gray-300 focus:border-[#F47A1F]"
                               value={statusFilter}
                               onChange={(e) => {
                                   setStatusFilter(e.target.value);
                                   setPage(1);
                               }}
                           >
                               <option value="all">All Statuses</option>
                               <option value="Pending">Pending</option>
                               <option value="Completed">Completed</option>
                               <option value="Failed">Failed</option>
                               <option value="Cancelled">Cancelled</option>
                           </select>

                           <select 
                               className="h-9 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none hover:border-gray-300 focus:border-[#F47A1F]"
                               value={typeFilter}
                               onChange={(e) => {
                                   setTypeFilter(e.target.value);
                                   setPage(1);
                               }}
                           >
                               <option value="all">All Types</option>
                               <option value="Commission">Commission</option>
                               <option value="Subscription">Subscription</option>
                               <option value="Shipping">Shipping</option>
                               <option value="Deposit">Deposit</option>
                               <option value="Withdrawal">Withdrawal</option>
                           </select> */}

                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setStatusFilter("all");
                                    setTypeFilter("all");
                                    setPage(1);
                                }}
                            >
                                Reset
                            </Button>
                        </div>
                    </div>

                    <div className="px-6 py-4">
                        {transactionsError && <p className="mb-2 text-xs text-red-500">{transactionsError}</p>}

                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-transparent">
                                        <TableHead className="w-24">ID</TableHead>

                                        {/* <TableHead>Doc No</TableHead> */}
                                        <TableHead>Doc Type</TableHead>
                                        <TableHead>Transaction Type</TableHead>
                                        <TableHead className="w-24">UserID</TableHead>
                                        <TableHead className="w-24">UserName</TableHead>
                                        <TableHead className="text-center">Amount</TableHead>

                                        <TableHead className="text-center">Notes</TableHead>

                                        <TableHead className="text-center">Status</TableHead>
                                        <TableHead className="text-center">Transaction Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {!transactionsLoading && transactions.map((item) => (
                                        <TableRow key={item.transactionId}>
                                            <TableCell className="font-medium text-[#573E32]">#{item.transactionId}</TableCell>

                                            {/* <TableCell>{item.docNo ?? "-"}</TableCell> */}
                                            <TableCell>{formatDocType(item.docType)}</TableCell>
                                            <TableCell>{item.transactionType ?? "-"}</TableCell>
                                            <TableCell className="w-24">#{item.userId}</TableCell>

                                            <TableCell className="w-24">#{item.userName}</TableCell>
                                            <TableCell className="text-center font-medium text-[#573E32]">
                                                {item.totalPrice != null ? formatVND(item.totalPrice) : "-"}
                                            </TableCell>
                                            <TableCell className="max-w-60 truncate text-[#707070] text-center " title={item.notes ?? ""}>
                                                {item.notes ?? "-"}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className={`inline-flex items-center justify-center rounded-full px-2.5 py-1 text-[11px] font-medium capitalize ${getStatusClasses(item.status)}`}>
                                                    {item.status ?? "Unknown"}
                                                </span>
                                            </TableCell>
                                            {/* <TableCell className="text-center text-xs text-[#707070]">
                                                {formatDateTime(item.createAt)}
                                             
                                            </TableCell> */}
                                            <TableCell className="text-center text-xs text-[#707070]">
                                                {formatDateTime(item.transactionDate)}
                                            </TableCell>
                                        </TableRow>
                                    ))}

                                    {transactionsLoading && (
                                        <TableRow>
                                            <TableCell colSpan={9} className="py-6 text-center">
                                                <InlineLoading text="Loading transactions..." />
                                            </TableCell>
                                        </TableRow>
                                    )}

                                    {!transactionsLoading && transactions.length === 0 && !transactionsError && (
                                        <TableRow>
                                            <TableCell colSpan={9} className="py-6 text-center text-[#707070]">
                                                No transactions found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    <div className="mt-4 flex flex-col gap-3 text-xs text-[#707070] sm:flex-row sm:items-center px-6 pb-4">
                        <p>
                            Showing {fromItem} to {toItem} of {totalCount} entries
                        </p>
                        <div className="sm:ml-auto">
                            <TablePagination currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
