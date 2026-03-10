import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supplierProductService, type SupplierProduct, type UpdateSupplierProductPayload } from "@/apis/supplierProduct.service";
import { toast } from "sonner";

const formSchema = z.object({
    price: z.number().min(0.01, "Price must be greater than 0"),
    stock: z.number().min(0, "Stock must be at least 0"),
    measurement: z.string().min(1, "Measurement is required"),
    status: z.string().min(1, "Status is required"),
    description: z.string().optional(),
});

export type SupplierProductEditFormValues = z.infer<typeof formSchema>;

interface SupplierProductEditDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    product: SupplierProduct | null;
    onUpdated?: () => void;
}

export function SupplierProductEditDialog({ open, onOpenChange, product, onUpdated }: SupplierProductEditDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);

    const form = useForm<SupplierProductEditFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            price: product?.price ?? 0,
            stock: product?.stock ?? 0,
            measurement: product?.measurement ?? "gram",
            status: product?.status ?? "Available",
            description: product?.description ?? "",
        },
    });

    useEffect(() => {
        if (product && open) {
            form.reset({
                price: product.price,
                stock: product.stock,
                measurement: product.measurement,
                status: product.status,
                description: product.description ?? "",
            });
            setSelectedImage(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [product, open]);

    const handleClose = () => {
        onOpenChange(false);
        setSelectedImage(null);
    };

    const handleSubmit = async (values: SupplierProductEditFormValues) => {
        if (!product) return;

        try {
            setIsSubmitting(true);

            const payload: UpdateSupplierProductPayload = {
                productId: product.productId,
                supplierId: product.supplierId,
                ingredientId: product.ingredientId,
                price: values.price,
                stock: values.stock,
                status: values.status,
                description: values.description ?? null,
                createDate: product.createDate,
                measurement: values.measurement,
                image: product.image ?? null,
                ingredient: product.ingredient ?? null,
            };

            await supplierProductService.update(product.productId, payload);

            if (selectedImage && product.productId) {
                try {
                    await supplierProductService.uploadImage(product.productId, selectedImage);
                } catch (uploadError: any) {
                    console.error("Failed to upload product image:", uploadError);
                    toast.error(uploadError?.response?.data?.message || "Product updated, but failed to upload image");
                }
            }

            toast.success("Product updated successfully");

            if (onUpdated) {
                onUpdated();
            }

            handleClose();
        } catch (error: any) {
            console.error("Failed to update supplier product:", error);
            toast.error(error?.response?.data?.message || "Failed to update product");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-2xl w-full">
                <DialogHeader className="mb-2">
                    <DialogTitle className="text-xl font-semibold text-[#1F1F1F]">
                        Edit Supplier Product
                    </DialogTitle>
                    {product && (
                        <p className="text-sm text-[#707070] mt-1">
                            #{product.productId}
                            {" " + (product.ingredient?.name ?? "")}
                        </p>
                    )}
                </DialogHeader>

                <form
                    className="space-y-6 mt-2"
                    onSubmit={form.handleSubmit(handleSubmit)}
                >
                    <div className="rounded-2xl border border-[#EFE5DC] bg-white p-5 space-y-4">
                        <p className="text-sm font-semibold text-[#3B2618]">Pricing & Stock</p>

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
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-[#7A685B]">Current Stock</label>
                                <Input
                                    type="number"
                                    step="1"
                                    min="0"
                                    {...form.register("stock", { valueAsNumber: true })}
                                    className="rounded-xl border-[#E0D5D0]"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-[#7A685B]">Measurement Unit</label>
                                <select
                                    className="w-full rounded-xl border border-[#E0D5D0] bg-white px-2 py-4 text-sm text-[#3B2618] focus:outline-none focus:ring-2 focus:ring-[#C58A53]"
                                    value={form.watch("measurement")}
                                    onChange={(e) => form.setValue("measurement", e.target.value)}
                                >
                                    <option value="gram">Gram</option>
                                    <option value="kg">Kilogram</option>
                                    <option value="ml">Milliliter</option>
                                    <option value="l">Liter</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-xs font-medium text-[#7A685B]">Status</label>
                                <Input
                                    type="text"
                                    {...form.register("status")}
                                    className="rounded-xl border-[#E0D5D0]"
                                />
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
                            <label className="text-xs font-medium text-[#7A685B]">Change Product Image (optional)</label>
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
                                If set, this will replace the current product image.
                            </p>
                        </div>
                    </div>

                    <div className="flex items-center justify-end gap-3">
                        <Button
                            type="button"
                            variant="outline"
                            className="border-[#E0D5D0] text-[#7A685B] hover:bg-[#F5ECE5]"
                            disabled={isSubmitting}
                            onClick={handleClose}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            variant="coffee"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
