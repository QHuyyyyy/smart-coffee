import api from "./axios";

export type Province = {
    ProvinceID: number;
    ProvinceName: string;
    Code: string;
};

export type District = {
    DistrictID: number;
    ProvinceID: number;
    DistrictName: string;
    Code: string;
    Type: number;
    SupportType: number;
};

export type Ward = {
    WardCode: string;
    DistrictID: number;
    WardName: string;
};

type GhnResponse<T> = {
    code: number;
    message: string;
    data: T;
};

export const ghnService = {
    getProvinces: async () => {
        const response = await api.get<GhnResponse<Province[]>>("/GHN/provinces");
        return response.data.data;
    },

    getDistrictsByProvince: async (provinceId: number) => {
        const response = await api.get<GhnResponse<District[]>>(`/GHN/districts/${provinceId}`);
        return response.data.data;
    },

    getWardsByDistrict: async (districtId: number) => {
        const response = await api.get<GhnResponse<Ward[]>>(`/GHN/wards/${districtId}`);
        return response.data.data;
    },
};
