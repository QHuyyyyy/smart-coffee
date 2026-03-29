import { useEffect, useState } from "react";
import { WalletCards } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { transactionService, type TransactionItem } from "@/apis/transaction.service";
import { InlineLoading } from "@/components/Loading";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TablePagination } from "@/components/ui/pagination";


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

export function Transaction() {
    const currentUser = useAuthStore((state) => state.currentUser);
    const [transactions, setTransactions] = useState<TransactionItem[]>([]);
    const [transactionsLoading, setTransactionsLoading] = useState(false);
    const [transactionsError, setTransactionsError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);

    const fetchTransactions = async (targetPage = page) => {
        try {
            setTransactionsLoading(true);
            setTransactionsError(null);
            const response = await transactionService.getPaginated({ page: targetPage, pageSize });
            setTransactions(response.items ?? []);
            setTotalCount(response.totalCount ?? 0);
        } catch (error: any) {
            setTransactionsError(error?.message || "Failed to load transactions.");
        } finally {
            setTransactionsLoading(false);
        }
    };

    useEffect(() => {
        void fetchTransactions(page);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [page, pageSize]);

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

                <div className="bg-white rounded-2xl shadow-sm border border-[#EFEAE5]">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between px-6 py-4 border-b border-[#EFEAE5]">
                        <h2 className="text-base font-semibold text-[#573E32]">Recent Transactions</h2>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setPage(1);
                                void fetchTransactions(1);
                            }}
                        >
                            Reset
                        </Button>
                    </div>

                    <div className="px-6 py-4">
                        {transactionsError && <p className="mb-2 text-xs text-red-500">{transactionsError}</p>}

                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-transparent">
                                        <TableHead className="w-24">ID</TableHead>
                                        <TableHead>Doc No</TableHead>
                                        <TableHead>Doc Type</TableHead>
                                        <TableHead>Transaction Type</TableHead>
                                        <TableHead className="text-center">Transaction Date</TableHead>
                                        <TableHead className="text-center">Created At</TableHead>
                                        <TableHead className="text-center">Status</TableHead>
                                        <TableHead className="text-center">Amount</TableHead>
                                        <TableHead className="text-center">Notes</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {!transactionsLoading && transactions.map((item) => (
                                        <TableRow key={item.transactionId}>
                                            <TableCell className="font-medium text-[#573E32]">#{item.transactionId}</TableCell>
                                            <TableCell>{item.docNo ?? "-"}</TableCell>
                                            <TableCell>{item.docType ?? "-"}</TableCell>
                                            <TableCell>{item.transactionType ?? "-"}</TableCell>
                                            <TableCell className="text-center text-xs text-[#707070]">
                                                {formatDateTime(item.transactionDate)}
                                            </TableCell>
                                            <TableCell className="text-center text-xs text-[#707070]">
                                                {formatDateTime(item.createAt)}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className={`inline-flex items-center justify-center rounded-full px-2.5 py-1 text-[11px] font-medium capitalize ${getStatusClasses(item.status)}`}>
                                                    {item.status ?? "Unknown"}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center font-medium text-[#573E32]">
                                                {item.totalPrice}VND
                                            </TableCell>
                                            <TableCell className="max-w-[240px] truncate text-[#707070] text-center " title={item.notes ?? ""}>
                                                {item.notes ?? "-"}
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
