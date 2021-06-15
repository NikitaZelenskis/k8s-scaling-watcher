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
  private viewPort: Viewport = { width: 500, height: 500 };
  // chrome dev tools client
  private client: puppeteer.CDPSession = null;

  private maxDownloadSpeed = 1048576;
  private maxUploadSpeed = 1048576;

  public linkToGo: string;
  public pageReloadTime: number;

  public async run(): Promise<void> {
    this.browser = await this.createBrowser();
    this.page = await this.browser.newPage();
    this.client = await this.page.target().createCDPSession();
    await this.setBandwidthLimit(this.maxDownloadSpeed, this.maxUploadSpeed);
    await this.goToLink();
    await this.runScript();
    console.log('watching');
    this.setReloadInterval();
  }

  // Set network bandwidth limit in bytes
  public async setBandwidthLimit(
    downloadSpeed: number,
    uploadSpeed: number
  ): Promise<void> {
    this.maxDownloadSpeed = downloadSpeed;
    this.maxUploadSpeed = uploadSpeed;
    if (this.client === null) {
      return;
    }
    await this.client.send('Network.emulateNetworkConditions', {
      offline: false,
      downloadThroughput: downloadSpeed,
      uploadThroughput: uploadSpeed,
      latency: 0,
    });
  }

  public async screenshot(): Promise<void> {
    await this.page.screenshot();
  }

  private getFlags() {
    const chromeFlags = [
      '--no-sandbox',
      '--disable-dev-shm-usage',
      '--disable-setuid-sandbox',
      '--disable-gpu',
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
      headless: true,
      defaultViewport: this.viewPort,
      executablePath: 'google-chrome-unstable',
    });
  }

  private async goToLink() {
    console.log('Going to: ' + this.linkToGo);
    await this.page.goto(this.linkToGo, {
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
