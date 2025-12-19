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
  const tasks = [];
  discoverAllTasks(seed, domain, tasks);
  // 3. calculate all the html blob and generate theirs fingerprints
  // 4. memorize fingerprints from current run
  // ---first run ends here---
  // 5. diff the fingerprints from current run and previous run
  // 6. generate a report from 5
}

function discoverAllTasks(seedUrl: string, domain: string, tasks: any[]) {
  // FIXME: need complement
  try {
    const response = tryFetchUrl(seedUrl, 'SEED');
    const internalLinks = crawlForInternalLink(response, seedUrl, domain);
    internalLinks.map((lnk) => {
      tasks.push(lnk);
      discoverAllTasks(lnk, domain, tasks);
    });
  } catch (e) {
    if (e instanceof Error)
      console.error(`    [ERROR] ${seedUrl} のスキャンに失敗しました: ${e.message}`);
  }
}
