import puppeteer from 'puppeteer';
import * as os from 'os';
import * as fs from 'fs';
export class Browser {
    constructor() {
        this.viewPort = { width: 500, height: 500 };
        this.headless = true;
    }
    async run() {
        this.browser = await this.createBrowser();
        this.page = await this.browser.newPage();
        await this.goToStream();
        await this.runScript();
        console.log('watching');
        this.setReloadInterval();
    }
    async screenshot() {
        await this.page.screenshot();
    }
    getFlags() {
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
    async createBrowser() {
        const chromeFlags = this.getFlags();
        return await puppeteer.launch({
            args: chromeFlags,
            headless: this.headless,
            defaultViewport: this.viewPort,
            executablePath: 'google-chrome-unstable',
        });
    }
    async goToStream() {
        console.log('Going to: ' + this.streamURL);
        await this.page.goto(this.streamURL, {
            waitUntil: 'networkidle2',
            timeout: 180000,
        });
    }
    async runScript() {
        await this.page.waitForTimeout(3000);
        fs.readFile(Browser.scriptLocation, 'utf8', (err, data) => {
            if (err) {
                return console.log(err);
            }
            this.page.evaluate(data);
        });
    }
    setReloadInterval() {
        setInterval(() => {
            this.page.evaluate(() => {
                location.reload();
            });
        }, this.pageReloadTime);
    }
}
Browser.scriptLocation = '/script/browser-script.js';
//# sourceMappingURL=browser.js.map