import { useEffect, useMemo, useState } from "react";
import { BadgePercent, Save, Settings2, Users, WandSparkles, FlaskConical, MessageSquareText, Boxes } from "lucide-react";
import { toast } from "sonner";
import { InlineLoading } from "@/components/Loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    systemSettingsService,
    type PackageLimit,
    type SystemSettings,
    type UpdatePackageLimitPayload,
} from "@/apis/systemSettings.service";

type PackageLimitFormState = {
    staffQuantity: string;
    productRecommendLimit: string;
    menuSuggestLimit: string;
    menuAnalyzeFeedbackLimit: string;
    inventoryForecastLimit: string;
    recipeRecommendLimit: string;
};

const formatLimit = (value: number | null | undefined) => {
    if (value == null) return "Unlimited";
    return value.toLocaleString("en-US");
};

const toFormState = (item: PackageLimit): PackageLimitFormState => ({
    staffQuantity: item.staffQuantity == null ? "" : item.staffQuantity.toString(),
    productRecommendLimit: item.productRecommendLimit == null ? "" : item.productRecommendLimit.toString(),
    menuSuggestLimit: item.menuSuggestLimit == null ? "" : item.menuSuggestLimit.toString(),
    menuAnalyzeFeedbackLimit: item.menuAnalyzeFeedbackLimit == null ? "" : item.menuAnalyzeFeedbackLimit.toString(),
    inventoryForecastLimit: item.inventoryForecastLimit == null ? "" : item.inventoryForecastLimit.toString(),
    recipeRecommendLimit: item.recipeRecommendLimit == null ? "" : item.recipeRecommendLimit.toString(),
});

const parseOptionalInteger = (rawValue: string, fieldLabel: string) => {
    const value = rawValue.trim();
    if (!value) return null;

    const parsed = Number(value);
    if (!Number.isInteger(parsed) || parsed < 0) {
        throw new Error(`${fieldLabel} must be a non-negative integer or left empty for unlimited.`);
    }

    return parsed;
};

export function SystemSettingsPage() {
    const [settings, setSettings] = useState<SystemSettings | null>(null);
    const [packageForms, setPackageForms] = useState<Record<number, PackageLimitFormState>>({});

    const [commissionInput, setCommissionInput] = useState("0");

    const [loading, setLoading] = useState(false);
    const [savingCommission, setSavingCommission] = useState(false);
    const [savingPackageId, setSavingPackageId] = useState<number | null>(null);

    const [error, setError] = useState<string | null>(null);

    const fetchSettings = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await systemSettingsService.getAll();
            const data = response.data;

            setSettings(data);
            const normalizedCommission = Math.min(20, Math.max(5, data.commissionRatePercent ?? 5));
            setCommissionInput(normalizedCommission.toString());

            const initialForms: Record<number, PackageLimitFormState> = {};
            data.packageLimits.forEach((item) => {
                initialForms[item.packageId] = toFormState(item);
            });
            setPackageForms(initialForms);
        } catch {
            setError("Cannot load system settings at the moment.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchSettings();
    }, []);

    const commissionValue = useMemo(() => {
        const parsed = Number(commissionInput);
        if (Number.isNaN(parsed)) return 5;
        return Math.min(20, Math.max(5, parsed));
    }, [commissionInput]);

    const handleCommissionSave = async () => {
        const value = Number(commissionInput);

        if (Number.isNaN(value) || value < 5 || value > 20 || !Number.isInteger(value)) {
            toast.error("Commission rate must be an integer between 5 and 20.");
            return;
        }

        try {
            setSavingCommission(true);
            await systemSettingsService.updateCommission({ commissionRatePercent: value });

            setSettings((prev) => (prev ? { ...prev, commissionRatePercent: value } : prev));
            toast.success("Commission fee updated successfully.");
        } catch (err: any) {
            toast.error(err?.response?.data?.message || "Failed to update commission fee.");
        } finally {
            setSavingCommission(false);
        }
    };

    const handleLimitFieldChange = (packageId: number, field: keyof PackageLimitFormState, value: string) => {
        setPackageForms((prev) => ({
            ...prev,
            [packageId]: {
                ...prev[packageId],
                [field]: value,
            },
        }));
    };

    const handleSavePackageLimits = async (item: PackageLimit) => {
        const form = packageForms[item.packageId] ?? toFormState(item);

        let payload: UpdatePackageLimitPayload;
        try {
            payload = {
                staffQuantity: parseOptionalInteger(form.staffQuantity, "Staff quantity"),
                productRecommendLimit: parseOptionalInteger(form.productRecommendLimit, "Product recommend limit"),
                menuSuggestLimit: parseOptionalInteger(form.menuSuggestLimit, "Menu suggest limit"),
                menuAnalyzeFeedbackLimit: parseOptionalInteger(form.menuAnalyzeFeedbackLimit, "Menu analyze feedback limit"),
                inventoryForecastLimit: parseOptionalInteger(form.inventoryForecastLimit, "Inventory forecast limit"),
                recipeRecommendLimit: parseOptionalInteger(form.recipeRecommendLimit, "Recipe recommend limit"),
            };
        } catch (validationError: any) {
            toast.error(validationError?.message || "Invalid package limit values.");
            return;
        }

        try {
            setSavingPackageId(item.packageId);
            await systemSettingsService.updatePackageLimits(item.packageId, payload);

            setSettings((prev) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    packageLimits: prev.packageLimits.map((pkg) => {
                        if (pkg.packageId !== item.packageId) return pkg;
                        return {
                            ...pkg,
                            ...payload,
                        };
                    }),
                };
            });

            toast.success(`Updated limits for ${item.name}.`);
        } catch (err: any) {
            toast.error(err?.response?.data?.message || `Cannot update limits for ${item.name}.`);
        } finally {
            setSavingPackageId(null);
        }
    };

    return (
        <div className="mt-24 w-full px-6 pb-10 md:px-10">
            <div className="mx-auto max-w-7xl space-y-6">
                <div className="rounded-3xl border border-[#E8E1DB] bg-linear-to-r from-[#FCFAF8] via-[#F7F3EF] to-[#F4ECE6] p-6 shadow-sm md:p-8">
                    <h1 className="text-2xl font-bold tracking-tight text-[#2F221B] md:text-3xl">Fee Management</h1>
                    <p className="mt-2 max-w-3xl text-sm text-[#6E5E54] md:text-base">
                        Configure global fee policies applied to transactions, services, and partnerships. Changes are applied immediately for upcoming operations.
                    </p>
                </div>

                {loading && (
                    <div className="rounded-3xl border border-[#E8E1DB] bg-white py-16">
                        <InlineLoading text="Loading system settings..." />
                    </div>
                )}

                {error && !loading && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
                        {error}
                    </div>
                )}

                {!loading && settings && (
                    <>
                        <section className="overflow-hidden rounded-3xl border border-[#E8E1DB] bg-white shadow-sm">
                            <div className="flex flex-col gap-3 border-b border-[#F1E8E2] bg-[#FCFAF8] px-5 py-4 md:flex-row md:items-center md:justify-between md:px-6">
                                <div className="flex items-center gap-3">
                                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EDE5DD] text-[#5B4637]">
                                        <BadgePercent size={18} />
                                    </div>
                                    <div>
                                        <h2 className="text-lg font-semibold text-[#2F221B]">Commission Fee</h2>
                                        <p className="text-xs text-[#7E6A5C]">Standard fee applied to all processed payments.</p>
                                    </div>
                                </div>
                                <Button
                                    type="button"
                                    className="bg-[#5C4233] text-white hover:bg-[#4B362A]"
                                    onClick={handleCommissionSave}
                                    disabled={savingCommission}
                                >
                                    <Save size={16} className="mr-1" />
                                    {savingCommission ? "Saving..." : "Save Commission"}
                                </Button>
                            </div>

                            <div className="space-y-5 p-5 md:p-6">
                                <div className="space-y-2">
                                    <label className="text-sm font-medium text-[#4E3D32]">Percentage Fee</label>
                                    <div className="flex items-center gap-3">
                                        <Input
                                            type="number"
                                            value={commissionInput}
                                            min={5}
                                            max={20}
                                            step={1}
                                            onChange={(e) => setCommissionInput(e.target.value)}
                                            className="max-w-xs"
                                        />
                                        <span className="rounded-full bg-[#F2E9E3] px-3 py-1 text-sm font-semibold text-[#5C4233]">
                                            {commissionValue.toFixed(0)}%
                                        </span>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <input
                                        type="range"
                                        min={5}
                                        max={20}
                                        step={1}
                                        value={commissionValue}
                                        onChange={(e) => setCommissionInput(e.target.value)}
                                        className="h-2 w-full cursor-pointer appearance-none rounded-full bg-[#E9DFD6]"
                                    />
                                    <div className="flex items-center justify-between text-xs text-[#8A7566]">
                                        <span>5%</span>
                                        <span>10%</span>
                                        <span>15%</span>
                                        <span>20%</span>
                                    </div>
                                </div>
                            </div>
                        </section>

                        <section className="rounded-3xl border border-[#E8E1DB] bg-white p-5 shadow-sm md:p-6">
                            <div className="mb-4 flex items-center gap-3">
                                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#EDE5DD] text-[#5B4637]">
                                    <Settings2 size={18} />
                                </div>
                                <div>
                                    <h2 className="text-lg font-semibold text-[#2F221B]">Package Limits</h2>
                                    <p className="text-xs text-[#7E6A5C]">Fine-tune account and AI usage limits per subscription package.</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
                                {settings.packageLimits.map((item) => {
                                    const form = packageForms[item.packageId] ?? toFormState(item);
                                    const isSaving = savingPackageId === item.packageId;

                                    return (
                                        <article
                                            key={item.packageId}
                                            className="rounded-2xl border border-[#EEE6DF] bg-[#FFFDFA] p-4"
                                        >
                                            <div className="mb-4 flex items-center justify-between">
                                                <h3 className="text-base font-semibold text-[#2F221B]">{item.name}</h3>
                                                <span className="rounded-full bg-[#F2E9E3] px-2.5 py-1 text-[11px] font-medium text-[#6B5343]">
                                                    ID #{item.packageId}
                                                </span>
                                            </div>

                                            <div className="space-y-3">
                                                <div>
                                                    <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-[#5C4A3E]">
                                                        <Users size={13} />
                                                        Staff Quantity
                                                    </label>
                                                    <Input
                                                        type="number"
                                                        min={0}
                                                        step={1}
                                                        value={form.staffQuantity}
                                                        onChange={(e) => handleLimitFieldChange(item.packageId, "staffQuantity", e.target.value)}
                                                        placeholder="Leave empty for unlimited"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-[#5C4A3E]">
                                                        <Boxes size={13} />
                                                        Product Recommend Limit
                                                    </label>
                                                    <Input
                                                        type="number"
                                                        min={0}
                                                        step={1}
                                                        value={form.productRecommendLimit}
                                                        onChange={(e) => handleLimitFieldChange(item.packageId, "productRecommendLimit", e.target.value)}
                                                        placeholder="Leave empty for unlimited"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-[#5C4A3E]">
                                                        <WandSparkles size={13} />
                                                        Menu Suggest Limit
                                                    </label>
                                                    <Input
                                                        type="number"
                                                        min={0}
                                                        step={1}
                                                        value={form.menuSuggestLimit}
                                                        onChange={(e) => handleLimitFieldChange(item.packageId, "menuSuggestLimit", e.target.value)}
                                                        placeholder="Leave empty for unlimited"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-[#5C4A3E]">
                                                        <MessageSquareText size={13} />
                                                        Menu Analyze Feedback Limit
                                                    </label>
                                                    <Input
                                                        type="number"
                                                        min={0}
                                                        step={1}
                                                        value={form.menuAnalyzeFeedbackLimit}
                                                        onChange={(e) => handleLimitFieldChange(item.packageId, "menuAnalyzeFeedbackLimit", e.target.value)}
                                                        placeholder="Leave empty for unlimited"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-[#5C4A3E]">
                                                        <WandSparkles size={13} />
                                                        Inventory Forecast Limit
                                                    </label>
                                                    <Input
                                                        type="number"
                                                        min={0}
                                                        step={1}
                                                        value={form.inventoryForecastLimit}
                                                        onChange={(e) => handleLimitFieldChange(item.packageId, "inventoryForecastLimit", e.target.value)}
                                                        placeholder="Leave empty for unlimited"
                                                    />
                                                </div>

                                                <div>
                                                    <label className="mb-1 flex items-center gap-1.5 text-xs font-medium text-[#5C4A3E]">
                                                        <FlaskConical size={13} />
                                                        Recipe Recommend Limit
                                                    </label>
                                                    <Input
                                                        type="number"
                                                        min={0}
                                                        step={1}
                                                        value={form.recipeRecommendLimit}
                                                        onChange={(e) => handleLimitFieldChange(item.packageId, "recipeRecommendLimit", e.target.value)}
                                                        placeholder="Leave empty for unlimited"
                                                    />
                                                </div>
                                            </div>

                                            <div className="mt-4 rounded-xl border border-[#EFE5DD] bg-white px-3 py-2 text-[11px] text-[#7E6A5C]">
                                                Current: Staff {formatLimit(item.staffQuantity)} | Product {formatLimit(item.productRecommendLimit)} | Menu {formatLimit(item.menuSuggestLimit)} | Feedback {formatLimit(item.menuAnalyzeFeedbackLimit)} | Forecast {formatLimit(item.inventoryForecastLimit)} | Recipe {formatLimit(item.recipeRecommendLimit)}
                                            </div>

                                            <Button
                                                type="button"
                                                onClick={() => handleSavePackageLimits(item)}
                                                className="mt-4 w-full bg-[#5C4233] text-white hover:bg-[#4B362A]"
                                                disabled={isSaving}
                                            >
                                                {isSaving ? "Updating..." : "Update Limits"}
                                            </Button>
                                        </article>
                                    );
                                })}
                            </div>
                        </section>
                    </>
                )}
            </div>
        </div>
    );
}
