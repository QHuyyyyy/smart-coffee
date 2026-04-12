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

export type AdminSubscriptionRevenueResponse = {
    data: DashboardChartPoint[];
    totalSubscription: number;
    range?: string;
};

export type SupplierCommissionRevenueCompletedResponse = {
    data: DashboardChartPoint[];
    totalCommission: number;
    range?: string;
};

export type TotalCommissionResponse = {
    totalCommission: number;
};

export type TotalSubscriptionResponse = {
    totalSubscription: number;
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

    getSubscriptionRevenue: async (params?: DashboardRevenueQuery) => {
        const response = await api.get<AdminSubscriptionRevenueResponse>("/Dashboard/subscription-revenue", {
            params,
        });
        return response.data;
    },

    getTotalRevenue: async (params?: Pick<DashboardRevenueQuery, "month" | "year">) => {
        const response = await api.get<DashboardChartPoint[]>("/Dashboard/total-revenue", {
            params,
        });
        return response.data;
    },

    getSupplierTotalRevenue: async (supplierId: number, params?: Pick<DashboardRevenueQuery, "month" | "year">) => {
        const response = await api.get<DashboardChartPoint[]>(`/Dashboard/supplier/${supplierId}/total-revenue`, {
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

    getTotalTransaction: async () => {
        const response = await api.get<NumericResponse>("/Dashboard/total-transaction");
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

    getSupplierCommissionRevenueCompleted: async (supplierId: number, params?: Pick<DashboardRevenueQuery, "month" | "year">) => {
        const response = await api.get<SupplierCommissionRevenueCompletedResponse>(
            `/Dashboard/supplier/${supplierId}/commission-revenue-completed`,
            { params },
        );
        return response.data;
    },

    getCommissionRevenueTotal: async () => {
        const response = await api.get<TotalCommissionResponse>("/Dashboard/commission-revenue/total");
        return Number(response.data?.totalCommission ?? 0);
    },

    getSubscriptionRevenueTotal: async () => {
        const response = await api.get<TotalSubscriptionResponse>("/Dashboard/subscription-revenue/total");
        return Number(response.data?.totalSubscription ?? 0);
    },
};
