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
        if (sheetName === CRAWL_REPORT_START_MARK) {
          acc.crawlStartMarkSheet = sheet;
        }
        if (sheetName === DIFF_START_MARK) {
          acc.diffStartMarkSheet = sheet;
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
      {
        seedSheet: null,
        runSheets: [],
        reportSheets: [],
        crawlStartMarkSheet: null,
        diffStartMarkSheet: null,
      }
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
function addNewSheet(
  book: Book,
  newSheetName: string,
  type: AddSheetType,
  currentRunTime: number = null
): SheetInfo {
  let sheetName = type === 'MARK' ? `${newSheetName}` : `${newSheetName}${currentRunTime}`;

  try {
    const currentRunSheet = book.insertSheet(sheetName);
    return {
      sheet: currentRunSheet,
      sheetName: sheetName,
      runTime: currentRunTime,
    };
  } catch (e) {
    if (e instanceof Error) {
      throw new Error(`[ERROR] シート "${sheetName}" の挿入に失敗しました: ${e.message}`);
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

function moveSheetAfter(book: Book, sheet: Sheet, markSheet: Sheet) {
  try {
    const targetIndex = markSheet.getIndex();
    // const totalSheet = book.getNumSheets();

    const moveTo = targetIndex; // === totalSheet ? totalSheet : targetIndex + 1;
    if (moveTo === sheet.getIndex()) {
      return;
    }

    sheet.activate();
    book.moveActiveSheet(moveTo);
  } catch (e) {
    if (e instanceof Error) {
      throw new Error(
        `[ERROR] シート "${markSheet.getSheetName()}" の移動に失敗しました: ${e.message}`
      );
    } else {
      throw new Error(`[ERROR] 不明なエラーが発生しました: ${e}`);
    }
  }
}
function cleanUpRunSheets(book: Book, runSheets: SheetInfo[], latestRunTime: number): void {
  const runSheetsCount = runSheets.length + 1;
  if (runSheetsCount <= MAX_HISTORY_TO_KEEP) {
    console.log(
      `[INFO] シート数が ${runSheetsCount} 枚で、${MAX_HISTORY_TO_KEEP} 枚以下のため、クリーンアップをスキップします`
    );
    return;
  }

  const runToKeepFrom = latestRunTime - MAX_HISTORY_TO_KEEP + 1;
  let SheetToDelete;
  try {
    runSheets.forEach((sheet) => {
      if (sheet.runTime <= runToKeepFrom) {
        SheetToDelete = sheet.sheetName;
        book.deleteSheet(sheet.sheet);
        console.log(`[INFO] 履歴シート "${SheetToDelete}" を削除しました`);
      }
    });
  } catch (e) {
    if (e instanceof Error) {
      throw new Error(`[ERROR] 履歴シート "${SheetToDelete}" の削除に失敗しました: ${e.message}`);
    } else {
      throw new Error(`[ERROR] 不明なエラーが発生しました: ${e}`);
    }
  }
}
