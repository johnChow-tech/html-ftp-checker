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

function getAllValuesFromRunSheet(runSheet: Sheet): RunResultRow[] {
  try {
    const allValues = runSheet.getDataRange().getValues();
    if (allValues.length < 2) {
      // ヘッダー行（1行）より少ない場合はデータがないとみなす
      throw new Error(`シート ${runSheet.getName()} は空です`);
    }

    allValues.shift(); // remove header
    return allValues as RunResultRow[];
  } catch (e) {
    if (e instanceof Error) {
      throw new Error(
        `[ERROR] シート ${runSheet.getName()} からのコンテンツ取得に失敗しました: ${e.message}`
      );
    } else {
      throw new Error(`[ERROR] 不明なエラーが発生しました: ${e}`);
    }
  }
}

function writeReportToSheet(sheetInfo: SheetInfo, reportData: ReportData) {
  const { sheet, sheetName } = sheetInfo;
  try {
    if (reportData.detail && reportData.detail.length > 0) {
      const detailDataToWrite = [...reportData.detail];
      if (detailDataToWrite.length === 1) {
        const unchangeNotice = ['前回と変化なし', '不変', null, null] as ReportRow;
        detailDataToWrite.push(unchangeNotice);
      }

      const detailRange = sheet.getRange(1, 1, detailDataToWrite.length, REPORT_HEADER.length);
      detailRange.setValues(detailDataToWrite).setBorder(true, true, true, true, false, false);

      setReportHeaderStyle(sheetInfo, reportData);
      console.log(`[SUCCESS] レポートをシート "${sheetName}" に正常に書き込みました。`);
    }
  } catch (e) {
    if (e instanceof Error) {
      throw new Error(`[ERROR] シート "${sheetName}" への書き込みに失敗しました: ${e.message}`);
    }
  }
}

function setReportHeaderStyle(sheetInfo: SheetInfo, reportData: ReportData) {
  const { sheet, sheetName } = sheetInfo;
  try {
    // 詳細レポートのヘッダー設定
    const detailHeaderRange = sheet.getRange(1, 1, 1, REPORT_HEADER.length);
    detailHeaderRange
      .setBackground(DETAIL_HEADER_BG_COLOR)
      .setBorder(false, false, true, false, false, false)
      .setFontColor(DETAIL_HEADER_FONT_COLOR);
    //フィルター、1行目の固定
    const reportRange = sheet.getRange(1, 1, reportData.detail.length, REPORT_HEADER.length);
    reportRange.createFilter();
    sheet.setFrozenRows(1);
  } catch (e) {
    if (e instanceof Error) {
      throw new Error(`[ERROR] シート "${sheetName}" への書き込みに失敗しました: ${e.message}`);
    }
  }
}

// TODO:
function removeSheetAfter(book: Book, sheet: Sheet, sheetName: string) {}
function getPreviousFingerprint(sheet: Sheet) {}
function cleanUpRunSheets(book: Book, runSheets: SheetInfo[], latestRunTime: number): void {}
