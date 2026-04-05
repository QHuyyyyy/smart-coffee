import { useEffect, useState } from "react";
import { Users, CreditCard, CalendarClock, BadgeCheck } from "lucide-react";
import { TablePagination } from "@/components/ui/pagination";
import { Table, TableBody, TableHeader, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { InlineLoading } from "@/components/Loading";
import { Button } from "@/components/ui/button";
import { subscriptionService, type Subscription } from "@/apis/subscription.service";
import { formatVND } from "@/utils/currency";

export function SubscriptionsPage() {
    const [subscriptions, setSubscriptions] = useState<Subscription[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(10);
    const [totalCount, setTotalCount] = useState(0);

    const fetchSubscriptions = async (targetPage = 1) => {
        try {
            setLoading(true);
            setError(null);
            const res = await subscriptionService.getPaginated(targetPage, pageSize);
            const data = res.data as any;
            const items: Subscription[] = Array.isArray(data) ? data : data.items ?? data.data ?? [];

            setSubscriptions(items);

            if (typeof data.totalCount === "number") {
                setTotalCount(data.totalCount);
            } else {
                setTotalCount(items.length);
            }

            if (typeof data.page === "number") {
                setPage(data.page);
            } else {
                setPage(targetPage);
            }
        } catch (err) {
            setError("Không tải được danh sách người đăng ký");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchSubscriptions(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const totalPages = totalCount > 0 ? Math.max(1, Math.ceil(totalCount / pageSize)) : 1;
    const fromItem = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
    const toItem = totalCount === 0 ? 0 : Math.min(totalCount, page * pageSize);

    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > totalPages || newPage === page) return;
        void fetchSubscriptions(newPage);
    };

    const formatDateTime = (value: string | null | undefined) => {
        if (!value) return "-";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return value;
        return date.toLocaleString("vi-VN");
    };

    const renderStatus = (status: string | null | undefined) => {
        const value = (status ?? "").toLowerCase();
        let label = status ?? "Unknown";
        let bg = "bg-gray-100 text-gray-700";

        if (value === "active") {
            label = "Active";
            bg = "bg-emerald-50 text-emerald-700";
        } else if (value === "pending") {
            label = "Pending";
            bg = "bg-amber-50 text-amber-700";
        } else if (value === "expired") {
            label = "Expired";
            bg = "bg-red-50 text-red-700";
        }

        return (
            <span className={`inline-flex items-center gap-1 rounded-full px-3 py-1 text-xs font-medium ${bg}`}>
                <BadgeCheck size={12} />
                {label}
            </span>
        );
    };

    return (
        <div className="mt-24 px-10 pb-10 w-full overflow-y-auto">
            <div className="w-full">
                {/* Page header */}
                <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                        <h1 className="text-2xl font-bold leading-tight tracking-[-0.015em] text-[#1F1F1F] flex items-center gap-2">
                            <Users size={22} className="text-[#573E32]" />
                            Subscriptions
                        </h1>
                        <p className="mt-1 text-sm text-[#707070]">
                            Overview of all owner subscriptions in the system
                        </p>
                    </div>
                </div>

                {/* Card with table */}
                <div className="bg-white rounded-2xl shadow-sm border border-[#EFEAE5]">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-[#EFEAE5]">
                        <h2 className="text-base font-semibold text-[#573E32]">Subscriber List</h2>
                        <div className="flex items-center gap-3 text-xs text-[#707070]">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => {
                                    setPage(1);
                                    void fetchSubscriptions(1);
                                }}
                            >
                                Reset
                            </Button>
                            <div className="flex items-center gap-1">
                                <CreditCard size={14} className="text-[#573E32]" />
                                <span>Total: {totalCount}</span>
                            </div>
                            <div className="hidden md:flex items-center gap-1">
                                <CalendarClock size={14} className="text-[#573E32]" />
                                <span>Page {page} / {totalPages}</span>
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
                                        <TableHead>Package</TableHead>
                                        <TableHead className="text-center">Owner ID</TableHead>
                                        <TableHead className="text-center">Status</TableHead>
                                        <TableHead className="text-center">Start Date</TableHead>
                                        <TableHead className="text-center">End Date</TableHead>
                                        <TableHead className="text-center">Created At</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {!loading && subscriptions.map((sub) => (
                                        <TableRow key={sub.subscriptionId}>
                                            <TableCell className="font-medium text-[#573E32]">#{sub.subscriptionId}</TableCell>
                                            <TableCell>
                                                <div className="flex flex-col">
                                                    <span className="font-medium text-[#1F1F1F]">
                                                        {sub.package?.name ?? `Package #${sub.packageId ?? "-"}`}
                                                    </span>
                                                    {sub.package?.price != null && (
                                                        <span className="text-xs text-[#707070]">
                                                            {formatVND(sub.package.price)} / month
                                                        </span>
                                                    )}
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center text-[#573E32]">{sub.ownerId ?? "-"}</TableCell>
                                            <TableCell className="text-center">{renderStatus(sub.status)}</TableCell>
                                            <TableCell className="text-center text-xs text-[#707070]">
                                                {formatDateTime(sub.startDate)}
                                            </TableCell>
                                            <TableCell className="text-center text-xs text-[#707070]">
                                                {formatDateTime(sub.endDate)}
                                            </TableCell>
                                            <TableCell className="text-center text-xs text-[#707070]">
                                                {formatDateTime(sub.timeStamp)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {loading && (
                                        <TableRow>
                                            <TableCell colSpan={7} className="py-6 text-center">
                                                <InlineLoading text="Loading Subscriptions..." />
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {!loading && subscriptions.length === 0 && !error && (
                                        <TableRow>
                                            <TableCell colSpan={7} className="py-6 text-center text-[#707070]">
                                                No subscriptions found.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>

                        {/* Pagination */}
                        <div className="mt-4 flex flex-col gap-3 text-xs text-[#707070] sm:flex-row sm:items-center">
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
        </div>
    );
}
