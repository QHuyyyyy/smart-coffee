import { useEffect, useMemo, useState } from "react";
import { WalletCards } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { walletService, type Wallet, type WalletWithdrawal } from "@/apis/wallet.service";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loading } from "@/components/Loading";
import angribankLogo from "@/assets/angribank.png";


function formatCurrency(amount: number | null | undefined, currency: string | null | undefined) {
    const safeAmount = amount ?? 0;
    const safeCurrency = currency ?? "VND";
    return `${safeAmount.toLocaleString("vi-VN")} ${safeCurrency}`;
}

function formatDate(value: string | null | undefined) {
    if (!value) return "-";
    return new Date(value).toLocaleString();
}

function getTransactionDescription(w: WalletWithdrawal, bankName: string | null, bankAccountNumber: string | null) {
    if ((w.type ?? "").toLowerCase() === "withdrawal") {
        const last4 = bankAccountNumber ? bankAccountNumber.slice(-4) : "";
        const masked = last4 ? `****${last4}` : "";
        const bankLabel = bankName ? `${bankName} ` : "";
        return `Withdrawal to ${bankLabel}bank account ${masked}`.trim();
    }

    if ((w.type ?? "").toLowerCase() === "commission") {
        return "Commission";
    }

    return w.type || "Transaction";
}

function getTransactionAmountSign(w: WalletWithdrawal) {
    const type = (w.type ?? "").toLowerCase();
    return type === "withdrawal" ? -1 : 1;
}

const bankLogos: Record<string, string> = {
    angribank: angribankLogo,
};

function getBankLogo(bankName: string | null | undefined) {
    if (!bankName) return null;
    const key = bankName.trim().toLowerCase();
    return bankLogos[key] ?? null;
}

function getBankInitials(bankName: string | null | undefined) {
    if (!bankName) return "?";
    const words = bankName.trim().split(/\s+/);
    const firstTwo = words.slice(0, 2).map((w) => (w[0] ? w[0].toUpperCase() : ""));
    const joined = firstTwo.join("");
    return joined || "?";
}

export function SupplierWallet() {
    const { currentUser } = useAuthStore();
    const [wallet, setWallet] = useState<Wallet | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isBankDialogOpen, setIsBankDialogOpen] = useState(false);
    const [bankName, setBankName] = useState("");
    const [bankAccountNumber, setBankAccountNumber] = useState("");
    const [isSavingBank, setIsSavingBank] = useState(false);
    const [bankError, setBankError] = useState<string | null>(null);
    const [showFullAccount, setShowFullAccount] = useState(false);

    useEffect(() => {
        const fetchWallet = async () => {
            if (!currentUser?.wallet?.walletId) return;

            try {
                setIsLoading(true);
                setError(null);
                const data = await walletService.getWalletById(currentUser.wallet.walletId);
                setWallet(data);
            } catch (err: any) {
                setError(err?.message || "Failed to load wallet information.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchWallet();
    }, [currentUser?.wallet?.walletId]);

    const sortedTransactions = useMemo(() => {
        if (!wallet?.walletWithdrawals) return [] as WalletWithdrawal[];
        return [...wallet.walletWithdrawals].sort((a, b) => {
            const tA = a.createAt ? new Date(a.createAt).getTime() : 0;
            const tB = b.createAt ? new Date(b.createAt).getTime() : 0;
            return tB - tA;
        });
    }, [wallet?.walletWithdrawals]);

    const openBankDialog = () => {
        if (!wallet) return;
        setBankName(wallet.bankName ?? "");
        setBankAccountNumber(wallet.bankAccountNumber ?? "");
        setBankError(null);
        setIsBankDialogOpen(true);
    };

    const handleSaveBankInfo = async () => {
        if (!wallet) return;

        const trimmedBankName = bankName.trim();
        const trimmedAccount = bankAccountNumber.trim();

        if (!trimmedBankName || !trimmedAccount) {
            setBankError("Bank name and account number are required.");
            return;
        }

        try {
            setIsSavingBank(true);
            setBankError(null);
            const updated = await walletService.updateBankInfo(wallet.walletId, {
                bankName: trimmedBankName,
                bankAccountNumber: trimmedAccount,
            });
            setWallet(updated);
            setIsBankDialogOpen(false);
        } catch (err: any) {
            const message = err?.response?.data?.message ?? err?.message ?? "Failed to update bank information.";
            setBankError(message);
        } finally {
            setIsSavingBank(false);
        }
    };

    if (!currentUser) {
        return (
            <div className="p-6">
                <p className="text-red-500">You must be logged in as a supplier to view wallet information.</p>
            </div>
        );
    }

    if (!currentUser.wallet?.walletId) {
        return (
            <div className="p-6">
                <p className="text-gray-700">This supplier does not have a wallet yet.</p>
            </div>
        );
    }

    const isBusinessStep = false;
    if (isLoading) return (
        <Loading />
    )
    return (
        <div className="mt-24 px-10 pb-10 w-full overflow-y-auto">
            <div className="w-full space-y-6">
                {/* Page header */}
                <div className="mb-2 flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold leading-tight tracking-[-0.015em] text-[#1F1F1F] flex items-center gap-2">
                            <WalletCards size={22} className="text-[#573E32]" />
                            Your Wallet
                        </h1>
                        <p className="mt-1 text-sm text-[#707070]">
                            Quản lý số dư và giao dịch thanh toán của bạn
                        </p>
                    </div>
                </div>
                {error && <p className="text-red-500 mb-2">{error}</p>}

                {wallet && !isLoading && !error && (
                    <>
                        {/* Top card: balance + bank account */}
                        <div className="bg-white shadow rounded-xl p-6 flex flex-col md:flex-row gap-8 mt-5">
                            {/* Left: current balance */}
                            <div className="flex-1 flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-4">
                                    <div>
                                        <p className="text-sm text-gray-500">Current Balance</p>
                                    </div>
                                    <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-600">
                                        Auto-withdraw: Off
                                    </span>
                                </div>
                                <div className="flex items-end justify-between gap-4">
                                    <p className="text-3xl md:text-4xl font-semibold tracking-tight text-gray-900">
                                        {formatCurrency(wallet.availableBalance, wallet.currency)}
                                    </p>
                                    <button
                                        type="button"
                                        className="px-4 py-2 rounded-md bg-[#4b2c20] text-white text-sm font-medium hover:bg-[#3b2218] transition-colors"
                                    >
                                        Request Payout
                                    </button>
                                </div>
                            </div>

                            {/* Right: bank account info */}
                            <div className="flex-1 border-t md:border-t-0 md:border-l border-gray-200 pt-4 md:pt-0 md:pl-6 flex flex-col justify-between">
                                <div className="flex items-center justify-between mb-4">
                                    <p className="text-sm font-medium text-gray-700">Bank Accounts</p>
                                </div>

                                <div className="flex items-center justify-between gap-4">
                                    <div className="text-sm text-gray-600 flex-1">
                                        {wallet.bankName && wallet.bankAccountNumber ? (
                                            <div className="flex items-center gap-3">
                                                {getBankLogo(wallet.bankName) ? (
                                                    <img
                                                        src={getBankLogo(wallet.bankName) as string}
                                                        alt={`${wallet.bankName} logo`}
                                                        className="h-9 w-9 rounded-full object-contain bg-white border border-gray-200"
                                                    />
                                                ) : (
                                                    <div className="h-9 w-9 rounded-full bg-[#F47A1F]/10 flex items-center justify-center text-xs font-semibold text-[#B87938]">
                                                        {getBankInitials(wallet.bankName)}
                                                    </div>
                                                )}
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-gray-900 leading-tight">
                                                        {wallet.bankName}
                                                    </span>
                                                    <span className="text-xs text-gray-500">
                                                        {(() => {
                                                            const raw = wallet.bankAccountNumber ?? "";
                                                            const last4 = raw.slice(-4);
                                                            const masked = last4 ? `**** ${last4}` : "";
                                                            return `Account ${showFullAccount ? raw : masked}`;
                                                        })()}
                                                    </span>
                                                </div>
                                            </div>
                                        ) : (
                                            <p className="text-gray-400">No linked bank account</p>
                                        )}
                                    </div>
                                    <div className="flex items-center gap-3">
                                        {wallet.bankName && wallet.bankAccountNumber && (
                                            <button
                                                type="button"
                                                className="text-xs text-[#4b2c20] hover:text-[#3b2218]"
                                                onClick={() => setShowFullAccount((prev) => !prev)}
                                            >
                                                {showFullAccount ? "Hide" : "View"}
                                            </button>
                                        )}
                                        <button
                                            type="button"
                                            className="text-xs text-[#4b2c20] hover:text-[#3b2218]"
                                            onClick={openBankDialog}
                                        >
                                            {wallet.bankName && wallet.bankAccountNumber ? "Edit Bank Account" : "Add Bank Account"}
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Recent transactions */}
                        <div className="bg-white shadow rounded-xl p-6">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                                <h2 className="text-lg font-semibold text-gray-900">Recent Transactions</h2>
                                <div className="inline-flex items-center gap-2 px-3 py-2 border border-gray-200 rounded-md text-sm text-gray-600 bg-gray-50">
                                    <span className="material-symbols-outlined text-base">calendar_month</span>
                                    <span>Date range</span>
                                </div>
                            </div>

                            <div className="overflow-x-auto">
                                <table className="min-w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-gray-200 text-gray-500">
                                            <th className="py-3 text-left font-medium">Date</th>
                                            <th className="py-3 text-left font-medium">Description</th>
                                            <th className="py-3 text-left font-medium">Status</th>
                                            <th className="py-3 text-right font-medium">Amount</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {sortedTransactions.length === 0 && (
                                            <tr>
                                                <td colSpan={4} className="py-6 text-center text-gray-400">
                                                    No transactions yet.
                                                </td>
                                            </tr>
                                        )}

                                        {sortedTransactions.map((tx) => {
                                            const sign = getTransactionAmountSign(tx);
                                            const amountValue = (tx.amount ?? 0) * sign;
                                            const amountDisplay = `${sign === -1 ? "-" : "+"}${amountValue.toLocaleString("vi-VN")} ${wallet.currency}`;
                                            const status = (tx.status ?? "").toLowerCase();

                                            let statusClasses = "bg-gray-100 text-gray-700";
                                            if (status === "completed") statusClasses = "bg-green-100 text-green-700";
                                            else if (status === "processing") statusClasses = "bg-yellow-100 text-yellow-700";

                                            return (
                                                <tr key={tx.walletWithdrawalId} className="border-b border-gray-100 last:border-0">
                                                    <td className="py-3 pr-4 whitespace-nowrap text-gray-700">
                                                        {formatDate(tx.createAt)}
                                                    </td>
                                                    <td className="py-3 pr-4 text-gray-700">
                                                        {getTransactionDescription(tx, wallet.bankName, wallet.bankAccountNumber)}
                                                    </td>
                                                    <td className="py-3 pr-4">
                                                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${statusClasses}`}>
                                                            {tx.status ?? "-"}
                                                        </span>
                                                    </td>
                                                    <td className="py-3 text-right font-medium text-gray-900 whitespace-nowrap">
                                                        {amountDisplay}
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </>
                )}
            </div>

            {/* Bank info dialog - clone SupplierOnboarding step 2 UI */}
            <Dialog open={isBankDialogOpen} onOpenChange={setIsBankDialogOpen}>
                <DialogContent
                    className="max-w-4xl p-0 overflow-hidden border-none bg-[#FFF7F2] text-[#1F1F1F]"
                >
                    {/* Hero section (same as SupplierOnboarding) */}
                    <div
                        className="h-40 w-full bg-cover bg-center"
                        style={{
                            backgroundImage:
                                "url('https://images.pexels.com/photos/894695/pexels-photo-894695.jpeg?auto=compress&cs=tinysrgb&w=1200')",
                        }}
                    >
                        <div className="h-full w-full bg-linear-to-r from-black/40 to-black/10 flex flex-col justify-center px-10">
                            <h2 className="text-2xl font-semibold text-white mb-1">Welcome to SmartCoffee!</h2>
                            <p className="text-sm text-white/90 max-w-xl">
                                Let&apos;s set up your supplier profile to get you started with our global network.
                            </p>
                        </div>
                    </div>

                    {/* Content - force step 2 */}
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

                        {/* Right side: bank info form (save to wallet) */}
                        <section className="col-span-8">
                            <div className="space-y-6">
                                <div>
                                    <p className="text-sm font-semibold text-[#C4682B] mb-1">payouts</p>
                                    <h3 className="text-lg font-semibold mb-1">Bank Information</h3>
                                    <p className="text-xs text-[#8C6C4A] max-w-md">
                                        Add your payout account details to receive earnings.
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

                                    {bankError && (
                                        <p className="text-xs text-red-600">{bankError}</p>
                                    )}
                                </div>

                                <div className="flex items-center justify-between pt-4">
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="xl"
                                        className="rounded-full border-[#E6D5C6] text-[#8C6C4A] bg-white/70 hover:bg-white"
                                        onClick={() => setIsBankDialogOpen(false)}
                                        disabled={isSavingBank}
                                    >
                                        Cancel
                                    </Button>
                                    <Button
                                        type="button"
                                        size="xl"
                                        variant="coffee"
                                        className="rounded-full px-10 flex items-center gap-2"
                                        onClick={handleSaveBankInfo}
                                        disabled={isSavingBank}
                                    >
                                        {isSavingBank ? "Saving..." : "Save"}
                                    </Button>
                                </div>
                            </div>
                        </section>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
