import { useEffect, useMemo, useState } from "react";
import { Building2, MapPin, Package, Users } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableHeader, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { InlineLoading } from "@/components/Loading";
import { Button } from "@/components/ui/button";
import { TablePagination } from "@/components/ui/pagination";
import { coffeeShopService, type CoffeeShop } from "@/services/apis/coffeeShop.service";
import { ghnService, type District, type Province, type Ward } from "@/services/apis/ghn.service";

const DEFAULT_PAGE_SIZE = 10;

export function CoffeeShopPage() {
    const navigate = useNavigate();
    const [shops, setShops] = useState<CoffeeShop[]>([]);
    const [totalCount, setTotalCount] = useState(0);
    const [page, setPage] = useState(1);
    const [pageSize] = useState(DEFAULT_PAGE_SIZE);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [provinces, setProvinces] = useState<Province[]>([]);
    const [loadingProvinces, setLoadingProvinces] = useState(false);
    const [districtsByProvince, setDistrictsByProvince] = useState<Record<number, District[]>>({});
    const [loadingDistrictByProvince, setLoadingDistrictByProvince] = useState<Record<number, boolean>>({});
    const [wardsByDistrict, setWardsByDistrict] = useState<Record<number, Ward[]>>({});
    const [loadingWardByDistrict, setLoadingWardByDistrict] = useState<Record<number, boolean>>({});

    const fetchShops = async (targetPage = page) => {
        try {
            setLoading(true);
            setError(null);
            const data = await coffeeShopService.getAll({ page: targetPage, pageSize });
            setShops(Array.isArray(data.items) ? data.items : []);
            setTotalCount(typeof data.totalCount === "number" ? data.totalCount : 0);
            setPage(typeof data.page === "number" ? data.page : targetPage);
        } catch (err) {
            setError("Không tải được danh sách Coffee Shop");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchShops(1);
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
                shops
                    .map((shop) => Number(shop.provinceId))
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
    }, [shops, districtsByProvince]);

    useEffect(() => {
        const missingDistrictIds = Array.from(
            new Set(
                shops
                    .map((shop) => Number(shop.districtId))
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
    }, [shops, wardsByDistrict]);

    const totalPages = totalCount > 0 ? Math.max(1, Math.ceil(totalCount / pageSize)) : 1;
    const fromItem = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
    const toItem = totalCount === 0 ? 0 : Math.min(totalCount, page * pageSize);

    const provinceNameMap = useMemo(
        () => Object.fromEntries(provinces.map((p) => [p.ProvinceID, p.ProvinceName])),
        [provinces],
    );

    const getLocationLabel = (shop: CoffeeShop) => {
        const provinceId = Number(shop.provinceId ?? 0);
        const districtId = Number(shop.districtId ?? 0);
        const wardCode = shop.wardCode ?? "";

        const provinceName = provinceNameMap[provinceId];
        const districtName = districtsByProvince[provinceId]?.find((d) => d.DistrictID === districtId)?.DistrictName;
        const wardName = wardsByDistrict[districtId]?.find((w) => w.WardCode === wardCode)?.WardName;

        const locationParts = [wardName, districtName, provinceName].filter(Boolean);
        return locationParts.length > 0 ? locationParts.join(" - ") : "-";
    };

    const isLocationLoading = (shop: CoffeeShop) => {
        const provinceId = Number(shop.provinceId ?? 0);
        const districtId = Number(shop.districtId ?? 0);
        const wardCode = shop.wardCode ?? "";

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
                {/* Page header */}
                <div className="mb-6 flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold leading-tight tracking-[-0.015em] text-[#1F1F1F] flex items-center gap-2">
                            <Building2 size={22} className="text-[#573E32]" />
                            Coffee Shops
                        </h1>
                        <p className="mt-1 text-sm text-[#707070]">
                            Information about the coffee shops in the Intelligent Coffee system
                        </p>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button type="button" variant="outline" size="sm" onClick={() => navigate("/admin/accounts")}>
                            <Users size={14} className="mr-1" />
                            All Accounts
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

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-[#EFEAE5]">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-[#EFEAE5]">
                        <div className="flex items-center gap-3">
                            <h2 className="text-base font-semibold text-[#573E32]">Coffee Shop List</h2>

                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => void fetchShops(1)}
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
                                        <TableHead>Shop Name</TableHead>
                                        <TableHead>Address</TableHead>
                                        <TableHead>Location</TableHead>
                                        <TableHead className="text-right">Created Time</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {!loading && shops.map((shop) => (
                                        <TableRow key={shop.coffeeShopId}>
                                            <TableCell className="font-medium text-[#573E32]">
                                                #{shop.coffeeShopId}
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2">
                                                    <Building2 size={16} className="text-[#573E32]" />
                                                    <span className="font-medium text-[#1F1F1F]">{shop.shopName}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-2 text-[#707070]">
                                                    <MapPin size={14} />
                                                    <span className="truncate max-w-md">{shop.address || "-"}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-[#707070]">
                                                {isLocationLoading(shop)
                                                    ? <InlineLoading text="Loading location..." textClassName="text-xs text-[#707070]" />
                                                    : getLocationLabel(shop)}
                                            </TableCell>
                                            <TableCell className="text-right text-xs text-[#707070]">
                                                {formatDateTime(shop.timestamp)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {loading && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="py-6 text-center">
                                                <InlineLoading text="Loading Coffee Shop..." />
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {!loading && shops.length === 0 && !error && (
                                        <TableRow>
                                            <TableCell colSpan={5} className="py-6 text-center text-[#707070]">
                                                No Coffee Shop found
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
                            <TablePagination
                                currentPage={page}
                                totalPages={totalPages}
                                onPageChange={(nextPage) => {
                                    if (nextPage < 1 || nextPage > totalPages || nextPage === page) return;
                                    void fetchShops(nextPage);
                                }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
