function tryFetchUrl(url: string, fetchType: FetchType): HTTPResponse {
  try {
    const response = UrlFetchApp.fetch(url, { muteHttpExceptions: true });
    const reponseCode = response.getResponseCode();
    if (reponseCode === 200) {
      return response;
    } else {
      if (fetchType === 'SEED') {
        // シードURLの取得失敗はクリティカルなエラーとしてスローする
        throw new Error(
          `[ERROR] シードURLへのアクセス失敗: responseCode=${response.getResponseCode()};url=${url}`
        );
      } else if (fetchType === 'INTERNAL_LINK') {
        // 内部リンクの取得失敗は警告ログに留め、nullを返して処理を続行する
        console.warn(
          `  [WARNING] 内部リンクへのアクセス試行失敗：responseCode=${response.getResponseCode()};url=${url}`
        );
        return null;
      } else {
        throw new Error(`[ERROR] tryFetchUrl呼び出し時にfetchTypeが設定されていません！`);
      }
    }
    return;
  } catch (e) {
    if (e instanceof Error) {
      // UrlFetchApp.fetch自体が例外を投げた場合
      throw new Error(`[ERROR] ネットワークリクエスト失敗:${e.message};url=${url}`);
    } else {
      throw new Error(`[ERROR] 不明なエラーが発生しました:${e}`);
    }
  }
}

function resolveUrl(href: string, baseUrl: string): string | null {
  href = href.trim();

  if (
    href.startsWith('mailto:') ||
    href.startsWith('tel:') ||
    href.startsWith('javascript:') ||
    href.startsWith('#') ||
    !href
  ) {
    return null;
  }

  let resolved: string;

  if (href.startsWith('http://') || href.startsWith('https://')) {
    resolved = href;
  } else {
    const originMatch = baseUrl.match(/^(https?:\/\/[^/]+)/);
    if (!originMatch) return null;
    const origin = originMatch[1];

    const protocolMatch = baseUrl.match(/^(https?:)/);
    if (!protocolMatch) return null;
    const protocol = protocolMatch[1];

    if (href.startsWith('//')) {
      resolved = protocol + href;
    } else if (href.startsWith('/')) {
      resolved = origin + href;
    } else {
      const path = baseUrl.substring(origin.length) || '/';

      let basePath: string;
      if (path.endsWith('/')) {
        basePath = path;
      } else {
        const lastSlash = path.lastIndexOf('/');
        basePath = path.substring(0, lastSlash + 1);
      }

      const baseParts = basePath.split('/').filter((p) => p.length > 0);
      const hrefParts = href.split('/');

      for (const part of hrefParts) {
        if (part === '..') {
          baseParts.pop();
        } else if (part !== '.' && part.length > 0) {
          baseParts.push(part);
        }
      }

      const newPath = '/' + baseParts.join('/');
      resolved = origin + newPath;
    }
  }

  // 最終的なURLからハッシュ（#）部分を取り除き、正規化する
  return resolved.split('#')[0];
}

function getHostnameFromUrl(url: string): string | null {
  if (!url) return null;
  const match = url.match(/^https?:\/\/([^/?#]+)/);
  return match ? match[1] : null;
}

function crawlForInternalLink(response: HTTPResponse, url: string, domain: string): string[] {
  const html = response.getContentText();
  const $ = Cheerio.load(html);
  const internalUrls = new Set<string>();

  $('a').each((index, element) => {
    const href = $(element).attr('href');
    if (!href) return;
    const resolvedUrl = resolveUrl(href, url);
    if (resolvedUrl) {
      const hostname = getHostnameFromUrl(resolvedUrl);
      if (hostname && hostname === domain) {
        internalUrls.add(resolvedUrl);
      }
    }
  });

  return Array.from(internalUrls);
}

function calculateFingerprint(response: HTTPResponse | null): string {
  if (!response) return ''; // responseがnullの場合は空文字列を返す

  const blob = response.getBlob();
  const hashBytes = blob.getBytes();
  const rawHash = Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256, hashBytes);

  const fingerPrint = Array.from(rawHash)
    .map((byte) => {
      const unsignedByte = byte < 0 ? byte + 256 : byte;
      return unsignedByte.toString(16).padStart(2, '0');
    })
    .join('');
  return fingerPrint;
}
