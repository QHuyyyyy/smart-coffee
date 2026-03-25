import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ingredientService, type Ingredient, type UpdateIngredientPayload } from "@/apis/ingredient.service";
import { toast } from "sonner";

const formSchema = z.object({
    name: z.string().trim().min(1, "Ingredient name is required"),
    category: z.string().trim().min(1, "Category is required"),
});

type IngredientEditFormValues = z.infer<typeof formSchema>;

interface IngredientEditDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    ingredient: Ingredient | null;
    onUpdated?: () => void;
}

export function IngredientEditDialog({ open, onOpenChange, ingredient, onUpdated }: IngredientEditDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);

    const form = useForm<IngredientEditFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: ingredient?.name ?? "",
            category: ingredient?.category ?? "",
        },
    });

    useEffect(() => {
        if (ingredient && open) {
            form.reset({
                name: ingredient.name,
                category: ingredient.category,
            });
            setSelectedImage(null);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [ingredient, open]);

    const handleClose = () => {
        onOpenChange(false);
        setSelectedImage(null);
    };

    const handleSubmit = async (values: IngredientEditFormValues) => {
        if (!ingredient) return;

        try {
            setIsSubmitting(true);

            const payload: UpdateIngredientPayload = {
                ingredientId: ingredient.ingredientId,
                name: values.name.trim(),
                category: values.category.trim(),
                createDate: ingredient.createDate,
            };

            await ingredientService.update(ingredient.ingredientId, payload);

            if (selectedImage) {
                try {
                    await ingredientService.uploadImage(ingredient.ingredientId, selectedImage);
                } catch (uploadError: any) {
                    console.error("Failed to upload ingredient image:", uploadError);
                    toast.error(uploadError?.response?.data?.message || "Ingredient updated, but failed to upload image");
                }
            }

            toast.success("Ingredient updated successfully");
            if (onUpdated) {
                onUpdated();
            }
            handleClose();
        } catch (error: any) {
            console.error("Failed to update ingredient:", error);
            toast.error(error?.response?.data?.message || "Failed to update ingredient");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-xl w-full">
                <DialogHeader className="mb-2">
                    <DialogTitle className="text-xl font-semibold text-[#1F1F1F]">
                        Edit Ingredient
                    </DialogTitle>
                    {ingredient && (
                        <p className="text-sm text-[#707070] mt-1">
                            #{ingredient.ingredientId} {ingredient.name}
                        </p>
                    )}
                </DialogHeader>

                <form className="space-y-6 mt-2" onSubmit={form.handleSubmit(handleSubmit)}>
                    <div className="rounded-2xl border border-[#EFE5DC] bg-white p-5 space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-[#7A685B]">Ingredient Name</label>
                            <Input
                                type="text"
                                {...form.register("name")}
                                className="rounded-xl border-[#E0D5D0]"
                            />
                            {form.formState.errors.name && (
                                <p className="text-xs text-red-500 mt-1">
                                    {form.formState.errors.name.message as string}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-medium text-[#7A685B]">Category</label>
                            <Input
                                type="text"
                                {...form.register("category")}
                                className="rounded-xl border-[#E0D5D0]"
                            />
                            {form.formState.errors.category && (
                                <p className="text-xs text-red-500 mt-1">
                                    {form.formState.errors.category.message as string}
                                </p>
                            )}
                        </div>

                        <div className="space-y-1">
                            <label className="text-xs font-medium text-[#7A685B]">Change Ingredient Image (optional)</label>
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
                                If selected, this will replace current ingredient image.
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
                        <Button type="submit" variant="coffee" disabled={isSubmitting}>
                            {isSubmitting ? "Saving..." : "Save Changes"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
