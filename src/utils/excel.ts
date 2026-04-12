import * as XLSX from "xlsx";

type ExcelRow = Record<string, string | number | boolean | null | undefined>;

type ExportExcelOptions = {
    rows: ExcelRow[];
    fileName: string;
    sheetName?: string;
};

const normalizeFileName = (name: string) => {
    const cleaned = name.trim().replace(/[\\/:*?"<>|]+/g, "-");
    return cleaned || "export";
};

export function exportRowsToExcel({ rows, fileName, sheetName = "Data" }: ExportExcelOptions) {
    if (!rows.length) return;

    const worksheet = XLSX.utils.json_to_sheet(rows);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
    XLSX.writeFile(workbook, `${normalizeFileName(fileName)}.xlsx`);
}
