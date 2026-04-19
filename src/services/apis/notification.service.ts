import api from "../axios";

export type NotificationItem = {
    notificationId: number;
    userId: number;
    title: string | null;
    description: string | null;
    type: string | null;
    content: string | null;
    isRead: boolean;
    priority: string | null;
    createDate: string;
    readDate: string | null;
};

export type NotificationPaginatedResponse = {
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
    items: NotificationItem[];
};

export const notificationService = {
    getByAccountId: async (accountId: number, params: { page?: number; pageSize?: number }) => {
        const response = await api.get<NotificationPaginatedResponse>(`/Notification/account/${accountId}`, { params });
        return response.data;
    },

    markAsRead: async (notificationId: number) => {
        const response = await api.put(`/Notification/${notificationId}/read`);
        return response.data;
    },
};
