import { useEffect, useMemo, useState } from "react";
import { Package, Users, CreditCard, BarChart2, Plus, Pencil, Filter, Search, Check, MoreVertical } from "lucide-react";
import { InlineLoading } from "@/components/Loading";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { subscriptionPackageService, type SubscriptionPackage } from "@/apis/subscriptionPackage.service";
import { toast } from "sonner";

interface PackageFormState {
    name: string;
    description: string;
    price: string;
    staffQuantity: string;
    productRecommendLimit: string;
    menuSuggestLimit: string;
    menuAnalyzeFeedbackLimit: string;
    inventoryForecastLimit: string;
    recipeRecommendLimit: string;
}

const parseOptionalLimit = (value: string) => {
    if (!value.trim()) return null;

    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 0) {
        return Number.NaN;
    }

    return parsed;
};

export function SubscriptionPackagesPage() {
    const [packages, setPackages] = useState<SubscriptionPackage[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [search, setSearch] = useState("");

    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingPackage, setEditingPackage] = useState<SubscriptionPackage | null>(null);
    const [activeMenuPackageId, setActiveMenuPackageId] = useState<number | null>(null);
    const [deleteTarget, setDeleteTarget] = useState<SubscriptionPackage | null>(null);
    const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
    const [formState, setFormState] = useState<PackageFormState>({
        name: "",
        description: "",
        price: "",
        staffQuantity: "",
        productRecommendLimit: "",
        menuSuggestLimit: "",
        menuAnalyzeFeedbackLimit: "",
        inventoryForecastLimit: "",
        recipeRecommendLimit: "",
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);

    const fetchPackages = async () => {
        try {
            setLoading(true);
            setError(null);
            const res = await subscriptionPackageService.getAll();
            const data = Array.isArray(res.data) ? res.data : (res.data as any)?.items ?? [];
            setPackages(data as SubscriptionPackage[]);
        } catch (err) {
            setError("Không tải được danh sách gói đăng ký");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchPackages();
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
    const totalStaffCapacity = useMemo(
        () => packages.reduce((sum, p) => sum + (Number(p.staffQuantity) || 0), 0),
        [packages],
    );

    // Hard-coded / derived statistics as requested
    const stats = [
        {
            title: "Total Packages",
            value: totalPackages.toString(),
            icon: Package,
            subtitle: "Available subscription plans",
        },
        {
            title: "Total Staff Capacity",
            value: totalStaffCapacity.toString(),
            icon: Users,
            subtitle: "Maximum staff across all packages",
        },
        {
            title: "Active Subscriptions",
            value: "128", // UI cứng
            icon: CreditCard,
            subtitle: "Currently active across system",
        },
        {
            title: "Monthly Revenue",
            value: "89,000,000₫", // UI cứng
            icon: BarChart2,
            subtitle: "Estimated subscription revenue",
        },
    ];

    const openCreateDialog = () => {
        setEditingPackage(null);
        setFormState({
            name: "",
            description: "",
            price: "",
            staffQuantity: "",
            productRecommendLimit: "",
            menuSuggestLimit: "",
            menuAnalyzeFeedbackLimit: "",
            inventoryForecastLimit: "",
            recipeRecommendLimit: "",
        });
        setIsDialogOpen(true);
    };

    const openEditDialog = (pkg: SubscriptionPackage) => {
        setEditingPackage(pkg);
        setFormState({
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
            toast.success("Xóa gói đăng ký thành công");
            closeDeleteDialog();
            void fetchPackages();
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Xóa gói đăng ký thất bại");
        } finally {
            setIsDeleting(false);
        }
    };

    const handleInputChange = (field: keyof PackageFormState, value: string) => {
        setFormState((prev) => ({ ...prev, [field]: value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formState.name || !formState.price || !formState.staffQuantity) {
            toast.error("Vui lòng nhập đầy đủ tên, giá và số lượng nhân viên");
            return;
        }

        const priceNumber = Number(formState.price);
        const staffQuantityNumber = Number(formState.staffQuantity);
        const productRecommendLimitNumber = parseOptionalLimit(formState.productRecommendLimit);
        const menuSuggestLimitNumber = parseOptionalLimit(formState.menuSuggestLimit);
        const menuAnalyzeFeedbackLimitNumber = parseOptionalLimit(formState.menuAnalyzeFeedbackLimit);
        const inventoryForecastLimitNumber = parseOptionalLimit(formState.inventoryForecastLimit);
        const recipeRecommendLimitNumber = parseOptionalLimit(formState.recipeRecommendLimit);

        if (Number.isNaN(priceNumber) || priceNumber < 0) {
            toast.error("Giá không hợp lệ");
            return;
        }
        if (!Number.isInteger(staffQuantityNumber) || staffQuantityNumber < 0) {
            toast.error("Số lượng nhân viên không hợp lệ");
            return;
        }
        if (Number.isNaN(productRecommendLimitNumber)) {
            toast.error("Product recommend limit không hợp lệ");
            return;
        }
        if (Number.isNaN(menuSuggestLimitNumber)) {
            toast.error("Menu suggest limit không hợp lệ");
            return;
        }
        if (Number.isNaN(menuAnalyzeFeedbackLimitNumber)) {
            toast.error("Menu analyze feedback limit không hợp lệ");
            return;
        }
        if (Number.isNaN(inventoryForecastLimitNumber)) {
            toast.error("Inventory forecast limit không hợp lệ");
            return;
        }
        if (Number.isNaN(recipeRecommendLimitNumber)) {
            toast.error("Recipe recommend limit không hợp lệ");
            return;
        }

        const payload = {
            name: formState.name,
            description: formState.description,
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
                toast.success("Cập nhật gói đăng ký thành công");
            } else {
                await subscriptionPackageService.create(payload);
                toast.success("Tạo gói đăng ký thành công");
            }
            resetDialog();
            void fetchPackages();
        } catch (err: any) {
            console.error(err);
            toast.error(err?.response?.data?.message || "Thao tác không thành công");
            setIsSubmitting(false);
        }
    };

    const formatPrice = (value: number | null | undefined) => {
        if (value == null || Number.isNaN(Number(value))) return "-";
        return `${Number(value).toLocaleString("vi-VN")}₫`;
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
                            Manage subscription packages for SmartCoffee owners
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

                    <form className="space-y-4 mt-2" onSubmit={handleSubmit}>
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-[#4F4F4F]">Package Name</label>
                            <Input
                                value={formState.name}
                                onChange={(e) => handleInputChange("name", e.target.value)}
                                placeholder="e.g. Starter, Growth, Enterprise"
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-medium text-[#4F4F4F]">Description</label>
                            <textarea
                                value={formState.description}
                                onChange={(e) => handleInputChange("description", e.target.value)}
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
                                    value={formState.price}
                                    onChange={(e) => handleInputChange("price", e.target.value)}
                                    placeholder="e.g. 990000"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-[#4F4F4F]">Staff Quantity</label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={formState.staffQuantity}
                                    onChange={(e) => handleInputChange("staffQuantity", e.target.value)}
                                    placeholder="e.g. 5"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-[#4F4F4F]">Product Recommend Limit</label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={formState.productRecommendLimit}
                                    onChange={(e) => handleInputChange("productRecommendLimit", e.target.value)}
                                    placeholder="Leave empty for unlimited"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-[#4F4F4F]">Menu Suggest Limit</label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={formState.menuSuggestLimit}
                                    onChange={(e) => handleInputChange("menuSuggestLimit", e.target.value)}
                                    placeholder="Leave empty for unlimited"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-[#4F4F4F]">Recipe Recommend Limit</label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={formState.recipeRecommendLimit}
                                    onChange={(e) => handleInputChange("recipeRecommendLimit", e.target.value)}
                                    placeholder="Leave empty for unlimited"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-[#4F4F4F]">Menu Analyze Feedback Limit</label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={formState.menuAnalyzeFeedbackLimit}
                                    onChange={(e) => handleInputChange("menuAnalyzeFeedbackLimit", e.target.value)}
                                    placeholder="Leave empty for unlimited"
                                />
                            </div>
                            <div className="space-y-2">
                                <label className="text-xs font-medium text-[#4F4F4F]">Inventory Forecast Limit</label>
                                <Input
                                    type="number"
                                    min="0"
                                    step="1"
                                    value={formState.inventoryForecastLimit}
                                    onChange={(e) => handleInputChange("inventoryForecastLimit", e.target.value)}
                                    placeholder="Leave empty for unlimited"
                                />
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
                        Bạn có chắc muốn xóa gói
                        {" "}
                        <span className="font-semibold text-[#1F1F1F]">{deleteTarget?.name ?? "này"}</span>
                        ? Hành động này không thể hoàn tác.
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
