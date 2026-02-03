import { useEffect, useState } from "react";
import { Building2, MapPin } from "lucide-react";
import { Table, TableBody, TableHeader, TableHead, TableRow, TableCell } from "@/components/ui/table";
import { coffeeShopService } from "@/apis/coffeeShop.service";

type CoffeeShop = {
    coffeeShopId: number;
    shopName: string;
    address: string;
    timestamp: string;
};

export function CoffeeShopPage() {
    const [shops, setShops] = useState<CoffeeShop[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        const fetchShops = async () => {
            try {
                setLoading(true);
                setError(null);
                const response = await coffeeShopService.getAll();
                const data = Array.isArray(response.data) ? response.data : response.data?.data ?? [];
                setShops(data as CoffeeShop[]);
            } catch (err) {
                setError("Không tải được danh sách Coffee Shop");
            } finally {
                setLoading(false);
            }
        };

        fetchShops();
    }, []);

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
                            Information about the coffee shops in the SmartCoffee system
                        </p>
                    </div>
                </div>

                {/* Card */}
                <div className="bg-white rounded-2xl shadow-sm border border-[#EFEAE5]">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-[#EFEAE5]">
                        <h2 className="text-base font-semibold text-[#573E32]">Coffee Shop List</h2>
                        <span className="text-xs text-[#707070]">
                            Total: {shops.length}

                        </span>
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
                                                    <span className="truncate max-w-md">{shop.address}</span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-right text-xs text-[#707070]">
                                                {formatDateTime(shop.timestamp)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                    {loading && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="py-6 text-center text-[#707070]">
                                                Đang tải danh sách Coffee Shop...
                                            </TableCell>
                                        </TableRow>
                                    )}
                                    {!loading && shops.length === 0 && !error && (
                                        <TableRow>
                                            <TableCell colSpan={4} className="py-6 text-center text-[#707070]">
                                                Chưa có Coffee Shop nào.
                                            </TableCell>
                                        </TableRow>
                                    )}
                                </TableBody>
                            </Table>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
