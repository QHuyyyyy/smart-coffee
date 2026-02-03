import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, SlidersHorizontal, Plus, Coffee, Eye, Pencil, Trash2 } from "lucide-react";
import {
    Pagination,
    PaginationContent,
    PaginationItem,
    PaginationLink,
    PaginationPrevious,
    PaginationNext,
    PaginationEllipsis,
} from "@/components/ui/pagination";
import { Table, TableBody, TableHeader, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { recipeService } from "@/apis/recipe.service";

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

    useEffect(() => {
        const fetchRecipes = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await recipeService.getAllRecipes();
                const data = Array.isArray(response.data) ? response.data : response.data?.data ?? [];
                setRecipes(data as Recipe[]);
            } catch (err) {
                setError("Không tải được danh sách recipe");
            } finally {
                setLoading(false);
            }
        };

        fetchRecipes();
    }, []);

    const formatPrice = (value: number | null) => {
        if (!value || Number.isNaN(value)) return "-";
        return `${value.toLocaleString("vi-VN")}₫`;
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
                            {/* Search */}
                            <div className="flex items-center gap-2 rounded-full bg-[#F5F3F1] px-4 py-2 w-full sm:w-[260px]">
                                <Search size={16} className="text-[#B0A49E]" />
                                <input
                                    type="text"
                                    placeholder="Search by name, code..."
                                    className="w-full bg-transparent text-sm text-[#573E32] placeholder:text-[#B0A49E] focus:outline-none"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex items-center gap-2 self-end sm:self-auto">
                                <button className="inline-flex items-center gap-2 rounded-full border border-[#E0D5D0] bg-white px-4 py-2 text-sm font-medium text-[#573E32] hover:bg-[#F5F3F1] transition-colors">
                                    <SlidersHorizontal size={16} />
                                    <span>Filter</span>
                                </button>

                                <button className="inline-flex items-center gap-2 rounded-full bg-[#573E32] px-4 py-2 text-sm font-medium text-white hover:bg-[#432d23] transition-colors">
                                    <Plus size={16} />
                                    <span>Add Recipe</span>
                                </button>
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
                                                        onClick={() => navigate(`/recipes/${recipe.recipeId}`)}
                                                    >
                                                        <Eye size={16} />
                                                    </button>
                                                    <button className="hover:text-[#573E32]" aria-label="Edit">
                                                        <Pencil size={16} />
                                                    </button>
                                                    <button className="hover:text-[#C04A3A]" aria-label="Delete">
                                                        <Trash2 size={16} />
                                                    </button>
                                                </div>
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {loading && (
                                        <TableRow>
                                            <TableCell colSpan={6} className="py-6 text-center text-[#707070]">
                                                Đang tải danh sách recipe...
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        <div className="mt-4 flex flex-col gap-3 text-xs text-[#707070] sm:flex-row sm:items-center">
                            <p>Showing 1 to 7 of 24 entries</p>
                            <div className="sm:ml-auto">
                                <Pagination className="w-auto mx-0 justify-end">
                                    <PaginationContent>
                                        <PaginationItem>
                                            <PaginationPrevious href="#" />
                                        </PaginationItem>
                                        <PaginationItem>
                                            <PaginationLink href="#" isActive>
                                                1
                                            </PaginationLink>
                                        </PaginationItem>
                                        <PaginationItem>
                                            <PaginationLink href="#">2</PaginationLink>
                                        </PaginationItem>
                                        <PaginationItem>
                                            <PaginationLink href="#">3</PaginationLink>
                                        </PaginationItem>
                                        <PaginationItem>
                                            <PaginationEllipsis />
                                        </PaginationItem>
                                        <PaginationItem>
                                            <PaginationNext href="#" />
                                        </PaginationItem>
                                    </PaginationContent>
                                </Pagination>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
