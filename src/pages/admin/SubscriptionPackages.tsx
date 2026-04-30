import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Package, Users, CreditCard, BarChart2, Plus, Pencil, Filter, Search, Check, MoreVertical } from "lucide-react";
import { InlineLoading } from "@/components/Loading";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { dashboardService } from "@/services/apis/dashboard.service";
import { subscriptionPackageService, type SubscriptionPackage } from "@/services/apis/subscriptionPackage.service";
import { toast } from "sonner";
import { formatVND } from "@/utils/currency";

const numericStringSchema = z
    .string()
    .trim()
    .refine((value) => /^\d+$/.test(value), "Value must be a non-negative integer");

const optionalLimitSchema = z
    .string()
    .trim()
    .refine((value) => value === "" || /^\d+$/.test(value), "Value must be a non-negative integer");

const packageFormSchema = z.object({
    name: z.string().trim().min(1, "Package name is required"),
    description: z.string().trim(),
    price: numericStringSchema,
    staffQuantity: numericStringSchema,
    productRecommendLimit: optionalLimitSchema,
    menuSuggestLimit: optionalLimitSchema,
    menuAnalyzeFeedbackLimit: optionalLimitSchema,
    inventoryForecastLimit: optionalLimitSchema,
    recipeRecommendLimit: optionalLimitSchema,
});

type PackageFormValues = z.infer<typeof packageFormSchema>;

const defaultPackageFormValues: PackageFormValues = {
    name: "",
    description: "",
    price: "",
    staffQuantity: "",
    productRecommendLimit: "",
    menuSuggestLimit: "",
    menuAnalyzeFeedbackLimit: "",
    inventoryForecastLimit: "",
    recipeRecommendLimit: "",
};

const parseOptionalLimit = (value: string) => {
    if (!value.trim()) return null;

    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 0) {
        return Number.NaN;
    }

    return parsed;
};

const getCurrentVietnamMonthYear = () => {
    const formatter = new Intl.DateTimeFormat("en-US", {
        timeZone: "Asia/Ho_Chi_Minh",
        year: "numeric",
        month: "2-digit",
    });
    const parts = formatter.formatToParts(new Date());
    const month = Number(parts.find((part) => part.type === "month")?.value ?? "0");
    const year = Number(parts.find((part) => part.type === "year")?.value ?? "0");

    return { month, year };
};

export function SubscriptionPackagesPage() {
    const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [statsLoading, setStatsLoading] = useState(false);
    const [activeSubscriptions, setActiveSubscriptions] = useState(0);
    const [totalRevenue, setTotalRevenue] = useState(0);
    const [monthRevenue, setMonthRevenue] = useState(0);

    const [search, setSearch] = useState("");

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingPackage, setEditingPackage] = useState<SubscriptionPackage | null>(null);
    const [activeMenuPackageId, setActiveMenuPackageId] = useState<number | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<SubscriptionPackage | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const form = useForm<PackageFormValues>({
        resolver: zodResolver(packageFormSchema),
        defaultValues: defaultPackageFormValues,
    });

    const fetchPackages = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await subscriptionPackageService.getAll();
            const data = Array.isArray(res.data) ? res.data : (res.data as any)?.items ?? [];
            setPackages(data as SubscriptionPackage[]);
        } catch (err) {
            setError("Failed to load subscription packages");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchPackages();
    }, []);

    const fetchDashboardStats = async () => {
        try {
            setStatsLoading(true);

            const { month, year } = getCurrentVietnamMonthYear();
            const [activeSubscriptionsResult, subscriptionRevenueResult, monthSubscriptionRevenueResult] =
                await Promise.all([
                    dashboardService.getTotalActiveSubscriptions(),
                    dashboardService.getSubscriptionRevenueTotal(),
                    dashboardService.getSubscriptionRevenue({ month, year }),
                ]);

            setActiveSubscriptions(activeSubscriptionsResult);
            setTotalRevenue(subscriptionRevenueResult);
            setMonthRevenue(monthSubscriptionRevenueResult.totalSubscription ?? 0);
        } catch {
            toast.error("Failed to load subscription revenue statistics");
        } finally {
            setStatsLoading(false);
        }
    };

    useEffect(() => {
        void fetchDashboardStats();
    }, []);

    const filteredPackages = useMemo(
        () =>
            packages.filter((p) => {
                if (!search.trim()) return true;
                const keyword = search.toLowerCase();
                return (
                    (p.name ?? "").toLowerCase().includes(keyword) ||
                    (p.description ?? "").toLowerCase().includes(keyword)
                );
            }),
        [packages, search],
    );

    const totalPackages = filteredPackages.length;

    const stats = [
        {
            title: "Total Packages",
            value: totalPackages.toString(),
            icon: Package,
            subtitle: "Available subscription plans",
        },
        {
            title: "Total Revenue",
            value: statsLoading ? "..." : formatVND(totalRevenue),
            icon: BarChart2,
            subtitle: "Total subscription revenue",
        },
        {
            title: "Month Revenue",
            value: statsLoading ? "..." : formatVND(monthRevenue),
            icon: Users,
            subtitle: "Current month",
        },
        {
            title: "Active Subscriptions",
            value: statsLoading ? "..." : activeSubscriptions.toLocaleString("en-US"),
            icon: CreditCard,
            subtitle: "Currently active across system",
        },

    ];

    const openCreateDialog = () => {
        setEditingPackage(null);
        form.reset(defaultPackageFormValues);
        setIsDialogOpen(true);
    };

    const openEditDialog = (pkg: SubscriptionPackage) => {
        setEditingPackage(pkg);
        form.reset({
            name: pkg.name,
            description: pkg.description,
            price: pkg.price?.toString() ?? "",
            staffQuantity: pkg.staffQuantity?.toString() ?? "",
            productRecommendLimit: pkg.productRecommendLimit?.toString() ?? "",
            menuSuggestLimit: pkg.menuSuggestLimit?.toString() ?? "",
            menuAnalyzeFeedbackLimit: pkg.menuAnalyzeFeedbackLimit?.toString() ?? "",
            inventoryForecastLimit: pkg.inventoryForecastLimit?.toString() ?? "",
            recipeRecommendLimit: pkg.recipeRecommendLimit?.toString() ?? "",
        });
        setIsDialogOpen(true);
    };

    const resetDialog = () => {
        setIsDialogOpen(false);
        setEditingPackage(null);
        form.reset(defaultPackageFormValues);
        setIsSubmitting(false);
    };

    const openDeleteDialog = (pkg: SubscriptionPackage) => {
        setDeleteTarget(pkg);
        setIsDeleteDialogOpen(true);
        setActiveMenuPackageId(null);
    };

    const closeDeleteDialog = () => {
        if (isDeleting) return;
        setIsDeleteDialogOpen(false);
        setDeleteTarget(null);
    };

    const handleDeletePackage = async () => {
        if (!deleteTarget) return;

        try {
            setIsDeleting(true);
            await subscriptionPackageService.delete(deleteTarget.packageId);
            toast.success("Subscription package deleted successfully");
            closeDeleteDialog();
            void fetchPackages();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Failed to delete subscription package");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleSubmit = async (values: PackageFormValues) => {
        const normalizedName = values.name.trim().toLowerCase();
        const hasDuplicateName = packages.some((pkg) => {
            const sameName = (pkg.name ?? "").trim().toLowerCase() === normalizedName;
            if (!sameName) return false;

            if (editingPackage) {
                return pkg.packageId !== editingPackage.packageId;
            }

            return true;
        });

        if (hasDuplicateName) {
            toast.error("Package name already exists");
            return;
        }

        const priceNumber = Number(values.price);
        const staffQuantityNumber = Number(values.staffQuantity);
        const productRecommendLimitNumber = parseOptionalLimit(values.productRecommendLimit);
        const menuSuggestLimitNumber = parseOptionalLimit(values.menuSuggestLimit);
        const menuAnalyzeFeedbackLimitNumber = parseOptionalLimit(values.menuAnalyzeFeedbackLimit);
        const inventoryForecastLimitNumber = parseOptionalLimit(values.inventoryForecastLimit);
        const recipeRecommendLimitNumber = parseOptionalLimit(values.recipeRecommendLimit);

        if (Number.isNaN(priceNumber) || priceNumber < 0) {
            toast.error("Invalid price");
            return;
        }
        if (!Number.isInteger(staffQuantityNumber) || staffQuantityNumber < 0) {
            toast.error("Invalid staff quantity");
            return;
        }
        if (Number.isNaN(productRecommendLimitNumber)) {
            toast.error("Invalid product recommend limit");
            return;
        }
        if (Number.isNaN(menuSuggestLimitNumber)) {
            toast.error("Invalid menu suggest limit");
            return;
        }
        if (Number.isNaN(menuAnalyzeFeedbackLimitNumber)) {
            toast.error("Invalid menu analyze feedback limit");
            return;
        }
        if (Number.isNaN(inventoryForecastLimitNumber)) {
            toast.error("Invalid inventory forecast limit");
            return;
        }
        if (Number.isNaN(recipeRecommendLimitNumber)) {
            toast.error("Invalid recipe recommend limit");
            return;
        }

        const payload = {
            name: values.name.trim(),
            description: values.description.trim(),
            price: priceNumber,
            staffQuantity: staffQuantityNumber,
            productRecommendLimit: productRecommendLimitNumber,
            menuSuggestLimit: menuSuggestLimitNumber,
            menuAnalyzeFeedbackLimit: menuAnalyzeFeedbackLimitNumber,
            inventoryForecastLimit: inventoryForecastLimitNumber,
            recipeRecommendLimit: recipeRecommendLimitNumber,
        };

        try {
            setIsSubmitting(true);
            if (editingPackage) {
                await subscriptionPackageService.update(editingPackage.packageId, payload);
                toast.success("Subscription package updated successfully");
            } else {
                await subscriptionPackageService.create(payload);
                toast.success("Subscription package created successfully");
            }
            resetDialog();
            void fetchPackages();
        } catch (err: any) {
            console.error(err);
            toast.error(err?.response?.data?.message || "Operation failed");
            setIsSubmitting(false);
        }
    };

    const formatPrice = (value: number | null | undefined) => {
        return formatVND(value);
    };

    const getDescriptionFeatures = (value: string | null | undefined) => {
        const normalized = (value ?? "").replace(/\\n|\/n/g, "\n");
        const features = normalized
            .split("\n")
            .map((line) => line.trim())
            .filter(Boolean);

        return features.length > 0 ? features : ["Perfect for small local shops starting out."];
    };

    return (
        <div className="mt-24 px-10 pb-10 w-full overflow-y-auto">
            <div className="w-full">
                {/* Page header */}
                <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold leading-tight tracking-[-0.015em] text-[#1F1F1F] flex items-center gap-2">
                            <Package size={22} className="text-[#573E32]" />
                            Subscription Packages
                        </h1>
                        <p className="mt-1 text-sm text-[#707070]">
                            Manage subscription packages for Coffee owners
                        </p>
                    </div>
                    <div className="flex items-center gap-3">
                        <div className="hidden md:flex items-center gap-2 rounded-full bg-white px-4 py-2 shadow-sm border border-[#EFEAE5]">
                            <Search size={16} className="text-[#B0A49E]" />
                            <input
                                type="text"
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Search plans..."
                                className="w-48 bg-transparent text-sm text-[#573E32] placeholder:text-[#B0A49E] focus:outline-none"
                            />
                        </div>

                        <Button
                            type="button"
                            variant="outline"
                            className="rounded-full border-[#E0D5D0] bg-white text-[#573E32] hover:bg-[#F5F3F1] flex items-center gap-2"
                        >
                            <Filter size={16} />
                            <span>Filter</span>
                        </Button>
                    </div>
                </div>

                {/* Statistics */}
                <div className="mb-6 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
                    {stats.map((stat) => {
                        const Icon = stat.icon;
                        return (
                            <div
                                key={stat.title}
                                className="bg-white rounded-2xl shadow-sm border border-[#EFEAE5] p-4 flex items-center gap-4"
                            >
                                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#573E32]/10 text-[#573E32]">
                                    <Icon size={18} />
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-[#8C7A6B]">{stat.title}</p>
                                    <p className="text-xl font-semibold text-[#1F1F1F]">{stat.value}</p>
                                    <p className="text-[11px] text-[#B0A49E] mt-0.5">{stat.subtitle}</p>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {/* Plans grid */}
                <div className="mt-4">
                    {error && <p className="mb-2 text-xs text-red-500">{error}</p>}

                    {loading && (
                        <div className="flex items-center justify-center py-10">
                            <InlineLoading text="Loading Packages..." />
                        </div>
                    )}

                    {!loading && filteredPackages.length === 0 && !error && (
                        <p className="py-10 text-center text-sm text-[#707070]">No subscription packages found.</p>
                    )}

                    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-5">
                        {filteredPackages.map((pkg, index) => (
                            <div
                                key={pkg.packageId}
                                className="flex flex-col justify-between rounded-3xl border border-[#EFEAE5] bg-white shadow-sm px-6 py-6 min-h-85 relative"
                            >
                                {/* Most popular badge for second card as UI-cứng */}
                                {index === 1 && (
                                    <div className="absolute -top-3 left-6 rounded-full bg-[#573E32] px-3 py-1 text-[10px] font-semibold tracking-wide text-white uppercase shadow-sm">
                                        Most popular
                                    </div>
                                )}

                                <div className="flex items-start justify-between mb-4">
                                    <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#F5F3F1] text-[#573E32] text-lg">
                                        <span className="material-symbols-outlined text-base">coffee</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="rounded-full bg-emerald-50 px-3 py-1 text-[11px] font-semibold text-emerald-700">
                                            ACTIVE
                                        </span>
                                        <button
                                            type="button"
                                            className="p-1 rounded-full hover:bg-black/5 text-[#B0A49E]"
                                            onClick={() => setActiveMenuPackageId((prev) => (prev === pkg.packageId ? null : pkg.packageId))}
                                        >
                                            <MoreVertical size={16} />
                                        </button>
                                        {activeMenuPackageId === pkg.packageId && (
                                            <div className="absolute right-5 top-14 z-20 min-w-36 rounded-xl border border-[#EFEAE5] bg-white py-1 shadow-lg">
                                                <button
                                                    type="button"
                                                    className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50"
                                                    onClick={() => openDeleteDialog(pkg)}
                                                >
                                                    Delete package
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="mb-4">
                                    <h3 className="text-lg font-semibold text-[#1F1F1F]">{pkg.name}</h3>
                                </div>

                                <div className="mb-5">
                                    <p className="text-xl font-semibold tracking-tight text-[#1F1F1F]">{formatPrice(pkg.price as any)}</p>
                                    <p className="text-xs text-[#B0A49E]">/ month</p>
                                </div>

                                <div className="border-t border-[#F1E6DE] pt-4 space-y-2 text-xs text-[#4F4F4F]">

                                    {getDescriptionFeatures(pkg.description).map((feature, featureIndex) => (
                                        <div key={`${pkg.packageId}-feature-${featureIndex}`} className="flex items-center gap-2">
                                            <Check size={14} className="text-emerald-600" />
                                            <span>{feature}</span>
                                        </div>
                                    ))}
                                    <div className="flex items-center gap-2">
                                        <Check size={14} className="text-emerald-600" />
                                        <span>Up to {pkg.staffQuantity ?? 0} staff accounts</span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Check size={14} className="text-emerald-600" />
                                        <span>
                                            Product recommend limit: {pkg.productRecommendLimit == null ? "Unlimited" : pkg.productRecommendLimit}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Check size={14} className="text-emerald-600" />
                                        <span>
                                            Menu suggest limit: {pkg.menuSuggestLimit == null ? "Unlimited" : pkg.menuSuggestLimit}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Check size={14} className="text-emerald-600" />
                                        <span>
                                            Menu analyze feedback limit: {pkg.menuAnalyzeFeedbackLimit == null ? "Unlimited" : pkg.menuAnalyzeFeedbackLimit}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Check size={14} className="text-emerald-600" />
                                        <span>
                                            Inventory forecast limit: {pkg.inventoryForecastLimit == null ? "Unlimited" : pkg.inventoryForecastLimit}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Check size={14} className="text-emerald-600" />
                                        <span>
                                            Recipe recommend limit: {pkg.recipeRecommendLimit == null ? "Unlimited" : pkg.recipeRecommendLimit}
                                        </span>
                                    </div>
                                </div>

                                <div className="mt-5 flex items-center gap-3">
                                    <button
                                        className="flex-1 rounded-xl border border-[#EFEAE5] bg-white px-4 py-2 text-sm font-medium text-[#573E32] hover:bg-[#F5F3F1] flex items-center justify-center gap-2"
                                        onClick={() => openEditDialog(pkg)}
                                    >
                                        <Pencil size={14} />
                                        <span>Edit</span>
                                    </button>
                                </div>
                            </div>
                        ))}

                        {/* Create new plan card */}
                        <button
                            type="button"
                            onClick={openCreateDialog}
                            className="flex flex-col items-center justify-center rounded-3xl border border-dashed border-[#D5C9C0] bg-transparent px-6 py-6 min-h-85 text-center text-[#7A685B] hover:border-[#B89D8A] hover:bg-[#F9F6F3] transition-colors"
                        >
                            <p className="text-sm font-semibold mb-1">Create New Plan</p>
                            <p className="text-xs text-[#B0A49E] mb-4">Design a new custom tier</p>
                            <div className="flex h-14 w-14 items-center justify-center rounded-full bg-white shadow-sm border border-[#E4D7CD]">
                                <Plus size={20} className="text-[#573E32]" />
                            </div>
                        </button>
                    </div>
                </div>
            </div>

            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>
                            {editingPackage ? "Edit Subscription Package" : "Create Subscription Package"}
                        </DialogTitle>
                    </DialogHeader>

                    <form className="space-y-4 mt-2" onSubmit={form.handleSubmit(handleSubmit)}>
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-[#4F4F4F]">Package Name</label>
                            <Input
                                {...form.register("name")}
                                placeholder="e.g. Starter, Growth, Enterprise"
                            />
                            {form.formState.errors.name && (
                                <p className="text-xs text-red-500">{form.formState.errors.name.message}</p>
                            )}
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-[#4F4F4F]">Description</label>
                            <textarea
                                {...form.register("description")}
                                placeholder="Short description for this package"
                                className="w-full rounded-2xl border border-slate-200 bg-transparent px-5 py-3 text-sm shadow-sm placeholder:text-slate-400 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#4b2c20]/20 focus-visible:border-[#4b2c20] min-h-20"
                            />
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-[#4F4F4F]">Price (VND)</label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="1000"
                                    {...form.register("price")}
                                    placeholder="e.g. 990000"
                                />
                                {form.formState.errors.price && (
                                    <p className="text-xs text-red-500">{form.formState.errors.price.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-[#4F4F4F]">Staff Quantity</label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="1"
                                    {...form.register("staffQuantity")}
                                    placeholder="e.g. 5"
                                />
                                {form.formState.errors.staffQuantity && (
                                    <p className="text-xs text-red-500">{form.formState.errors.staffQuantity.message}</p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-[#4F4F4F]">Product Recommend Limit</label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="1"
                                    {...form.register("productRecommendLimit")}
                                    placeholder="Leave empty for unlimited"
                                />
                                {form.formState.errors.productRecommendLimit && (
                                    <p className="text-xs text-red-500">{form.formState.errors.productRecommendLimit.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-[#4F4F4F]">Menu Suggest Limit</label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="1"
                                    {...form.register("menuSuggestLimit")}
                                    placeholder="Leave empty for unlimited"
                                />
                                {form.formState.errors.menuSuggestLimit && (
                                    <p className="text-xs text-red-500">{form.formState.errors.menuSuggestLimit.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-[#4F4F4F]">Recipe Recommend Limit</label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="1"
                                    {...form.register("recipeRecommendLimit")}
                                    placeholder="Leave empty for unlimited"
                                />
                                {form.formState.errors.recipeRecommendLimit && (
                                    <p className="text-xs text-red-500">{form.formState.errors.recipeRecommendLimit.message}</p>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-[#4F4F4F]">Menu Analyze Feedback Limit</label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="1"
                                    {...form.register("menuAnalyzeFeedbackLimit")}
                                    placeholder="Leave empty for unlimited"
                                />
                                {form.formState.errors.menuAnalyzeFeedbackLimit && (
                                    <p className="text-xs text-red-500">{form.formState.errors.menuAnalyzeFeedbackLimit.message}</p>
                                )}
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-[#4F4F4F]">Inventory Forecast Limit</label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="1"
                                    {...form.register("inventoryForecastLimit")}
                                    placeholder="Leave empty for unlimited"
                                />
                                {form.formState.errors.inventoryForecastLimit && (
                                    <p className="text-xs text-red-500">{form.formState.errors.inventoryForecastLimit.message}</p>
                                )}
                            </div>
                        </div>

                        <DialogFooter className="mt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={resetDialog}
                                disabled={isSubmitting}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="submit"
                                className="bg-[#573E32] hover:bg-[#432d23]"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? "Saving..." : editingPackage ? "Save Changes" : "Create Package"}
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            <Dialog
                open={isDeleteDialogOpen}
                onOpenChange={(open) => {
                    if (!open) {
                        closeDeleteDialog();
                        return;
                    }
                    setIsDeleteDialogOpen(true);
                }}
            >
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Confirm Delete Package</DialogTitle>
                    </DialogHeader>

                    <p className="text-sm text-[#5F5F5F]">
                        Are you sure you want to delete package
                        {" "}
                        <span className="font-semibold text-[#1F1F1F]">{deleteTarget?.name ?? "this"}</span>
                        ? This action cannot be undone.
                    </p>

                    <DialogFooter className="mt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={closeDeleteDialog}
                            disabled={isDeleting}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="button"
                            className="bg-red-600 text-white hover:bg-red-700"
                            onClick={handleDeletePackage}
                            disabled={isDeleting}
                        >
                            {isDeleting ? "Deleting..." : "Delete"}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    );
}
