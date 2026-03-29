import { useEffect, useMemo, useState } from "react";
import { FileText, CheckCircle2, XCircle } from "lucide-react";
import { toast } from "sonner";
import { postService, type PostItem } from "@/apis/post.service";
import { InlineLoading } from "@/components/Loading";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TablePagination } from "@/components/ui/pagination";

type PostTab = "unapproved" | "approved";

type Filters = {
    coffeeShopId: string;
    postCategoryId: string;
    publishedFrom: string;
    publishedTo: string;
    createFrom: string;
    createTo: string;
    title: string;
    status: string;
};

const defaultFilters: Filters = {
    coffeeShopId: "",
    postCategoryId: "",
    publishedFrom: "",
    publishedTo: "",
    createFrom: "",
    createTo: "",
    title: "",
    status: "",
};

function formatDateTime(value: string | null | undefined) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("vi-VN");
}

function normalizeDateTimeLocal(value: string) {
    if (!value) return undefined;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return undefined;
    return date.toISOString();
}

export function AdminPostsPage() {
    const [tab, setTab] = useState<PostTab>("unapproved");
    const [posts, setPosts] = useState<PostItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [actingPostId, setActingPostId] = useState<number | null>(null);

    const [filters, setFilters] = useState<Filters>(defaultFilters);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [totalCount, setTotalCount] = useState(0);

    const fetchPosts = async (targetPage = page, customFilters?: Filters, customPageSize?: number) => {
        try {
            setLoading(true);
            setError(null);

            const activeFilters = customFilters ?? filters;
            const activePageSize = customPageSize ?? pageSize;

            const response = await postService.getPaginated({
                coffeeShopId: activeFilters.coffeeShopId ? Number(activeFilters.coffeeShopId) : undefined,
                postCategoryId: activeFilters.postCategoryId ? Number(activeFilters.postCategoryId) : undefined,
                publishedFrom: normalizeDateTimeLocal(activeFilters.publishedFrom),
                publishedTo: normalizeDateTimeLocal(activeFilters.publishedTo),
                isApproved: tab === "approved",
                createFrom: normalizeDateTimeLocal(activeFilters.createFrom),
                createTo: normalizeDateTimeLocal(activeFilters.createTo),
                title: activeFilters.title.trim() || undefined,
                status: activeFilters.status.trim() || undefined,
                pageSize: activePageSize,
                pageNo: targetPage,
            });

            setPosts(response.items ?? []);
            setTotalCount(response.totalCount ?? 0);
            setPage(targetPage);
        } catch (err: any) {
            setError(err?.response?.data?.message || err?.message || "Failed to load posts");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        void fetchPosts(1);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [tab, pageSize]);

    const totalPages = useMemo(() => {
        return totalCount > 0 ? Math.max(1, Math.ceil(totalCount / pageSize)) : 1;
    }, [totalCount, pageSize]);

    const fromItem = totalCount === 0 ? 0 : (page - 1) * pageSize + 1;
    const toItem = totalCount === 0 ? 0 : Math.min(totalCount, page * pageSize);

    const handlePageChange = (newPage: number) => {
        if (newPage < 1 || newPage > totalPages || newPage === page) return;
        void fetchPosts(newPage);
    };

    const handleTabChange = (nextTab: PostTab) => {
        if (tab === nextTab) return;
        setTab(nextTab);
        setPage(1);
    };

    const handleApprove = async (postId: number) => {
        try {
            setActingPostId(postId);
            await postService.approve(postId);
            toast.success("Post approved successfully");
            void fetchPosts(page);
        } catch (err: any) {
            toast.error(err?.response?.data?.message || err?.message || "Failed to approve post");
        } finally {
            setActingPostId(null);
        }
    };

    const handleUnapprove = async (postId: number) => {
        try {
            setActingPostId(postId);
            await postService.cancel(postId);
            toast.success("Post unapproved successfully");
            void fetchPosts(page);
        } catch (err: any) {
            toast.error(err?.response?.data?.message || err?.message || "Failed to unapprove post");
        } finally {
            setActingPostId(null);
        }
    };

    return (
        <div className="mt-24 px-10 pb-10 w-full overflow-y-auto">
            <div className="w-full">
                <div className="mb-6 flex items-center justify-between gap-4">
                    <div>
                        <h1 className="text-2xl font-bold leading-tight tracking-[-0.015em] text-[#1F1F1F] flex items-center gap-2">
                            <FileText size={22} className="text-[#573E32]" />
                            Post Management
                        </h1>
                        <p className="mt-1 text-sm text-[#707070]">
                            Quản lý bài viết và duyệt bài theo trạng thái Approved
                        </p>
                    </div>
                </div>

                <div className="bg-white rounded-2xl shadow-sm border border-[#EFEAE5]">
                    <div className="px-6 pt-4 pb-2 border-b border-[#EFEAE5]">
                        <div className="flex items-center gap-2">
                            <button
                                type="button"
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === "unapproved"
                                    ? "bg-[#573E32] text-white"
                                    : "bg-[#F5F1EE] text-[#573E32] hover:bg-[#EEE7E2]"
                                    }`}
                                onClick={() => handleTabChange("unapproved")}
                            >
                                Wait for Approval
                            </button>
                            <button
                                type="button"
                                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${tab === "approved"
                                    ? "bg-[#573E32] text-white"
                                    : "bg-[#F5F1EE] text-[#573E32] hover:bg-[#EEE7E2]"
                                    }`}
                                onClick={() => handleTabChange("approved")}
                            >
                                Approved
                            </button>
                        </div>
                    </div>

                    <div className="px-6 py-4 border-b border-[#EFEAE5] grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-3">
                        {/* <Input
                            type="number"
                            placeholder="coffeeShopId"
                            value={filters.coffeeShopId}
                            onChange={(e) => setFilters((prev) => ({ ...prev, coffeeShopId: e.target.value }))}
                        /> */}
                        {/* <Input
                            type="number"
                            placeholder="postCategoryId"
                            value={filters.postCategoryId}
                            onChange={(e) => setFilters((prev) => ({ ...prev, postCategoryId: e.target.value }))}
                        /> */}
                        <Input
                            placeholder="title"
                            value={filters.title}
                            onChange={(e) => setFilters((prev) => ({ ...prev, title: e.target.value }))}
                        />
                        <Input
                            type="datetime-local"
                            placeholder="createFrom"
                            value={filters.createFrom}
                            onChange={(e) => setFilters((prev) => ({ ...prev, createFrom: e.target.value }))}
                        />
                        <Input
                            type="datetime-local"
                            placeholder="createTo"
                            value={filters.createTo}
                            onChange={(e) => setFilters((prev) => ({ ...prev, createTo: e.target.value }))}
                        />

                        <Input
                            placeholder="status"
                            value={filters.status}
                            onChange={(e) => setFilters((prev) => ({ ...prev, status: e.target.value }))}
                        />

                        <div className="flex ml-auto gap-2 xl:col-span-4">

                            <Button
                                type="button"
                                variant="coffee"
                                onClick={() => void fetchPosts(1)}
                            >
                                Apply Filters
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => {
                                    setFilters(defaultFilters);
                                    setPageSize(20);
                                    setPage(1);
                                    void fetchPosts(1, defaultFilters, 20);
                                }}
                            >
                                Reset
                            </Button>
                        </div>
                    </div>

                    <div className="px-6 py-4">
                        {error && <p className="mb-2 text-xs text-red-500">{error}</p>}

                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-transparent">
                                        <TableHead className="w-24">ID</TableHead>
                                        <TableHead>Title</TableHead>
                                        <TableHead className="text-center">Coffee Shop</TableHead>
                                        <TableHead className="text-center">Category</TableHead>
                                        <TableHead className="text-center">Status</TableHead>
                                        <TableHead className="text-center">Views</TableHead>

                                        <TableHead className="text-center">Created At</TableHead>
                                        <TableHead className="text-center">Actions</TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {!loading && posts.map((post) => (
                                        <TableRow key={post.postId}>
                                            <TableCell className="font-medium text-[#573E32]">#{post.postId}</TableCell>
                                            <TableCell className="max-w-[220px] truncate" title={post.title ?? ""}>
                                                {post.title ?? "-"}
                                            </TableCell>
                                            <TableCell className="text-center">{post.coffeeShopId ?? "-"}</TableCell>
                                            <TableCell className="text-center">{post.postCategoryId ?? "-"}</TableCell>
                                            <TableCell className="text-center">{post.status ?? "-"}</TableCell>
                                            <TableCell className="text-center">{post.viewCount ?? 0}</TableCell>
                                            <TableCell className="text-center text-xs text-[#707070]">
                                                {formatDateTime(post.createdAt)}
                                            </TableCell>
                                            <TableCell>
                                                {tab === "unapproved" ? (
                                                    <div className="flex items-center justify-center gap-2">
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            className="bg-emerald-600 hover:bg-emerald-700 text-white"
                                                            onClick={() => void handleApprove(post.postId)}
                                                            disabled={actingPostId === post.postId}
                                                        >
                                                            <CheckCircle2 size={14} />
                                                            Approve
                                                        </Button>
                                                        <Button
                                                            type="button"
                                                            size="sm"
                                                            variant="outline"
                                                            className="border-red-200 text-red-700 hover:bg-red-50"
                                                            onClick={() => void handleUnapprove(post.postId)}
                                                            disabled={actingPostId === post.postId}
                                                        >
                                                            <XCircle size={14} />
                                                            Cancel
                                                        </Button>
                                                    </div>
                                                ) : (
                                                    <span className="text-xs text-[#9B8E87]">-</span>
                                                )}
                                            </TableCell>
                                        </TableRow>
                                    ))}

                                    {loading && (
                                        <TableRow>
                                            <TableCell colSpan={9} className="py-6 text-center">
                                                <InlineLoading text="Loading posts..." />
                                            </TableCell>
                                        </TableRow>
                                    )}

                                    {!loading && posts.length === 0 && !error && (
                                        <TableRow>
                                            <TableCell colSpan={9} className="py-6 text-center text-[#707070]">
                                                No posts found.
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
                            <TablePagination currentPage={page} totalPages={totalPages} onPageChange={handlePageChange} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
