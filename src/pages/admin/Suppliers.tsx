import { useEffect, useMemo, useState } from "react";
import { Coffee, Package, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { InlineLoading } from "@/components/Loading";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TablePagination } from "@/components/ui/pagination";
import { supplierService, type Supplier } from "@/apis/supplier.service";
import { ghnService, type District, type Province, type Ward } from "@/apis/ghn.service";

const DEFAULT_PAGE_SIZE = 10;

export function AdminSuppliersPage() {
    const navigate = useNavigate();
    const [items, setItems] = useState<Supplier[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(DEFAULT_PAGE_SIZE);

    const [provinces, setProvinces] = useState<Province[]>([]);
    const [loadingProvinces, setLoadingProvinces] = useState(false);
    const [districtsByProvince, setDistrictsByProvince] = useState<Record<number, District[]>>({});
    const [loadingDistrictByProvince, setLoadingDistrictByProvince] = useState<Record<number, boolean>>({});
    const [wardsByDistrict, setWardsByDistrict] = useState<Record<number, Ward[]>>({});
    const [loadingWardByDistrict, setLoadingWardByDistrict] = useState<Record<number, boolean>>({});

    const fetchData = async (targetPage = page) => {
        try {
            setLoading(true);
            setError(null);
            const data = await supplierService.getAll({ page: targetPage, pageSize });
            setItems(Array.isArray(data.items) ? data.items : []);
            setTotalCount(typeof data.totalCount === "number" ? data.totalCount : 0);
            setPage(typeof data.page === "number" ? data.page : targetPage);
        } catch (err: any) {
            setError(err?.response?.data?.message || "Failed to load supplier data");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchData(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        const loadProvinces = async () => {
            try {
                setLoadingProvinces(true);
                const list = await ghnService.getProvinces();
                setProvinces(list);
            } catch {
                setProvinces([]);
            } finally {
                setLoadingProvinces(false);
            }
        };

        void loadProvinces();
    }, []);

    useEffect(() => {
        const missingProvinceIds = Array.from(
            new Set(
                items
                    .map((item) => Number(item.provinceId))
                    .filter((id) => Number.isInteger(id) && id > 0 && !districtsByProvince[id]),
            ),
        );

        if (missingProvinceIds.length === 0) return;

        const loadDistricts = async () => {
            setLoadingDistrictByProvince((prev) => {
                const next = { ...prev };
                missingProvinceIds.forEach((provinceId) => {
                    next[provinceId] = true;
                });
                return next;
            });

            const entries = await Promise.all(
                missingProvinceIds.map(async (provinceId) => {
                    try {
                        const districts = await ghnService.getDistrictsByProvince(provinceId);
                        return [provinceId, districts] as const;
                    } catch {
                        return [provinceId, [] as District[]] as const;
                    }
                }),
            );

            setDistrictsByProvince((prev) => {
                const next = { ...prev };
                entries.forEach(([provinceId, districts]) => {
                    next[provinceId] = districts;
                });
                return next;
            });

            setLoadingDistrictByProvince((prev) => {
                const next = { ...prev };
                missingProvinceIds.forEach((provinceId) => {
                    next[provinceId] = false;
                });
                return next;
            });
        };

        void loadDistricts();
    }, [items, districtsByProvince]);

    useEffect(() => {
        const missingDistrictIds = Array.from(
            new Set(
                items
                    .map((item) => Number(item.districtId))
                    .filter((id) => Number.isInteger(id) && id > 0 && !wardsByDistrict[id]),
            ),
        );

        if (missingDistrictIds.length === 0) return;

        const loadWards = async () => {
            setLoadingWardByDistrict((prev) => {
                const next = { ...prev };
                missingDistrictIds.forEach((districtId) => {
                    next[districtId] = true;
                });
                return next;
            });

            const entries = await Promise.all(
                missingDistrictIds.map(async (districtId) => {
                    try {
                        const wards = await ghnService.getWardsByDistrict(districtId);
                        return [districtId, wards] as const;
                    } catch {
                        return [districtId, [] as Ward[]] as const;
                    }
                }),
            );

            setWardsByDistrict((prev) => {
                const next = { ...prev };
                entries.forEach(([districtId, wards]) => {
                    next[districtId] = wards;
                });
                return next;
            });

            setLoadingWardByDistrict((prev) => {
                const next = { ...prev };
                missingDistrictIds.forEach((districtId) => {
                    next[districtId] = false;
                });
                return next;
            });
        };

        void loadWards();
    }, [items, wardsByDistrict]);

    const totalPages = totalCount > 0 ? Math.max(1, Math.ceil(totalCount / pageSize)) : 1;
    const fromItem = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
    const toItem = totalCount === 0 ? 0 : Math.min(totalCount, page * pageSize);

    const provinceNameMap = useMemo(
        () => Object.fromEntries(provinces.map((p) => [p.ProvinceID, p.ProvinceName])),
        [provinces],
    );

    const getLocationLabel = (supplier: Supplier) => {
        const provinceId = Number(supplier.provinceId ?? 0);
        const districtId = Number(supplier.districtId ?? 0);
        const wardCode = supplier.wardCode ?? "";

        const provinceName = provinceNameMap[provinceId];
        const districtName = districtsByProvince[provinceId]?.find((d) => d.DistrictID === districtId)?.DistrictName;
        const wardName = wardsByDistrict[districtId]?.find((w) => w.WardCode === wardCode)?.WardName;

        const locationParts = [wardName, districtName, provinceName].filter(Boolean);
        return locationParts.length > 0 ? locationParts.join(" - ") : "-";
    };

    const isLocationLoading = (supplier: Supplier) => {
        const provinceId = Number(supplier.provinceId ?? 0);
        const districtId = Number(supplier.districtId ?? 0);
        const wardCode = supplier.wardCode ?? "";

        if (provinceId <= 0 || districtId <= 0 || !wardCode) return false;

        return loadingProvinces
            || loadingDistrictByProvince[provinceId] === true
            || loadingWardByDistrict[districtId] === true;
    };

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
                            <Package size={22} className="text-[#573E32]" />
                            Supplier Management
                        </h1>
                        <p className="mt-1 text-sm text-[#707070]">Supplier list from /api/Supplier</p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => navigate("/admin/accounts")}>All Accounts</Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => navigate("/admin/coffee-shop")}>
                            <Coffee size={14} className="mr-1" />
                            Coffee Shop
                        </Button>
                        <Button type="button" variant="outline" size="sm" onClick={() => navigate("/admin/shop-staff")}>
                            <Users size={14} className="mr-1" />
                            Staff
                        </Button>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-[#EFEAE5]">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-[#EFEAE5]">
                        <div className="flex items-center gap-3">
                            <h2 className="text-base font-semibold text-[#573E32]">Supplier List</h2>

                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => void fetchData(1)}
                        >
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
                                        <TableHead>Supplier Name</TableHead>
                                        <TableHead>Address</TableHead>
                                        <TableHead>Location</TableHead>
                                        <TableHead className="text-center">Rating</TableHead>
                                        <TableHead className="text-center">Create Date</TableHead>
                                        <TableHead className="text-center">Withdraw Date</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {!loading && items.map((supplier) => (
                                        <TableRow key={supplier.supplierId}>
                                            <TableCell className="font-medium text-[#573E32]">#{supplier.supplierId}</TableCell>
                                            <TableCell className="text-[#707070]">{supplier.accountId ?? "-"}</TableCell>
                                            <TableCell className="text-[#1F1F1F]">{supplier.supplierName || "-"}</TableCell>
                                            <TableCell className="text-[#707070]">{supplier.address || "-"}</TableCell>
                                            <TableCell className="text-[#707070]">
                                                {isLocationLoading(supplier)
                                                    ? <InlineLoading text="Loading location..." textClassName="text-xs text-[#707070]" />
                                                    : getLocationLabel(supplier)}
                                            </TableCell>
                                            <TableCell className="text-center text-[#707070]">{supplier.rating ?? "-"}</TableCell>
                                            <TableCell className="text-center text-xs text-[#707070]">{formatDateTime(supplier.createDate)}</TableCell>
                                            <TableCell className="text-center text-xs text-[#707070]">{formatDateTime(supplier.withdrawDate)}</TableCell>
                                        </TableRow>
                                    ))}

                                    {loading && (
                                        <TableRow>
                                            <TableCell colSpan={8} className="py-6 text-center">
                                                <InlineLoading text="Loading data..." />
                                            </TableCell>
                                        </TableRow>
                                    )}

                                    {!loading && items.length === 0 && !error && (
                                        <TableRow>
                                            <TableCell colSpan={8} className="py-6 text-center text-[#707070]">No data found.</TableCell>
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
