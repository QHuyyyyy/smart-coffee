import api from "./axios";

export type DashboardRevenueQuery = {
    day?: number;
    month?: number;
    year?: number;
    fromDate?: string;
    toDate?: string;
};

export type DashboardChartPoint = {
    time: string;
    totalRevenue: number;
};

export type AdminCommissionRevenueResponse = {
    data: DashboardChartPoint[];
    totalCommission: number;
    range?: string;
};

type NumericResponse = number | Record<string, unknown>;

const getNumericValue = (value: NumericResponse): number => {
    if (typeof value === "number") return value;

    const numericEntry = Object.values(value).find((entry) => typeof entry === "number");
    return typeof numericEntry === "number" ? numericEntry : 0;
};

export const dashboardService = {
    getCommissionRevenue: async (params?: DashboardRevenueQuery) => {
        const response = await api.get<AdminCommissionRevenueResponse>("/Dashboard/commission-revenue", {
            params,
        });
        return response.data;
    },

    getTotalAccounts: async () => {
        const response = await api.get<NumericResponse>("/Dashboard/total-accounts");
        return getNumericValue(response.data);
    },
    getTotalStaffs: async () => {
        const response = await api.get<NumericResponse>("/Dashboard/total-staff");
        return getNumericValue(response.data);
    },
    getTotalCoffeeShops: async () => {
        const response = await api.get<NumericResponse>("/Dashboard/total-coffeeshops");
        return getNumericValue(response.data);
    },

    getTotalSuppliers: async () => {
        const response = await api.get<NumericResponse>("/Dashboard/total-suppliers");
        return getNumericValue(response.data);
    },

    getTotalActiveSubscriptions: async () => {
        const response = await api.get<NumericResponse>("/Dashboard/total-active-subscriptions");
        return getNumericValue(response.data);
    },

    getSupplierTotalOrder: async (supplierId: number) => {
        const response = await api.get<NumericResponse>(`/Dashboard/supplier/${supplierId}/total-order`);
        return getNumericValue(response.data);
    },

    getSupplierTotalTransaction: async (supplierId: number) => {
        const response = await api.get<NumericResponse>(`/Dashboard/supplier/${supplierId}/total-transaction`);
        return getNumericValue(response.data);
    },

    getSupplierTotalCommissionFee: async (supplierId: number) => {
        const response = await api.get<NumericResponse>(`/Dashboard/supplier/${supplierId}/total-commission-fee`);
        return getNumericValue(response.data);
    },
};
