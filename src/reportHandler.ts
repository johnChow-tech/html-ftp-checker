function generateReport(
  previousRunData: Array<[string, string]>,
  currentRunDataMap: Map<string, string>,
  seedUrl: string
): ReportData {
  const detailReportData: DetailReportData = generateDetailReport(
    previousRunData,
    currentRunDataMap
  );
  const briefReportData: BriefReportData = generateBriefReport(detailReportData, seedUrl);
  const cleanDetailReport = reduceDetailReport(detailReportData);
  return { detail: cleanDetailReport, brief: briefReportData };
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

function generateBriefReport(
  detailReportData: DetailReportData, // Contains rows like [url, status, prevFingerprint, currFingerprint]
  seedUrl: string // The single seed URL for this report
): BriefReportData | null {
  // Ensure detailReportData is treated as an array of rows, skipping any potential header row from previous stages.
  // The header row from detailReportData is ['URL', 'Status', 'Previous Fingerprint', 'Current Fingerprint'].
  // We should skip this if it exists.
  const reportRows = detailReportData.slice(1) as ReportRow[]; // Skip the first row assuming it's the header

  // BRIEF_HEADER is ['Seed URL', 'Internal Links Count', 'Status']
  const briefReportData: BriefReportData = [['Seed URL', 'Internal Links Count', 'Status']];

  let totalRelevantLinksCount = 0;
  let hasBrokenLinks = false;

  // Filter out rows that are '不変' (unchanged) as they are not relevant for a *brief* report of changes.
  // We are interested in '追加', '変更', '削除', 'リンク切れ'
  const relevantRows = reportRows.filter((row) => row[1] !== '不変');

  totalRelevantLinksCount = relevantRows.length;

  for (const row of relevantRows) {
    const [, diffStatus] = row; // diffStatus is at index 1
    if (diffStatus === 'リンク切れ') {
      hasBrokenLinks = true;
      // If we find one 'NG' status, the overall status will be 'NG'.
      // We continue to count all relevant links.
    }
  }

  const finalStatus: BriefStatus = hasBrokenLinks ? 'NG' : 'OK';

  // If there are any relevant links (changes or new/deleted items), add the summary row.
  // This summary row is specific to the single seed URL for this report.
  if (totalRelevantLinksCount > 0) {
    briefReportData.push([seedUrl, totalRelevantLinksCount, finalStatus]);
  } else {
    // If no relevant links are found (i.e., all were '不変' or there were no rows after skipping header),
    // we might still want to report that no changes occurred.
    // Add a row indicating no changes for the given seedUrl.
    // The prompt implies a summary row is always expected if there were changes.
    // If no changes, we don't push the summary row here.
    // If the user expects a row even with 0 changes, this logic might need adjustment.
    // For now, only push if there are relevant links to report.
  }

  return briefReportData;
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
