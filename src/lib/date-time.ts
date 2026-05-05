import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);

const VIETNAM_TIME_ZONE = "Asia/Ho_Chi_Minh";
const DATE_TIME_FORMAT = "DD/MM/YYYY HH:mm:ss";

function isEmptyDateValue(value: string | null | undefined) {
    if (!value) return true;
    return value.startsWith("0001-01-01");
}

export function formatUtc7DateTime(value: string | null | undefined, fallback = "-") {
    if (isEmptyDateValue(value)) return fallback;

    const date = dayjs(value);
    if (!date.isValid()) return value ?? fallback;

    return date.tz(VIETNAM_TIME_ZONE).format(DATE_TIME_FORMAT);
}

export const getVietnamISOString = () => {
    return dayjs().tz(VIETNAM_TIME_ZONE).format("YYYY-MM-DDTHH:mm:ss.SSSZ");
};
