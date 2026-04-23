import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Coffee, Eye } from "lucide-react";
import { TablePagination } from "@/components/ui/pagination";
import { Table, TableBody, TableHeader, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { InlineLoading } from "@/components/Loading";
import { Button } from "@/components/ui/button";
import { RecipeCreateDialog } from "@/components/RecipeCreateDialog";
import { recipeService } from "@/services/apis/recipe.service";
import { toast } from "sonner";
import { formatVND } from "@/utils/currency";

type Recipe = {
    recipeId: number;
    recipeName: string;
    image: string | null;
    flavorNote: string | null;
    proposedSellingPrice: number | null;
};

export function Recipes() {
    const navigate = useNavigate();
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [openCreateDialog, setOpenCreateDialog] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);

    const fetchRecipes = async (targetPage = 1) => {
        try {
            setLoading(true);
            setError(null);
            const response = await recipeService.getPaginatedRecipes("true", targetPage, pageSize);
            const data = response.data as any;
            const items: Recipe[] = Array.isArray(data) ? data : data.items ?? data.data ?? [];

            setRecipes(items);

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
            setError("Không tải được danh sách recipe");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchRecipes(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const totalPages = totalCount > 0 ? Math.max(1, Math.ceil(totalCount / pageSize)) : 1;
    const fromItem = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
    const toItem = totalCount === 0 ? 0 : Math.min(totalCount, page * pageSize);

    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > totalPages || newPage === page) return;
        void fetchRecipes(newPage);
    };

    const handleCreateRecipe = async (data: any) => {
        try {
            // TODO: Call the create recipe API
            console.log("Create recipe with data:", data);
            toast.success("Recipe created successfully!");
            setOpenCreateDialog(false);
            // Refresh the recipes list
            // await fetchRecipes();
        } catch (err) {
            toast.error("Failed to create recipe");
            console.error(err);
        }
    };

    const formatPrice = (value: number | null) => {
        return formatVND(value);
    };

    return (
        <div className="mt-24 px-10 pb-10 w-full overflow-y-auto">
            <div className="w-full">
                {/* Page header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold leading-tight tracking-[-0.015em] text-[#1F1F1F]">
                        Recipe Management
                    </h1>
                    <p className="mt-1 text-sm text-[#707070]">
                        Create, edit, and organize coffee recipes
                    </p>
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-[#EFEAE5]">
                    {/* Card header */}
                    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between px-6 py-4 border-b border-[#EFEAE5]">
                        <h2 className="text-base font-semibold text-[#573E32]">All Recipes</h2>

                        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                            {/* Search
                            <div className="flex items-center gap-2 rounded-full bg-[#F5F3F1] px-4 py-2 w-full sm:w-65">
                                <Search size={16} className="text-[#B0A49E]" />
                                <input
                                    type="text"
                                    placeholder="Search by name, code..."
                                    className="w-full bg-transparent text-sm text-[#573E32] placeholder:text-[#B0A49E] focus:outline-none"
                                />
                            </div> */}

                            {/* Actions */}
                            <div className="flex items-center gap-2 self-end sm:self-auto">
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="rounded-full"
                                    onClick={() => {
                                        setPage(1);
                                        void fetchRecipes(1);
                                    }}
                                >
                                    Reset
                                </Button>

                                {/* <button
                                    onClick={() => setOpenCreateDialog(true)}
                                    className="inline-flex items-center gap-2 rounded-full bg-[#573E32] px-4 py-2 text-sm font-medium text-white hover:bg-[#432d23] transition-colors"
                                >
                                    <Plus size={16} />
                                    <span>Add Recipe</span>
                                </button> */}
                            </div>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="px-6 py-4">
                        {error && (
                            <p className="mb-2 text-xs text-red-500">{error}</p>
                        )}
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-transparent">
                                        <TableHead>Code</TableHead>
                                        <TableHead>Image</TableHead>
                                        <TableHead>Recipe Name</TableHead>
                                        <TableHead>Flavor Note</TableHead>
                                        <TableHead className="text-right">Cost</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {!loading && recipes.map((recipe) => (
                                        <TableRow key={recipe.recipeId}>
                                            <TableCell>#{recipe.recipeId}</TableCell>
                                            <TableCell>
                                                {recipe.image ? (
                                                    <img
                                                        src={recipe.image}
                                                        alt={recipe.recipeName}
                                                        className="h-15 w-15     rounded-lg object-cover"
                                                    />
                                                ) : (
                                                    <div className="h-15 w-15 rounded-lg flex items-center justify-center bg-[#F2E6DA]">
                                                        <Coffee size={18} className="text-[#573E32]" />
                                                    </div>
                                                )}
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-medium text-[#573E32]">{recipe.recipeName}</span>
                                            </TableCell>
                                            <TableCell className="max-w-xs">
                                                <p className="truncate text-[#707070]">{recipe.flavorNote}</p>
                                            </TableCell>
                                            <TableCell className="text-right font-medium text-[#573E32]">
                                                {formatPrice(recipe.proposedSellingPrice)}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex justify-end gap-2 text-[#B0A49E]">
                                                    <button
                                                        className="hover:text-[#573E32]"
                                                        aria-label="View"
                                                        onClick={() => navigate(`/admin/recipes/${recipe.recipeId}`)}
                                                    >
                                                        <Eye size={16} />
                                                    </button>

                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {loading && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="py-6 text-center">
                                                <InlineLoading text="Loading Recipes..." />
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {!loading && recipes.length === 0 && !error && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="py-6 text-center text-[#707070]">
                                                No Recipes Found
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        <div className="mt-4 flex flex-col gap-3 text-xs text-[#707070] sm:flex-row sm:items-center">
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

            <RecipeCreateDialog
                open={openCreateDialog}
                onOpenChange={setOpenCreateDialog}
                onSubmit={handleCreateRecipe}
            />
        </div>
    );
}
