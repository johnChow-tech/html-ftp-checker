/**
 * Google Apps Script の CheerioGS ライブラリの型定義。
 * これにより、ローカルのTypeScript環境で `Cheerio` グローバルオブジェクトの
 * 自動補完と型チェックが有効になります。
 */

// まず、Cheerio が操作する基本的な要素の型を定義します。
interface CheerioElement {
  type: string;
  name?: string;
  attribs?: { [key: string]: string };
  children?: CheerioElement[];
  data?: string;
}

// Cheerio のインスタンス（例：$('a') の結果）の型を定義します。
interface Cheerio<T> {
  // 属性を取得または設定します
  attr(name: string): string | undefined; // 用法1: 获取属性 (返回 string 或 undefined)
  attr(name: string, value: any): Cheerio<T>; // 用法2: 设置属性 (返回 Cheerio 对象)

  // HTMLコンテンツを取得します
  html(): string | null;
  // テキストコンテンツを取得します
  text(): string;
  // CSSセレクタで子孫要素を検索します
  find(selector: string): Cheerio<T>;
  // 各要素に対してループ処理を実行します
  each(func: (index: number, element: T) => void): Cheerio<T>;
  // 最初の要素を取得します
  first(): Cheerio<T>;
  // 最後の要素を取得します
  last(): Cheerio<T>;
  // 親要素を取得します
  parent(): Cheerio<T>;
}

// Cheerio.load() が返すトップレベルのオブジェクト（$）の型を定義します。
// これが Cheerio API のエントリーポイントです。
interface CheerioAPI {
  (selector: string | CheerioElement): Cheerio<CheerioElement>;
  html(): string;
}

// 最後に、GAS環境に存在するグローバルな `Cheerio` オブジェクトを宣言します。
declare namespace Cheerio {
  /**
   * HTML文字列をロードし、操作可能なCheerioオブジェクトを返します。
   * @param html 解析するHTMLコンテンツ。
   * @returns 操作可能なCheerioAPIインスタンス（通常は`$`として使用）。
   */
  function load(html: string): CheerioAPI;
}
