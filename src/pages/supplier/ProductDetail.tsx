import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { supplierProductService, type SupplierProduct } from "@/apis/supplierProduct.service";
import { useAuthStore } from "@/stores/auth.store";
import { toast } from "sonner";
import { formatVND } from "@/utils/currency";

export function SupplierProductDetail() {
    const currentUser = useAuthStore((state) => state.currentUser);
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [product, setProduct] = useState<SupplierProduct | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;

        const fetchProduct = async () => {
            const currentSupplierId = currentUser?.supplierId ?? null;
            try {
                setLoading(true);
                setError(null);
                const res = await supplierProductService.getById(Number(id));

                if (res.data.supplierId !== currentSupplierId) {
                    toast.error("Permission denied");
                    navigate("/supplier/products", { replace: true });
                    return;
                }

                setProduct(res.data);
            } catch (err) {
                setError("Failed to load product detail");
            } finally {
                setLoading(false);
            }
        };

        void fetchProduct();
    }, [id, currentUser?.supplierId, navigate]);

    const formatPrice = (value: number | null | undefined) => {
        return formatVND(value);
    };

    const formatRating = (value: number | null | undefined) => {
        if (value === null || value === undefined || Number.isNaN(value)) return "-";
        return `${value.toFixed(1)} / 5`;
    };

    if (loading) {
        return (
            <div className="mt-24 px-10 pb-10 w-full overflow-y-auto">
                <p className="text-sm text-[#707070]">Loading product detail...</p>
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

    if (!product) {
        return (
            <div className="mt-24 px-10 pb-10 w-full overflow-y-auto">
                <p className="text-sm text-[#707070]">Product not found.</p>
            </div>
        );
    }

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
                <span className="font-medium text-[#573E32]">Product Detail</span>
            </div>

            <div className="space-y-6">
                {/* Hero card */}
                <div className="overflow-hidden rounded-3xl border border-[#EFE5DC] bg-white shadow-sm">
                    {product.image && (
                        <div className="w-full bg-[#111] flex items-center justify-center">
                            <img
                                src={product.image}
                                alt={product.ingredient?.name}
                                className="max-h-80 w-full object-contain"
                            />
                        </div>
                    )}
                    {!product.image && (
                        <div className="h-48 w-full bg-linear-to-r from-[#3B2618] to-[#8B5E3C]" />
                    )}

                    <div className="px-8 py-6">
                        <h1 className="text-2xl font-semibold text-[#1F1F1F]">
                            {product.ingredient?.name ?? "Unnamed Product"}
                        </h1>
                        {product.description && (
                            <p className="mt-1 text-sm text-[#707070]">{product.description}</p>
                        )}


                    </div>
                </div>

                {/* Stock & pricing card */}
                <div className="rounded-3xl border border-[#EFE5DC] bg-white px-8 py-6">
                    <h2 className="text-sm font-semibold text-[#1F1F1F]">Stock &amp; Pricing</h2>

                    <div className="mt-6 grid gap-6 md:grid-cols-2 xl:grid-cols-5">
                        <div>
                            <p className="text-[11px] font-semibold tracking-[0.12em] text-[#A08C7A] uppercase">
                                Current Price
                            </p>
                            <p className="mt-2 text-3xl font-semibold tracking-tight text-[#1F1F1F]">
                                {formatPrice(product.price)}
                            </p>
                            <p className="mt-1 text-xs text-[#A08C7A]">
                                per bag
                                {product.packageSize
                                    ? ` (${product.packageSize} ${product.measurement})`
                                    : product.measurement
                                        ? ` (${product.measurement})`
                                        : ""}
                            </p>
                        </div>

                        <div className="rounded-2xl bg-[#FFF7F0] px-5 py-4">
                            <p className="text-[11px] font-semibold tracking-[0.12em] text-[#A08C7A] uppercase">
                                Stock Level
                            </p>
                            <p className="mt-2 text-xl font-semibold text-[#1F1F1F]">{product.stock}</p>
                            <p className="mt-1 text-xs text-[#A08C7A]">
                                bags available
                                {product.packageSize && product.measurement
                                    ? ` • each ${product.packageSize} ${product.measurement}`
                                    : ""}
                            </p>
                        </div>

                        <div className="rounded-2xl bg-[#FFF7F0] px-5 py-4">
                            <p className="text-[11px] font-semibold tracking-[0.12em] text-[#A08C7A] uppercase">
                                Hold Stock
                            </p>
                            <p className="mt-2 text-xl font-semibold text-[#1F1F1F]">{product.holdStock ?? "-"}</p>
                            <p className="mt-1 text-xs text-[#A08C7A]">bags on hold</p>
                        </div>

                        <div className="rounded-2xl bg-[#FFF7F0] px-5 py-4">
                            <p className="text-[11px] font-semibold tracking-[0.12em] text-[#A08C7A] uppercase">
                                Measurement
                            </p>
                            <p className="mt-2 text-xl font-semibold text-[#1F1F1F]">
                                {product.packageSize && product.measurement
                                    ? `${product.packageSize} ${product.measurement} / bag`
                                    : product.measurement}
                            </p>
                            <p className="mt-1 text-xs text-[#A08C7A]">weight per bag</p>
                        </div>

                        <div className="rounded-2xl bg-[#FFF7F0] px-5 py-4">
                            <p className="text-[11px] font-semibold tracking-[0.12em] text-[#A08C7A] uppercase">
                                Rating
                            </p>
                            <p className="mt-2 text-xl font-semibold text-[#1F1F1F]">{formatRating(product.rating)}</p>
                            <p className="mt-1 text-xs text-[#A08C7A]">average product score</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
