import { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { dashboardService, type DashboardChartPoint } from "@/apis/dashboard.service";
import { formatVND } from "@/utils/currency";

// Màu sắc theo tone web
const BAR_COLOR = "#5C4233";
const GRID_COLOR = "#E8E1DB";
const BG_COLOR = "#FFFDFA";

export function CommissionRevenueChart() {
    const [data, setData] = useState<DashboardChartPoint[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [totalCommission, setTotalCommission] = useState(0);
    const [rangeLabel, setRangeLabel] = useState<string>("");

    useEffect(() => {
        async function fetchData() {
            setLoading(true);
            setError(null);
            try {
                const result = await dashboardService.getCommissionRevenue();
                setData(result.data ?? []);
                setTotalCommission(result.totalCommission ?? 0);
                setRangeLabel(result.range ?? "");
            } catch (err) {
                setError("Không thể tải dữ liệu doanh thu hoa hồng.");
            } finally {
                setLoading(false);
            }
        }
        fetchData();
    }, []);

    return (
        <div className="rounded-3xl border border-[#E8E1DB] bg-[#FFFDFA] p-6 shadow-sm">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
                <div>
                    <h2 className="text-lg font-semibold text-[#2F221B]">Biểu đồ doanh thu hoa hồng</h2>
                    <p className="mt-1 text-xs text-[#7E6A5C]">{rangeLabel || "Kỳ hiện tại"}</p>
                </div>
                <div className="rounded-full bg-[#F2E9E3] px-3 py-1.5 text-sm font-semibold text-[#5C4233]">
                    Tổng: {formatVND(totalCommission)}
                </div>
            </div>
            {loading ? (
                <div className="py-14 text-center text-sm text-[#7E6A5C]">Đang tải dữ liệu...</div>
            ) : error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-600">{error}</div>
            ) : data.length === 0 ? (
                <div className="py-14 text-center text-sm text-[#7E6A5C]">Chưa có dữ liệu trong khoảng thời gian này.</div>
            ) : (
                <ResponsiveContainer width="100%" height={320}>
                    <BarChart data={data} margin={{ top: 16, right: 24, left: 0, bottom: 16 }}>
                        <CartesianGrid stroke={GRID_COLOR} vertical={false} />
                        <XAxis dataKey="time" stroke="#8A7566" fontSize={12} />
                        <YAxis stroke="#8A7566" fontSize={12} />
                        <Tooltip
                            contentStyle={{ background: BG_COLOR, borderColor: GRID_COLOR, borderRadius: 12 }}
                            labelStyle={{ color: "#5C4233", fontWeight: 600 }}
                            itemStyle={{ color: BAR_COLOR }}
                            formatter={(value) => formatVND(value)}
                        />
                        <Bar dataKey="totalRevenue" fill={BAR_COLOR} radius={[8, 8, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            )}
        </div>
    );
}
