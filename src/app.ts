import { CrawlerCoordinator } from "./libs/crawlerCoordinator";
import { initialzie } from "koalanlp/Util";
import database from "./config/database";

(async () => {
  database.sync({
    alter: true,
  });

  await initialzie({
    packages: { KMR: "2.0.4", KKMA: "2.0.4" },
    verbose: true,
  });

  const coordinator = new CrawlerCoordinator();
  coordinator.reportUrl("https://naver.com/");
  await coordinator.start();
})();
