import { parse } from "node-html-parser";
import chardet from "chardet";
import { KMR } from "koalanlp/API";
import { Tagger } from "koalanlp/proc";
import { CrawlerCoordinator } from "./crawlerCoordinator";
import { Keyword } from "../models/Keyword";
import { Link } from "../models/Link";
import { KeywordLink } from "../models/KeywordLink";

export class Crawler {
  private url: string;
  // 인코딩을 하기위한 바이트 배열 객체
  private content?: string;
  private coordinator: CrawlerCoordinator;
  private host?: string;

  public constructor(url: string, coordinator: CrawlerCoordinator) {
    this.url = url;
    this.coordinator = coordinator;
  }

  private async fetch(): Promise<string | null> {
    const brower = await this.coordinator.getBrowser().getInstance();
    if (!brower) {
      return null;
    }
    const page = await brower.newPage();
    await page.goto(this.url);
    const result = await page.content();

    if (result) {
      this.content = result;
      return this.content;
    }
    return null;
  }

  private detectEncodeing(data: Buffer): string | null {
    // 인지해서 되돌려주는 역할(성공:string,실패:null)
    return chardet.detect(data);
  }

  public async trip(): Promise<void> {
    const result = await this.fetch();
    // 데이터가 있으면
    if (result) {
      this.content = result;
      await this.parseContent();
    }
    // 데이터가 없으면
    else {
      console.log("Failed to get url data");
    }
  }

  private async parseContent(): Promise<void> {
    // 크롤링의 결과로 받은 html에서 anchor 태그를 모두 찾아 내기
    // 인코딩 유무 검사
    if (!this.content) {
      return;
    }

    const html = parse(this.content).querySelector("body");
    const anchors = html.querySelectorAll("a");

    anchors.forEach((anchor) => {
      const href = anchor.getAttribute("href");
      if (!href) {
        return;
      }
      const matched = href.match(
        /^(((http|ftp|https):\/\/)|(\/))*[\w-]+(\.[\w-]+)*([\w.,@?^=%&amp;:/~+#-]*[\w@?^=%&amp;/~+#-])?/i
      );

      if (!matched) {
        return null;
      }
      let url = matched[0];

      if (url.startsWith("/")) {
        url = this.host + url;
      } else if (!href.startsWith("http")) {
        url = this.host + "/" + url;
      }
      // this.coordinator.reportUrl(url);
    });
    html.querySelectorAll("script").forEach((script) => script.remove());

    const text = html.text.replace(/\s{2,}/g, "");
    await this.parseKeywords(text);
  }

  // 형태소 분석
  private async parseKeywords(text: string) {
    const tagger = new Tagger(KMR);
    const tagged = await tagger(text);
    const newKeywords: Set<string> = new Set();
    const existKeywords: Keyword[] = [];
    for (const sent of tagged) {
      for (const word of sent._items) {
        for (const morpheme of word._items) {
          if (
            morpheme._tag === "NNG" ||
            morpheme._tag === "NNP" ||
            morpheme._tag === "NNB" ||
            morpheme._tag === "NP" ||
            morpheme._tag === "NR" ||
            morpheme._tag === "VV" ||
            morpheme._tag === "SL"
          ) {
            const keyword = morpheme._surface.toLowerCase();
            const exist = await Keyword.findOne({
              where: {
                name: morpheme.surface,
              },
            });
            if (!exist) {
              newKeywords.add(keyword);
            } else {
              existKeywords.push(exist);
            }
          }
        }
      }
    }
    const existLink = await Link.findOne({
      where: { url: this.url },
    });

    let newLink;
    const keywords = Array.from(newKeywords).map((keyword) => {
      return { name: keyword };
    });
    if (!existLink) {
      newLink = await Link.create(
        {
          url: this.url,
          description: text.slice(0, 512),
          keywords: keywords,
        },
        {
          include: [Keyword],
        }
      );
    } else {
      for (const keyword of keywords) {
        const newKeywords = await Keyword.create(keyword);
        await KeywordLink.create({
          keywordId: newKeywords.id,
          linkId: newLink.id,
        });
      }
    }
    const linkId = existLink ? existLink.id : newLink.id;
    const addedIds: Set<bigint> = new Set();
    for (const keyword of existKeywords) {
      const existRelation = await KeywordLink.findOne({
        where: {
          linkId: linkId,
          keywordId: keyword.id,
        },
      });

      if (!existRelation && !addedIds.has(keyword.id)) {
        await KeywordLink.create({
          keywordId: keyword.id,
          linkId: linkId,
        });
        addedIds.add(keyword.id);
      }
    }
  }
}
