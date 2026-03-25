import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ingredientService, type CreateIngredientPayload, type Ingredient } from "@/apis/ingredient.service";
import { getVietnamISOString } from "@/lib/date-time";
import { toast } from "sonner";

const formSchema = z.object({
    name: z.string().trim().min(1, "Ingredient name is required"),
    category: z.string().trim().min(1, "Category is required"),
});

type IngredientCreateFormValues = z.infer<typeof formSchema>;

interface IngredientCreateDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onCreated?: () => void;
}

export function IngredientCreateDialog({ open, onOpenChange, onCreated }: IngredientCreateDialogProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [selectedImage, setSelectedImage] = useState<File | null>(null);

    const form = useForm<IngredientCreateFormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            category: "",
        },
    });

    const handleClose = () => {
        onOpenChange(false);
        form.reset();
        setSelectedImage(null);
    };

    const handleSubmit = async (values: IngredientCreateFormValues) => {
        try {
            setIsSubmitting(true);

            const payload: CreateIngredientPayload = {
                ingredientId: 0,
                name: values.name.trim(),
                category: values.category.trim(),
                createDate: getVietnamISOString(),
            };
            console.log("Creating ingredient with payload:", payload);
            const response = await ingredientService.create(payload);
            const createdIngredient: Ingredient | undefined = response?.data;

            if (selectedImage && createdIngredient?.ingredientId) {
                try {
                    await ingredientService.uploadImage(createdIngredient.ingredientId, selectedImage);
                } catch (uploadError: any) {
                    console.error("Failed to upload ingredient image:", uploadError);
                    toast.error(uploadError?.response?.data?.message || "Ingredient created, but failed to upload image");
                    if (onCreated) {
                        onCreated();
                    }
                    handleClose();
                    return;
                }
            }

            toast.success("Ingredient created successfully");
            if (onCreated) {
                onCreated();
            }
            handleClose();
        } catch (error: any) {
            console.error("Failed to create ingredient:", error);
            toast.error(error?.response?.data?.message || "Failed to create ingredient");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={handleClose}>
            <DialogContent className="max-w-xl w-full">
                <DialogHeader className="mb-2">
                    <DialogTitle className="text-xl font-semibold text-[#1F1F1F]">
                        Add New Ingredient
                    </DialogTitle>
                    <p className="text-sm text-[#707070] mt-1">
                        Create a new ingredient for system catalog.
                    </p>
                </DialogHeader>

                <form className="space-y-6 mt-2" onSubmit={form.handleSubmit(handleSubmit)}>
                    <div className="rounded-2xl border border-[#EFE5DC] bg-white p-5 space-y-4">
                        <div className="space-y-1">
                            <label className="text-xs font-medium text-[#7A685B]">Ingredient Name</label>
                            <Input
                                type="text"
                                placeholder="e.g. Hạt Cà Phê Arabica"
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
                                placeholder="e.g. Hạt Cà Phê"
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
                            <label className="text-xs font-medium text-[#7A685B]">Ingredient Image (optional)</label>
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
                                If selected, image will be uploaded after ingredient is created.
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
                            {isSubmitting ? "Creating..." : "Create Ingredient"}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
}
