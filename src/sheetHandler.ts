function findSheets(book: Book) {
  try {
    const allSheets = book.getSheets();

    const runRegex = new RegExp(`^${RUN_SHEET_PREFIX}(\\d+)$`);
    const reportRegex = new RegExp(`^${REPORT_SHEET_PREFIX}(\\d+)$`);

    const foundSheets = allSheets.reduce<FoundSheets>(
      (acc, sheet) => {
        const sheetName = sheet.getName();
        const runMatch = sheetName.match(runRegex);
        const reportMatch = sheetName.match(reportRegex);
        if (sheetName === SEED_SHEET) {
          acc.seedSheet = sheet;
        }
        if (runMatch) {
          const runTime = parseInt(runMatch[1], 10);
          acc.runSheets.push({ sheet, sheetName, runTime });
        } else if (reportMatch) {
          const runTime = parseInt(reportMatch[1], 10);
          acc.reportSheets.push({ sheet, sheetName, runTime });
        }

        return acc;
      },
      { seedSheet: null, runSheets: [], reportSheets: [] }
    );

    // 実行回数の降順（最新のものが先頭）にソート
    foundSheets.runSheets.sort((a, b) => b.runTime - a.runTime);
    foundSheets.reportSheets.sort((a, b) => b.runTime - a.runTime);

    return foundSheets;
  } catch (e) {
    if (e instanceof Error) {
      throw new Error(
        `[ERROR] "${RUN_SHEET_PREFIX}*" または "${REPORT_SHEET_PREFIX}*" の取得試行に失敗しました: ${e.message}`
      );
    } else {
      throw new Error(`[ERROR] 不明なエラーが発生しました: ${e}`);
    }
  }
}
function addNewSheet(book: Book, sheetNamePrefix: string, currentRunTime: number): SheetInfo {
  const currentRunName = `${sheetNamePrefix}${currentRunTime}`;
  try {
    const currentRunSheet = book.insertSheet(currentRunName);
    return {
      sheet: currentRunSheet,
      sheetName: currentRunName,
      runTime: currentRunTime,
    };
  } catch (e) {
    if (e instanceof Error) {
      throw new Error(`[ERROR] シート "${currentRunName}" の挿入に失敗しました: ${e.message}`);
    } else {
      throw new Error(`[ERROR] 不明なエラーが発生しました: ${e}`);
    }
  }
}

function writeRunResultToSheet(
  sheetInfo: SheetInfo,
  results: Map<string, string>,
  currentRunTime: number
): void {
  const { sheet: sheet, sheetName: sheetName } = sheetInfo;
  try {
    const dataToWrite: RunResultSheetData = [RUN_RESULT_SHEET_HEADER];

    const keys = Array.from(results.keys());
    keys.map((k) => {
      const v = results.get(k);
      const urlAndFingerprint: RunResultRow = [currentRunTime, k, v];
      dataToWrite.push(urlAndFingerprint);
    });

    const range = sheet.getRange(1, 1, dataToWrite.length, RUN_RESULT_SHEET_HEADER.length);

    range.setValues(dataToWrite);
    range.createFilter();
    sheet.setFrozenRows(1);

    console.log(
      `[SUCCESS] ${keys.length} 件のレコードをシート "${sheetName}" に正常に書き込みました`
    );
  } catch (e) {
    if (e instanceof Error) {
      throw new Error(`[ERROR] シート "${sheetName}" への書き込みに失敗しました: ${e.message}`);
    }
  }
}

function removeSheetAfter(book: Book, sheet: Sheet, sheetName: string) {}
function getPreviousFingerprint(sheet: Sheet) {}
