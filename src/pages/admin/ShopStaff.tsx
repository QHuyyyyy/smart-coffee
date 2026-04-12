import { useEffect, useState } from "react";
import { Coffee, Package, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { InlineLoading } from "@/components/Loading";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TablePagination } from "@/components/ui/pagination";
import { shopStaffService, type ShopStaff } from "@/apis/shopStaff.service";

const DEFAULT_PAGE_SIZE = 10;

export function AdminShopStaffPage() {
    const navigate = useNavigate();
    const [items, setItems] = useState<ShopStaff[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(DEFAULT_PAGE_SIZE);

    const fetchData = async (targetPage = page) => {
        try {
            setLoading(true);
            setError(null);
            const data = await shopStaffService.getAll({ page: targetPage, pageSize });
            setItems(Array.isArray(data.items) ? data.items : []);
            setTotalCount(typeof data.totalCount === "number" ? data.totalCount : 0);
            setPage(typeof data.page === "number" ? data.page : targetPage);
        } catch (err: any) {
            setError(err?.response?.data?.message || "Failed to load staff data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchData(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const totalPages = totalCount > 0 ? Math.max(1, Math.ceil(totalCount / pageSize)) : 1;
    const fromItem = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
    const toItem = totalCount === 0 ? 0 : Math.min(totalCount, page * pageSize);

    const formatDateTime = (value: string | null | undefined) => {
        if (!value) return "-";
        const date = new Date(value);
        if (Number.isNaN(date.getTime())) return value;
        return date.toLocaleString("vi-VN");
    };

    return (
        <div className="mt-24 px-10 pb-10 w-full overflow-y-auto">
            <div className="w-full">
                <div className="mb-6 flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold leading-tight tracking-[-0.015em] text-[#1F1F1F] flex items-center gap-2">
                            <Users size={22} className="text-[#573E32]" />
                            Staff Management
                        </h1>
                        <p className="mt-1 text-sm text-[#707070]">Staff list from /api/ShopStaff</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => navigate("/admin/accounts")}>All Accounts</Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => navigate("/admin/coffee-shop")}>
                            <Coffee size={14} className="mr-1" />
                            Coffee Shop
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => navigate("/admin/suppliers")}>
                            <Package size={14} className="mr-1" />
                            Supplier
                        </Button>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-[#EFEAE5]">
                    <div className="px-6 py-4 border-b border-[#EFEAE5]">
                        <Button type="button" variant="outline" size="sm" onClick={() => void fetchData()}>
                            Reset
                        </Button>
                    </div>

                    <div className="px-6 py-4">
                        {error && <p className="mb-2 text-xs text-red-500">{error}</p>}

                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-transparent">
                                        <TableHead className="w-24">ID</TableHead>
                                        <TableHead>Account ID</TableHead>
                                        <TableHead>CoffeeShop Name</TableHead>
                                        <TableHead>Full Name</TableHead>
                                        <TableHead className="text-center">Created Time</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {!loading && items.map((staff) => (
                                        <TableRow key={staff.staffId}>
                                            <TableCell className="font-medium text-[#573E32]">#{staff.staffId}</TableCell>
                                            <TableCell className="text-[#707070]">{staff.accountId ?? "-"}</TableCell>
                                            <TableCell className="text-[#707070]">{staff.ownerName ?? "-"}</TableCell>
                                            <TableCell className="text-[#1F1F1F]">{staff.fullName || "-"}</TableCell>
                                            <TableCell className="text-center text-xs text-[#707070]">{formatDateTime(staff.timeStamp)}</TableCell>
                                        </TableRow>
                                    ))}

                                    {loading && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="py-6 text-center">
                                                <InlineLoading text="Loading data..." />
                                            </TableCell>
                                        </TableRow>
                                    )}

                                    {!loading && items.length === 0 && !error && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="py-6 text-center text-[#707070]">No data found.</TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>

                    <div className="mt-4 flex flex-col gap-3 text-xs text-[#707070] sm:flex-row sm:items-center px-6 pb-4">
                        <p>Showing {fromItem} to {toItem} of {totalCount} entries</p>
                        <div className="sm:ml-auto">
                            <TablePagination
                                currentPage={page}
                                totalPages={totalPages}
                                onPageChange={(nextPage) => {
                                    if (nextPage < 1 || nextPage > totalPages || nextPage === page) return;
                                    void fetchData(nextPage);
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
