import { useCallback, useEffect, useMemo, useState } from 'react';
import { Bell } from 'lucide-react';
import { notificationService, type NotificationItem, type NotificationPaginatedResponse } from '../services/apis/notification.service';
import { useSidebar } from '../context/SidebarContext';
import { TablePagination } from './ui/pagination';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from './ui/sheet';
import { useAuthStore } from '../stores/auth.store';

const NOTIFICATION_PAGE_SIZE = 10;

function formatNotificationDate(value: string | null | undefined) {
    if (!value) return '-';
    return new Date(value).toLocaleString('vi-VN');
}

export function Header() {
    const { isCollapsed } = useSidebar();
    const { currentUser } = useAuthStore();
    const sidebarWidth = isCollapsed ? 'left-20' : 'left-64';
    const [isNotificationOpen, setIsNotificationOpen] = useState(false);
    const [notificationPage, setNotificationPage] = useState(1);
    const [notificationData, setNotificationData] = useState<NotificationPaginatedResponse | null>(null);
    const [isLoadingNotifications, setIsLoadingNotifications] = useState(false);
    const [notificationError, setNotificationError] = useState<string | null>(null);
    const [markingReadId, setMarkingReadId] = useState<number | null>(null);

    const initials = useMemo(() => {
        const source = (currentUser?.supplierName || currentUser?.email || "").trim();
        if (!source) return "?";
        const parts = source.split(/\s+/);
        if (parts.length === 1) {
            return parts[0][0]?.toUpperCase() ?? "?";
        }
        return `${parts[0][0]?.toUpperCase() ?? ""}${parts[1][0]?.toUpperCase() ?? ""}` || "?";
    }, [currentUser?.supplierName, currentUser?.email]);
    const loadNotifications = useCallback(async (nextPage = notificationPage) => {
        if (!currentUser?.accountId) return;

        try {
            setIsLoadingNotifications(true);
            setNotificationError(null);
            const data = await notificationService.getByAccountId(currentUser.accountId, {
                page: nextPage,
                pageSize: NOTIFICATION_PAGE_SIZE,
            });
            setNotificationData(data);
        } catch (err: any) {
            const message = err?.response?.data?.message ?? err?.message ?? 'Failed to load notifications.';
            setNotificationError(message);
        } finally {
            setIsLoadingNotifications(false);
        }
    }, [currentUser?.accountId, notificationPage]);

    useEffect(() => {
        if (!isNotificationOpen) return;
        void loadNotifications(notificationPage);
    }, [isNotificationOpen, loadNotifications, notificationPage]);

    useEffect(() => {
        setNotificationPage(1);
        setNotificationData(null);
        setNotificationError(null);
    }, [currentUser?.accountId]);

    const handleMarkAsRead = async (item: NotificationItem) => {
        if (item.isRead) return;

        try {
            setMarkingReadId(item.notificationId);
            await notificationService.markAsRead(item.notificationId);

            setNotificationData((prev) => {
                if (!prev) return prev;
                return {
                    ...prev,
                    items: prev.items.map((notification) => {
                        if (notification.notificationId !== item.notificationId) return notification;
                        return {
                            ...notification,
                            isRead: true,
                            readDate: new Date().toISOString(),
                        };
                    }),
                };
            });
        } catch (err: any) {
            const message = err?.response?.data?.message ?? err?.message ?? 'Failed to mark notification as read.';
            setNotificationError(message);
        } finally {
            setMarkingReadId(null);
        }
    };

    const unreadCount = useMemo(() => {
        if (!notificationData?.items?.length) return 0;
        return notificationData.items.filter((item) => !item.isRead).length;
    }, [notificationData?.items]);

    const notifications = notificationData?.items ?? [];
    const currentPage = notificationData?.page ?? notificationPage;
    const totalPages = notificationData?.totalPages ?? 1;

    return (
        <header className={`fixed top-0 right-0 h-20 bg-[#F9F9F9] border-b border-[#EFEAE5] px-10 py-5 flex items-center justify-between z-30 transition-all duration-300 ${sidebarWidth}`}>
            <div className="flex flex-col items-start gap-1">

            </div>

            <div className="flex items-center gap-6">
                <Sheet open={isNotificationOpen} onOpenChange={setIsNotificationOpen}>
                    <SheetTrigger asChild>
                        <button className="relative flex max-w-120 cursor-pointer items-center justify-center overflow-hidden rounded-full h-10 w-10 text-[#707070] hover:bg-black/5 transition-colors">
                            <Bell size={20} />
                            {unreadCount > 0 && (
                                <span className="absolute right-2 top-2 h-2.5 w-2.5 rounded-full bg-[#EF4444] border border-[#F9F9F9]" />
                            )}
                        </button>
                    </SheetTrigger>

                    <SheetContent side="right" className="w-105 sm:max-w-105 p-0 bg-[#F9F9F9] border-[#EFEAE5]">
                        <div className="h-full flex flex-col">
                            <SheetHeader className="px-6 py-5 border-b border-[#EFEAE5]">
                                <SheetTitle className="text-lg text-[#1F1F1F]">Notifications</SheetTitle>
                                <p className="text-sm text-[#707070]">
                                    {notificationData?.totalCount ?? 0} notifications
                                </p>
                            </SheetHeader>

                            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3">
                                {isLoadingNotifications && (
                                    <p className="text-sm text-[#707070]">Loading notifications...</p>
                                )}

                                {!isLoadingNotifications && notificationError && (
                                    <p className="text-sm text-red-500">{notificationError}</p>
                                )}

                                {!isLoadingNotifications && !notificationError && notifications.length === 0 && (
                                    <p className="text-sm text-[#707070]">No notifications available.</p>
                                )}

                                {!isLoadingNotifications && !notificationError && notifications.map((item) => (
                                    <button
                                        key={item.notificationId}
                                        type="button"
                                        onClick={() => {
                                            void handleMarkAsRead(item);
                                        }}
                                        className={`w-full rounded-xl border p-4 text-left transition-colors ${item.isRead
                                            ? 'bg-white border-[#EFEAE5] hover:bg-[#F4F4F4]'
                                            : 'bg-[#FFF8F7] border-[#F5D4CF] hover:bg-[#FFEFEA]'
                                            }`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <p className="text-sm font-semibold text-[#1F1F1F] leading-5">{item.title || 'Notification'}</p>
                                            {!item.isRead && (
                                                <span className="shrink-0 rounded-full bg-[#EF4444] px-2 py-0.5 text-[11px] font-semibold text-white">
                                                    New
                                                </span>
                                            )}
                                        </div>

                                        <p className="mt-1 text-sm text-[#5B5B5B] leading-5">{item.description || '-'}</p>

                                        <div className="mt-3 flex items-center justify-between gap-2 text-xs text-[#8B8B8B]">
                                            <span>{formatNotificationDate(item.createDate)}</span>
                                            <span className="rounded-full bg-[#EFEAE5] px-2 py-0.5 text-[#5B5B5B]">
                                                {item.type || item.priority || 'General'}
                                            </span>
                                        </div>

                                        {markingReadId === item.notificationId && (
                                            <p className="mt-2 text-xs text-[#707070]">Updating read status...</p>
                                        )}
                                    </button>
                                ))}
                            </div>

                            <div className="border-t border-[#EFEAE5] px-6 py-4">
                                <TablePagination
                                    currentPage={currentPage}
                                    totalPages={totalPages}
                                    onPageChange={(nextPage) => {
                                        if (nextPage === notificationPage) return;
                                        setNotificationPage(nextPage);
                                    }}
                                />
                            </div>
                        </div>
                    </SheetContent>
                </Sheet>

                <div className="flex items-center gap-3">
                    <p className="text-sm font-medium text-[#707070]">Hi, {currentUser?.supplierName || currentUser?.role} </p>
                    <button
                        type="button"
                        className="h-10 w-10 rounded-full bg-linear-to-br from-[#FEE4D6] to-[#F9D5B5] flex items-center justify-center text-sm font-semibold text-[#4b2c20] overflow-hidden border border-[#E6D5C6] focus:outline-none focus:ring-2 focus:ring-[#F47A1F] focus:ring-offset-2"
                    >
                        {currentUser?.image ? (
                            <img
                                src={currentUser.image}
                                alt={currentUser.supplierName ?? currentUser.email}
                                className="h-full w-full object-cover"
                            />
                        ) : (
                            <span>{initials}</span>
                        )}
                    </button>
                </div>
            </div>
        </header>
    );
}
