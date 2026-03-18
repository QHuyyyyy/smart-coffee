import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Package, Plus, Eye, Pencil, Trash2 } from "lucide-react";
import { Table, TableBody, TableHeader, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationPrevious, PaginationNext, PaginationEllipsis } from "@/components/ui/pagination";
import { supplierProductService, type SupplierProduct } from "@/apis/supplierProduct.service";
import { useAuthStore } from "@/stores/auth.store";
import { SupplierProductCreateDialog } from "@/components/SupplierProductCreateDialog";
import { SupplierProductEditDialog } from "@/components/SupplierProductEditDialog";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { InlineLoading } from "@/components/Loading";

export function SupplierProducts() {
    const currentUser = useAuthStore((state) => state.currentUser);
    const navigate = useNavigate();
    const [products, setProducts] = useState<SupplierProduct[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [openCreateDialog, setOpenCreateDialog] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [editingProduct, setEditingProduct] = useState<SupplierProduct | null>(null);
    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [deletingProduct, setDeletingProduct] = useState<SupplierProduct | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchProducts = async (targetPage = 1) => {
        if (!currentUser?.supplierId) {
            setError("Missing supplier information");
            return;
        }
        try {
            setLoading(true);
            setError(null);
            const res = await supplierProductService.getPaginatedBySupplier(currentUser.supplierId, targetPage, pageSize);
            const data = res.data as any;
            const items: SupplierProduct[] = Array.isArray(data)
                ? data
                : data.items ?? data.data ?? [];

            setProducts(items);
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
            setError("Failed to load products");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchProducts(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const totalPages = totalCount > 0 ? Math.max(1, Math.ceil(totalCount / pageSize)) : 1;
    const fromItem = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
    const toItem = totalCount === 0 ? 0 : Math.min(totalCount, page * pageSize);

    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > totalPages || newPage === page) return;
        void fetchProducts(newPage);
    };

    const formatPrice = (value: number | null | undefined) => {
        if (value === null || value === undefined || Number.isNaN(value)) return "-";
        return `${value.toLocaleString("vi-VN")}₫`;
    };

    const formatRating = (value: number | null | undefined) => {
        if (value === null || value === undefined || Number.isNaN(value)) return "-";
        return `${value.toFixed(1)} / 5`;
    };

    const formatDateTime = (value: string | null | undefined) => {
        if (!value) return "-";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return value;
        return date.toLocaleString("vi-VN");
    };

    const renderStatus = (status: string | null | undefined) => {
        const value = (status ?? "Unknown").trim();
        const normalized = value.toLowerCase();

        let badgeClasses = "bg-gray-100 text-gray-700 border border-gray-200";

        if (normalized === "available") {
            badgeClasses = "bg-emerald-50 text-emerald-700 border border-emerald-100";
        } else if (normalized.includes("low")) {
            badgeClasses = "bg-amber-50 text-amber-700 border border-amber-100";
        } else if (normalized.includes("out")) {
            badgeClasses = "bg-red-50 text-red-700 border border-red-100";
        }

        return (
            <span className={`inline-flex items-center justify-center rounded-full px-2.5 py-1 text-[11px] font-medium capitalize ${badgeClasses}`}>
                {value}
            </span>
        );
    };

    const handleConfirmDelete = async () => {
        if (!deletingProduct) return;

        try {
            setIsDeleting(true);
            await supplierProductService.delete(deletingProduct.productId);
            toast.success("Product deleted successfully");
            setConfirmDeleteOpen(false);
            setDeletingProduct(null);
            void fetchProducts(page);
        } catch (error: any) {
            console.error("Failed to delete product:", error);
            toast.error(error?.response?.data?.message || "Failed to delete product");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="mt-24 px-10 pb-10 w-full overflow-y-auto">
            <div className="w-full">
                {/* Page header */}
                <div className="mb-6 flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold leading-tight tracking-[-0.015em] text-[#1F1F1F] flex items-center gap-2">
                            <Package size={22} className="text-[#573E32]" />
                            Supplier Products
                        </h1>
                        <p className="mt-1 text-sm text-[#707070]">
                            List of ingredients/products you supply to SmartCoffee
                        </p>
                    </div>
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-[#EFEAE5]">
                    {/* Card header */}
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between px-6 py-4 border-b border-[#EFEAE5]">
                        <h2 className="text-base font-semibold text-[#573E32]">All Products</h2>

                        <div className="flex items-center gap-2 self-end md:self-auto">
                            <button
                                type="button"
                                className="inline-flex items-center gap-2 rounded-full bg-[#573E32] px-4 py-2 text-sm font-medium text-white hover:bg-[#432d23] transition-colors"
                                onClick={() => setOpenCreateDialog(true)}
                            >
                                <Plus size={16} />
                                <span>Create Product</span>
                            </button>
                        </div>
                    </div>

                    <div className="px-6 py-4">
                        {error && <p className="mb-2 text-xs text-red-500">{error}</p>}

                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-transparent">
                                        <TableHead className="w-24">ID</TableHead>
                                        <TableHead>Ingredient Name</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead className="text-center">Price</TableHead>
                                        <TableHead className="text-center">Stock (bags)</TableHead>
                                        <TableHead className="text-center">Hold Stock</TableHead>
                                        <TableHead className="text-center">Package Size</TableHead>
                                        <TableHead className="text-center">Rating</TableHead>
                                        <TableHead className="text-center">Created At</TableHead>
                                        <TableHead className="text-center">Status</TableHead>
                                        <TableHead className="text-center">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {!loading && products.map((p) => (
                                        <TableRow key={p.productId}>
                                            <TableCell className="font-medium text-[#573E32]">
                                                #{p.productId}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Package size={16} className="text-[#573E32]" />
                                                    <span className="font-medium text-[#1F1F1F]">
                                                        {p.ingredient?.name ?? "-"}
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-[#707070]">
                                                {p.ingredient?.category ?? "-"}
                                            </TableCell>
                                            <TableCell className="text-center font-medium text-[#573E32]">
                                                {formatPrice(p.price)}
                                            </TableCell>
                                            <TableCell className="text-center text-[#573E32]">
                                                {p.stock}
                                            </TableCell>
                                            <TableCell className="text-center text-[#573E32]">
                                                {p.holdStock ?? "-"}
                                            </TableCell>
                                            <TableCell className="text-center text-[#573E32]">
                                                {p.packageSize && p.measurement
                                                    ? `${p.packageSize} ${p.measurement}`
                                                    : p.measurement || "-"}
                                            </TableCell>
                                            <TableCell className="text-center text-[#573E32]">
                                                {formatRating(p.rating)}
                                            </TableCell>
                                            <TableCell className="text-center text-xs text-[#707070]">
                                                {formatDateTime(p.createDate)}
                                            </TableCell>
                                            <TableCell className="text-center text-xs">
                                                {renderStatus(p.status)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex justify-center gap-2 text-[#B0A49E]">
                                                    <button
                                                        className="hover:text-[#573E32]"
                                                        aria-label="View"
                                                        onClick={() => navigate(`/supplier/products/${p.productId}`)}
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button
                                                        className="hover:text-[#573E32]"
                                                        aria-label="Edit"
                                                        onClick={() => {
                                                            setEditingProduct(p);
                                                            setOpenEditDialog(true);
                                                        }}
                                                    >
                                                        <Pencil size={16} />
                                                    </button>
                                                    <button
                                                        className="hover:text-red-500"
                                                        aria-label="Delete"
                                                        onClick={() => {
                                                            setDeletingProduct(p);
                                                            setConfirmDeleteOpen(true);
                                                        }}
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {loading && (
                                        <TableRow>
                                            <TableCell colSpan={11} className="py-6 text-center">
                                                <InlineLoading text="Loading products..." />
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {!loading && products.length === 0 && !error && (
                                        <TableRow>
                                            <TableCell colSpan={11} className="py-6 text-center text-[#707070]">
                                                No products found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    {/* Pagination */}
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

            <SupplierProductCreateDialog
                open={openCreateDialog}
                onOpenChange={setOpenCreateDialog}
                onCreated={fetchProducts}
            />

            <SupplierProductEditDialog
                open={openEditDialog}
                onOpenChange={setOpenEditDialog}
                product={editingProduct}
                onUpdated={() => void fetchProducts(page)}
            />

            <Dialog open={confirmDeleteOpen} onOpenChange={(open) => {
                if (!open) {
                    setConfirmDeleteOpen(false);
                    setDeletingProduct(null);
                }
            }}>
                <DialogContent className="max-w-sm w-full">
                    <DialogHeader>
                        <DialogTitle>Delete product</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-[#707070]">
                        Are you sure you want to delete
                        {" "}
                        <span className="font-semibold text-[#573E32]">
                            #{deletingProduct?.productId}
                            {deletingProduct?.ingredient?.name ? ` - ${deletingProduct.ingredient.name}` : ""}
                        </span>
                        ? This action cannot be undone.
                    </p>
                    <DialogFooter className="mt-4 flex justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            disabled={isDeleting}
                            onClick={() => {
                                setConfirmDeleteOpen(false);
                                setDeletingProduct(null);
                            }}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            disabled={isDeleting}
                            onClick={() => void handleConfirmDelete()}
                        >
                            {isDeleting ? "Deleting..." : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
