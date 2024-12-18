import { launch, Browser as HeadlessBrowser } from "puppeteer";
export class Browser {
  private browser?: HeadlessBrowser;

  public async getInstance(): Promise<HeadlessBrowser | null> {
    if (this.browser) {
      return this.browser;
    }
    this.browser = await launch();

    if (!this.browser) {
      return null;
    }
    return this.browser;
  }
}
