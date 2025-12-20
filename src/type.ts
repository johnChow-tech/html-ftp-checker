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
