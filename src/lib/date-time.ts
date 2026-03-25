import dayjs from "dayjs";
import timezone from "dayjs/plugin/timezone";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);
dayjs.extend(timezone);

const VIETNAM_TIME_ZONE = "Asia/Ho_Chi_Minh";

export const getVietnamISOString = () => {
    return dayjs().tz(VIETNAM_TIME_ZONE).format("YYYY-MM-DDTHH:mm:ss.SSSZ");
};
