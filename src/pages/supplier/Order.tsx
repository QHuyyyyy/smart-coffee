import { useEffect, useState } from "react";
import { ClipboardList, Eye, XCircle } from "lucide-react";
import { Table, TableBody, TableHeader, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { TablePagination } from "@/components/ui/pagination";
import { supplierOrderService, type SupplierOrder } from "@/apis/supplierOrder.service";
import { useAuthStore } from "@/stores/auth.store";
import { useNavigate } from "react-router-dom";
import { InlineLoading } from "@/components/Loading";
import { Button } from "@/components/ui/button";
import { formatVND } from "@/utils/currency";

export function SupplierOrders() {
    const navigate = useNavigate();
    const currentUser = useAuthStore((state) => state.currentUser);
    const [orders, setOrders] = useState<SupplierOrder[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [statusFilter, setStatusFilter] = useState<string | null>("Pending");

    const fetchOrders = async (targetPage = 1, status: string | null = statusFilter) => {
        if (!currentUser?.supplierId) {
            setError("Missing supplier information");
            return;
        }

        try {
            setLoading(true);
            setError(null);
            const res = await supplierOrderService.getPaginatedBySupplier(
                currentUser.supplierId,
                targetPage,
                pageSize,
                status ?? undefined,
            );
            const data = res.data as any;
            const items: SupplierOrder[] = Array.isArray(data)
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

    const formatPrice = (value: number | null | undefined) => {
        return formatVND(value);
    };

    const renderStatus = (status: string | null | undefined) => {
        const value = (status ?? "Unknown").trim();
        const normalized = value.toLowerCase();

        let badgeClasses = "bg-gray-100 text-gray-700 border border-gray-200";

        if (normalized.includes("pending")) {
            badgeClasses = "bg-[#FFF6E4] text-[#C8811A] border border-[#F2E1B6]";
        } else if (normalized.includes("preparing")) {
            badgeClasses = "bg-[#FFF0E6] text-[#D46A1D] border border-[#F3D3BF]";
        } else if (normalized.includes("delivering")) {
            badgeClasses = "bg-[#EAF3FF] text-[#2F6FB3] border border-[#CFE2F8]";
        } else if (normalized.includes("delivered")) {
            badgeClasses = "bg-[#E8F3FF] text-[#2E6FB3] border border-[#CDE1F7]";
        } else if (normalized.includes("completed") || normalized.includes("success")) {
            badgeClasses = "bg-[#E8F6EE] text-[#2E8B57] border border-[#CFEAD9]";
        } else if (normalized.includes("rejected")) {
            badgeClasses = "bg-[#FDECEC] text-[#C24242] border border-[#F8D1D1]";
        } else if (normalized.includes("refunded")) {
            badgeClasses = "bg-[#EEF1F5] text-[#5E6B7A] border border-[#DEE5EE]";
        } else if (normalized.includes("cancel")) {
            badgeClasses = "bg-[#FDECEC] text-[#C24242] border border-[#F8D1D1]";
        }

        return (
            <span className={`inline-flex items-center justify-center rounded-full px-2.5 py-1 text-[11px] font-medium capitalize ${badgeClasses}`}>
                {value}
            </span>
        );
    };

    const handleCancelOrder = async (orderId: number) => {
        try {
            setLoading(true);
            setError(null);
            await supplierOrderService.updateStatus(orderId, "Cancelled");
            await fetchOrders(page);
        } catch {
            setError("Failed to cancel order");
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
                            Supplier Orders
                        </h1>
                        <p className="mt-1 text-sm text-[#707070]">
                            Danh sách đơn đặt hàng từ SmartCoffee
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
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                                setStatusFilter(null);
                                setPage(1);
                                void fetchOrders(1, null);
                            }}
                        >
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
                                                {o.ownerName}
                                            </TableCell>
                                            <TableCell className="text-right font-medium text-[#573E32]">
                                                {formatPrice(o.totalPrice)}
                                            </TableCell>
                                            <TableCell className="text-right text-xs">
                                                {renderStatus(o.status)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex justify-end gap-3 text-[#B0A49E]">
                                                    <button
                                                        className="hover:text-[#573E32]"
                                                        aria-label="View order detail"
                                                        onClick={() => navigate(`/supplier/orders/${o.orderId}`)}
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    {!(o.status ?? "").toLowerCase().includes("cancel") && (
                                                        <button
                                                            className="hover:text-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                                            onClick={() => handleCancelOrder(o.orderId)}
                                                            disabled={loading}
                                                        >
                                                            <XCircle size={16} />
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
