import { useEffect, useMemo, useState } from "react";
import { Coffee, Package, RotateCcw, UserCheck, UserX, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TablePagination } from "@/components/ui/pagination";
import { Button } from "@/components/ui/button";
import { InlineLoading } from "@/components/Loading";
import { authService, type AccountManagementItem } from "@/apis/auth.service";
import { toast } from "sonner";

const DEFAULT_PAGE_SIZE = 20;
const STATUS_OPTIONS: Array<{ label: string; value: string }> = [
    { label: "All", value: "" },
    { label: "Active", value: "Active" },
    { label: "Inactive", value: "Inactive" },
];
const ROLE_OPTIONS = ["", "Admin", "ShopOwner", "Supplier", "Staff"];

export function AdminAccountsPage() {
    const [accounts, setAccounts] = useState<AccountManagementItem[]>([]);
    const [accountTotalCount, setAccountTotalCount] = useState(0);
    const [statusFilter, setStatusFilter] = useState("");
    const [roleFilter, setRoleFilter] = useState("");
    const [updatingAccountId, setUpdatingAccountId] = useState<number | null>(null);
    const navigate = useNavigate();

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [page, setPage] = useState(1);
    const [pageSize] = useState(DEFAULT_PAGE_SIZE);

    const fetchAccounts = async (targetPage = 1, nextStatus = statusFilter, nextRole = roleFilter) => {
        try {
            setLoading(true);
            setError(null);

            const data = await authService.getAccounts({
                page: targetPage,
                pageSize,
                status: nextStatus || undefined,
                role: nextRole || undefined,
            });

            const items = Array.isArray(data?.items) ? data.items : [];
            setAccounts(items);
            setAccountTotalCount(typeof data?.totalCount === "number" ? data.totalCount : items.length);
            setPage(typeof data?.page === "number" ? data.page : targetPage);
        } catch (err: any) {
            console.error("Failed to load accounts:", err);
            setError(err?.response?.data?.message || "Failed to load accounts");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchAccounts(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const dynamicRoleOptions = useMemo(() => {
        const roleSet = new Set(ROLE_OPTIONS.filter((role) => role));
        accounts.forEach((account) => {
            if (account.role) {
                roleSet.add(account.role);
            }
        });
        return ["", ...Array.from(roleSet).sort((a, b) => a.localeCompare(b))];
    }, [accounts]);

    const totalCount = accountTotalCount;
    const totalPages = totalCount > 0 ? Math.max(1, Math.ceil(totalCount / pageSize)) : 1;

    const fromItem = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
    const toItem = totalCount === 0 ? 0 : Math.min(totalCount, page * pageSize);

    const handlePageChange = (nextPage: number) => {
        if (nextPage < 1 || nextPage > totalPages || nextPage === page) return;
        void fetchAccounts(nextPage);
    };

    const handleReset = () => {
        setStatusFilter("");
        setRoleFilter("");
        setPage(1);
        void fetchAccounts(1, "", "");
    };

    const formatDateTime = (value: string | null | undefined) => {
        if (!value) return "-";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return value;
        return date.toLocaleString("vi-VN");
    };

    const renderStatus = (status: string) => {
        const normalized = (status || "").toLowerCase();
        const badgeClass = normalized === "active"
            ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
            : "bg-red-50 text-red-700 border border-red-100";

        return (
            <span className={`mx-auto inline-flex items-center justify-center rounded-full px-2.5 py-1 text-[11px] font-medium ${badgeClass}`}>
                {status || "Unknown"}
            </span>
        );
    };

    const handleToggleStatus = async (account: AccountManagementItem) => {
        const currentStatus = (account.status || "").toLowerCase();
        const nextActionLabel = currentStatus === "active" ? "inactive" : "active";

        try {
            setUpdatingAccountId(account.accountId);
            if (currentStatus === "active") {
                await authService.inactiveAccount(account.accountId);
                toast.success(`Account #${account.accountId} set to Inactive`);
            } else {
                await authService.activeAccount(account.accountId);
                toast.success(`Account #${account.accountId} set to Active`);
            }
            void fetchAccounts(page);
        } catch (err: any) {
            console.error(`Failed to set account ${nextActionLabel}:`, err);
            toast.error(err?.response?.data?.message || `Failed to set account ${nextActionLabel}`);
        } finally {
            setUpdatingAccountId(null);
        }
    };

    return (
        <div className="mt-24 px-10 pb-10 w-full overflow-y-auto">
            <div className="w-full">
                <div className="mb-6 flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold leading-tight tracking-[-0.015em] text-[#1F1F1F] flex items-center gap-2">
                            <Users size={22} className="text-[#573E32]" />
                            Account Management
                        </h1>
                        <p className="mt-1 text-sm text-[#707070]">
                            Manage account status and filter by role.
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => navigate("/admin/coffee-shop")}>
                            <Coffee size={14} className="mr-1" />
                            Coffee Shop
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => navigate("/admin/shop-staff")}>
                            <Users size={14} className="mr-1" />
                            Staff
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => navigate("/admin/suppliers")}>
                            <Package size={14} className="mr-1" />
                            Supplier
                        </Button>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-[#EFEAE5]">
                    <div className="flex flex-col gap-3 px-6 py-4 border-b border-[#EFEAE5]">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                            <div className="flex items-center gap-5">
                                {STATUS_OPTIONS.map((statusOption) => {
                                    const active = statusFilter === statusOption.value;
                                    return (
                                        <button
                                            key={statusOption.label}
                                            type="button"
                                            className={`inline-flex items-center gap-2 pb-1 border-b-2 transition-colors ${active
                                                ? "border-[#573E32] text-[#573E32] font-semibold"
                                                : "border-transparent hover:text-[#573E32]"
                                                }`}
                                            onClick={() => {
                                                setStatusFilter(statusOption.value);
                                                setPage(1);
                                                void fetchAccounts(1, statusOption.value, roleFilter);
                                            }}
                                        >
                                            {statusOption.label}
                                        </button>
                                    );
                                })}
                            </div>

                            <div className="inline-flex items-center gap-2">
                                <label className="text-sm text-gray-600">Role</label>
                                <select
                                    className="h-9 rounded-md border border-gray-200 bg-white px-3 text-sm text-gray-700"
                                    value={roleFilter}
                                    onChange={(e) => {
                                        const nextRole = e.target.value;
                                        setRoleFilter(nextRole);
                                        setPage(1);
                                        void fetchAccounts(1, statusFilter, nextRole);
                                    }}
                                >
                                    {dynamicRoleOptions.map((role) => (
                                        <option key={role || "all-role"} value={role}>
                                            {role || "All roles"}
                                        </option>
                                    ))}
                                </select>

                                <Button type="button" variant="outline" size="sm" onClick={handleReset} title="Reload current tab">
                                    Reset
                                </Button>
                            </div>
                        </div>
                    </div>

                    <div className="px-6 py-4">
                        {error && <p className="mb-2 text-xs text-red-500">{error}</p>}

                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-transparent">
                                        <TableHead className="w-20">ID</TableHead>
                                        <TableHead>Email</TableHead>
                                        <TableHead>Role</TableHead>
                                        <TableHead>Phone</TableHead>
                                        <TableHead className="text-center">Status</TableHead>
                                        <TableHead className="text-center">Create Date</TableHead>
                                        <TableHead className="text-center">Withdraw Date</TableHead>
                                        <TableHead className="text-center">Action</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {!loading && accounts.map((account) => {
                                        const isActive = account.status?.toLowerCase() === "active";
                                        const isProcessing = updatingAccountId === account.accountId;
                                        return (
                                            <TableRow key={account.accountId}>
                                                <TableCell className="font-medium text-[#573E32]">#{account.accountId}</TableCell>
                                                <TableCell className="text-[#1F1F1F]">{account.email}</TableCell>
                                                <TableCell className="text-[#707070]">{account.role || "-"}</TableCell>
                                                <TableCell className="text-[#707070]">{account.phone || "-"}</TableCell>
                                                <TableCell className="text-center align-middle">{renderStatus(account.status)}</TableCell>
                                                <TableCell className="text-center text-xs text-[#707070]">
                                                    {formatDateTime(account.createDate)}
                                                </TableCell>
                                                <TableCell className="text-center text-xs text-[#707070]">
                                                    {formatDateTime(account.withdrawDate)}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex justify-center">
                                                        <Button
                                                            type="button"
                                                            size="icon"
                                                            variant={isActive ? "outline" : "coffee"}
                                                            disabled={isProcessing}
                                                            title={isActive ? "Set Inactive" : "Set Active"}
                                                            onClick={() => void handleToggleStatus(account)}
                                                        >
                                                            {isProcessing
                                                                ? <RotateCcw size={14} className="animate-spin" />
                                                                : isActive
                                                                    ? <UserX size={14} />
                                                                    : <UserCheck size={14} />}
                                                        </Button>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        );
                                    })}

                                    {loading && (
                                        <TableRow>
                                            <TableCell colSpan={8} className="py-6 text-center">
                                                <InlineLoading text="Loading data..." />
                                            </TableCell>
                                        </TableRow>
                                    )}

                                    {!loading && accounts.length === 0 && !error && (
                                        <TableRow>
                                            <TableCell colSpan={8} className="py-6 text-center text-[#707070]">
                                                No data found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    <div className="mt-4 flex flex-col gap-3 text-xs text-[#707070] sm:flex-row sm:items-center px-6 pb-4">
                        <p>
                            Showing {fromItem} to {toItem} of {totalCount} entries
                        </p>
                        <div className="sm:ml-auto">
                            <TablePagination currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
