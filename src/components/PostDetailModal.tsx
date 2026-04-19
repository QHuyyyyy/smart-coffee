import { useEffect, useMemo, useState } from "react";
import { Coffee } from "lucide-react";
import type { PostItem } from "@/services/apis/post.service";
import { recipeService } from "@/services/apis/recipe.service";
import { InlineLoading } from "@/components/Loading";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

type PostPreviewRecipe = {
    recipeId: number;
    recipeName: string;
    image: string | null;
    flavorNote: string | null;
    prepTimeRange: string | null;
    brewingMethod: string | null;
    suggestedOccasions: string | null;
};

type PostPreviewIngredient = {
    id: number;
    quantity: number;
    cost: number;
    ingredient: {
        name: string;
        image?: string | null;
    } | null;
};

type PostDetailModalProps = {
    open: boolean;
    post: PostItem | null;
    onOpenChange: (open: boolean) => void;
    categoryName: string;
};

function getPostStatusClasses(status: string | null | undefined) {
    const normalized = (status ?? "").toLowerCase();

    if (normalized === "pending") {
        return "bg-[#FFF6E4] text-[#C8811A] border border-[#F2E1B6]";
    }

    if (normalized === "hidden") {
        return "bg-[#F2F4F7] text-[#5F6B7A] border border-[#E3E8EE]";
    }

    if (normalized === "cancelled" || normalized === "canceled") {
        return "bg-[#FDECEC] text-[#C24242] border border-[#F8D1D1]";
    }

    if (normalized === "public") {
        return "bg-[#E8F6EE] text-[#2E8B57] border border-[#CFEAD9]";
    }

    return "bg-gray-100 text-gray-700 border border-gray-200";
}

function formatDateTime(value: string | null | undefined) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("vi-VN");
}

function parseOccasions(value: string | null | undefined) {
    if (!value) return [] as string[];
    try {
        const parsed = JSON.parse(value);
        return Array.isArray(parsed) ? parsed.filter(Boolean) : [];
    } catch {
        return [] as string[];
    }
}

export function PostDetailModal({ open, post, onOpenChange, categoryName }: PostDetailModalProps) {
    const [detailLoading, setDetailLoading] = useState(false);
    const [detailError, setDetailError] = useState<string | null>(null);
    const [previewRecipe, setPreviewRecipe] = useState<PostPreviewRecipe | null>(null);
    const [previewIngredients, setPreviewIngredients] = useState<PostPreviewIngredient[]>([]);

    useEffect(() => {
        if (!open || !post) return;

        const loadRecipePreview = async () => {
            setDetailError(null);
            setPreviewRecipe(null);
            setPreviewIngredients([]);

            if (!post.recipeId) return;

            try {
                setDetailLoading(true);
                const [recipeRes, ingredientsRes] = await Promise.all([
                    recipeService.getRecipeById(String(post.recipeId)),
                    recipeService.getIngredientsByRecipeId(post.recipeId),
                ]);

                setPreviewRecipe(recipeRes.data as PostPreviewRecipe);

                const ingredientData = Array.isArray(ingredientsRes.data)
                    ? ingredientsRes.data
                    : ingredientsRes.data?.data ?? [];
                setPreviewIngredients(ingredientData as PostPreviewIngredient[]);
            } catch {
                setDetailError("Khong tai duoc preview cong thuc");
            } finally {
                setDetailLoading(false);
            }
        };

        void loadRecipePreview();
    }, [open, post]);

    const previewOccasions = useMemo(() => parseOccasions(previewRecipe?.suggestedOccasions), [previewRecipe?.suggestedOccasions]);

    return (
        <Dialog
            open={open}
            onOpenChange={(nextOpen) => {
                onOpenChange(nextOpen);
                if (!nextOpen) {
                    setDetailError(null);
                    setDetailLoading(false);
                }
            }}
        >
            <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0">
                {!post ? null : (
                    <div className="bg-white">
                        <DialogHeader className="px-6 pt-6 pb-4 border-b border-[#EFEAE5]">
                            <DialogTitle className="text-2xl font-bold text-[#1F1F1F] pr-8">
                                {post.title || "Post Detail"}
                            </DialogTitle>
                            <p className="text-sm text-[#707070]">
                                Shop: {post.shopName || "-"} • Category: {categoryName}
                            </p>
                        </DialogHeader>

                        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-6">
                            <div className="lg:col-span-4 space-y-6">
                                <div className="rounded-xl overflow-hidden shadow-sm border border-[#EFEAE5] bg-white">
                                    {post.recipeImageUrl ? (
                                        <img
                                            src={post.recipeImageUrl}
                                            alt={post.title || "Post"}
                                            className="h-52 w-full object-cover"
                                        />
                                    ) : (
                                        <div className="h-52 w-full bg-[#F5F3F1] flex items-center justify-center">
                                            <Coffee size={28} className="text-[#573E32]" />
                                        </div>
                                    )}
                                    <div className="p-5 border-t border-[#EFEAE5] space-y-3">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-[#707070]">Post ID</span>
                                            <span className="font-medium text-[#1F1F1F]">#{post.postId}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-[#707070]">Status</span>
                                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[11px] font-medium capitalize ${getPostStatusClasses(post.status)}`}>
                                                {post.status || "-"}
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-[#707070]">Views</span>
                                            <span className="font-medium text-[#1F1F1F]">{post.viewCount ?? 0}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-[#707070]">Created At</span>
                                            <span className="font-medium text-[#1F1F1F]">{formatDateTime(post.createdAt)}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs text-[#707070]">Published At</span>
                                            <span className="font-medium text-[#1F1F1F]">{formatDateTime(post.publishedAt)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="lg:col-span-8 space-y-6">
                                <div className="rounded-xl border border-[#EFEAE5] bg-white overflow-hidden shadow-sm">
                                    <div className="px-5 py-4 border-b border-[#EFEAE5] bg-gray-50">
                                        <h3 className="font-bold text-[#1F1F1F]">Post Content</h3>
                                    </div>
                                    <div className="p-5">
                                        <p className="text-sm text-[#1F1F1F] whitespace-pre-wrap leading-relaxed">
                                            {post.content || "-"}
                                        </p>
                                    </div>
                                </div>

                                <div className="rounded-xl border border-[#EFEAE5] bg-white overflow-hidden shadow-sm">
                                    <div className="px-5 py-4 border-b border-[#EFEAE5] bg-gray-50">
                                        <h3 className="font-bold text-[#1F1F1F]">Recipe Preview</h3>
                                    </div>
                                    <div className="p-5 space-y-4">
                                        {!post.recipeId && (
                                            <p className="text-sm text-[#707070]">Post nay chua gan recipeId.</p>
                                        )}

                                        {post.recipeId && detailLoading && (
                                            <InlineLoading text="Loading recipe preview..." />
                                        )}

                                        {post.recipeId && !detailLoading && detailError && (
                                            <p className="text-sm text-red-500">{detailError}</p>
                                        )}

                                        {post.recipeId && !detailLoading && !detailError && previewRecipe && (
                                            <>
                                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                    <div>
                                                        <p className="text-xs text-[#707070] mb-1">Recipe ID</p>
                                                        <p className="text-sm font-medium text-[#1F1F1F]">#{previewRecipe.recipeId}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-[#707070] mb-1">Recipe Name</p>
                                                        <p className="text-sm font-medium text-[#1F1F1F]">{previewRecipe.recipeName || "-"}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-[#707070] mb-1">Brewing Method</p>
                                                        <p className="text-sm font-medium text-[#1F1F1F]">{previewRecipe.brewingMethod || "-"}</p>
                                                    </div>
                                                    <div>
                                                        <p className="text-xs text-[#707070] mb-1">Prep Time</p>
                                                        <p className="text-sm font-medium text-[#1F1F1F]">{previewRecipe.prepTimeRange || "-"}</p>
                                                    </div>
                                                </div>

                                                <div>
                                                    <p className="text-xs text-[#707070] mb-1">Flavor Note</p>
                                                    <p className="text-sm text-[#1F1F1F] leading-relaxed">{previewRecipe.flavorNote || "-"}</p>
                                                </div>

                                                <div>
                                                    <p className="text-xs text-[#707070] mb-2">Suggested Occasions</p>
                                                    <div className="flex flex-wrap gap-2">
                                                        {previewOccasions.length === 0 && (
                                                            <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">No data</span>
                                                        )}
                                                        {previewOccasions.map((occasion) => (
                                                            <span
                                                                key={occasion}
                                                                className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600"
                                                            >
                                                                {occasion}
                                                            </span>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div>
                                                    <p className="text-xs text-[#707070] mb-2">Ingredients</p>
                                                    {previewIngredients.length === 0 ? (
                                                        <p className="text-sm text-[#707070]">No ingredients data.</p>
                                                    ) : (
                                                        <div className="rounded-lg border border-[#EFEAE5] overflow-hidden">
                                                            <Table>
                                                                <TableHeader>
                                                                    <TableRow className="p">
                                                                        <TableHead>Name</TableHead>
                                                                        <TableHead className="text-right">Quantity</TableHead>
                                                                        <TableHead className="text-right">Cost</TableHead>
                                                                    </TableRow>
                                                                </TableHeader>
                                                                <TableBody>
                                                                    {previewIngredients.map((item) => (
                                                                        <TableRow key={item.id}>
                                                                            <TableCell>{item.ingredient?.name || "-"}</TableCell>
                                                                            <TableCell className="text-right">{item.quantity ?? 0}</TableCell>
                                                                            <TableCell className="text-right">{item.cost ?? 0}</TableCell>
                                                                        </TableRow>
                                                                    ))}
                                                                </TableBody>
                                                            </Table>
                                                        </div>
                                                    )}
                                                </div>
                                            </>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
