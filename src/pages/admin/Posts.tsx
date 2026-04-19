import { useEffect, useMemo, useState } from "react";
import { FileText, CheckCircle2, XCircle, Search, Eye } from "lucide-react";
import { toast } from "sonner";
import { postService, type PostCategoryItem, type PostItem } from "@/services/apis/post.service";
import { InlineLoading } from "@/components/Loading";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TablePagination } from "@/components/ui/pagination";
import { PostDetailModal } from "@/components/PostDetailModal";

type PostTab = "unapproved" | "approved";

type Filters = {
    coffeeShopId: string;
    postCategoryId: string;
    publishedFrom: Date | null;
    publishedTo: Date | null;
    createFrom: Date | null;
    createTo: Date | null;
    title: string;
};

const defaultFilters: Filters = {
    coffeeShopId: "",
    postCategoryId: "",
    publishedFrom: null,
    publishedTo: null,
    createFrom: null,
    createTo: null,
    title: "",
};

function formatDateTime(value: string | null | undefined) {
    if (!value) return "-";
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleString("vi-VN");
}

function normalizeDateTimeLocal(value: Date | null) {
    if (!value) return undefined;
    if (Number.isNaN(value.getTime())) return undefined;
    return value.toISOString();
}

function getPostStatusClasses(status: string | null | undefined) {
    const normalized = (status ?? "").toLowerCase();

    if (normalized === "pending") {
        return "bg-[#FFF6E4] text-[#C8811A] border border-[#F2E1B6]";
    }

    if (normalized === "hidden") {
        return "bg-[#F2F4F7] text-[#5F6B7A] border border-[#E3E8EE]";
    }

    if (normalized === "cancelled" || normalized === "canceled") {
        return "bg-[#FDECEC] text-[#C24242] border border-[#F8D1D1]";
    }

    if (normalized === "public") {
        return "bg-[#E8F6EE] text-[#2E8B57] border border-[#CFEAD9]";
    }

    return "bg-gray-100 text-gray-700 border border-gray-200";
}


export function AdminPostsPage() {
    const [tab, setTab] = useState<PostTab>("unapproved");
    const [posts, setPosts] = useState<PostItem[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [actingPostId, setActingPostId] = useState<number | null>(null);
    const [postCategories, setPostCategories] = useState<PostCategoryItem[]>([]);

    const [detailOpen, setDetailOpen] = useState(false);
    const [selectedPost, setSelectedPost] = useState<PostItem | null>(null);

    const [filters, setFilters] = useState<Filters>(defaultFilters);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(20);
    const [totalCount, setTotalCount] = useState(0);

    const categoryNameById = useMemo(() => {
        return new Map(postCategories.map((category) => [category.postCategoryId, category.categoryName]));
    }, [postCategories]);

    const fetchPosts = async (targetPage = page, customFilters?: Filters, customPageSize?: number) => {
        try {
            setLoading(true);
            setError(null);

            const activeFilters = customFilters ?? filters;
            const activePageSize = customPageSize ?? pageSize;

            const response = await postService.getPaginated({

                status: tab === "unapproved" ? "Pending" : undefined,
                createFrom: normalizeDateTimeLocal(activeFilters.createFrom),
                createTo: normalizeDateTimeLocal(activeFilters.createTo),
                title: activeFilters.title.trim() || undefined,
                pageSize: activePageSize,
                pageNo: targetPage,
            });

            const items = response.items ?? [];
            const tabFilteredItems = tab === "approved"
                ? items.filter((item) => (item.status ?? "").toLowerCase() !== "pending")
                : items;

            setPosts(tabFilteredItems);
            setTotalCount(tab === "approved" ? tabFilteredItems.length : (response.totalCount ?? 0));
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
    }, [tab, pageSize, filters]);

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const data = await postService.getCategories();
                setPostCategories(Array.isArray(data) ? data : []);
            } catch {
                setPostCategories([]);
            }
        };

        void fetchCategories();
    }, []);

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

    const handleViewDetails = (post: PostItem) => {
        setSelectedPost(post);
        setDetailOpen(true);
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
                    <div className="px-6 py-4 border-b border-[#EFEAE5]">
                        <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
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

                            <div className="flex flex-wrap items-end justify-end gap-3">

                                <div className="flex items-center gap-2 rounded-full bg-[#F5F3F1] px-4 h-11 w-full sm:w-52">

                                    <Search size={16} className="text-[#B0A49E]" />
                                    <input
                                        type="text"
                                        placeholder="Title of post"
                                        value={filters.title}
                                        onChange={(e) => {
                                            setPage(1);
                                            setFilters((prev) => ({ ...prev, title: e.target.value }));
                                        }}
                                        className="w-full bg-transparent text-sm text-[#573E32] placeholder:text-[#B0A49E] focus:outline-none"
                                    />
                                </div>



                                <Button
                                    type="button"
                                    variant="outline"
                                    className="h-10 rounded-2xl px-4"
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
                    </div>

                    <div className="px-6 py-4">
                        {error && <p className="mb-2 text-xs text-red-500">{error}</p>}

                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-transparent">
                                        <TableHead className="w-24">ID</TableHead>
                                        <TableHead>Title</TableHead>
                                        <TableHead className="text-center">CoffeeShop</TableHead>
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
                                            <TableCell className="max-w-55 truncate" title={post.title ?? ""}>
                                                {post.title ?? "-"}
                                            </TableCell>
                                            <TableCell className="text-center">{post.shopName ?? "-"}</TableCell>
                                            <TableCell className="text-center">
                                                {post.postCategoryId
                                                    ? (categoryNameById.get(post.postCategoryId) ?? `#${post.postCategoryId}`)
                                                    : "-"}
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <span className={`inline-flex items-center justify-center rounded-full px-2.5 py-1 text-[11px] font-medium capitalize ${getPostStatusClasses(post.status)}`}>
                                                    {post.status ?? "-"}
                                                </span>
                                            </TableCell>
                                            <TableCell className="text-center">{post.viewCount ?? 0}</TableCell>
                                            <TableCell className="text-center text-xs text-[#707070]">
                                                {formatDateTime(post.createdAt)}
                                            </TableCell>
                                            <TableCell>
                                                {tab === "unapproved" ? (
                                                    <div className="flex items-center justify-center gap-2">
                                                        <button
                                                            type="button"
                                                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[#B0A49E] hover:text-[#573E32] hover:bg-[#F5F3F1]"
                                                            aria-label="View post detail"
                                                            onClick={() => void handleViewDetails(post)}
                                                        >
                                                            <Eye size={16} />
                                                        </button>
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
                                                    <div className="flex items-center justify-center">
                                                        <button
                                                            type="button"
                                                            className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[#B0A49E] hover:text-[#573E32] hover:bg-[#F5F3F1]"
                                                            aria-label="View post detail"
                                                            onClick={() => void handleViewDetails(post)}
                                                        >
                                                            <Eye size={16} />
                                                        </button>
                                                    </div>
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

            <PostDetailModal
                open={detailOpen}
                onOpenChange={(open) => setDetailOpen(open)}
                post={selectedPost}
                categoryName={selectedPost?.postCategoryId ? (categoryNameById.get(selectedPost.postCategoryId) ?? `#${selectedPost.postCategoryId}`) : "-"}
            />
        </div>
    );
}
