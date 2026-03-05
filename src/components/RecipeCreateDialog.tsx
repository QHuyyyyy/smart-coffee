import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { Trash2, Plus } from "lucide-react";
import { recipeService } from "@/apis/recipe.service";
import { toast } from "sonner";
import { shopBeverageService } from "@/apis/shopBeverage.service";
import { ingredientService } from "@/apis/ingredient.service";
import { useAuthStore } from "@/stores/auth.store";

const DEFAULT_RECIPE_IMAGE = "https://placehold.co/600x400?text=Coffee+Recipe";

// Validation schemas
const step1Schema = z.object({
    recipeName: z.string().min(1, "Recipe name is required"),
    category: z.string().min(1, "Category is required"),
    flavorStylePrimary: z.string().min(1, "Flavor style is required"),
    flavorStyleSecondary: z.string().optional(),
    brewingMethod: z.string().min(1, "Brewing method is required"),
});

const step2Schema = z.object({
    flavorNote: z.string().optional(),
    isHot: z.boolean(),
    isCold: z.boolean(),
    containsMilk: z.boolean(),
    hasIce: z.boolean(),
    caffeineStrength: z.number().min(0).max(100).optional(),
    prepTimeRange: z.string().optional(),
    difficultyLevel: z.string().optional(),
    suggestedOccasions: z.string().optional(),
    profitMarginPercent: z.number().optional(),
    brewingStepsData: z.array(z.string()).min(1, "At least one brewing step is required"),
    brewingVariablesData: z.string().optional(),
    presentationData: z.string().optional(),
    createdSource: z.string().optional(),
    isDefault: z.boolean().optional(),
    isPublic: z.boolean().optional(),
    status: z.string().optional(),
    beverageId: z.number().optional(),
    ingredients: z.array(
        z.object({
            ingredient_id: z.number(),
            quantity: z.number(),
            measurement: z.string(),
        })
    ),
});

type Step1FormData = z.infer<typeof step1Schema>;
type Step2FormData = z.infer<typeof step2Schema>;

interface RecipeCreateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onSubmit?: (data: Step1FormData & Step2FormData) => void;
}

export function RecipeCreateDialog({ open, onOpenChange, onSubmit }: RecipeCreateDialogProps) {
    const [step, setStep] = useState<1 | 2>(1);
    const [step1Data, setStep1Data] = useState<Step1FormData | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [beverages, setBeverages] = useState<any[]>([]);
    const [isBeveragesLoading, setIsBeveragesLoading] = useState(false);
    const [selectedBeverageId, setSelectedBeverageId] = useState<number | undefined>(undefined);
    const [ingredientsMaster, setIngredientsMaster] = useState<any[]>([]);
    const [isIngredientsLoading, setIsIngredientsLoading] = useState(false);

    const currentUser = useAuthStore((state) => state.currentUser);

    const step1Form = useForm<Step1FormData>({
        resolver: zodResolver(step1Schema),
        defaultValues: {
            recipeName: "",
            flavorStylePrimary: "",
            flavorStyleSecondary: "",
            brewingMethod: "",
            category: "",
        },
    });

    const step2Form = useForm<Step2FormData>({
        resolver: zodResolver(step2Schema),
        defaultValues: {
            isHot: true,
            isCold: false,
            containsMilk: false,
            hasIce: false,
            caffeineStrength: 50,
            prepTimeRange: "",
            difficultyLevel: "Easy",
            suggestedOccasions: "",
            profitMarginPercent: 30,
            flavorNote: "",
            brewingStepsData: [],
            brewingVariablesData: "",
            presentationData: "",
            createdSource: "Manual",
            isDefault: false,
            isPublic: true,
            status: "Active",
            beverageId: undefined,
            ingredients: [],
        },
    });

    useEffect(() => {
        if (!open) return;

        const shopId = 1;
        if (!shopId) return;

        const fetchBeverages = async () => {
            try {
                setIsBeveragesLoading(true);
                const res = await shopBeverageService.getByShopId(shopId);
                const data = res.data;
                const list = Array.isArray(data) ? data : data?.beverages || [];
                setBeverages(list || []);

                if (list && list.length > 0 && !selectedBeverageId) {
                    setSelectedBeverageId(list[0].beverageId);
                    step2Form.setValue("beverageId", list[0].beverageId);
                }
            } catch (error: any) {
                console.error("Failed to load beverages:", error);
                toast.error(error?.response?.data?.message || "Failed to load beverages");
            } finally {
                setIsBeveragesLoading(false);
            }
        };

        fetchBeverages();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, currentUser?.coffeeShopId]);

    useEffect(() => {
        if (!open) return;

        const fetchIngredients = async () => {
            try {
                setIsIngredientsLoading(true);
                const res = await ingredientService.getAll();
                const data = res.data;
                const list = Array.isArray(data) ? data : [];
                setIngredientsMaster(list || []);
            } catch (error: any) {
                console.error("Failed to load ingredients:", error);
                toast.error(error?.response?.data?.message || "Failed to load ingredients");
            } finally {
                setIsIngredientsLoading(false);
            }
        };

        fetchIngredients();
    }, [open]);

    const handleStep1Submit = async (data: Step1FormData) => {
        if (!selectedBeverageId) {
            toast.error("Please select a beverage");
            return;
        }

        step2Form.setValue("beverageId", selectedBeverageId);
        setStep1Data(data);
        setStep(2);
    };

    const handleStep2Submit = async (data: Step2FormData) => {
        if (!step1Data) return;

        setIsLoading(true);
        try {
            const payload = {
                ...step1Data,
                ...data,
                image: DEFAULT_RECIPE_IMAGE,
                brewingSteps: data.brewingStepsData || [],
            };

            await recipeService.createRecipe(payload);

            toast.success("Recipe created successfully!");

            if (onSubmit) {
                onSubmit(payload);
            }

            onOpenChange(false);
            handleClose();
        } catch (error: any) {
            toast.error(error?.response?.data?.message || "Failed to create recipe");
            console.error("Create recipe error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const handleBack = () => {
        setStep(1);
    };

    const handleClose = () => {
        setStep(1);
        step1Form.reset();
        step2Form.reset();
        setStep1Data(null);
        setBeverages([]);
        setSelectedBeverageId(undefined);
        onOpenChange(false);
    };

    const addIngredient = () => {
        const currentIngredients = step2Form.getValues("ingredients");

        const defaultIngredientId =
            ingredientsMaster && ingredientsMaster.length > 0
                ? ingredientsMaster[0].ingredientId
                : Date.now();

        step2Form.setValue("ingredients", [
            ...currentIngredients,
            { ingredient_id: defaultIngredientId, quantity: 0, measurement: "g" },
        ]);
    };

    const removeIngredient = (ingredient_id: number) => {
        const currentIngredients = step2Form.getValues("ingredients");
        step2Form.setValue(
            "ingredients",
            currentIngredients.filter((ing) => ing.ingredient_id !== ingredient_id)
        );
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle className="text-lg font-semibold text-[#1F1F1F]">
                        Create New Recipe
                    </DialogTitle>
                    <p className="text-sm text-[#707070] mt-1">
                        {step === 1
                            ? "Define details, parameters, and ingredients for a new brew"
                            : "Define advanced details, brewing steps, and parameters"}
                    </p>
                </DialogHeader>

                {/* Step indicator */}
                <div className="flex items-center gap-2 mb-6">
                    <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${step >= 1
                            ? "bg-[#573E32] text-white"
                            : "bg-[#EFEAE5] text-[#573E32]"
                            }`}
                    >
                        1
                    </div>
                    <div className={`flex-1 h-1 transition-colors ${step >= 2 ? "bg-[#573E32]" : "bg-[#EFEAE5]"}`} />
                    <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold transition-colors ${step >= 2
                            ? "bg-[#573E32] text-white"
                            : "bg-[#EFEAE5] text-[#573E32]"
                            }`}
                    >
                        2
                    </div>
                </div>

                {/* Step 1 Form */}
                {step === 1 && (
                    <form onSubmit={step1Form.handleSubmit(handleStep1Submit)} className="space-y-6">
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-[#1F1F1F] uppercase">Basic Information</h3>

                            {/* Beverage (from API) */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-[#573E32]">Beverage</label>
                                <select
                                    value={selectedBeverageId ?? ""}
                                    onChange={(e) => {
                                        const value = e.target.value;
                                        const id = value ? Number(value) : undefined;
                                        setSelectedBeverageId(id);
                                        if (id) {
                                            step2Form.setValue("beverageId", id);
                                        }
                                    }}
                                    className="w-full px-3 py-2 border border-[#E0D5D0] rounded-lg bg-white text-sm text-[#573E32] focus:outline-none focus:border-[#573E32]"
                                    disabled={isBeveragesLoading || beverages.length === 0}
                                >
                                    <option value="">
                                        {isBeveragesLoading
                                            ? "Loading beverages..."
                                            : beverages.length === 0
                                                ? "No beverages available"
                                                : "Select beverage..."}
                                    </option>
                                    {beverages.map((bev) => (
                                        <option key={bev.beverageId} value={bev.beverageId}>
                                            {bev.name || `Beverage #${bev.beverageId}`}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Recipe Name and Category */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-[#573E32]">Recipe Name</label>
                                    <Input
                                        placeholder="e.g. Morning Blend V2"
                                        {...step1Form.register("recipeName")}
                                        className="bg-white"
                                    />
                                    {step1Form.formState.errors.recipeName && (
                                        <p className="text-xs text-red-500">
                                            {step1Form.formState.errors.recipeName.message}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-[#573E32]">Category</label>
                                    <Input
                                        placeholder="e.g. Coffee, Tea"
                                        {...step1Form.register("category")}
                                        className="bg-white"
                                    />
                                    {step1Form.formState.errors.category && (
                                        <p className="text-xs text-red-500">
                                            {step1Form.formState.errors.category.message}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Brewing Method */}
                            <div className="space-y-2">
                                <label className="text-sm font-medium text-[#573E32]">Brewing Method</label>
                                <select
                                    {...step1Form.register("brewingMethod")}
                                    className="w-full px-3 py-2 border border-[#E0D5D0] rounded-lg bg-white text-sm text-[#573E32] focus:outline-none focus:border-[#573E32]"
                                >
                                    <option value="">Select method...</option>
                                    <option value="Pour Over">Pour Over</option>
                                    <option value="Espresso">Espresso</option>
                                    <option value="French Press">French Press</option>
                                    <option value="AeroPress">AeroPress</option>
                                    <option value="Cold Brew">Cold Brew</option>
                                    <option value="Phin Filter">Phin Filter</option>
                                </select>
                                {step1Form.formState.errors.brewingMethod && (
                                    <p className="text-xs text-red-500">
                                        {step1Form.formState.errors.brewingMethod.message}
                                    </p>
                                )}
                            </div>

                            {/* Flavor Styles */}
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-[#573E32]">Flavor Style Primary</label>
                                    <Input
                                        placeholder="e.g. Fruity, Nutty"
                                        {...step1Form.register("flavorStylePrimary")}
                                        className="bg-white"
                                    />
                                    {step1Form.formState.errors.flavorStylePrimary && (
                                        <p className="text-xs text-red-500">
                                            {step1Form.formState.errors.flavorStylePrimary.message}
                                        </p>
                                    )}
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-[#573E32]">Flavor Style Secondary</label>
                                    <Input
                                        placeholder="e.g. Nutty"
                                        {...step1Form.register("flavorStyleSecondary")}
                                        className="bg-white"
                                    />
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Buttons */}
                        <div className="flex gap-3 justify-end">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClose}
                                className="border-[#E0D5D0] text-[#573E32] hover:bg-[#F5F3F1]"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="bg-[#573E32] text-white hover:bg-[#432d23]"
                            >
                                Next Step
                            </Button>
                        </div>
                    </form>
                )}

                {/* Step 2 Form */}
                {step === 2 && (
                    <form onSubmit={step2Form.handleSubmit((data) => handleStep2Submit(data))} className="space-y-6 max-h-[calc(90vh-250px)] overflow-y-auto pr-4">
                        {/* Recipe Properties */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-[#1F1F1F] uppercase">Recipe Properties</h3>

                            <div className="grid grid-cols-4 gap-3">
                                {/* Checkboxes */}
                                {[
                                    { name: "isHot", label: "Is Hot" },
                                    { name: "isCold", label: "Is Cold" },
                                    { name: "containsMilk", label: "Contains Milk" },
                                    { name: "hasIce", label: "Has Ice" },
                                ].map(({ name, label }) => (
                                    <div key={name} className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id={name}
                                            {...step2Form.register(name as any)}
                                            className="w-4 h-4 rounded border-[#E0D5D0] text-[#573E32] focus:ring-2 focus:ring-[#573E32]"
                                        />
                                        <label htmlFor={name} className="text-sm font-medium text-[#573E32] cursor-pointer">
                                            {label}
                                        </label>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Recipe Details */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-[#1F1F1F] uppercase">Recipe Details</h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-[#573E32]">Caffeine Strength (0-100)</label>
                                    <Input
                                        type="number"
                                        placeholder="50"
                                        min="0"
                                        max="100"
                                        {...step2Form.register("caffeineStrength", { valueAsNumber: true })}
                                        className="bg-white"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-[#573E32]">Prep Time Range</label>
                                    <Input
                                        placeholder="e.g. 3-5 mins"
                                        {...step2Form.register("prepTimeRange")}
                                        className="bg-white"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-[#573E32]">Difficulty Level</label>
                                    <Input
                                        placeholder="e.g. Easy, Medium, Hard"
                                        {...step2Form.register("difficultyLevel")}
                                        className="bg-white"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-[#573E32]">Profit Margin %</label>
                                    <Input
                                        type="number"
                                        placeholder="30"
                                        {...step2Form.register("profitMarginPercent", { valueAsNumber: true })}
                                        className="bg-white"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-[#573E32]">Suggested Occasions</label>
                                <Input
                                    placeholder="Morning, Afternoon, etc..."
                                    {...step2Form.register("suggestedOccasions")}
                                    className="bg-white"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-[#573E32]">Flavor Notes</label>
                                <textarea
                                    placeholder="Detailed taste profile description..."
                                    {...step2Form.register("flavorNote")}
                                    className="w-full px-3 py-2 border border-[#E0D5D0] rounded-lg bg-white text-sm text-[#573E32] focus:outline-none focus:border-[#573E32] resize-none"
                                    rows={3}
                                />
                            </div>
                        </div>

                        {/* Brewing Information */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-[#1F1F1F] uppercase">Brewing Information</h3>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-[#573E32]">Brewing Variables Data</label>
                                <Input
                                    placeholder="e.g. Temperature: 95C, Ratio: 1:4"
                                    {...step2Form.register("brewingVariablesData")}
                                    className="bg-white"
                                />
                            </div>

                            <div className="space-y-2">
                                <label className="text-sm font-medium text-[#573E32]">Presentation Data</label>
                                <textarea
                                    placeholder="e.g. Serve in a tall glass with a spoon"
                                    {...step2Form.register("presentationData")}
                                    className="w-full px-3 py-2 border border-[#E0D5D0] rounded-lg bg-white text-sm text-[#573E32] focus:outline-none focus:border-[#573E32] resize-none"
                                    rows={2}
                                />
                            </div>
                        </div>

                        {/* Brewing Steps */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-[#1F1F1F] uppercase">Brewing Steps</h3>
                                <Button
                                    type="button"
                                    size="sm"
                                    variant="outline"
                                    onClick={() => {
                                        const currentSteps = step2Form.getValues("brewingStepsData") || [];
                                        step2Form.setValue("brewingStepsData", [...currentSteps, ""]);
                                    }}
                                    className="border-[#E0D5D0] text-[#573E32] hover:bg-[#F5F3F1]"
                                >
                                    <Plus size={14} className="mr-1" />
                                    Add Step
                                </Button>
                            </div>

                            <div className="space-y-2">
                                {step2Form.watch("brewingStepsData")?.map((step, index) => (
                                    <div key={index} className="flex gap-2">
                                        <span className="text-sm font-medium text-[#573E32] pt-2">Step {index + 1}:</span>
                                        <Input
                                            placeholder="Describe this step..."
                                            value={step}
                                            onChange={(e) => {
                                                const currentSteps = step2Form.getValues("brewingStepsData") || [];
                                                currentSteps[index] = e.target.value;
                                                step2Form.setValue("brewingStepsData", currentSteps);
                                            }}
                                            className="bg-white flex-1"
                                        />
                                        <Button
                                            type="button"
                                            size="sm"
                                            variant="outline"
                                            onClick={() => {
                                                const currentSteps = step2Form.getValues("brewingStepsData") || [];
                                                currentSteps.splice(index, 1);
                                                step2Form.setValue("brewingStepsData", currentSteps);
                                            }}
                                            className="border-[#E0D5D0] text-red-500 hover:bg-red-50"
                                        >
                                            <Trash2 size={14} />
                                        </Button>
                                    </div>
                                ))}
                                {step2Form.formState.errors.brewingStepsData && (
                                    <p className="text-xs text-red-500">
                                        {step2Form.formState.errors.brewingStepsData.message}
                                    </p>
                                )}
                            </div>
                        </div>

                        {/* Ingredients */}
                        <div className="space-y-4">
                            <div className="flex items-center justify-between">
                                <h3 className="text-sm font-semibold text-[#1F1F1F] uppercase">Ingredients</h3>
                            </div>

                            {/* Ingredients List */}
                            <div className="space-y-2">
                                {step2Form.watch("ingredients").map((ingredient) => (
                                    <div key={ingredient.ingredient_id} className="flex items-center gap-2 bg-white p-3 rounded border border-[#E0D5D0]">
                                        <select
                                            value={ingredient.ingredient_id}
                                            onChange={(e) => {
                                                const value = Number(e.target.value);
                                                const currentIngredients = step2Form.getValues("ingredients");
                                                const index = currentIngredients.findIndex(i => i.ingredient_id === ingredient.ingredient_id);
                                                if (index >= 0) {
                                                    currentIngredients[index].ingredient_id = value;
                                                    step2Form.setValue("ingredients", currentIngredients);
                                                }
                                            }}
                                            className="w-56 px-2 py-2 border border-[#E0D5D0] rounded-lg bg-white text-sm"
                                            disabled={isIngredientsLoading || ingredientsMaster.length === 0}
                                        >
                                            <option value="">
                                                {isIngredientsLoading
                                                    ? "Loading ingredients..."
                                                    : ingredientsMaster.length === 0
                                                        ? "No ingredients available"
                                                        : "Select ingredient..."}
                                            </option>
                                            {ingredientsMaster.map((ing) => (
                                                <option key={ing.ingredientId} value={ing.ingredientId}>
                                                    {ing.name || `Ingredient #${ing.ingredientId}`}
                                                </option>
                                            ))}
                                        </select>
                                        <Input
                                            type="number"
                                            placeholder="Qty"
                                            value={ingredient.quantity}
                                            onChange={(e) => {
                                                const currentIngredients = step2Form.getValues("ingredients");
                                                const index = currentIngredients.findIndex(i => i.ingredient_id === ingredient.ingredient_id);
                                                if (index >= 0) {
                                                    currentIngredients[index].quantity = Number(e.target.value);
                                                    step2Form.setValue("ingredients", currentIngredients);
                                                }
                                            }}
                                            className="w-20 text-sm"
                                        />
                                        <select
                                            value={ingredient.measurement}
                                            onChange={(e) => {
                                                const currentIngredients = step2Form.getValues("ingredients");
                                                const index = currentIngredients.findIndex(i => i.ingredient_id === ingredient.ingredient_id);
                                                if (index >= 0) {
                                                    currentIngredients[index].measurement = e.target.value;
                                                    step2Form.setValue("ingredients", currentIngredients);
                                                }
                                            }}
                                            className="w-20 px-2 py-2 border border-[#E0D5D0] rounded-lg bg-white text-sm"
                                        >
                                            <option>g</option>
                                            <option>ml</option>
                                            <option>cup</option>
                                            <option>tbsp</option>
                                            <option>tsp</option>
                                        </select>
                                        <button
                                            type="button"
                                            onClick={() => removeIngredient(ingredient.ingredient_id)}
                                            className="p-1 text-[#707070] hover:text-red-500 transition-colors ml-auto"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </div>
                                ))}

                                <Button
                                    type="button"
                                    size="sm"
                                    className="bg-[#573E32] text-white hover:bg-[#432d23] mt-2"
                                    onClick={addIngredient}
                                >
                                    <Plus size={14} className="mr-1" />
                                    Add Ingredient
                                </Button>
                            </div>
                        </div>

                        {/* Additional Settings */}
                        <div className="space-y-4">
                            <h3 className="text-sm font-semibold text-[#1F1F1F] uppercase">Additional Settings</h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-[#573E32]">Created Source</label>
                                    <Input
                                        placeholder="e.g. Manual, API"
                                        {...step2Form.register("createdSource")}
                                        className="bg-white"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-[#573E32]">Status</label>
                                    <Input
                                        placeholder="e.g. Active, Inactive"
                                        {...step2Form.register("status")}
                                        className="bg-white"
                                    />
                                </div>

                                <div className="flex items-center gap-4 pt-6">
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="isDefault"
                                            {...step2Form.register("isDefault")}
                                            className="w-4 h-4 rounded border-[#E0D5D0] text-[#573E32]"
                                        />
                                        <label htmlFor="isDefault" className="text-sm font-medium text-[#573E32]">Default</label>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="isPublic"
                                            {...step2Form.register("isPublic")}
                                            className="w-4 h-4 rounded border-[#E0D5D0] text-[#573E32]"
                                        />
                                        <label htmlFor="isPublic" className="text-sm font-medium text-[#573E32]">Public</label>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* Buttons */}
                        <div className="flex gap-3 justify-end pb-5">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleBack}
                                className="border-[#E0D5D0] text-[#573E32] hover:bg-[#F5F3F1]"
                            >
                                Back
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={handleClose}
                                className="border-[#E0D5D0] text-[#573E32] hover:bg-[#F5F3F1]"
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="bg-[#573E32] text-white hover:bg-[#432d23]"
                                disabled={isLoading}
                            >
                                {isLoading ? "Creating..." : "Create Recipe"}
                            </Button>
                        </div>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
}
