import api from "./axios";

export type PostItem = {
    postId: number;
    recipeId: number | null;
    coffeeShopId: number | null;
    shopName: string | null;
    postCategoryId: number | null;
    title: string | null;
    status: string | null;
    viewCount: number | null;
    publishedAt: string | null;
    isApproved: boolean;
    content: string | null;
    createdAt: string | null;
    recipeImageUrl: string | null;
    postCommentIds: number[];
};

export type PostQueryParams = {
    coffeeShopId?: number;
    postCategoryId?: number;
    publishedFrom?: string;
    publishedTo?: string;
    isApproved?: boolean;
    createFrom?: string;
    createTo?: string;
    title?: string;
    status?: string;
    pageSize?: number;
    pageNo?: number;
};

export type PostPaginatedResponse = {
    totalCount: number;
    items: PostItem[];
};

export type PostCategoryItem = {
    postCategoryId: number;
    categoryName: string;
    createdAt: string | null;
};

export const postService = {
    getPaginated: async (params: PostQueryParams) => {
        const response = await api.get<PostPaginatedResponse>("/Post", { params });
        return response.data;
    },

    getCategories: async () => {
        const response = await api.get<PostCategoryItem[]>("/post-categories");
        return response.data;
    },

    approve: async (postId: number) => {
        const response = await api.put<PostItem>(`/admin/posts/${postId}/approve`);
        return response.data;
    },

    cancel: async (postId: number) => {
        const response = await api.put<PostItem>(`/admin/posts/${postId}/unapprove`);
        return response.data;
    },
};
