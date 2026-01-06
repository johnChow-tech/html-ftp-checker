# html-ftp-checker Business Logic Description

This document details the business logic and core functionality of the `html-ftp-checker` project.

## Project Overview

The `html-ftp-checker` is a Google Apps Script (GAS) project designed to monitor changes on a specified website by automatically crawling its internal links. It generates unique "fingerprints" (SHA-256 hash values) for each page's content. By comparing these fingerprints across different runs, the tool can detect additions, modifications, deletions, and potentially broken links, reporting the findings in a structured Google Spreadsheet.

## Core Business Logic and Functionality

The project operates through a series of steps, orchestrated primarily by `main.ts`, which leverages several other modules:

### 1. Initialization and Input (via `Seed` Sheet)

*   **Entry Point:** The script is initiated by a user, typically by running a function like `checkInternalLinks` from the Google Apps Script editor.
*   **Configuration Retrieval:** The script reads crucial configuration details from a designated Google Spreadsheet sheet named `Seed`.
    *   **Base Domain (`base_domain`):** A named range in the `Seed` sheet where the user provides the hostname (e.g., `example.com`) of the website to be monitored. This is used to distinguish internal links from external ones.
    *   **Seed URL (`seed_url`):** Another named range in the `Seed` sheet where the user provides the starting URL (e.g., `https://example.com/index.html`) for the crawling process.
*   **Module:** `sheetHandler.ts` is responsible for interacting with the Google Spreadsheet to read these inputs.

### 2. Website Crawling and Fingerprint Generation

*   **URL Discovery:** Starting from the `seed_url`, the `crawler.ts` module fetches the HTML content of the page. It then parses this content (using the `Cheerio` library) to extract all `href` attributes.
*   **Internal Link Filtering:** Only links whose hostnames match the `base_domain` are considered for further crawling. External links are ignored.
*   **Recursive Crawling:** The crawler recursively visits all discovered internal links that haven't been processed yet, ensuring all accessible pages within the specified domain are covered.
*   **Content Fetching:** For each internal page, the script fetches its raw content (blob).
*   **Fingerprint Calculation:** A SHA-256 hash is calculated from the fetched content (blob) of each page. This hash serves as a unique "fingerprint" for the page's content at that specific point in time.
*   **Data Storage (`Run_X` Sheet):** All collected URLs and their corresponding SHA-256 fingerprints, along with other relevant metadata, are recorded in a new Google Spreadsheet sheet. This sheet is dynamically named `Run_X`, where `X` is an incrementing number representing the current execution run (e.g., `Run_1`, `Run_2`).
*   **Module:** `crawler.ts` performs the core crawling, HTML parsing, and fingerprint generation. `sheetHandler.ts` handles writing this data to the spreadsheet.

### 3. Change Detection and Reporting

*   **Comparison Basis:** Once the current `Run_X` sheet is populated, the `reportGenerator.ts` module compares its data with the data from the *previous* run, typically `Run_{X-1}`.
*   **Identifying Changes:** The comparison process identifies the following types of changes based on URL and fingerprint matches:
    *   **Added Pages:** URLs present in `Run_X` but not found in `Run_{X-1}`.
    *   **Modified Pages:** URLs present in both `Run_X` and `Run_{X-1}`, but with differing SHA-256 fingerprints.
    *   **Deleted Pages:** URLs present in `Run_{X-1}` but no longer found in `Run_X`.
    *   **Broken Links (Implicit):** While not explicitly listed as "broken links" in the report, if a page previously crawled is no longer accessible or results in an error during fetching, it would likely appear as a "deleted" page or fail to generate a fingerprint, thus indicating an issue.
*   **Report Generation (`Report_X` Sheet):** A detailed report summarizing these changes is generated and written to a new Google Spreadsheet sheet named `Report_X` (e.g., `Report_1`, `Report_2`).
*   **No Change Indication:** If no differences are found between the current and previous runs, the `Report_X` sheet will clearly indicate "不変" (unchanged).
*   **Module:** `reportGenerator.ts` is responsible for the comparison logic and structuring the report data. `sheetHandler.ts` handles writing this report to the spreadsheet.

### 4. Sheet Management and Cleanup

*   **Dynamic Sheet Creation:** `sheetHandler.ts` is responsible for creating new `Run_X` and `Report_X` sheets for each execution.
*   **Automated Cleanup:** To prevent the spreadsheet from becoming cluttered, `sheetHandler.ts` also manages the deletion of older `Run_` and `Report_` sheets, keeping only a configurable number of recent runs.

### 5. Configuration Management

*   **Global Constants:** The `configs.ts` module likely stores global constants, magic strings (like sheet names or named range keys), and other configurable parameters that influence the script's behavior.

## Project Structure and Technologies

*   **Language:** TypeScript (`.ts` files in `src/`).
*   **Platform:** Google Apps Script (GAS), compiled to JavaScript (`.js` files in `dist/`).
*   **Deployment Tool:** `clasp` is used to push the compiled JavaScript code from the local `dist/` directory to the Google Apps Script project.
*   **HTML Parsing Library:** `Cheerio` is utilized for efficient server-side HTML parsing.
*   **Dependency Management:** `npm` for managing project dependencies.
*   **Development Workflow:** Local development in TypeScript, compilation to JavaScript using `tsc`, and deployment to GAS via `clasp`.

This robust system allows for continuous monitoring of website content changes, providing a clear and traceable history of modifications.