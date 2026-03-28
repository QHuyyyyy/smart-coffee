import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ChevronDown } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supplierProductService, type CreateSupplierProductPayload, type SupplierProduct } from "@/apis/supplierProduct.service";
import { ingredientService } from "@/apis/ingredient.service";
import { useAuthStore } from "@/stores/auth.store";
import { toast } from "sonner";
import { DialogDescription } from "@radix-ui/react-dialog";

const INGREDIENT_PAGE_SIZE = 10;

type IngredientOption = {
    ingredientId: number;
    name: string;
    category?: string | null;
};

type IngredientListEnvelope = {
    items?: unknown;
    data?: unknown;
    ingredients?: unknown;
    totalCount?: number;
    totalPages?: number;
};

const extractIngredientList = (data: unknown): IngredientOption[] => {
    if (Array.isArray(data)) {
        return data as IngredientOption[];
    }

    if (data && typeof data === "object") {
        const payload = data as { items?: unknown; data?: unknown; ingredients?: unknown };

        if (Array.isArray(payload.items)) {
            return payload.items as IngredientOption[];
        }

        if (Array.isArray(payload.data)) {
            return payload.data as IngredientOption[];
        }

        if (Array.isArray(payload.ingredients)) {
            return payload.ingredients as IngredientOption[];
        }
    }

    return [];
};

const extractTotalPages = (data: unknown): number => {
    if (!data || typeof data !== "object") return 1;
    const totalPages = (data as IngredientListEnvelope).totalPages;
    if (typeof totalPages === "number" && totalPages > 0) {
        return totalPages;
    }
    return 1;
};

const extractTotalCount = (data: unknown): number => {
    if (!data || typeof data !== "object") return 0;
    const totalCount = (data as IngredientListEnvelope).totalCount;
    if (typeof totalCount === "number" && totalCount >= 0) {
        return totalCount;
    }
    return 0;
};

const formSchema = z.object({
    mode: z.enum(["existing", "new"]),
    ingredientId: z.number().optional(),
    ingredientName: z.string().optional(),
    ingredientCategory: z.string().optional(),
    price: z.number().min(1000, "Price must be greater than 1000"),
    // stock: số lượng túi
    stock: z.number().min(1, "Stock must be at least 1 bag"),
    // packageSize: khối lượng 1 túi hàng (theo measurement)
    packageSize: z.number().min(0.01, "Package size must be greater than 0"),
    measurement: z.string().min(1, "Measurement is required"),
    status: z.string().min(1, "Status is required"),
    description: z.string().optional(),
}).refine((data) => {
    if (data.mode === "existing") {
        return !!data.ingredientId;
    }
    return !!data.ingredientName && !!data.ingredientCategory;
}, {
    message: "Please select an ingredient or enter name & category",
    path: ["ingredientId"],
});

export type SupplierProductFormValues = z.infer<typeof formSchema>;

interface SupplierProductCreateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreated?: () => void;
}

export function SupplierProductCreateDialog({ open, onOpenChange, onCreated }: SupplierProductCreateDialogProps) {
    const currentUser = useAuthStore((state) => state.currentUser);
    const [ingredients, setIngredients] = useState<IngredientOption[]>([]);
    const [loadingIngredients, setLoadingIngredients] = useState(false);
    const [loadingMoreIngredients, setLoadingMoreIngredients] = useState(false);
    const [ingredientPage, setIngredientPage] = useState(0);
    const [ingredientTotalPages, setIngredientTotalPages] = useState(1);
    const [ingredientTotalCount, setIngredientTotalCount] = useState(0);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);

    const form = useForm<SupplierProductFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            mode: "existing",
            ingredientId: undefined,
            ingredientName: "",
            ingredientCategory: "",
            price: 0,
            stock: 0,
            packageSize: 0,
            measurement: "gram",
            status: "Available",
            description: "",
        },
    });

    useEffect(() => {
        if (!open) return;

        const fetchFirstIngredientPage = async () => {
            try {
                setLoadingIngredients(true);
                const res = await ingredientService.getPaginated({ page: 1, pageSize: INGREDIENT_PAGE_SIZE });
                const data = res.data;
                const list = extractIngredientList(data);

                setIngredients(Array.from(new Map(list.map((item) => [item.ingredientId, item])).values()));
                setIngredientPage(1);
                setIngredientTotalPages(extractTotalPages(data));
            } catch (error: any) {
                console.error("Failed to load ingredients:", error);
                toast.error(error?.response?.data?.message || "Failed to load ingredients");
            } finally {
                setLoadingIngredients(false);
            }
        };

        setIngredients([]);
        setIngredientPage(0);
        setIngredientTotalPages(1);
        setIngredientTotalCount(0);
        setLoadingMoreIngredients(false);

        void fetchFirstIngredientPage();
    }, [open]);

    const hasMoreIngredients = ingredientPage < ingredientTotalPages;

    const loadMoreIngredients = async () => {
        if (loadingIngredients || loadingMoreIngredients || !hasMoreIngredients) return;

        try {
            setLoadingMoreIngredients(true);
            const nextPage = ingredientPage + 1;
            const res = await ingredientService.getPaginated({ page: nextPage, pageSize: INGREDIENT_PAGE_SIZE });
            const data = res.data;
            const list = extractIngredientList(data);

            setIngredients((prev) => Array.from(new Map([...prev, ...list].map((item) => [item.ingredientId, item])).values()));
            setIngredientPage(nextPage);
            setIngredientTotalPages(extractTotalPages(data));
            setIngredientTotalCount(extractTotalCount(data));
        } catch (error: any) {
            console.error("Failed to load more ingredients:", error);
            toast.error(error?.response?.data?.message || "Failed to load more ingredients");
        } finally {
            setLoadingMoreIngredients(false);
        }
    };

    const handleClose = () => {
        onOpenChange(false);
        form.reset();
        setSelectedImage(null);
    };

    const handleSubmit = async (values: SupplierProductFormValues) => {
        if (!currentUser?.supplierId) {
            toast.error("Missing supplier information");
            return;
        }

        try {
            setIsSubmitting(true);

            let payload: CreateSupplierProductPayload;

            if (values.mode === "existing" && values.ingredientId) {
                payload = {
                    supplierId: currentUser.supplierId,
                    ingredientId: values.ingredientId,
                    price: values.price,
                    stock: values.stock,
                    packageSize: values.packageSize,
                    status: values.status,
                    measurement: values.measurement,
                    description: values.description || undefined,
                };
            } else {
                payload = {
                    supplierId: currentUser.supplierId,
                    ingredient: {
                        name: values.ingredientName || "",
                        category: values.ingredientCategory || "",
                    },
                    price: values.price,
                    stock: values.stock,
                    packageSize: values.packageSize,
                    status: values.status,
                    measurement: values.measurement,
                    description: values.description || undefined,
                };
            }

            const response = await supplierProductService.create(payload);
            const createdProduct: SupplierProduct | undefined = response?.data;

            if (selectedImage && createdProduct?.productId) {
                try {
                    await supplierProductService.uploadImage(createdProduct.productId, selectedImage);
                } catch (uploadError: any) {
                    console.error("Failed to upload product image:", uploadError);
                    toast.error(uploadError?.response?.data?.message || "Product created, but failed to upload image");
                    // still treat as overall success for product creation
                    if (onCreated) {
                        onCreated();
                    }
                    handleClose();
                    return;
                }
            }

            toast.success("Product created successfully");

            if (onCreated) {
                onCreated();
            }

            handleClose();
        } catch (error: any) {
            console.error("Failed to create supplier product:", error);
            toast.error(error?.response?.data?.message || "Failed to create product");
        } finally {
            setIsSubmitting(false);
        }
    };

    const mode = form.watch("mode");

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-3xl w-full">
                <DialogHeader className="mb-2">
                    <DialogTitle className="text-xl font-semibold text-[#1F1F1F]">
                        Add New Supplier Product
                    </DialogTitle>
                    <DialogDescription className="text-sm text-[#707070]"> Link or create a new ingredient listing.</DialogDescription>
                </DialogHeader>

                <form
                    className="space-y-6 mt-2"
                    onSubmit={form.handleSubmit(handleSubmit)}
                >
                    {/* Ingredient source card */}
                    <div className="rounded-2xl border border-[#EFE5DC] bg-[#FFFBF7] p-5 space-y-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-semibold text-[#3B2618]">Ingredient Source</p>
                        </div>

                        {/* Tabs: Link Existing / Create New */}
                        <div className="inline-flex rounded-full bg-[#F3E7DC] p-1 text-sm font-medium text-[#6C4A33]">
                            <button
                                type="button"
                                className={`px-4 py-1.5 rounded-full transition-colors ${mode === "existing" ? "bg-white shadow-sm text-[#3B2618]" : "bg-transparent"}`}
                                onClick={() => form.setValue("mode", "existing")}
                            >
                                Select Existing
                            </button>
                            {/* <button
                                type="button"
                                className={`px-4 py-1.5 rounded-full transition-colors ${mode === "new" ? "bg-white shadow-sm text-[#3B2618]" : "bg-transparent"}`}
                                onClick={() => form.setValue("mode", "new")}
                            >
                                Create New
                            </button> */}
                        </div>

                        {mode === "existing" ? (
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-[#7A685B]">Select Ingredient</label>
                                <Select
                                    disabled={loadingIngredients && ingredients.length === 0}
                                    value={form.watch("ingredientId") ? String(form.watch("ingredientId")) : undefined}
                                    onValueChange={(value) => {
                                        form.setValue("ingredientId", value ? Number(value) : undefined, {
                                            shouldValidate: true,
                                            shouldDirty: true,
                                        });
                                    }}
                                >
                                    <SelectTrigger className="w-full rounded-xl border-[#E0D5D0] bg-white px-4 py-2.5 text-sm text-[#3B2618]">
                                        <SelectValue placeholder="Select existing ingredient of system" />
                                    </SelectTrigger>
                                    <SelectContent className="h-64 max-h-64">
                                        {ingredients.map((ing, index) => (
                                            <SelectItem key={`${ing.ingredientId}-${index}`} value={String(ing.ingredientId)}>
                                                {ing.name} ({ing.category})
                                            </SelectItem>
                                        ))}

                                        {loadingIngredients && ingredients.length === 0 && (
                                            <SelectItem value="__loading_initial" disabled>
                                                Loading ingredients...
                                            </SelectItem>
                                        )}

                                        {loadingMoreIngredients && (
                                            <SelectItem value="__loading_more" disabled>
                                                Loading more ingredients...
                                            </SelectItem>
                                        )}

                                        {!loadingIngredients && ingredients.length === 0 && (
                                            <SelectItem value="__empty" disabled>
                                                No ingredients found
                                            </SelectItem>
                                        )}

                                        <div className="border-t border-[#EFE5DC] mt-1 px-2 py-2 bg-white">
                                            <div className="flex items-center justify-between gap-2">
                                                <p className="text-[11px] text-[#B8AAA0]">
                                                    {ingredients.length}/{ingredientTotalCount} item(s) - page {Math.max(ingredientPage, 1)}/{Math.max(ingredientTotalPages, 1)}
                                                </p>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    size="icon"
                                                    className="h-7 w-7"
                                                    disabled={loadingIngredients || loadingMoreIngredients || !hasMoreIngredients}
                                                    onClick={() => void loadMoreIngredients()}
                                                    aria-label="Load more ingredients"
                                                >
                                                    <ChevronDown size={14} className={loadingMoreIngredients ? "animate-pulse" : ""} />
                                                </Button>
                                            </div>
                                        </div>
                                    </SelectContent>
                                </Select>
                                {form.formState.errors.ingredientId && (
                                    <p className="text-xs text-red-500 mt-1">
                                        {form.formState.errors.ingredientId.message as string}
                                    </p>
                                )}
                                <p className="text-[11px] text-[#B8AAA0]">
                                    Dropdown height is fixed. Press the arrow at the end of the list to load next page.
                                </p>
                            </div>
                        ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-[#7A685B]">Ingredient Name</label>
                                    <Input
                                        type="text"
                                        placeholder="e.g. Matcha Powder"
                                        {...form.register("ingredientName")}
                                        className="rounded-xl border-[#E0D5D0]"
                                    />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-xs font-medium text-[#7A685B]">Category</label>
                                    <Input
                                        type="text"
                                        placeholder="e.g. Powder"
                                        {...form.register("ingredientCategory")}
                                        className="rounded-xl border-[#E0D5D0]"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Pricing, stock & description card */}
                    <div className="rounded-2xl border border-[#EFE5DC] bg-white p-5 space-y-4">
                        <p className="text-sm font-semibold text-[#3B2618]">Pricing & Stock Details</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-[#7A685B]">Unit Price (VND)</label>
                                <Input
                                    type="number"
                                    step="1"
                                    min="0"
                                    {...form.register("price", { valueAsNumber: true })}
                                    className="rounded-xl border-[#E0D5D0]"
                                />
                                {form.formState.errors.price && (
                                    <p className="text-xs text-red-500 mt-1">
                                        {form.formState.errors.price.message as string}
                                    </p>
                                )}
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-[#7A685B]">Current Stock (bags)</label>
                                <Input
                                    type="number"
                                    step="1"
                                    min="0"
                                    {...form.register("stock", { valueAsNumber: true })}
                                    className="rounded-xl border-[#E0D5D0]"
                                />
                                {form.formState.errors.stock && (
                                    <p className="text-xs text-red-500 mt-1">
                                        {form.formState.errors.stock.message as string}
                                    </p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-[#7A685B]">Measurement Unit</label>
                                <select
                                    className="w-full rounded-xl border border-[#E0D5D0] bg-white px-2 py-3 text-sm text-[#3B2618] focus:outline-none focus:ring-2 focus:ring-[#C58A53]"
                                    value={form.watch("measurement")}
                                    onChange={(e) => form.setValue("measurement", e.target.value)}
                                >
                                    <option value="gram">Gram</option>
                                    <option value="kg">Kilogram</option>
                                    <option value="ml">Milliliter</option>
                                    <option value="l">Liter</option>
                                </select>
                            </div>
                            <div className="space-y-1 md:col-span-2">
                                <label className="text-xs font-medium text-[#7A685B]">Package Size</label>
                                <div className="flex items-center gap-2">
                                    <Input
                                        type="number"
                                        step="0.01"
                                        min="0"
                                        {...form.register("packageSize", { valueAsNumber: true })}
                                        className="rounded-xl border-[#E0D5D0]"
                                    />
                                    <span className="text-xs text-[#7A685B]">per bag ({form.watch("measurement")})</span>
                                </div>
                                {form.formState.errors.packageSize && (
                                    <p className="text-xs text-red-500 mt-1">
                                        {form.formState.errors.packageSize.message as string}
                                    </p>
                                )}
                                <p className="text-[11px] text-[#B8AAA0] mt-1">
                                    Weight of 1 bag sold. Stock is the number of bags.
                                </p>
                            </div>
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-medium text-[#7A685B]">Description (optional)</label>
                            <textarea
                                rows={3}
                                className="w-full rounded-xl border border-[#E0D5D0] px-3 py-2 text-sm text-[#3B2618] placeholder:text-[#B8AAA0] focus:outline-none focus:ring-2 focus:ring-[#C58A53] resize-none"
                                placeholder="Short notes about this product, sourcing, or usage..."
                                {...form.register("description")}
                            />
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-medium text-[#7A685B]">Product Image (optional)</label>
                            <Input
                                type="file"
                                accept="image/*"
                                onChange={(e) => {
                                    const file = e.target.files?.[0] ?? null;
                                    setSelectedImage(file);
                                }}
                                className="rounded-xl border-[#E0D5D0] bg-white"
                            />
                            <p className="text-[11px] text-[#B8AAA0]">
                                Recommended formats: JPG, PNG. Max size depends on server configuration.
                            </p>
                        </div>
                    </div>

                    {/* Footer actions */}
                    <div className="flex items-center justify-between ">

                        <div className="flex gap-3 ml-auto">
                            <Button
                                type="button"
                                variant="outline"
                                className="border-[#E0D5D0] text-[#7A685B] hover:bg-[#F5ECE5]"
                                disabled={isSubmitting}
                                onClick={handleClose}
                            >
                                Discard
                            </Button>
                            <Button
                                type="submit"
                                variant="coffee"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Publishing..." : "Publish Product"}
                            </Button>
                        </div>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
