import { Crawler } from "./crawler";

export class CrawlerCoordinator {
  private urlQueue: string[];

  public constructor() {
    this.urlQueue = [];
  }

  // 주소를 전달 받아서 큐에다가 전달
  public reportUrl(url: string): void {
    this.urlQueue.push(url);
  }

  //url큐가 빌때까지 돈다.
  public async start(): Promise<void> {
    while (this.urlQueue) {
      //앞에 있는 값을 삭제
      const url = this.urlQueue.shift();

      if (!url) {
        continue;
      }

      const crawler = new Crawler(url, this);
      await crawler.trip();
    }
  }
}
