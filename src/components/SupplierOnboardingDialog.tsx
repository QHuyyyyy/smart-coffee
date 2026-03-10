import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
    Dialog,
    DialogContent,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { InlineLoading } from "@/components/Loading";
import { useAuthStore } from "@/stores/auth.store";
import { authService } from "@/apis/auth.service";
import { walletService } from "@/apis/wallet.service";

type Step = 1 | 2;

const businessInfoSchema = z.object({
    supplierName: z.string().min(1, "Supplier name is required"),
    businessAddress: z.string().min(1, "Business address is required"),
});

type BusinessInfoFormValues = z.infer<typeof businessInfoSchema>;

export function SupplierOnboardingDialog() {
    const currentUser = useAuthStore((state) => state.currentUser);
    const fetchCurrentUser = useAuthStore((state) => state.fetchCurrentUser);

    const [open, setOpen] = useState(false);
    const [activeStep, setActiveStep] = useState<Step>(1);

    const [bankName, setBankName] = useState("");
    const [bankAccountNumber, setBankAccountNumber] = useState("");

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const businessForm = useForm<BusinessInfoFormValues>({
        resolver: zodResolver(businessInfoSchema),
        defaultValues: {
            supplierName: currentUser?.supplierName ?? "",
            businessAddress: currentUser?.address ?? "",
        },
    });

    useEffect(() => {
        if (currentUser && currentUser.role === "Supplier" && !currentUser.address) {
            businessForm.reset({
                supplierName: currentUser.supplierName ?? "",
                businessAddress: currentUser.address ?? "",
            });
            setOpen(true);
        }
    }, [currentUser, businessForm]);

    if (!currentUser || currentUser.role !== "Supplier") {
        return null;
    }

    const handleBusinessSubmit = async (values: BusinessInfoFormValues) => {
        setError(null);

        try {
            setIsSubmitting(true);

            await authService.updateSupplier({
                accountId: currentUser.accountId,
                supplierName: values.supplierName.trim(),
                address: values.businessAddress.trim(),
            });

            await fetchCurrentUser();

            setActiveStep(2);
        } catch (err: any) {
            const message = err?.response?.data?.message ?? "Failed to save business information. Please try again.";
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleCompleteSetup = () => {
        setOpen(false);
    };

    const handleSaveBankInfo = async () => {
        if (!currentUser?.wallet?.walletId) {
            // Wallet chưa sẵn sàng, cứ đóng dialog để tránh lỗi khó hiểu
            setOpen(false);
            return;
        }

        const trimmedBankName = bankName.trim();
        const trimmedAccount = bankAccountNumber.trim();

        if (!trimmedBankName || !trimmedAccount) {
            setError("Bank name and account number are required.");
            return;
        }

        try {
            setIsSubmitting(true);
            setError(null);

            await walletService.updateBankInfo(currentUser.wallet.walletId, {
                bankName: trimmedBankName,
                bankAccountNumber: trimmedAccount,
            });

            await fetchCurrentUser();
            setOpen(false);
        } catch (err: any) {
            const message = err?.response?.data?.message ?? err?.message ?? "Failed to update bank information. Please try again.";
            setError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const isBusinessStep = activeStep === 1;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogContent
                className="max-w-4xl p-0 overflow-hidden border-none bg-[#FFF7F2] text-[#1F1F1F]"
                onInteractOutside={(event) => event.preventDefault()}
            >
                {/* Hero section */}
                <div className="h-40 w-full bg-cover bg-center" style={{
                    backgroundImage:
                        "url('https://images.pexels.com/photos/894695/pexels-photo-894695.jpeg?auto=compress&cs=tinysrgb&w=1200')",
                }}>
                    <div className="h-full w-full bg-linear-to-r from-black/40 to-black/10 flex flex-col justify-center px-10">
                        <h2 className="text-2xl font-semibold text-white mb-1">Welcome to SmartCoffee!</h2>
                        <p className="text-sm text-white/90 max-w-xl">
                            Let&apos;s set up your supplier profile to get you started with our global network.
                        </p>
                    </div>
                </div>

                {/* Content */}
                <div className="px-10 py-8 grid grid-cols-12 gap-10 bg-[#FFF7F2]">
                    {/* Progress */}
                    <aside className="col-span-4 border-r border-[#F0E0D3] pr-8">
                        <p className="text-xs font-semibold tracking-[0.2em] text-[#D28A36] mb-4">
                            SETUP PROGRESS
                        </p>
                        <div className="space-y-4">
                            <div className="flex items-start gap-3">
                                <div
                                    className={`flex h-7 w-7 items-center justify-center rounded-full border text-sm font-semibold ${isBusinessStep
                                        ? "bg-[#F47A1F] border-[#F47A1F] text-white"
                                        : "bg-white border-[#F0E0D3] text-[#B87938]"
                                        }`}
                                >
                                    1
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-[#1F1F1F]">Business Details</p>
                                    <p className="text-xs text-[#8C6C4A]">
                                        Tell us about your official dealership or plantation.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-3 opacity-80">
                                <div
                                    className={`flex h-7 w-7 items-center justify-center rounded-full border text-sm font-semibold ${!isBusinessStep
                                        ? "bg-[#F47A1F] border-[#F47A1F] text-white"
                                        : "bg-white border-[#F0E0D3] text-[#B87938]"
                                        }`}
                                >
                                    2
                                </div>
                                <div>
                                    <p className="text-sm font-semibold text-[#1F1F1F]">Bank Info</p>
                                    <p className="text-xs text-[#8C6C4A]">
                                        Add your payout account details to receive earnings.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </aside>

                    {/* Form area */}
                    <section className="col-span-8">
                        {isBusinessStep ? (
                            <form
                                className="space-y-6"
                                onSubmit={businessForm.handleSubmit(handleBusinessSubmit)}
                            >
                                <div>
                                    <p className="text-sm font-semibold text-[#C4682B] mb-1">storefront</p>
                                    <h3 className="text-lg font-semibold mb-1">Business Information</h3>
                                    <p className="text-xs text-[#8C6C4A] max-w-md">
                                        Enter your official dealership or plantation details.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-[#4F4F4F]">
                                            Supplier Name
                                        </label>
                                        <Input
                                            placeholder="e.g. Arabica Heights Co."
                                            {...businessForm.register("supplierName")}
                                            className="h-11 rounded-xl border-[#E6D5C6] bg-white/80 focus-visible:ring-[#F47A1F]"
                                        />
                                        {businessForm.formState.errors.supplierName && (
                                            <p className="text-xs text-red-600">
                                                {businessForm.formState.errors.supplierName.message}
                                            </p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-[#4F4F4F]">
                                            Business Address
                                        </label>
                                        <textarea
                                            placeholder="Street name, City, Region, Zip code"
                                            {...businessForm.register("businessAddress")}
                                            className="min-h-24 w-full resize-none rounded-xl border border-[#E6D5C6] bg-white/80 px-3 py-2 text-sm outline-none focus-visible:ring-2 focus-visible:ring-[#F47A1F] focus-visible:ring-offset-0"
                                        />
                                        {businessForm.formState.errors.businessAddress && (
                                            <p className="text-xs text-red-600">
                                                {businessForm.formState.errors.businessAddress.message}
                                            </p>
                                        )}
                                    </div>
                                </div>

                                {error && (
                                    <p className="text-xs text-red-600">{error}</p>
                                )}

                                <div className="flex items-center justify-end pt-4">
                                    <Button
                                        type="submit"
                                        size="xl"
                                        variant="coffee"
                                        className="rounded-full px-10 flex items-center gap-2"
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? <InlineLoading text="Saving..." textClassName="text-white" /> : "Next"}
                                        <span className="material-symbols-outlined text-base">
                                            arrow_forward
                                        </span>
                                    </Button>
                                </div>
                            </form>
                        ) : (
                            <div className="space-y-6">
                                <div>
                                    <p className="text-sm font-semibold text-[#C4682B] mb-1">payouts</p>
                                    <h3 className="text-lg font-semibold mb-1">Bank Information</h3>
                                    <p className="text-xs text-[#8C6C4A] max-w-md">
                                        This is a preview of how your bank details setup will look. API integration will be added later.
                                    </p>
                                </div>

                                <div className="space-y-4">
                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-[#4F4F4F]">
                                            Bank Name
                                        </label>
                                        <Input
                                            placeholder="e.g. Vietcombank"
                                            value={bankName}
                                            onChange={(e) => setBankName(e.target.value)}
                                            className="h-11 rounded-xl border-[#E6D5C6] bg-white/80 focus-visible:ring-[#F47A1F]"
                                        />
                                    </div>

                                    <div className="space-y-2">
                                        <label className="text-xs font-medium text-[#4F4F4F]">
                                            Account Number
                                        </label>
                                        <Input
                                            placeholder="Enter your bank account number"
                                            value={bankAccountNumber}
                                            onChange={(e) => setBankAccountNumber(e.target.value)}
                                            className="h-11 rounded-xl border-[#E6D5C6] bg-white/80 focus-visible:ring-[#F47A1F]"
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <p className="text-xs text-red-600">
                                        {error}
                                    </p>
                                )}

                                <div className="flex items-center justify-between pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="xl"
                                        className="rounded-full border-[#E6D5C6] text-[#8C6C4A] bg-white/70 hover:bg-white"
                                        onClick={handleCompleteSetup}
                                    >
                                        Skip
                                    </Button>
                                    <Button
                                        type="button"
                                        size="xl"
                                        variant="coffee"
                                        className="rounded-full px-10 flex items-center gap-2"
                                        onClick={handleSaveBankInfo}
                                        disabled={isSubmitting}
                                    >
                                        {isSubmitting ? <InlineLoading text="Saving..." textClassName="text-white" /> : "Complete Setup"}
                                        <span className="material-symbols-outlined text-base">
                                            check
                                        </span>
                                    </Button>
                                </div>
                            </div>
                        )}
                    </section>
                </div>
            </DialogContent>
        </Dialog>
    );
}
