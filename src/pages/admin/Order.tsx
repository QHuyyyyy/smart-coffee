import { useEffect, useState } from "react";
import { ClipboardList, CheckCircle } from "lucide-react";
import { Table, TableBody, TableHeader, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { orderService, type SystemOrder } from "@/apis/order.service";
import { InlineLoading } from "@/components/Loading";
import { Button } from "@/components/ui/button";
import { TablePagination } from "@/components/ui/pagination";
import { formatVND } from "@/utils/currency";

export function AdminOrders() {
    const [orders, setOrders] = useState<SystemOrder[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [statusFilter, setStatusFilter] = useState<string | null>("Pending");

    const fetchOrders = async (targetPage = 1, status: string | null = statusFilter) => {
        try {
            setLoading(true);
            setError(null);
            const res = await orderService.getPaginated(targetPage, pageSize, status ?? undefined);
            const data = res.data as any;
            const items: SystemOrder[] = Array.isArray(data)
                ? data
                : data.items ?? data.data ?? [];

            setOrders(items);
            if (typeof data.totalCount === "number") {
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
            setError("Failed to load orders");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchOrders(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const totalPages = totalCount > 0 ? Math.max(1, Math.ceil(totalCount / pageSize)) : 1;
    const fromItem = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
    const toItem = totalCount === 0 ? 0 : Math.min(totalCount, page * pageSize);

    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > totalPages || newPage === page) return;
        void fetchOrders(newPage);
    };

    const handleReset = () => {
        setStatusFilter(null);
        setPage(1);
        void fetchOrders(1, null);
    };

    const formatPrice = (value: number | null | undefined) => {
        return formatVND(value);
    };

    const renderStatus = (status: string | null | undefined) => {
        const value = (status ?? "Unknown").trim();
        const normalized = value.toLowerCase();

        let badgeClasses = "bg-gray-100 text-gray-700 border border-gray-200";

        if (normalized.includes("pending")) {
            badgeClasses = "bg-amber-50 text-amber-700 border border-amber-100";
        } else if (normalized.includes("completed") || normalized.includes("success") || normalized.includes("refund")) {
            badgeClasses = "bg-emerald-50 text-emerald-700 border border-emerald-100";
        } else if (normalized.includes("cancel") || normalized.includes("reject")) {
            badgeClasses = "bg-red-50 text-red-700 border border-red-100";
        }

        return (
            <span className={`inline-flex items-center justify-center rounded-full px-2.5 py-1 text-[11px] font-medium capitalize ${badgeClasses}`}>
                {value}
            </span>
        );
    };

    const handleRefundOrder = async (orderId: number) => {
        try {
            setLoading(true);
            setError(null);
            await orderService.updateStatus(orderId, "Refunded");
            await fetchOrders(page);
        } catch {
            setError("Failed to accept refund");
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="mt-24 px-10 pb-10 w-full overflow-y-auto">
            <div className="w-full">
                <div className="mb-6 flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold leading-tight tracking-[-0.015em] text-[#1F1F1F] flex items-center gap-2">
                            <ClipboardList size={22} className="text-[#573E32]" />
                            System Orders Management
                        </h1>
                        <p className="mt-1 text-sm text-[#707070]">
                            Manage all system orders seamlessly
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-[#EFEAE5]">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between px-6 py-4 border-b border-[#EFEAE5]">
                        <h2 className="text-base font-semibold text-[#573E32]">Orders</h2>
                        <div className="flex flex-wrap items-center gap-6 text-sm text-[#B0A49E]">
                            {[
                                { key: null, label: "All" },
                                { key: "Pending", label: "Pending" },
                                { key: "Preparing", label: "Preparing" },
                                { key: "Delivering", label: "Delivering" },
                                { key: "Delivered", label: "Delivered" },
                                { key: "Cancelled", label: "Cancelled" },
                                { key: "Rejected", label: "Rejected" },
                                { key: "Refunded", label: "Refunded" },
                                { key: "Completed", label: "Completed" },
                            ].map((item) => {
                                const active = statusFilter === item.key;
                                return (
                                    <button
                                        key={item.label}
                                        type="button"
                                        className={`inline-flex items-center gap-2 pb-1 border-b-2 transition-colors ${active
                                            ? "border-[#573E32] text-[#573E32] font-semibold"
                                            : "border-transparent hover:text-[#573E32]"
                                            }`}
                                        onClick={() => {
                                            const nextStatus = item.key;
                                            setStatusFilter(nextStatus);
                                            void fetchOrders(1, nextStatus);
                                        }}
                                    >
                                        <span>{item.label}</span>
                                    </button>
                                );
                            })}
                        </div>
                        <Button type="button" variant="outline" size="sm" onClick={handleReset}>
                            Reset
                        </Button>
                    </div>

                    <div className="px-6 py-4">
                        {error && <p className="mb-2 text-xs text-red-500">{error}</p>}

                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-transparent">
                                        <TableHead className="w-24">Order #</TableHead>
                                        <TableHead className="text-center">Owner Name</TableHead>
                                        <TableHead className="text-right">Total Price</TableHead>
                                        <TableHead className="text-right">Status</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {!loading && orders.map((o) => (
                                        <TableRow key={o.orderId}>
                                            <TableCell className="font-medium text-[#573E32]">{o.orderId}</TableCell>
                                            <TableCell className="text-center font-medium text-[#573E32]">
                                                {o.ownerName || "-"}
                                            </TableCell>
                                            <TableCell className="text-right font-medium text-[#573E32]">
                                                {formatPrice(o.totalPrice)}
                                            </TableCell>
                                            <TableCell className="text-right text-xs">
                                                {renderStatus(o.status)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex justify-end gap-3 text-[#B0A49E]">
                                                    {/* We can navigate if there's an admin detail page, skipping detail link for now if none exists */}
                                                    {/* 
                                                    <button
                                                        className="hover:text-[#573E32]"
                                                        aria-label="View order detail"
                                                        onClick={() => navigate(`/admin/orders/${o.orderId}`)}
                                                    >
                                                        <Eye size={16} />
                                                    </button>
 */}
                                                    {["cancelled", "rejected"].includes((o.status ?? "").toLowerCase()) && (
                                                        <button
                                                            className="hover:text-amber-600 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
                                                            onClick={() => handleRefundOrder(o.orderId)}
                                                            disabled={loading}
                                                            title="Accept Refund"
                                                        >
                                                            <CheckCircle size={16} /> Refund
                                                        </button>
                                                    )}
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {loading && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="py-6 text-center">
                                                <InlineLoading text="Loading orders..." />
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {!loading && orders.length === 0 && !error && (
                                        <TableRow>
                                            <TableCell colSpan={10} className="py-6 text-center text-[#707070]">
                                                No orders found.
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

