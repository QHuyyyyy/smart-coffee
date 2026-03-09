import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { supplierOrderService, type SupplierOrder } from "@/apis/supplierOrder.service";

export function SupplierOrderDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [order, setOrder] = useState<SupplierOrder | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

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

    if (loading) {
        return (
            <div className="mt-24 px-10 pb-10 w-full overflow-y-auto">
                <p className="text-sm text-[#707070]">Loading order detail...</p>
            </div>
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

    const entries = Object.entries(order).filter(([key]) => key !== "orderId");

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
                    <h1 className="text-xl font-semibold text-[#1F1F1F] mb-2">
                        Order #{order.orderId}
                    </h1>
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
                            <p className="mt-1 text-base font-medium capitalize">{String(order.status ?? "Unknown")}</p>
                        </div>
                    </div>
                </div>

                {/* All fields card */}
                <div className="rounded-3xl border border-[#EFE5DC] bg-white px-8 py-6">
                    <h2 className="text-sm font-semibold text-[#1F1F1F] mb-4">Order Information</h2>
                    <div className="grid gap-3 md:grid-cols-2 text-sm">
                        {entries.map(([key, value]) => (
                            <div key={key} className="flex flex-col">
                                <span className="text-[11px] font-semibold tracking-[0.12em] text-[#A08C7A] uppercase">
                                    {key}
                                </span>
                                <span className="mt-1 text-[#1F1F1F] break-words">
                                    {typeof value === "number" ? value.toLocaleString("vi-VN") : String(value)}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}
