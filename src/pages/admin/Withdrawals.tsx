import { useEffect, useState } from "react";
import { WalletCards } from "lucide-react";
import { walletService } from "@/apis/wallet.service";
import { InlineLoading } from "@/components/Loading";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationEllipsis, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";

interface WithdrawalRow {
    walletWithdrawalId: number;
    walletId: number | null;
    amount: number | null;
    status: string | null;
    balanceBefore: number | null;
    balanceAfter: number | null;
    createAt: string | null;
}

export function AdminWithdrawalsPage() {
    const [status, setStatus] = useState<string | null>("Pending");
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [rows, setRows] = useState<WithdrawalRow[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchData = async (targetPage = 1, targetStatus: string | null = status) => {
        try {
            setIsLoading(true);
            setError(null);
            const response = await walletService.getWithdrawals({
                status: targetStatus || undefined,
                page: targetPage,
                pageSize,
            });
            const data = response as any;
            const items: WithdrawalRow[] = Array.isArray(data)
                ? data
                : data.items ?? data.data ?? [];

            setRows(items);

            if (typeof data.totalItems === "number") {
                setTotalCount(data.totalItems);
            } else if (typeof data.totalCount === "number") {
                setTotalCount(data.totalCount);
            } else {
                setTotalCount(items.length);
            }

            if (typeof data.page === "number") {
                setPage(data.page);
            } else {
                setPage(targetPage);
            }
        } catch (err) {
            setError("Failed to load withdrawals");
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        void fetchData(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const handleUpdateStatus = async (id: number, newStatus: string) => {
        await walletService.updateWithdrawStatus(id, { status: newStatus });
        await fetchData(page);
    };
    const totalPages = totalCount > 0 ? Math.max(1, Math.ceil(totalCount / pageSize)) : 1;
    const fromItem = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
    const toItem = totalCount === 0 ? 0 : Math.min(totalCount, page * pageSize);

    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > totalPages || newPage === page) return;
        void fetchData(newPage);
    };

    const renderStatusBadge = (value: string | null | undefined) => {
        const raw = (value ?? "-").trim();
        const normalized = raw.toLowerCase();

        let badgeClasses = "bg-gray-100 text-gray-700 border border-gray-200";

        if (normalized === "pending") {
            badgeClasses = "bg-amber-50 text-amber-700 border border-amber-100";
        } else if (normalized === "processing") {
            badgeClasses = "bg-sky-50 text-sky-700 border border-sky-100";
        } else if (normalized === "completed") {
            badgeClasses = "bg-emerald-50 text-emerald-700 border border-emerald-100";
        } else if (normalized === "cancelled" || normalized === "rejected") {
            badgeClasses = "bg-red-50 text-red-700 border border-red-100";
        }

        return (
            <span className={`inline-flex items-center justify-center rounded-full px-2.5 py-1 text-[11px] font-medium capitalize ${badgeClasses}`}>
                {raw}
            </span>
        );
    };

    return (
        <div className="mt-24 px-10 pb-10 w-full overflow-y-auto">
            <div className="w-full">
                <div className="mb-6 flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold leading-tight tracking-[-0.015em] text-[#1F1F1F] flex items-center gap-2">
                            <WalletCards size={22} className="text-[#573E32]" />
                            Withdrawals
                        </h1>
                        <p className="mt-1 text-sm text-[#707070]">
                            Danh sách yêu cầu rút tiền của supplier
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-[#EFEAE5]">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between px-6 py-4 border-b border-[#EFEAE5]">
                        <h2 className="text-base font-semibold text-[#573E32]">Withdrawals</h2>
                        <div className="flex flex-wrap items-center gap-6 text-sm text-[#B0A49E]">
                            {[
                                { key: null, label: "All" },
                                { key: "Pending", label: "Pending" },
                                { key: "Processing", label: "Processing" },
                                { key: "Cancelled", label: "Cancelled" },
                                { key: "Rejected", label: "Rejected" },
                                { key: "Completed", label: "Completed" },
                            ].map((item) => {
                                const active = status === item.key;
                                return (
                                    <button
                                        key={item.label}
                                        type="button"
                                        className={`inline-flex items-center gap-2 pb-1 border-b-2 transition-colors ${active
                                            ? "border-[#573E32] text-[#573E32] font-semibold"
                                            : "border-transparent hover:text-[#573E32]"}
                                        `}
                                        onClick={() => {
                                            const nextStatus = item.key;
                                            setStatus(nextStatus as string | null);
                                            void fetchData(1, nextStatus as string | null);
                                        }}
                                    >
                                        <span>{item.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    <div className="px-6 py-4">
                        {error && <p className="mb-2 text-xs text-red-500">{error}</p>}

                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-transparent">
                                        <TableHead className="w-24">ID</TableHead>
                                        <TableHead className="text-center">Wallet</TableHead>
                                        <TableHead className="text-right">Amount</TableHead>
                                        <TableHead className="text-right">Status</TableHead>
                                        <TableHead className="text-right">Date</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {!isLoading && rows.map((w) => {
                                        const statusLower = (w.status ?? "").toLowerCase();
                                        return (
                                            <TableRow key={w.walletWithdrawalId}>
                                                <TableCell className="font-medium text-[#573E32]">#{w.walletWithdrawalId}</TableCell>
                                                <TableCell className="text-center font-medium text-[#573E32]">
                                                    {w.walletId ?? "-"}
                                                </TableCell>
                                                <TableCell className="text-right font-medium text-[#573E32]">
                                                    {w.amount?.toLocaleString("vi-VN") ?? "-"}
                                                </TableCell>
                                                <TableCell className="text-right text-xs">
                                                    {renderStatusBadge(w.status)}
                                                </TableCell>
                                                <TableCell className="text-right text-xs text-[#707070]">
                                                    {w.createAt ? new Date(w.createAt).toLocaleString() : "-"}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex justify-end gap-3 text-[#B0A49E]">
                                                        {statusLower === "pending" && (
                                                            <>
                                                                <button
                                                                    type="button"
                                                                    className="text-xs font-medium text-emerald-700 hover:text-emerald-800"
                                                                    onClick={() => handleUpdateStatus(w.walletWithdrawalId, "Processing")}
                                                                >
                                                                    Confirm
                                                                </button>
                                                                <button
                                                                    type="button"
                                                                    className="text-xs font-medium text-red-600 hover:text-red-700"
                                                                    onClick={() => handleUpdateStatus(w.walletWithdrawalId, "Rejected")}
                                                                >
                                                                    Reject
                                                                </button>
                                                            </>
                                                        )}
                                                        {statusLower === "processing" && (
                                                            <button
                                                                type="button"
                                                                className="text-xs font-medium text-[#573E32] hover:text-[#3b2218]"
                                                                onClick={() => handleUpdateStatus(w.walletWithdrawalId, "Completed")}
                                                            >
                                                                Mark Completed
                                                            </button>
                                                        )}
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}
                                    {isLoading && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="py-6 text-center">
                                                <InlineLoading text="Loading withdrawals..." />
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {!isLoading && rows.length === 0 && !error && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="py-6 text-center text-[#707070]">
                                                No withdrawals found.
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
                            <Pagination className="w-auto mx-0 justify-end">
                                <PaginationContent>
                                    <PaginationItem>
                                        <PaginationPrevious
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handlePageChange(page - 1);
                                            }}
                                        />
                                    </PaginationItem>
                                    {Array.from({ length: totalPages }).slice(0, 5).map((_, index) => {
                                        const pageNumber = index + 1;
                                        return (
                                            <PaginationItem key={pageNumber}>
                                                <PaginationLink
                                                    href="#"
                                                    isActive={pageNumber === page}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        handlePageChange(pageNumber);
                                                    }}
                                                >
                                                    {pageNumber}
                                                </PaginationLink>
                                            </PaginationItem>
                                        );
                                    })}
                                    {totalPages > 5 && (
                                        <>
                                            <PaginationItem>
                                                <PaginationEllipsis />
                                            </PaginationItem>
                                            <PaginationItem>
                                                <PaginationLink
                                                    href="#"
                                                    isActive={page === totalPages}
                                                    onClick={(e) => {
                                                        e.preventDefault();
                                                        handlePageChange(totalPages);
                                                    }}
                                                >
                                                    {totalPages}
                                                </PaginationLink>
                                            </PaginationItem>
                                        </>
                                    )}
                                    <PaginationItem>
                                        <PaginationNext
                                            href="#"
                                            onClick={(e) => {
                                                e.preventDefault();
                                                handlePageChange(page + 1);
                                            }}
                                        />
                                    </PaginationItem>
                                </PaginationContent>
                            </Pagination>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
