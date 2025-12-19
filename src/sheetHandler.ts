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
function addNewSheet(book: Book): Sheet {
  return;
}
function removeSheetAfter(book: Book, sheet: Sheet, sheetName: string) {}
function getPreviousFingerprint(sheet: Sheet) {}
