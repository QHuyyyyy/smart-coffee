import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { recipeService } from "@/apis/recipe.service";

type RecipeDetail = {
    recipeId: number;
    recipeName: string;
    image: string | null;
    createdSource: string | null;
    category: string | null;
    flavorStylePrimary: string | null;
    flavorStyleSecondary: string | null;
    flavorNote: string | null;
    isHot: boolean;
    isCold: boolean;
    hasIce: boolean;
    caffeineStrength: number;
    containsMilk: boolean;
    suggestedOccasions: string | null;
    proposedSellingPrice: number;
    profitMarginPercent: number;
    difficultyLevel: string | null;
    prepTimeRange: string | null;
    brewingMethod: string | null;
    brewingSteps: string[] | null;
    brewingVariablesData: string | null;
    presentationData: string | null;
    isDefault: boolean;
    createDate: string | null;
    applyDate: string | null;
    isPublic: boolean;
    status: string | null;
};

type RecipeIngredient = {
    id: number;
    quantity: number;
    cost: number;
    ingredient: {
        name: string;
        image?: string | null;
        category?: string | null;
    } | null;
};

type PresentationData = {
    cupType?: string;
    garnish?: string;
    visualStyle?: string;
};

type BrewingVariables = {
    extractionTime?: string;
    waterTemp?: string;
    coffeeToWaterRatio?: string;
    pressure?: string;
    milkTemp?: string;
    frothingLevel?: string;
};

type ParsedOccasions = string[];

const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined || Number.isNaN(value)) return "-";
    return `${value.toLocaleString("vi-VN")}₫`;
};

const formatDate = (value: string | null | undefined) => {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return "-";
    return date.toLocaleDateString("vi-VN");
};

export function RecipeDetail() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();

    const [recipe, setRecipe] = useState<RecipeDetail | null>(null);
    const [ingredients, setIngredients] = useState<RecipeIngredient[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;

        const fetchData = async () => {
            try {
                setLoading(true);
                setError(null);

                const [recipeRes, ingredientsRes] = await Promise.all([
                    recipeService.getRecipeById(id),
                    recipeService.getIngredientsByRecipeId(id),
                ]);

                setRecipe(recipeRes.data as RecipeDetail);

                const ingData = Array.isArray(ingredientsRes.data)
                    ? ingredientsRes.data
                    : ingredientsRes.data?.data ?? [];
                setIngredients(ingData as RecipeIngredient[]);
            } catch (err) {
                setError("Không tải được chi tiết recipe");
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id]);

    const totalCost = useMemo(
        () => ingredients.reduce((sum, item) => sum + Number(item.cost ?? 0), 0),
        [ingredients],
    );

    const presentation = useMemo(() => {
        if (!recipe?.presentationData) return null;
        try {
            return JSON.parse(recipe.presentationData) as PresentationData;
        } catch {
            return null;
        }
    }, [recipe?.presentationData]);

    const occasions = useMemo<ParsedOccasions>(() => {
        if (!recipe?.suggestedOccasions) return [];
        try {
            const parsed = JSON.parse(recipe.suggestedOccasions);
            if (Array.isArray(parsed)) return parsed.filter(Boolean);
            return [];
        } catch {
            return [];
        }
    }, [recipe?.suggestedOccasions]);

    const brewingVariables = useMemo(() => {
        if (!recipe?.brewingVariablesData) return null;
        try {
            return JSON.parse(recipe.brewingVariablesData) as BrewingVariables;
        } catch {
            return null;
        }
    }, [recipe?.brewingVariablesData]);

    const caffeineLabel = useMemo(() => {
        const strength = recipe?.caffeineStrength;
        if (strength === undefined || strength === null) return "-";
        if (strength <= 2) return "Low";
        if (strength <= 4) return "Medium";
        return "High";
    }, [recipe?.caffeineStrength]);

    const profitPercent = recipe?.profitMarginPercent ?? 0;
    const profitBarWidth = Math.max(0, Math.min(100, Number(profitPercent)));

    if (loading) {
        return (
            <div className="mt-24 px-10 pb-10 w-full flex items-center justify-center text-sm text-[#707070]">
                Đang tải chi tiết recipe...
            </div>
        );
    }

    if (error) {
        return (
            <div className="mt-24 px-10 pb-10 w-full">
                <p className="text-sm text-red-500 mb-4">{error}</p>
                <button
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center rounded-full border border-[#E0D5D0] bg-white px-4 py-2 text-sm font-medium text-[#573E32] hover:bg-[#F5F3F1] transition-colors"
                >
                    Quay lại
                </button>
            </div>
        );
    }

    if (!recipe) {
        return (
            <div className="mt-24 px-10 pb-10 w-full">
                <p className="text-sm text-[#707070] mb-4">Không tìm thấy recipe.</p>
                <button
                    onClick={() => navigate(-1)}
                    className="inline-flex items-center rounded-full border border-[#E0D5D0] bg-white px-4 py-2 text-sm font-medium text-[#573E32] hover:bg-[#F5F3F1] transition-colors"
                >
                    Quay lại
                </button>
            </div>
        );
    }

    return (
        <div className="mt-24 px-10 pb-10 w-full overflow-y-auto">
            <div className="p-0 md:p-0 space-y-6 max-w-7xl mx-auto">
                {/* Breadcrumb + title */}
                <div className="flex flex-col gap-1 text-[#1F1F1F] mb-2">
                    <div className="flex items-center gap-2 text-sm text-[#707070] mb-1">
                        <button
                            className="cursor-pointer hover:underline"
                            onClick={() => navigate("/recipes")}
                        >
                            Recipes
                        </button>
                        <span className="text-xs">/&nbsp;</span>
                        <span>Recipe Details</span>
                    </div>

                </div>

                {/* Header: recipe name + actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <h2 className="text-3xl font-bold text-[#1F1F1F]">
                        {recipe.recipeName}
                    </h2>
                    <div className="flex items-center gap-3">
                        {/* <button
                            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg border border-[#573E32] text-[#573E32] hover:bg-[#EFEAE5] transition-colors"
                            type="button"
                        >
                            Edit Recipe
                        </button>
                        <button
                            className="flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-lg bg-[#573E32] text-white hover:opacity-90 shadow-sm transition-opacity"
                            type="button"
                        >
                            Save Changes
                        </button> */}
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                    {/* Left column */}
                    <div className="lg:col-span-4 space-y-6">
                        {/* Image + meta */}
                        <div className="rounded-xl overflow-hidden shadow-sm border border-[#EFEAE5] bg-white">
                            <div
                                className="aspect-4/3 bg-cover bg-center bg-[#F5F5F5]"
                                style={recipe.image ? { backgroundImage: `url(${recipe.image})` } : undefined}
                            />
                            <div className="p-5 border-t border-[#EFEAE5]">
                                <div className="flex items-center justify-between mb-4">
                                    <span className="text-xs font-bold uppercase tracking-wider text-[#707070]">
                                        Status
                                    </span>
                                    <span
                                        className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${recipe.status === "Active"
                                            ? "bg-green-100 text-green-700"
                                            : "bg-gray-100 text-gray-700"
                                            }`}
                                    >
                                        {recipe.status || "Unknown"}
                                    </span>
                                </div>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-[#707070] mb-1">Created Source</p>
                                        <p className="text-sm font-medium text-[#1F1F1F]">
                                            {recipe.createdSource || "-"}
                                        </p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-[#707070] mb-1">Last Updated</p>
                                        <p className="text-sm font-medium text-[#1F1F1F]">
                                            {formatDate(recipe.applyDate || recipe.createDate)}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Economics */}
                        <div className="rounded-xl border border-[#EFEAE5] bg-white overflow-hidden shadow-sm">
                            <div className="px-5 py-4 border-b border-[#EFEAE5] bg-gray-50 flex justify-between items-center">
                                <h3 className="font-bold text-[#1F1F1F]">Recipe Economics</h3>
                            </div>
                            <div className="p-5">
                                <div className="flex items-center justify-between mb-6">
                                    <div>
                                        <p className="text-sm text-[#707070]">Total Cost</p>
                                        <p className="text-2xl font-bold text-[#1F1F1F]">
                                            {formatCurrency(totalCost)}
                                        </p>
                                    </div>
                                    <div className="text-right">
                                        <p className="text-sm text-[#707070]">Profit Margin</p>
                                        <p className="text-2xl font-bold text-green-600">
                                            {profitPercent ? `${profitPercent.toFixed(0)}%` : "-"}
                                        </p>
                                    </div>
                                </div>
                                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-2">
                                    <div
                                        className="bg-green-600 h-2.5 rounded-full"
                                        style={{ width: `${profitBarWidth}%` }}
                                    />
                                </div>
                                <p className="text-xs text-[#707070] text-right">
                                    Based on retail price {formatCurrency(recipe.proposedSellingPrice)}
                                </p>
                            </div>
                        </div>

                        {/* Presentation data */}
                        <div className="rounded-xl border border-[#EFEAE5] bg-white overflow-hidden shadow-sm">
                            <div className="px-5 py-4 border-b border-[#EFEAE5] bg-gray-50 flex justify-between items-center">
                                <h3 className="font-bold text-[#1F1F1F]">Presentation Data</h3>
                            </div>
                            <div className="p-5 space-y-4">
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-xs font-medium text-[#707070] mb-1">Cup Type</label>
                                        <p className="text-sm font-medium text-[#1F1F1F]">
                                            {presentation?.cupType || "-"}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-[#707070] mb-1">Garnish</label>
                                        <p className="text-sm font-medium text-[#1F1F1F]">
                                            {presentation?.garnish || "-"}
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-[#707070] mb-1">Visual Style</label>
                                    <p className="text-sm font-medium text-[#1F1F1F]">
                                        {presentation?.visualStyle || "-"}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right column */}
                    <div className="lg:col-span-8 space-y-6">
                        {/* Flavor profile */}
                        <div className="rounded-xl border border-[#EFEAE5] bg-white overflow-hidden shadow-sm">
                            <div className="px-5 py-4 border-b border-[#EFEAE5] bg-gray-50 flex justify-between items-center">
                                <h3 className="font-bold text-[#1F1F1F]">Flavor Profile</h3>
                            </div>
                            <div className="p-5">
                                <div className="flex flex-wrap gap-2 mb-6">
                                    {recipe.isHot && (
                                        <span className="inline-flex items-center gap-1 rounded-md bg-orange-50 px-2 py-1 text-xs font-medium text-orange-700 ring-1 ring-inset ring-orange-600/20">
                                            Hot
                                        </span>
                                    )}
                                    {recipe.isCold && (
                                        <span className="inline-flex items-center gap-1 rounded-md bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10">
                                            Cold Option Available
                                        </span>
                                    )}
                                    {recipe.containsMilk && (
                                        <span className="inline-flex items-center gap-1 rounded-md bg-gray-100 px-2 py-1 text-xs font-medium text-gray-600 ring-1 ring-inset ring-gray-500/10">
                                            Contains Milk
                                        </span>
                                    )}
                                    <span className="inline-flex items-center gap-1 rounded-md bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-700/10">
                                        Caffeine: {caffeineLabel}
                                    </span>
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
                                    <div>
                                        <label className="block text-xs font-medium text-[#707070] mb-1">
                                            Primary Flavor Style
                                        </label>
                                        <p className="text-base font-semibold text-[#1F1F1F]">
                                            {recipe.flavorStylePrimary || "-"}
                                        </p>
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-[#707070] mb-1">
                                            Secondary Flavor Style
                                        </label>
                                        <p className="text-base font-semibold text-[#1F1F1F]">
                                            {recipe.flavorStyleSecondary || "-"}
                                        </p>
                                    </div>
                                </div>
                                <div className="mb-4">
                                    <label className="block text-xs font-medium text-[#707070] mb-1">
                                        Description
                                    </label>
                                    <p className="text-sm text-[#1F1F1F] leading-relaxed">
                                        {recipe.flavorNote || "Chưa có mô tả cho recipe này."}
                                    </p>
                                </div>
                                {recipe.flavorNote && (
                                    <div>
                                        <label className="block text-xs font-medium text-[#707070] mb-1">
                                            Flavor Notes
                                        </label>
                                        <div className="flex flex-wrap gap-2 mt-1">
                                            {recipe.flavorNote
                                                .split(",")
                                                .map((note) => note.trim())
                                                .filter(Boolean)
                                                .map((note) => (
                                                    <span
                                                        key={note}
                                                        className="px-2.5 py-1 rounded-full bg-yellow-50 text-yellow-800 text-xs font-medium border border-yellow-200"
                                                    >
                                                        {note}
                                                    </span>
                                                ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Preparation details */}
                            <div className="rounded-xl border border-[#EFEAE5] bg-white overflow-hidden shadow-sm h-full">
                                <div className="px-5 py-4 border-b border-[#EFEAE5] bg-gray-50 flex justify-between items-center">
                                    <h3 className="font-bold text-[#1F1F1F]">Preparation Details</h3>
                                </div>
                                <div className="p-5 space-y-4">
                                    <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                                        <span className="text-sm text-[#707070]">Prep Time</span>
                                        <span className="font-medium text-[#1F1F1F]">
                                            {recipe.prepTimeRange || "-"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                                        <span className="text-sm text-[#707070]">Difficulty</span>
                                        <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
                                            {recipe.difficultyLevel || "-"}
                                        </span>
                                    </div>
                                    <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                                        <span className="text-sm text-[#707070]">Brewing Method</span>
                                        <span className="font-medium text-[#1F1F1F]">
                                            {recipe.brewingMethod || "-"}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="block text-sm text-[#707070] mb-2">Suggested Occasions</span>
                                        <div className="flex flex-wrap gap-1.5">
                                            {occasions.length === 0 && (
                                                <span className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600">
                                                    No data
                                                </span>
                                            )}
                                            {occasions.map((item) => (
                                                <span
                                                    key={item}
                                                    className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-600"
                                                >
                                                    {item}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Brewing variables */}
                            <div className="rounded-xl border border-[#EFEAE5] bg-white overflow-hidden shadow-sm h-full">
                                <div className="px-5 py-4 border-b border-[#EFEAE5] bg-gray-50 flex justify-between items-center">
                                    <h3 className="font-bold text-[#1F1F1F]">Brewing Variables</h3>
                                </div>
                                <div className="p-5 grid grid-cols-2 gap-x-4 gap-y-6">
                                    {brewingVariables ? (
                                        <>
                                            {brewingVariables.extractionTime && (
                                                <div>
                                                    <label className="block text-xs text-[#707070] mb-1">
                                                        Extraction Time
                                                    </label>
                                                    <p className="font-mono text-sm font-medium text-[#1F1F1F]">
                                                        {brewingVariables.extractionTime}
                                                    </p>
                                                </div>
                                            )}
                                            {brewingVariables.waterTemp && (
                                                <div>
                                                    <label className="block text-xs text-[#707070] mb-1">
                                                        Water Temp
                                                    </label>
                                                    <p className="font-mono text-sm font-medium text-[#1F1F1F]">
                                                        {brewingVariables.waterTemp}
                                                    </p>
                                                </div>
                                            )}
                                            {brewingVariables.coffeeToWaterRatio && (
                                                <div>
                                                    <label className="block text-xs text-[#707070] mb-1">
                                                        Coffee:Water Ratio
                                                    </label>
                                                    <p className="font-mono text-sm font-medium text-[#1F1F1F]">
                                                        {brewingVariables.coffeeToWaterRatio}
                                                    </p>
                                                </div>
                                            )}
                                            {brewingVariables.pressure && (
                                                <div>
                                                    <label className="block text-xs text-[#707070] mb-1">
                                                        Pressure
                                                    </label>
                                                    <p className="font-mono text-sm font-medium text-[#1F1F1F]">
                                                        {brewingVariables.pressure}
                                                    </p>
                                                </div>
                                            )}
                                            {brewingVariables.milkTemp && (
                                                <div>
                                                    <label className="block text-xs text-[#707070] mb-1">
                                                        Milk Temp
                                                    </label>
                                                    <p className="font-mono text-sm font-medium text-[#1F1F1F]">
                                                        {brewingVariables.milkTemp}
                                                    </p>
                                                </div>
                                            )}
                                            {brewingVariables.frothingLevel && (
                                                <div>
                                                    <label className="block text-xs text-[#707070] mb-1">
                                                        Frothing Level
                                                    </label>
                                                    <p className="font-mono text-sm font-medium text-[#1F1F1F]">
                                                        {brewingVariables.frothingLevel}
                                                    </p>
                                                </div>
                                            )}
                                            {!brewingVariables.extractionTime &&
                                                !brewingVariables.waterTemp &&
                                                !brewingVariables.coffeeToWaterRatio &&
                                                !brewingVariables.pressure &&
                                                !brewingVariables.milkTemp &&
                                                !brewingVariables.frothingLevel && (
                                                    <p className="col-span-2 text-xs text-[#707070]">No brewing variable data.</p>
                                                )}
                                        </>
                                    ) : (
                                        <p className="col-span-2 text-xs text-[#707070]">No brewing variable data.</p>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Ingredients table */}
                        <div className="rounded-xl border border-[#EFEAE5] bg-white overflow-hidden shadow-sm">
                            <div className="px-5 py-4 border-b border-[#EFEAE5] bg-gray-50 flex justify-between items-center">
                                <h3 className="font-bold text-[#1F1F1F]">Ingredients</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-gray-50 text-[#707070] font-medium">
                                        <tr>
                                            <th className="px-5 py-3">Ingredient Name</th>
                                            <th className="px-5 py-3 text-right">Quantity</th>
                                            <th className="px-5 py-3 text-right">Cost</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-[#EFEAE5]">
                                        {ingredients.length === 0 && (
                                            <tr>
                                                <td
                                                    colSpan={3}
                                                    className="px-5 py-4 text-center text-xs text-[#707070]"
                                                >
                                                    Chưa có nguyên liệu cho recipe này.
                                                </td>
                                            </tr>
                                        )}
                                        {ingredients.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50">
                                                <td className="px-5 py-3 font-medium text-[#1F1F1F]">
                                                    {item.ingredient?.name || "Ingredient"}
                                                </td>
                                                <td className="px-5 py-3 text-right">
                                                    {item.quantity}
                                                </td>
                                                <td className="px-5 py-3 text-right text-[#707070]">
                                                    {formatCurrency(item.cost)}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Brewing steps */}
                        <div className="rounded-xl border border-[#EFEAE5] bg-white overflow-hidden shadow-sm">
                            <div className="px-5 py-4 border-b border-[#EFEAE5] bg-gray-50 flex justify-between items-center">
                                <h3 className="font-bold text-[#1F1F1F]">Brewing Steps</h3>
                            </div>
                            <div className="p-5">
                                {recipe.brewingSteps && recipe.brewingSteps.length > 0 ? (
                                    <ol className="relative border-l border-gray-200 ml-3 space-y-6">
                                        {recipe.brewingSteps.map((step, index) => (
                                            <li key={index} className="mb-2 ml-6">
                                                <span className="absolute flex items-center justify-center w-6 h-6 bg-[#573E32] rounded-full -left-3 ring-4 ring-white text-white text-xs font-bold">
                                                    {index + 1}
                                                </span>
                                                <h4 className="flex items-center mb-1 text-sm font-semibold text-[#1F1F1F]">
                                                    Step {index + 1}
                                                </h4>
                                                <p className="mb-2 text-sm text-[#707070]">{step}</p>
                                            </li>
                                        ))}
                                    </ol>
                                ) : (
                                    <p className="text-xs text-[#707070]">Chưa có hướng dẫn pha chế cho recipe này.</p>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
