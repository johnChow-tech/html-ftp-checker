// googleAppScript type in short
type Book = GoogleAppsScript.Spreadsheet.Spreadsheet;
type Sheet = GoogleAppsScript.Spreadsheet.Sheet;
type HTTPResponse = GoogleAppsScript.URL_Fetch.HTTPResponse;
type FetchType = 'SEED' | 'INTERNAL_LINK';

type RunResultRow = [
  number, // runTimes
  string, // currentUrl
  string // FingerPrint
];

type RunResultSheetData = [typeof RUN_RESULT_SHEET_HEADER, ...RunResultRow[]];

interface FoundSheets {
  seedSheet: Sheet | null;
  runSheets: SheetInfo[];
  reportSheets: SheetInfo[];
}

interface SheetInfo {
  sheet: Sheet | null;
  sheetName: string;
  runTime: number;
}
type DetailReportData = [typeof REPORT_HEADER, ...ReportRow[]];
type ReportRow = [
  string, // url
  DiffStatus, // status
  string, // previous fingerprint
  string // current fingerprint
];
type DiffStatus = '追加' | '変更' | '不変' | '削除' | 'リンク切れ' | null;

type BriefStatus = 'OK' | 'NG' | null;

type BriefReportRow = [
  string, // seed url
  number, // internal links count
  BriefStatus // status
];

type BriefReportData = [typeof BRIEF_HEADER, ...BriefReportRow[]];

interface ReportData {
  detail: DetailReportData | null;
  brief: BriefReportData | null;
}

type RunsToCompare = {
  previousRunValues: RunResultRow[];
  currentRunValues: RunResultRow[];
};
