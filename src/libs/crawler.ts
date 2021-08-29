import axios, { AxiosError } from "axios";
import { parse } from "node-html-parser";
import chardet from "chardet";
import iconv from "iconv-lite";
import { CrawlerCoordinator } from "./crawlerCoordinator";
import { KMR } from "koalanlp/API";
import { Tagger } from "koalanlp/proc";
import { initialize } from "koalanlp/Util";

export class Crawler {
  private url: string;
  // 인코딩을 하기위한 바이트 배열 객체
  private content?: Buffer;
  private coordinator: CrawlerCoordinator;
  private host?: string;
  private encoding?: string;

  public constructor(url: string, coordinator: CrawlerCoordinator) {
    this.url = url;
    this.coordinator = coordinator;
  }

  private async fetch(): Promise<Buffer | null> {
    try {
      const { data, request } = await axios.get(this.url, {
        timeout: 3000,
        responseType: "arraybuffer",
      });

      this.host = request.host;
      const detectEncodeing = this.detectEncodeing(data);
      if (!detectEncodeing) {
        return null;
      }
      this.encoding = detectEncodeing;
      return data;
    } catch (error) {
      if (error.isAxiosError) {
        console.log(this.url);
        const e: AxiosError = error;
        console.log(e.response?.status);
      }
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
      console.log("data");
    }
  }

  private async parseContent(): Promise<void> {
    // 크롤링의 결과로 받은 html에서 anchor 태그를 모두 찾아 내기
    // 인코딩 유무 검사
    if (!this.content || !this.encoding) {
      return;
    }

    const encodedContent = iconv.decode(this.content, this.encoding);
    const html = parse(encodedContent);
    const anchors = html.querySelectorAll("a");
    const scripts = html.querySelectorAll("script");

    scripts.forEach((script) => script.remove());

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

  private async parseKeywords(text: string) {
    await initialize({
      packages: { KMR: "2.0.4", KKMA: "2.0.4" },
      vervose: true,
    });

    const tagger = new Tagger(KMR);
    const tagged = await tagger(text);
    for (const sent of tagged) {
      for (const word of sent._items) {
        for (const morpheme of word._items) {
          if (morpheme._tag === "NNG" || morpheme._tag === "VA")
            console.log(morpheme.toString());
        }
      }
    }
  }
}
