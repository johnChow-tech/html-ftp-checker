function generateReport(
  previousRunData: Array<[string, string]>,
  currentRunDataMap: Map<string, string>,
  seedUrl: string
): ReportData {
  const detailReportData: DetailReportData = generateDetailReport(
    previousRunData,
    currentRunDataMap
  );
  const cleanDetailReport = reduceDetailReport(detailReportData);
  // Removed brief report generation and return value.
  return { detail: cleanDetailReport };
}

function generateDetailReport(
  previousRunData: Array<[string, string]>,
  currentRunDataMap: Map<string, string>
): DetailReportData | null {
  const previousRunMap = new Map<string, string>();
  previousRunData.forEach((row) => {
    const url = row[0];
    const fingerPrint = row[1];
    previousRunMap.set(url, fingerPrint);
  });

  const reportRows: ReportRow[] = [];

  for (const [url, currentFingerPrint] of currentRunDataMap.entries()) {
    const previousFingerPrint = previousRunMap.get(url);
    let status: DiffStatus;
    if (!currentFingerPrint) {
      status = 'リンク切れ';
    } else if (!previousFingerPrint) {
      status = '追加';
    } else if (currentFingerPrint === previousFingerPrint) {
      status = '不変';
    } else {
      status = '変更';
    }
    reportRows.push([url, status, previousFingerPrint || '', currentFingerPrint]);
  }

  for (const [url, previousFingerPrint] of previousRunMap.entries()) {
    if (!currentRunDataMap.has(url)) {
      reportRows.push([url, '削除', previousFingerPrint, '']);
    }
  }

  const reportData: DetailReportData = [REPORT_HEADER];
  reportRows.sort((a, b) => (a[2] > b[2] ? 1 : -1) || (a[1] > b[1] ? 1 : -1));
  reportData.push(...reportRows);
  return reportData;
}

function reduceDetailReport(detailReportData: DetailReportData | null): DetailReportData | null {
  const dataCopy = [...detailReportData];
  dataCopy.shift();
  const detailReportRows = dataCopy as ReportRow[];

  const cleanDetailReportRows = detailReportRows.filter(
    (row) => row[REPORT_SHEET_DIFF_STATUS_COL_IDX] !== '不変'
  );

  return [REPORT_HEADER, ...cleanDetailReportRows];
}
