import { useEffect, useState } from "react";
import { Carrot, Plus, Pencil, Search, Trash2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TablePagination } from "@/components/ui/pagination";
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { InlineLoading } from "@/components/Loading";
import { ingredientService, type Ingredient } from "@/apis/ingredient.service";
import { IngredientCreateDialog } from "@/components/IngredientCreateDialog";
import { IngredientEditDialog } from "@/components/IngredientEditDialog";
import { toast } from "sonner";

export function AdminIngredientsPage() {
    const [ingredients, setIngredients] = useState<Ingredient[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);

    const [nameFilterInput, setNameFilterInput] = useState("");
    const [nameFilter, setNameFilter] = useState("");
    const [categoryFilter, setCategoryFilter] = useState("");

    const [openCreateDialog, setOpenCreateDialog] = useState(false);
    const [openEditDialog, setOpenEditDialog] = useState(false);
    const [editingIngredient, setEditingIngredient] = useState<Ingredient | null>(null);

    const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
    const [deletingIngredient, setDeletingIngredient] = useState<Ingredient | null>(null);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchIngredients = async (targetPage = 1, nextNameFilter = nameFilter, nextCategoryFilter = categoryFilter) => {
        try {
            setLoading(true);
            setError(null);

            const response = await ingredientService.getPaginated({
                page: targetPage,
                pageSize,
                name: nextNameFilter.trim() || undefined,
                category: nextCategoryFilter.trim() || undefined,
            });

            const data = response.data as any;
            const items: Ingredient[] = Array.isArray(data) ? data : data.items ?? data.data ?? [];

            setIngredients(items);
            setTotalCount(typeof data.totalCount === "number" ? data.totalCount : items.length);
            setPage(typeof data.page === "number" ? data.page : targetPage);
        } catch (err: any) {
            console.error("Failed to load ingredients:", err);
            setError(err?.response?.data?.message || "Failed to load ingredients");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchIngredients(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const totalPages = totalCount > 0 ? Math.max(1, Math.ceil(totalCount / pageSize)) : 1;
    const fromItem = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
    const toItem = totalCount === 0 ? 0 : Math.min(totalCount, page * pageSize);

    const handlePageChange = (nextPage: number) => {
        if (nextPage < 1 || nextPage > totalPages || nextPage === page) return;
        void fetchIngredients(nextPage);
    };

    const handleApplyFilter = () => {
        const nextName = nameFilterInput.trim();
        setNameFilter(nextName);
        setPage(1);
        void fetchIngredients(1, nextName, categoryFilter);
    };

    const handleResetFilter = () => {
        setNameFilterInput("");
        setNameFilter("");
        setCategoryFilter("");
        setPage(1);
        void fetchIngredients(1, "", "");
    };

    const formatDateTime = (value: string | null | undefined) => {
        if (!value) return "-";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return value;
        return date.toLocaleString("vi-VN");
    };

    const formatEndDate = (value: string | null | undefined) => {
        if (!value) return "-";
        if (value.startsWith("0001-01-01")) return "-";
        return formatDateTime(value);
    };

    const handleConfirmDelete = async () => {
        if (!deletingIngredient) return;
        try {
            setIsDeleting(true);
            await ingredientService.delete(deletingIngredient.ingredientId);
            toast.success("Ingredient deleted successfully");
            setConfirmDeleteOpen(false);
            setDeletingIngredient(null);
            void fetchIngredients(page);
        } catch (err: any) {
            console.error("Failed to delete ingredient:", err);
            toast.error(err?.response?.data?.message || "Failed to delete ingredient");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="mt-24 px-10 pb-10 w-full overflow-y-auto">
            <div className="w-full">
                <div className="mb-6 flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold leading-tight tracking-[-0.015em] text-[#1F1F1F] flex items-center gap-2">
                            <Carrot size={22} className="text-[#573E32]" />
                            Ingredient Management
                        </h1>
                        <p className="mt-1 text-sm text-[#707070]">
                            Manage ingredient catalog for the admin system.
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-[#EFEAE5]">
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between px-6 py-4 border-b border-[#EFEAE5]">
                        <h2 className="text-base font-semibold text-[#573E32]">All Ingredients</h2>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            <div className="flex items-center gap-2 rounded-full bg-[#F5F3F1] px-4 py-2 w-full sm:w-80">
                                <Search size={16} className="text-[#B0A49E]" />
                                <input
                                    type="text"
                                    placeholder="Search by ingredient name..."
                                    value={nameFilterInput}
                                    onChange={(e) => setNameFilterInput(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === "Enter") {
                                            e.preventDefault();
                                            handleApplyFilter();
                                        }
                                    }}
                                    className="w-full bg-transparent text-sm text-[#573E32] placeholder:text-[#B0A49E] focus:outline-none"
                                />
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-auto">
                                <Button type="button" variant="outline" className="rounded-full" onClick={handleResetFilter}>
                                    Reset
                                </Button>

                                <button
                                    type="button"
                                    className="inline-flex items-center gap-2 rounded-full bg-[#573E32] px-4 py-2 text-sm font-medium text-white hover:bg-[#432d23] transition-colors"
                                    onClick={() => setOpenCreateDialog(true)}
                                >
                                    <Plus size={16} />
                                    <span>Add Ingredient</span>
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="px-6 py-4">
                        {error && <p className="mb-2 text-xs text-red-500">{error}</p>}

                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-transparent">
                                        <TableHead className="w-20">ID</TableHead>
                                        <TableHead>Image</TableHead>
                                        <TableHead>Name</TableHead>
                                        <TableHead>Category</TableHead>
                                        <TableHead className="text-center">Create Date</TableHead>
                                        <TableHead className="text-center">End Date</TableHead>
                                        <TableHead className="text-center">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {!loading && ingredients.map((ingredient) => (
                                        <TableRow key={ingredient.ingredientId}>
                                            <TableCell className="font-medium text-[#573E32]">#{ingredient.ingredientId}</TableCell>
                                            <TableCell>
                                                {ingredient.image ? (
                                                    <img
                                                        src={ingredient.image}
                                                        alt={ingredient.name}
                                                        className="h-10 w-10 rounded-md object-cover border border-[#EFEAE5]"
                                                    />
                                                ) : (
                                                    <div className="h-10 w-10 rounded-md border border-dashed border-[#D9CEC8] text-[10px] text-[#B8AAA0] flex items-center justify-center">
                                                        No Img
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell className="font-medium text-[#1F1F1F]">{ingredient.name}</TableCell>
                                            <TableCell className="text-[#707070]">{ingredient.category}</TableCell>
                                            <TableCell className="text-center text-xs text-[#707070]">
                                                {formatDateTime(ingredient.createDate)}
                                            </TableCell>
                                            <TableCell className="text-center text-xs text-[#707070]">
                                                {formatEndDate(ingredient.endDate)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex justify-center gap-2 text-[#B0A49E]">
                                                    <button
                                                        className="hover:text-[#573E32]"
                                                        aria-label="Edit"
                                                        onClick={() => {
                                                            setEditingIngredient(ingredient);
                                                            setOpenEditDialog(true);
                                                        }}
                                                    >
                                                        <Pencil size={16} />
                                                    </button>
                                                    <button
                                                        className="hover:text-red-500"
                                                        aria-label="Delete"
                                                        onClick={() => {
                                                            setDeletingIngredient(ingredient);
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
                                            <TableCell colSpan={7} className="py-6 text-center">
                                                <InlineLoading text="Loading ingredients..." />
                                            </TableCell>
                                        </TableRow>
                                    )}

                                    {!loading && ingredients.length === 0 && !error && (
                                        <TableRow>
                                            <TableCell colSpan={7} className="py-6 text-center text-[#707070]">
                                                No ingredients found.
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

            <IngredientCreateDialog
                open={openCreateDialog}
                onOpenChange={setOpenCreateDialog}
                onCreated={() => void fetchIngredients(1)}
            />

            <IngredientEditDialog
                open={openEditDialog}
                onOpenChange={setOpenEditDialog}
                ingredient={editingIngredient}
                onUpdated={() => void fetchIngredients(page)}
            />

            <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="text-base">Delete Ingredient</DialogTitle>
                    </DialogHeader>
                    <p className="text-sm text-[#707070]">
                        Are you sure you want to delete
                        {" "}
                        <span className="font-semibold text-[#1F1F1F]">
                            {deletingIngredient ? `${deletingIngredient.name} (#${deletingIngredient.ingredientId})` : "this ingredient"}
                        </span>
                        ?
                    </p>
                    <DialogFooter>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => setConfirmDeleteOpen(false)}
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            variant="destructive"
                            onClick={() => void handleConfirmDelete()}
                            disabled={isDeleting}
                        >
                            {isDeleting ? "Deleting..." : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
