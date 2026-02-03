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

const recipes = [
    {
        code: "#RCP-001",
        name: "Classic Espresso",
        ingredients: "Coffee Beans, Hot Water",
        price: "$2.50",
        iconBg: "bg-[#F2E6DA]",
    },
    {
        code: "#RCP-002",
        name: "Cappuccino",
        ingredients: "Espresso, Steamed Milk, Foam",
        price: "$3.75",
        iconBg: "bg-[#F2E6DA]",
    },
    {
        code: "#RCP-003",
        name: "Caffe Latte",
        ingredients: "Espresso, Steamed Milk",
        price: "$4.00",
        iconBg: "bg-[#F2E6DA]",
    },
    {
        code: "#RCP-004",
        name: "Mocha",
        ingredients: "Espresso, Chocolate Syrup, Milk",
        price: "$4.50",
        iconBg: "bg-[#F2E6DA]",
    },
    {
        code: "#RCP-005",
        name: "Affogato",
        ingredients: "Vanilla Gelato, Hot Espresso",
        price: "$5.00",
        iconBg: "bg-[#F2E6DA]",
    },
    {
        code: "#RCP-006",
        name: "Americano",
        ingredients: "Espresso, Hot Water",
        price: "$3.00",
        iconBg: "bg-[#F2E6DA]",
    },
    {
        code: "#RCP-007",
        name: "Flat White",
        ingredients: "Espresso, Microfoam",
        price: "$3.80",
        iconBg: "bg-[#F2E6DA]",
    },
];

export function Recipes() {
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
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-transparent">
                                        <TableHead>Code</TableHead>
                                        <TableHead>Image</TableHead>
                                        <TableHead>Recipe Name</TableHead>
                                        <TableHead>Ingredient</TableHead>
                                        <TableHead className="text-right">Cost</TableHead>
                                        <TableHead className="text-right">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {recipes.map((recipe) => (
                                        <TableRow key={recipe.code}>
                                            <TableCell>{recipe.code}</TableCell>
                                            <TableCell>
                                                <div className={`h-9 w-9 rounded-lg flex items-center justify-center ${recipe.iconBg}`}>
                                                    <Coffee size={18} className="text-[#573E32]" />
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <span className="font-medium text-[#573E32]">{recipe.name}</span>
                                            </TableCell>
                                            <TableCell className="max-w-xs">
                                                <p className="truncate text-[#707070]">{recipe.ingredients}</p>
                                            </TableCell>
                                            <TableCell className="text-right font-medium text-[#573E32]">
                                                {recipe.price}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex justify-end gap-2 text-[#B0A49E]">
                                                    <button className="hover:text-[#573E32]" aria-label="View">
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
