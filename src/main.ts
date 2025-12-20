function main() {
  // 1. get seed url from sheet
  const book = SpreadsheetApp.getActiveSpreadsheet();
  const foundSheets = findSheets(book);

  const seedSheet = foundSheets.seedSheet;
  const runSheets = foundSheets.runSheets;
  const reportSheets = foundSheets.reportSheets;

  const latestRunSheetInfo = runSheets.length !== 0 ? runSheets[0] : null;
  const latestRunTime = latestRunSheetInfo ? latestRunSheetInfo.runTime : 0;
  const currentRunTime = latestRunTime + 1;

  // 2. crawl all the internal links (same domain with seed url) start by seed url
  // 2.1. get seed url and domain
  const seed = seedSheet.getRange(SEED_URL_CELL).getValue();
  if (!seed) {
    throw new Error(`[ERROR] 種URLが見つからないか、種URLリストが空です。`);
  }

  const domain = seedSheet.getRange(BASE_DOMAIN_CELL).getValue();
  if (!domain) {
    throw new Error(`[ERROR] ベースドメインが見つからないか、空です。`);
  }

  console.log(`[START] ${currentRunTime} 回目の実行を開始します。 `);

  // 2.2. discover tasks
  const urlAndFingerprintPairs = discoverAllTasks(seed, domain);
  if (urlAndFingerprintPairs.size === 0) {
    console.log('[INFO] 処理対象の内部リンクが見つかりませんでした。');
    return;
  }

  // // test
  // const key = Array.from(discoveredTasks.keys());
  // key.forEach((k) => {
  //   const value = discoveredTasks.get(k);
  //   console.log(`key=${k}`);
  //   console.log(`value=${value}`);
  // });

  console.log(
    `[PHASE 1] 発見フェーズ完了。合計 ${urlAndFingerprintPairs.size} 件のリンク（重複除去）が見つかりました。`
  );

  // 3. memorize fingerprints from current run
  // 3.1. add new sheet to record current run result
  const currentRunSheet = addNewSheet(book, RUN_SHEET_PREFIX, currentRunTime);

  // 3.2. write result the newly added runsheet
  writeRunResultToSheet(currentRunSheet, urlAndFingerprintPairs, currentRunTime);

  // ---first run ends here---
  // 4. diff the fingerprints from current run and previous run
  // 5. generate a report from 5
}

function discoverAllTasks(seedUrl: string, domain: string): Map<string, string> {
  const visitedUrls = new Set<string>();
  const urlsToVisit: string[] = [];
  const fingerprintPairs = new Map<string, string>();

  // Add the seed URL to the queue and visited set
  urlsToVisit.push(seedUrl);
  visitedUrls.add(seedUrl);

  while (urlsToVisit.length > 0 && visitedUrls.size < MAX_PAGE_TO_CRAWL) {
    const currentUrl = urlsToVisit.shift(); // Dequeue
    if (!currentUrl) continue;

    try {
      // console.log(`[CRAWLING] 現在のURL: ${currentUrl}`);
      const response = tryFetchUrl(currentUrl, 'INTERNAL_LINK');

      if (response) {
        // 2.3. get fingerprints
        const fingerPrint = calculateFingerprint(response);
        fingerprintPairs.set(currentUrl, fingerPrint);

        const internalLinks = crawlForInternalLink(response, currentUrl, domain);
        for (const link of internalLinks) {
          if (!visitedUrls.has(link)) {
            visitedUrls.add(link);
            urlsToVisit.push(link); // Enqueue
          }
        }
      }
    } catch (e) {
      if (e instanceof Error) {
        console.error(`    [ERROR] ${currentUrl} のスキャンに失敗しました: ${e.message}`);
      } else {
        console.error(`    [ERROR] ${currentUrl} のスキャン中に不明なエラーが発生しました: ${e}`);
      }
    }
  }
  return fingerprintPairs;
}

function getTimeStamp(): string {
  const now = new Date();
  return Utilities.formatDate(now, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss');
}
