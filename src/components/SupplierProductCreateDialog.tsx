import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supplierProductService, type CreateSupplierProductPayload, type SupplierProduct } from "@/apis/supplierProduct.service";
import { ingredientService } from "@/apis/ingredient.service";
import { useAuthStore } from "@/stores/auth.store";
import { toast } from "sonner";

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
    const [ingredients, setIngredients] = useState<any[]>([]);
    const [loadingIngredients, setLoadingIngredients] = useState(false);
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

        const fetchIngredients = async () => {
            try {
                setLoadingIngredients(true);
                const res = await ingredientService.getAll();
                const data = res.data;
                const list = Array.isArray(data) ? data : [];
                setIngredients(list || []);
            } catch (error: any) {
                console.error("Failed to load ingredients:", error);
                toast.error(error?.response?.data?.message || "Failed to load ingredients");
            } finally {
                setLoadingIngredients(false);
            }
        };

        fetchIngredients();
    }, [open]);

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
                    <p className="text-sm text-[#707070] mt-1">
                        Link or create a new ingredient listing.
                    </p>
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
                                Link Existing
                            </button>
                            <button
                                type="button"
                                className={`px-4 py-1.5 rounded-full transition-colors ${mode === "new" ? "bg-white shadow-sm text-[#3B2618]" : "bg-transparent"}`}
                                onClick={() => form.setValue("mode", "new")}
                            >
                                Create New
                            </button>
                        </div>

                        {mode === "existing" ? (
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-[#7A685B]">Search Ingredient</label>
                                <select
                                    className="w-full rounded-xl border border-[#E0D5D0] bg-white px-4 py-2.5 text-sm text-[#3B2618] placeholder:text-[#B8AAA0] focus:outline-none focus:ring-2 focus:ring-[#C58A53]"
                                    disabled={loadingIngredients}
                                    value={form.watch("ingredientId") ?? ""}
                                    onChange={(e) => form.setValue("ingredientId", Number(e.target.value))}
                                >
                                    <option value="">Search by name</option>
                                    {ingredients.map((ing: any) => (
                                        <option key={ing.ingredientId} value={ing.ingredientId}>
                                            {ing.name} ({ing.category})
                                        </option>
                                    ))}
                                </select>
                                {form.formState.errors.ingredientId && (
                                    <p className="text-xs text-red-500 mt-1">
                                        {form.formState.errors.ingredientId.message as string}
                                    </p>
                                )}
                                <p className="text-[11px] text-[#B8AAA0]">
                                    Common ingredients: Sea Salt, Olive Oil, Raw Honey, Cocoa Powder
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
