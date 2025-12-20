const MAX_PAGE_TO_CRAWL = 80;
const MAX_HISTORY_TO_KEEP = 7;

const SEED_SHEET = 'Seed';
const SEED_URL_CELL = 'seed_url';
const BASE_DOMAIN_CELL = 'base_domain';
const DIFF_START_MARK = 'Diff report >>';
const CRAWL_REPORT_START_MARK = 'Crawl result >>';

const RUN_SHEET_PREFIX = 'Run_';
const REPORT_SHEET_PREFIX = 'Report_';
const RUN_RESULT_SHEET_HEADER = ['実行回数', 'URL', '指紋'];

// --- Run 結果シート ---
const RUN_RESULT_SHEET_PREFIX = 'Run_';
const RUN_RESULT_SHEET_RUNTIMES_COL_IDX = 0;
const RUN_RESULT_SHEET_SEEDINDEX_COL_IDX = 1;
const RUN_RESULT_SHEET_CURRENT_URL_COL_IDX = 2;
const RUN_RESULT_SHEET_FINGERPRINT_COL_IDX = 3;
const RUN_RESULT_SHEET_TIMESTAMP_COL_IDX = 4;

// --- Report シート関連 ---
const DETAIL_HEADER_BG_COLOR = '#f3f3f3';
const DETAIL_HEADER_FONT_COLOR = '#000000';
const REPORT_HEADER = ['URL', 'Status', 'Previous Fingerprint', 'Current Fingerprint'];
const REPORT_SHEET_SEEDINDEX_COL_IDX = 0;
const REPORT_SHEET_DIFF_STATUS_COL_IDX = 1;
const SPACING_IN_REPORT = 1;
