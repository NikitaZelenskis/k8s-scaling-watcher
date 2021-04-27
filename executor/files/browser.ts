import puppeteer, {
  Page,
  Browser as puppeteerBrowser,
  Viewport,
} from 'puppeteer';
import * as os from 'os';
import * as fs from 'fs';

export class Browser {
  static scriptLocation = '/script/browser-script.js';
  private page: Page;
  private browser: puppeteerBrowser;
  public streamURL: string;
  private viewPort: Viewport = { width: 500, height: 500 };
  private headless = true;
  public pageReloadTime: number;

  public async run(): Promise<void> {
    this.browser = await this.createBrowser();
    this.page = await this.browser.newPage();
    await this.goToStream();
    await this.runScript();
    console.log('watching');
    this.setReloadInterval();
  }

  public async screenshot(): Promise<void> {
    await this.page.screenshot();
  }

  private getFlags() {
    const chromeFlags = [
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-setuid-sandbox',
    ];
    if (os.type() === 'Windows_NT') {
      chromeFlags.push('--disable-gpu');
    }
    return chromeFlags;
  }

  private async createBrowser(): Promise<puppeteerBrowser> {
    const chromeFlags = this.getFlags();
    return await puppeteer.launch({
      args: chromeFlags,
      headless: this.headless,
      defaultViewport: this.viewPort,
      executablePath: 'google-chrome-unstable',
    });
  }

  private async goToStream() {
    console.log('Going to: ' + this.streamURL);
    await this.page.goto(this.streamURL, {
      waitUntil: 'networkidle2',
      timeout: 180000,
    });
  }

  private async runScript() {
    await this.page.waitForTimeout(3000);
    fs.readFile(Browser.scriptLocation, 'utf8', (err, data) => {
      if (err) {
        return console.log(err);
      }
      this.page.evaluate(data);
    });
  }

  private setReloadInterval() {
    setInterval(() => {
      this.page.evaluate(() => {
        location.reload();
      });
    }, this.pageReloadTime);
  }
}
