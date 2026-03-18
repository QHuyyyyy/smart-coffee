import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { supplierOrderService, type SupplierOrder } from "@/apis/supplierOrder.service";
import ghnLogo from "../../assets/ghn.png";
import { useAuthStore } from "@/stores/auth.store";
import { Loading } from "@/components/Loading";

export function SupplierOrderDetail() {
    const { currentUser } = useAuthStore();
    const supplierName = currentUser?.supplierName ?? null;
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [order, setOrder] = useState<SupplierOrder | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [updatingStatus, setUpdatingStatus] = useState(false);

    useEffect(() => {
        if (!id) return;

        const fetchOrder = async () => {
            try {
                setLoading(true);
                setError(null);
                const res = await supplierOrderService.getById(Number(id));
                setOrder(res.data);
            } catch (err) {
                setError("Failed to load order detail");
            } finally {
                setLoading(false);
            }
        };

        void fetchOrder();
    }, [id]);

    const formatPrice = (value: number | null | undefined) => {
        if (value === null || value === undefined || Number.isNaN(value)) return "-";
        return `${value.toLocaleString("vi-VN")}₫`;
    };

    const formatDateTime = (value: string | null | undefined) => {
        if (!value) return "-";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return value;
        return date.toLocaleString("vi-VN");
    };

    if (loading) {
        return (
            <Loading />
        );
    }

    if (error) {
        return (
            <div className="mt-24 px-10 pb-10 w-full overflow-y-auto">
                <p className="text-sm text-red-500">{error}</p>
            </div>
        );
    }

    if (!order) {
        return (
            <div className="mt-24 px-10 pb-10 w-full overflow-y-auto">
                <p className="text-sm text-[#707070]">Order not found.</p>
            </div>
        );
    }

    const normalizeStatus = (status: string) => {
        const s = status.trim().toLowerCase();
        if (s === "cancelled") return "canceled";
        return s;
    };

    const currentStatus = normalizeStatus(String(order.status ?? ""));

    const handleUpdateStatus = async (nextStatus: string) => {
        if (!order || updatingStatus) return;

        try {
            setUpdatingStatus(true);
            setError(null);

            // When moving from Preparing -> Delivering, also call ship-GHN API
            if (
                currentStatus === "preparing" &&
                nextStatus.trim().toLowerCase() === "delivering"
            ) {
                await supplierOrderService.shipWithGHN(order.orderId);
            }
            await supplierOrderService.updateStatus(order.orderId, nextStatus);
            const res = await supplierOrderService.getById(order.orderId);
            setOrder(res.data);
        } catch (err) {
            setError("Failed to update order status");
        } finally {
            setUpdatingStatus(false);
        }
    };

    const handleTestGhnWebhook = async (nextStatus: "Delivered" | "Rejected") => {
        if (!order || updatingStatus) return;
        if (!order.ghnOrderCode) {
            // Keep it simple for staging: just show a basic alert if missing
            // so we don't break the whole page state.
            // eslint-disable-next-line no-alert
            alert("GHN order code is missing. Cannot trigger webhook.");
            return;
        }

        try {
            setUpdatingStatus(true);
            setError(null);
            await supplierOrderService.triggerGhnWebhook(order.ghnOrderCode, nextStatus);
            const res = await supplierOrderService.getById(order.orderId);
            setOrder(res.data);
        } catch (err) {
            setError("Failed to trigger GHN webhook");
        } finally {
            setUpdatingStatus(false);
        }
    };

    // Build shipment steps based on business flows:
    // 1) Pending -> Canceled
    // 2) Pending -> Preparing -> Canceled
    // 3) Pending -> Preparing -> Delivering -> Delivered -> Completed
    // 4) Pending -> Preparing -> Delivering -> Rejected -> Refunded
    const shipmentSteps = (() => {
        if (currentStatus === "canceled") {
            // Use the more detailed path that includes Preparing
            return [
                { key: "pending", label: "Pending" },
                { key: "preparing", label: "Preparing" },
                { key: "canceled", label: "Canceled" },
            ];
        }

        if (currentStatus === "rejected" || currentStatus === "refunded") {
            return [
                { key: "pending", label: "Pending" },
                { key: "preparing", label: "Preparing" },
                { key: "delivering", label: "Delivering" },
                { key: "rejected", label: "Rejected" },
                { key: "refunded", label: "Refunded" },
            ];
        }

        // Default successful delivery flow (covers Pending, Preparing, Delivering, Delivered, Completed)
        return [
            { key: "pending", label: "Pending" },
            { key: "preparing", label: "Preparing" },
            { key: "delivering", label: "Delivering" },
            { key: "delivered", label: "Delivered" },
            { key: "completed", label: "Completed" },
        ];
    })();

    const shipmentItems = Array.isArray(order.orderDetails)
        ? order.orderDetails
        : [];

    return (
        <div className="mt-24 px-10 pb-10 w-full overflow-y-auto">
            {/* Breadcrumb & back */}
            <div className="mb-6 flex items-center gap-2 text-sm text-[#A08C7A]">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-1 text-[#7A685B] hover:text-[#573E32]"
                >
                    <ChevronLeft size={16} />
                    <span>Back</span>
                </button>
                <span className="mx-2 text-[#D0C2B8]">/</span>
                <span className="font-medium text-[#573E32]">Order Detail</span>
            </div>

            <div className="space-y-6">
                {/* Summary card */}
                <div className="rounded-3xl border border-[#EFE5DC] bg-white px-8 py-6">
                    <p className="text-xs text-[#707070] mb-1">For Order ID: #{order.orderId}</p>
                    <h1 className="text-xl font-semibold text-[#1F1F1F] mb-4">Shipping Detail</h1>
                    <div className="flex flex-wrap gap-6 text-sm text-[#573E32]">
                        <div>
                            <p className="text-[11px] font-semibold tracking-[0.12em] text-[#A08C7A] uppercase">
                                Total Price
                            </p>
                            <p className="mt-1 text-xl font-semibold">{formatPrice(order.totalPrice)}</p>
                        </div>
                        <div>
                            <p className="text-[11px] font-semibold tracking-[0.12em] text-[#A08C7A] uppercase">
                                Status
                            </p>
                            <p className="mt-1 inline-flex items-center gap-2 text-sm font-medium capitalize">
                                <span className="px-3 py-1 rounded-full bg-[#F5EBE2] text-[#573E32]">
                                    {String(order.status ?? "Unknown")}
                                </span>

                            </p>
                        </div>
                        <div className="flex justify-between gap-4">
                            <span>Created At</span>
                            <span className="font-semibold text-[#1F1F1F]">{formatDateTime(order.createAt)}</span>
                        </div>
                    </div>
                </div>

                {/* Shipment status */}
                <div className="rounded-3xl border border-[#EFE5DC] bg-white px-8 py-6">
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <h2 className="text-sm font-semibold text-[#1F1F1F]">Shipment Status</h2>
                        {currentStatus === "pending" && (
                            <button
                                type="button"
                                onClick={() => handleUpdateStatus("Preparing")}
                                disabled={updatingStatus}
                                className="rounded-full bg-[#FF7A1A] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#e86b13] disabled:opacity-60"
                            >
                                {updatingStatus ? "Updating..." : "Confirm & Prepare"}
                            </button>
                        )}
                        {currentStatus === "preparing" && (
                            <button
                                type="button"
                                onClick={() => handleUpdateStatus("Delivering")}
                                disabled={updatingStatus}
                                className="rounded-full bg-[#FF7A1A] px-4 py-1.5 text-xs font-semibold text-white hover:bg-[#e86b13] disabled:opacity-60"
                            >
                                {updatingStatus ? "Updating..." : "Start Delivering"}
                            </button>
                        )}
                        {currentStatus === "delivering" && (
                            <div className="flex flex-wrap gap-2">
                                <button
                                    type="button"
                                    onClick={() => handleTestGhnWebhook("Delivered")}
                                    disabled={updatingStatus}
                                    className="rounded-full border border-dashed border-[#FF7A1A] px-4 py-1.5 text-xs font-semibold text-[#FF7A1A] hover:bg-[#FFF5EC] disabled:opacity-60"
                                >
                                    {updatingStatus ? "Testing..." : "Test Delivered (staging)"}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => handleTestGhnWebhook("Rejected")}
                                    disabled={updatingStatus}
                                    className="rounded-full border border-dashed border-red-400 px-4 py-1.5 text-xs font-semibold text-red-500 hover:bg-red-50 disabled:opacity-60"
                                >
                                    {updatingStatus ? "Testing..." : "Test Rejected (staging)"}
                                </button>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center justify-between gap-3">
                        {shipmentSteps.map((step, index) => {
                            const currentIndex = shipmentSteps.findIndex((s) => s.key === currentStatus);
                            const isActive = currentIndex === -1 ? index === 0 : index <= currentIndex;
                            return (
                                <div key={step.key} className="flex flex-1 items-center">
                                    <div className="flex flex-col items-center flex-1">
                                        <div
                                            className={`flex h-8 w-8 items-center justify-center rounded-full border text-xs font-semibold ${isActive
                                                ? "border-[#573E32] bg-[#573E32] text-white"
                                                : "border-[#EFE5DC] bg-[#F5EBE2] text-[#573E32]"
                                                }`}
                                        >
                                            {index + 1}
                                        </div>
                                        <p className="mt-2 text-xs font-medium text-[#573E32] text-center whitespace-nowrap">
                                            {step.label}
                                        </p>
                                    </div>
                                    {index !== shipmentSteps.length - 1 && (
                                        <div className="mx-2 hidden h-px flex-1 bg-[#EFE5DC] md:block" />
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Shipping information with GHN image */}
                <div className="rounded-3xl border border-[#EFE5DC] bg-white px-8 py-6 space-y-6">
                    <div className="flex items-center justify-between">
                        <h2 className="text-sm font-semibold text-[#1F1F1F]">Shipping Information</h2>

                    </div>

                    <div className="flex flex-col items-center gap-2">
                        <div className="h-20 w-20 rounded-2xl bg-[#FF7A1A] flex items-center justify-center shadow-sm">
                            <img src={ghnLogo} alt="GHN Express" className="h-11 w-11 object-contain" />
                        </div>
                        <p className="mt-1 text-sm font-semibold text-[#1F1F1F]">GHN Express</p>
                        <p className="text-xs text-[#707070]">{order.ghnOrderCode ?? "Shipper Name Not Available"}</p>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 text-xs text-[#707070]">

                        <div className="flex justify-between gap-4">
                            <span>Ship Date</span>
                            <span className="font-semibold text-[#1F1F1F]">{formatDateTime(order.shipDate)}</span>
                        </div>
                        <div className="flex justify-between gap-4">
                            <span>Receive Date</span>
                            <span className="font-semibold text-[#1F1F1F]">{formatDateTime(order.receiveDate)}</span>
                        </div>
                        <div className="md:col-span-2 flex justify-between gap-4">
                            <span>Notes</span>
                            <span className="font-semibold text-[#1F1F1F] text-right">
                                {order.notes ?? "No notes"}
                            </span>
                        </div>
                    </div>

                    <div className="grid gap-4 md:grid-cols-2 text-sm">
                        <div className="rounded-2xl border border-dashed border-[#EFE5DC] bg-[#FAF7F5] px-5 py-4">
                            <p className="text-[11px] font-semibold tracking-[0.12em] text-[#A08C7A] uppercase mb-2">
                                Shipping From
                            </p>
                            <p className="font-semibold text-[#1F1F1F]">
                                {supplierName ?? "Me"}
                            </p>
                            <p className="mt-1 text-xs text-[#707070] whitespace-pre-line">
                                {order.shipAddress ?? "123 Industrial Park Rd\nGreenville, SC 29601\nUnited States"}
                            </p>
                        </div>
                        <div className="rounded-2xl border border-dashed border-[#EFE5DC] bg-[#FAF7F5] px-5 py-4">
                            <p className="text-[11px] font-semibold tracking-[0.12em] text-[#A08C7A] uppercase mb-2">
                                Shipping To
                            </p>
                            <p className="font-semibold text-[#1F1F1F]">
                                {order.ownerName ?? "Customer"}
                            </p>
                            <p className="mt-1 text-xs text-[#707070] whitespace-pre-line">
                                {order.receiveAddress ?? "Address updating"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Items in shipment + summary */}
                <div className="grid gap-6 lg:grid-cols-[2fr,1fr] items-start">
                    <div className="rounded-3xl border border-[#EFE5DC] bg-white px-8 py-6">
                        <h2 className="text-sm font-semibold text-[#1F1F1F] mb-4">Items in Shipment</h2>
                        {shipmentItems.length === 0 ? (
                            <p className="text-xs text-[#707070]">No items found for this shipment.</p>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-[#F1E3D8] text-xs text-[#A08C7A]">
                                            <th className="py-2 text-left font-semibold">Ingredient</th>
                                            <th className="py-2 text-right font-semibold">Quantity</th>
                                            <th className="py-2 text-right font-semibold">Price</th>
                                            <th className="py-2 text-right font-semibold">Total</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {shipmentItems.map((item: any, index: number) => (
                                            <tr key={item.id ?? index} className="border-b border-[#F7EFE7] last:border-0">
                                                <td className="py-2 pr-4 text-[#1F1F1F]">
                                                    {item.ingredientName ?? item.name ?? "Item"}
                                                </td>
                                                <td className="py-2 text-right text-[#573E32]">
                                                    {item.quantity && item.unit
                                                        ? `${item.quantity} ${item.unit}`
                                                        : item.quantity ?? "-"}
                                                </td>
                                                <td className="py-2 text-right text-[#573E32]">
                                                    {formatPrice(item.price ?? 0)}
                                                </td>
                                                <td className="py-2 text-right font-semibold text-[#1F1F1F]">
                                                    {formatPrice((item.price ?? 0) * (item.quantity ?? 0))}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </div>

                    <div className="space-y-4">


                        <div className="rounded-3xl border border-[#EFE5DC] bg-white px-6 py-5 space-y-2 text-sm">
                            <h3 className="text-sm font-semibold text-[#1F1F1F] mb-2">Summary</h3>
                            <div className="flex justify-between text-xs text-[#707070]">
                                <span>Gross Amount</span>
                                <span>{formatPrice(order.grossAmount)}</span>
                            </div>
                            <div className="flex justify-between text-xs text-[#707070]">
                                <span>Supplier Amount</span>
                                <span>{formatPrice(order.supplierAmount)}</span>
                            </div>
                            <div className="flex justify-between text-xs text-[#707070]">
                                <span>Shipping Fee</span>
                                <span>{formatPrice(order.shippingFee ?? 0)}</span>
                            </div>
                            <div className="flex justify-between text-xs text-[#707070]">
                                <span>Commission</span>
                                <span>{formatPrice(order.comissionAmount)}</span>
                            </div>
                            <div className="mt-2 border-t border-[#F1E3D8] pt-2 flex justify-between text-xl font-semibold text-[#1F1F1F]">
                                <span>Total Paid</span>
                                <span>{formatPrice(order.totalPrice)}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div >
    );
}
