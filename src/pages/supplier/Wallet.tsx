import { useEffect, useMemo, useState } from "react";
import { WalletCards } from "lucide-react";
import { useAuthStore } from "@/stores/auth.store";
import { walletService, type SupplierWalletWithdrawal, type SupplierWalletWithdrawalsResponse, type Wallet } from "@/apis/wallet.service";
import {
    transactionService,
    type TransactionItem,
    type TransactionPaginatedResponse,
} from "@/apis/transaction.service";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TablePagination } from "@/components/ui/pagination";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Loading } from "@/components/Loading";
import { toast } from "sonner";
import angribankLogo from "@/assets/angribank.png";
import { formatVND } from "@/utils/currency";


function formatCurrency(amount: number | null | undefined, currency: string | null | undefined) {
    const normalizedCurrency = (currency ?? "VND").trim().toUpperCase();
    if (normalizedCurrency !== "VND") {
        const safeAmount = amount ?? 0;
        return `${safeAmount.toLocaleString("vi-VN")} ${normalizedCurrency}`;
    }
    return formatVND(amount);
}

function formatDocType(docType: string | null | undefined) {
    if (!docType) return "-";
    switch (docType) {
        case "1": return "Wallet";
        case "2": return "Order";
        case "3": return "Withdrawal/Settlement";
        case "4": return "Subscription";
        default: return docType;
    }
}

function formatDate(value: string | null | undefined) {
    if (!value) return "-";
    return new Date(value).toLocaleString();
}

function getStatusBadgeClasses(status: string | null | undefined) {
    const normalized = (status ?? "").toLowerCase();
    if (normalized === "completed") return "bg-emerald-50 text-emerald-700 border border-emerald-100";
    if (normalized === "processing" || normalized === "pending") return "bg-amber-50 text-amber-700 border border-amber-100";
    if (normalized === "unverified") return "bg-orange-50 text-orange-700 border border-orange-100";
    if (normalized === "failed" || normalized === "rejected" || normalized === "cancelled") {
        return "bg-red-50 text-red-700 border border-red-100";
    }
    return "bg-gray-100 text-gray-700 border border-gray-200";
}

function getTransactionDescription(
    w: Pick<SupplierWalletWithdrawal, "amount" | "status">,
    bankName: string | null,
    bankAccountNumber: string | null,
) {
    const amount = w.amount ?? 0;
    const status = (w.status ?? "").toLowerCase();

    if (amount < 0 || status === "pending" || status === "processing" || status === "completed") {
        const last4 = bankAccountNumber ? bankAccountNumber.slice(-4) : "";
        const masked = last4 ? `****${last4}` : "";
        const bankLabel = bankName ? `${bankName} ` : "";
        return `Withdrawal to ${bankLabel}bank account ${masked}`.trim();
    }

    return "Transaction";
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

export function Wallet() {
    const { currentUser } = useAuthStore();
    const role = currentUser?.role;
    const isAdmin = role === "Admin";
    const [wallet, setWallet] = useState<Wallet | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isBankDialogOpen, setIsBankDialogOpen] = useState(false);
    const [bankName, setBankName] = useState("");
    const [bankAccountNumber, setBankAccountNumber] = useState("");
    const [isSavingBank, setIsSavingBank] = useState(false);
    const [bankError, setBankError] = useState<string | null>(null);
    const [showFullAccount, setShowFullAccount] = useState(false);
    const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
    const [withdrawAmount, setWithdrawAmount] = useState("");
    const [withdrawOtp, setWithdrawOtp] = useState("");
    const [createdWithdrawId, setCreatedWithdrawId] = useState<number | null>(null);
    const [isCreatingWithdraw, setIsCreatingWithdraw] = useState(false);
    const [isVerifyingWithdraw, setIsVerifyingWithdraw] = useState(false);
    const [withdrawalsData, setWithdrawalsData] = useState<SupplierWalletWithdrawalsResponse | null>(null);
    const [isLoadingWithdrawals, setIsLoadingWithdrawals] = useState(false);
    const [withdrawalsError, setWithdrawalsError] = useState<string | null>(null);
    const [withdrawalsPage, setWithdrawalsPage] = useState(1);
    const [withdrawalsStatus, setWithdrawalsStatus] = useState("none");
    const [withdrawalsPageSize] = useState(10);
    const [transactionItems, setTransactionItems] = useState<TransactionItem[]>([]);
    const [transactionsData, setTransactionsData] = useState<TransactionPaginatedResponse | null>(null);
    const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
    const [transactionsError, setTransactionsError] = useState<string | null>(null);
    const [transactionsPage, setTransactionsPage] = useState(1);
    const [transactionsPageSize] = useState(10);
    const [isNoBankModalOpen, setIsNoBankModalOpen] = useState(false);

    const loadWithdrawals = async (walletId: number, page = withdrawalsPage, status = withdrawalsStatus) => {
        try {
            setIsLoadingWithdrawals(true);
            setWithdrawalsError(null);
            const data = await walletService.getWithdrawalsByWalletId(walletId, {
                page,
                pageSize: withdrawalsPageSize,
                status,
            });
            setWithdrawalsData(data);
        } catch (err: any) {
            const message = err?.response?.data?.message ?? err?.message ?? "Failed to load withdrawal history.";
            setWithdrawalsError(message);
        } finally {
            setIsLoadingWithdrawals(false);
        }
    };

    useEffect(() => {
        const fetchWallet = async () => {
            if (!currentUser?.wallet?.walletId) return;

            try {
                setIsLoading(true);
                setError(null);
                const data = await walletService.getWalletById(currentUser.wallet.walletId);
                setWallet(data);
                await loadWithdrawals(currentUser.wallet.walletId, 1, "none");
            } catch (err: any) {
                setError(err?.message || "Failed to load wallet information.");
            } finally {
                setIsLoading(false);
            }
        };

        fetchWallet();
    }, [currentUser?.wallet?.walletId]);

    const fetchTransactions = async (page = transactionsPage) => {
        if (!currentUser?.accountId || isAdmin) return;

        try {
            setIsLoadingTransactions(true);
            setTransactionsError(null);
            const data = await transactionService.getListByUserIdPaginated(currentUser.accountId, {
                page,
                pageSize: transactionsPageSize,
            });
            setTransactionsData(data);
            setTransactionItems(data.items ?? []);
        } catch (err: any) {
            const message = err?.response?.data?.message ?? err?.message ?? "Failed to load transaction list.";
            setTransactionsError(message);
        } finally {
            setIsLoadingTransactions(false);
        }
    };

    useEffect(() => {
        void fetchTransactions();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentUser?.accountId, isAdmin]);

    const transactions = useMemo(() => {
        if (!withdrawalsData?.items) return [] as SupplierWalletWithdrawal[];
        return [...withdrawalsData.items].sort((a, b) => {
            const tA = a.createAt ? new Date(a.createAt).getTime() : 0;
            const tB = b.createAt ? new Date(b.createAt).getTime() : 0;
            return tB - tA;
        });
    }, [withdrawalsData?.items]);

    const handleChangeWithdrawalStatus = async (status: string) => {
        setWithdrawalsStatus(status);
        setWithdrawalsPage(1);
        if (!currentUser?.wallet?.walletId) return;
        await loadWithdrawals(currentUser.wallet.walletId, 1, status);
    };

    const handleWithdrawalPageChange = async (nextPage: number) => {
        if (!currentUser?.wallet?.walletId) return;
        setWithdrawalsPage(nextPage);
        await loadWithdrawals(currentUser.wallet.walletId, nextPage, withdrawalsStatus);
    };

    const handleTransactionPageChange = async (nextPage: number) => {
        setTransactionsPage(nextPage);
        await fetchTransactions(nextPage);
    };

    const transactionsTotalCount = transactionsData?.totalCount ?? 0;
    const transactionsTotalPages = transactionsTotalCount > 0
        ? Math.max(1, Math.ceil(transactionsTotalCount / transactionsPageSize))
        : 1;
    const transactionsFromItem = transactionsTotalCount === 0
        ? 0
        : (transactionsPage - 1) * transactionsPageSize + 1;
    const transactionsToItem = transactionsTotalCount === 0
        ? 0
        : Math.min(transactionsTotalCount, transactionsPage * transactionsPageSize);

    const withdrawalsTotalCount = withdrawalsData?.totalCount ?? 0;
    const withdrawalsTotalPages = withdrawalsTotalCount > 0
        ? Math.max(1, Math.ceil(withdrawalsTotalCount / withdrawalsPageSize))
        : 1;
    const withdrawalsFromItem = withdrawalsTotalCount === 0
        ? 0
        : (withdrawalsPage - 1) * withdrawalsPageSize + 1;
    const withdrawalsToItem = withdrawalsTotalCount === 0
        ? 0
        : Math.min(withdrawalsTotalCount, withdrawalsPage * withdrawalsPageSize);

    const openBankDialog = () => {
        if (!wallet) return;
        setBankName(wallet.bankName ?? "");
        setBankAccountNumber(wallet.bankAccountNumber ?? "");
        setBankError(null);
        setIsBankDialogOpen(true);
    };

    const openWithdrawDialog = () => {
        if (!wallet?.bankName || !wallet?.bankAccountNumber) {
            setIsNoBankModalOpen(true);
            return;
        }
        setWithdrawAmount("");
        setWithdrawOtp("");
        setCreatedWithdrawId(null);
        setIsWithdrawDialogOpen(true);
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

    const handleCreateWithdraw = async () => {
        if (!wallet) return;

        const amountNumber = Number(withdrawAmount);
        if (!amountNumber || amountNumber <= 0) {
            toast.error("Amount must be greater than 0.");
            return;
        }
        if (amountNumber > wallet.availableBalance) {
            toast.error("Amount cannot exceed available balance.");
            return;
        }

        try {
            setIsCreatingWithdraw(true);
            const result = await walletService.createWithdraw({ amount: amountNumber });
            console.log("before", result); console.log("after");
            const withdrawId = (result as any).withdrawId ?? (result as any).id ?? null;
            setCreatedWithdrawId(withdrawId);
            toast.success("Withdrawal created. Please check your email for OTP.");
        } catch (err: any) {
            const message = err?.response?.data?.message ?? err?.message ?? "Failed to create withdrawal.";
            toast.error(message);
        } finally {
            setIsCreatingWithdraw(false);
        }
    };

    const handleVerifyWithdraw = async () => {
        if (!createdWithdrawId) {
            toast.error("Missing withdraw ID. Please create again.");
            return;
        }
        if (!withdrawOtp.trim()) {
            toast.error("Please enter OTP code.");
            return;
        }

        try {
            setIsVerifyingWithdraw(true);
            await walletService.verifyWithdraw({ withdrawId: createdWithdrawId, otpCode: withdrawOtp.trim() });
            toast.success("Withdrawal verified successfully.");
            setIsWithdrawDialogOpen(false);

            // reload wallet to reflect new transaction
            if (currentUser?.wallet?.walletId) {
                const data = await walletService.getWalletById(currentUser.wallet.walletId);
                setWallet(data);
                await loadWithdrawals(currentUser.wallet.walletId, withdrawalsPage, withdrawalsStatus);
            }
        } catch (err: any) {
            const message = err?.response?.data?.message ?? err?.message ?? "Failed to verify withdrawal.";
            toast.error(message);
        } finally {
            setIsVerifyingWithdraw(false);
        }
    };

    if (!currentUser) {
        return (
            <div className="p-6">
                <p className="text-red-500">You must be logged in to view wallet information.</p>
            </div>
        );
    }

    if (!currentUser.wallet?.walletId) {
        return (
            <div className="p-6">
                <p className="text-gray-700">Wallet information is not available for this account.</p>
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
                                    <div className="flex flex-col">
                                        <p className="text-xs text-gray-500">Available Balance</p>
                                        <p className="text-3xl md:text-4xl font-semibold tracking-tight text-gray-900">
                                            {formatCurrency(wallet.availableBalance, wallet.currency)}
                                        </p>
                                    </div>
                                    <div className="flex flex-col items-end text-right">
                                        <p className="text-xs text-gray-500">Held Balance</p>
                                        <p className="text-xl md:text-2xl font-semibold tracking-tight text-gray-900">
                                            {formatCurrency(wallet.heldBalance, wallet.currency)}
                                        </p>
                                    </div>

                                    {!isAdmin && (
                                        <button
                                            type="button"
                                            className="px-4 py-2 rounded-md bg-[#4b2c20] text-white text-sm font-medium hover:bg-[#3b2218] transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                                            onClick={openWithdrawDialog}
                                        >
                                            Request Withdraw
                                        </button>
                                    )}
                                </div>
                            </div>

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

                        {/* Recent transactions (hidden for Admin) */}

                        <>
                            <div className="bg-white shadow rounded-xl p-6">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        Withdrawal History
                                        <span className="ml-2 text-sm font-normal text-gray-500">
                                            ({withdrawalsData?.totalCount ?? 0} items)
                                        </span>
                                    </h2>
                                    <div className="inline-flex items-center gap-2">
                                        <label className="text-sm text-gray-600">Status</label>
                                        <select
                                            className="h-9 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700"
                                            value={withdrawalsStatus}
                                            onChange={(e) => void handleChangeWithdrawalStatus(e.target.value)}
                                        >
                                            <option value="none">All</option>
                                            <option value="Pending">Pending</option>
                                            <option value="Unverified">Unverified</option>
                                            <option value="Processing">Processing</option>
                                            <option value="Completed">Completed</option>
                                            <option value="Rejected">Rejected</option>
                                            <option value="Cancelled">Cancelled</option>
                                        </select>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {
                                                setWithdrawalsStatus("none");
                                                setWithdrawalsPage(1);
                                                if (currentUser?.wallet?.walletId) {
                                                    void loadWithdrawals(currentUser.wallet.walletId, 1, "none");
                                                }
                                            }}
                                        >
                                            Reset
                                        </Button>
                                    </div>
                                </div>

                                {withdrawalsError && (
                                    <p className="mb-3 text-sm text-red-500">{withdrawalsError}</p>
                                )}

                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="border-b border-gray-200 text-gray-500">
                                                <TableHead className="py-3 text-left font-medium">Date</TableHead>
                                                <TableHead className="py-3 text-left font-medium">Description</TableHead>
                                                <TableHead className="py-3 text-left font-medium">Status</TableHead>
                                                <TableHead className="py-3 text-right font-medium">Amount</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {!isLoadingWithdrawals && transactions.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="py-6 text-center text-gray-400">
                                                        No transactions yet.
                                                    </TableCell>
                                                </TableRow>
                                            )}

                                            {isLoadingWithdrawals && (
                                                <TableRow>
                                                    <TableCell colSpan={4} className="py-6 text-center text-gray-400">
                                                        Loading withdrawal history...
                                                    </TableCell>
                                                </TableRow>
                                            )}

                                            {transactions.map((tx) => {
                                                const amountValue = tx.amount ?? 0;
                                                const amountDisplay = `-${amountValue.toLocaleString("vi-VN")} ${wallet.currency}`;
                                                const statusClasses = getStatusBadgeClasses(tx.status);

                                                return (
                                                    <TableRow key={tx.withdrawId} className="border-b border-gray-100 last:border-0">
                                                        <TableCell className="py-3 pr-4 whitespace-nowrap text-gray-700">
                                                            {formatDate(tx.createAt)}
                                                        </TableCell>
                                                        <TableCell className="py-3 pr-4 text-gray-700">
                                                            {getTransactionDescription(tx, wallet.bankName, wallet.bankAccountNumber)}
                                                        </TableCell>
                                                        <TableCell className="py-3 pr-4">
                                                            <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${statusClasses}`}>
                                                                {tx.status ?? "-"}
                                                            </span>
                                                        </TableCell>
                                                        <TableCell className="py-3 text-right font-medium text-gray-900 whitespace-nowrap">
                                                            {amountDisplay}
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })}
                                        </TableBody>
                                    </Table>
                                </div>

                                <div className="mt-4 flex w-full flex-col gap-3 text-xs text-[#707070] sm:flex-row sm:items-center">
                                    <p>
                                        Showing {withdrawalsFromItem} to {withdrawalsToItem} of {withdrawalsTotalCount} entries
                                    </p>
                                    <div className="sm:ml-auto">
                                        <TablePagination
                                            currentPage={withdrawalsPage}
                                            totalPages={withdrawalsTotalPages}
                                            onPageChange={(newPage) => {
                                                if (isLoadingWithdrawals) return;
                                                if (newPage < 1 || newPage > withdrawalsTotalPages || newPage === withdrawalsPage) return;
                                                void handleWithdrawalPageChange(newPage);
                                            }}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div className="bg-white shadow rounded-xl p-6 mt-6">
                                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        Transaction List
                                        <span className="ml-2 text-sm font-normal text-gray-500">
                                            ({transactionsData?.totalCount ?? 0} items)
                                        </span>
                                    </h2>
                                    <div className="inline-flex items-center gap-2">

                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => {

                                                setTransactionsPage(1);
                                                void fetchTransactions(1);
                                            }}
                                        >
                                            Reset
                                        </Button>
                                    </div>
                                </div>

                                {transactionsError && (
                                    <p className="mb-3 text-sm text-red-500">{transactionsError}</p>
                                )}

                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="border-b border-gray-200 text-gray-500">
                                                <TableHead className="py-3 text-left font-medium">ID</TableHead>
                                                <TableHead className="py-3 text-left font-medium">Doc No</TableHead>
                                                <TableHead className="py-3 text-left font-medium">Doc Type</TableHead>
                                                <TableHead className="py-3 text-left font-medium">Type</TableHead>
                                                <TableHead className="py-3 text-left font-medium">Notes</TableHead>
                                                <TableHead className="py-3 text-left font-medium">Transaction Date</TableHead>
                                                <TableHead className="py-3 text-left font-medium">Status</TableHead>
                                                <TableHead className="py-3 text-right font-medium">Amount</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {!isLoadingTransactions && transactionItems.length === 0 && (
                                                <TableRow>
                                                    <TableCell colSpan={8} className="py-6 text-center text-gray-400">
                                                        No transactions found.
                                                    </TableCell>
                                                </TableRow>
                                            )}

                                            {isLoadingTransactions && (
                                                <TableRow>
                                                    <TableCell colSpan={8} className="py-6 text-center text-gray-400">
                                                        Loading transactions...
                                                    </TableCell>
                                                </TableRow>
                                            )}

                                            {transactionItems.map((item) => (
                                                <TableRow key={item.transactionId} className="border-b border-gray-100 last:border-0">
                                                    <TableCell className="py-3 pr-4 whitespace-nowrap text-gray-700">
                                                        #{item.transactionId}
                                                    </TableCell>
                                                    <TableCell className="py-3 pr-4 whitespace-nowrap text-gray-700">
                                                        {item.docNo ?? "-"}
                                                    </TableCell>
                                                    <TableCell className="py-3 pr-4 text-gray-700">
                                                        {formatDocType(item.docType)}
                                                    </TableCell>
                                                    <TableCell className="py-3 pr-4 text-gray-700">
                                                        {item.transactionType ?? "-"}
                                                    </TableCell>
                                                    <TableCell className="py-3 pr-4 text-gray-700">
                                                        {item.notes ?? "-"}
                                                    </TableCell>
                                                    <TableCell className="py-3 pr-4 whitespace-nowrap text-gray-700">
                                                        {formatDate(item.transactionDate)}
                                                    </TableCell>
                                                    <TableCell className="py-3 pr-4">
                                                        <span className={`inline-flex px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClasses(item.status)}`}>
                                                            {item.status ?? "-"}
                                                        </span>
                                                    </TableCell>
                                                    <TableCell className="py-3 text-right font-medium text-gray-900 whitespace-nowrap">
                                                        {formatCurrency(item.totalPrice, wallet.currency)}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>

                                <div className="mt-4 flex items-center justify-end gap-2">
                                    <div className="mt-4 flex w-full flex-col gap-3 text-xs text-[#707070] sm:flex-row sm:items-center">
                                        <p>
                                            Showing {transactionsFromItem} to {transactionsToItem} of {transactionsTotalCount} entries
                                        </p>
                                        <div className="sm:ml-auto">
                                            <TablePagination
                                                currentPage={transactionsPage}
                                                totalPages={transactionsTotalPages}
                                                onPageChange={(newPage) => {
                                                    if (isLoadingTransactions) return;
                                                    if (newPage < 1 || newPage > transactionsTotalPages || newPage === transactionsPage) return;
                                                    void handleTransactionPageChange(newPage);
                                                }}
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </>

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

            {/* Withdraw dialog: create + verify via OTP */}
            <Dialog open={isWithdrawDialogOpen} onOpenChange={setIsWithdrawDialogOpen}>
                <DialogContent className="max-w-md p-6">
                    <div className="space-y-4">
                        <h2 className="text-lg font-semibold">Request Withdrawal</h2>
                        <p className="text-sm text-gray-600">
                            Enter the amount you want to withdraw. We will send an OTP code to your email to verify this request.
                        </p>

                        <div className="space-y-2">
                            <label className="text-xs font-medium text-gray-700">Amount</label>
                            <Input
                                type="number"
                                min={0}
                                step={1000}
                                value={withdrawAmount}
                                onChange={(e) => setWithdrawAmount(e.target.value)}
                                disabled={!!createdWithdrawId}
                                placeholder="e.g. 100000"
                            />
                            {wallet && (
                                <>
                                    <p className="text-xs text-gray-500">
                                        Available: {formatCurrency(wallet.availableBalance, wallet.currency)}
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        Hold Balance: {formatCurrency(wallet.heldBalance, wallet.currency)}
                                    </p>
                                </>
                            )}
                        </div>

                        {createdWithdrawId && (
                            <div className="space-y-2 mt-4">
                                <label className="text-xs font-medium text-gray-700">OTP Code</label>
                                <Input
                                    value={withdrawOtp}
                                    onChange={(e) => setWithdrawOtp(e.target.value)}
                                    placeholder="Enter OTP from email"
                                />
                                <p className="text-xs text-gray-500">
                                    OTP has been sent to your registered email. Please enter it here to confirm the withdrawal.
                                </p>
                            </div>
                        )}

                        <div className="flex justify-end gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsWithdrawDialogOpen(false)}
                            >
                                Close
                            </Button>
                            {!createdWithdrawId ? (
                                <Button
                                    type="button"
                                    onClick={handleCreateWithdraw}
                                    disabled={isCreatingWithdraw}
                                >
                                    {isCreatingWithdraw ? "Creating..." : "Create Withdraw"}
                                </Button>
                            ) : (
                                <Button
                                    type="button"
                                    onClick={handleVerifyWithdraw}
                                    disabled={isVerifyingWithdraw}
                                >
                                    {isVerifyingWithdraw ? "Verifying..." : "Verify OTP"}
                                </Button>
                            )}
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* No Bank Info Modal */}
            <Dialog open={isNoBankModalOpen} onOpenChange={setIsNoBankModalOpen}>
                <DialogContent className="max-w-sm p-6 text-center">
                    <div className="space-y-4">
                        <h2 className="text-xl font-semibold text-red-600">Warning</h2>
                        <p className="text-sm text-gray-600">
                            Please update your bank account information before making a withdrawal request.
                        </p>
                        <div className="flex justify-center gap-3 pt-4">
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => setIsNoBankModalOpen(false)}
                            >
                                Cancel
                            </Button>
                            <Button
                                type="button"
                                className="bg-[#4b2c20] text-white hover:bg-[#3b2218]"
                                onClick={() => {
                                    setIsNoBankModalOpen(false);
                                    openBankDialog();
                                }}
                            >
                                OK
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
