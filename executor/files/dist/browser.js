import puppeteer from 'puppeteer';
import * as os from 'os';
import * as fs from 'fs';
export class Browser {
    static scriptLocation = '/script/browser-script.js';
    page;
    browser;
    viewPort = { width: 500, height: 500 };
    // chrome dev tools client
    client = null;
    maxDownloadSpeed = 1048576;
    maxUploadSpeed = 1048576;
    linkToGo;
    pageReloadTime;
    async run() {
        this.browser = await this.createBrowser();
        this.page = await this.browser.newPage();
        this.client = await this.page.target().createCDPSession();
        await this.setBandwidthLimit(this.maxDownloadSpeed, this.maxUploadSpeed);
        await this.goToStream();
        await this.runScript();
        console.log('watching');
        this.setReloadInterval();
    }
    // Set network bandwidth limit in bytes
    async setBandwidthLimit(downloadSpeed, uploadSpeed) {
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
    async screenshot() {
        await this.page.screenshot();
    }
    getFlags() {
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
    async createBrowser() {
        const chromeFlags = this.getFlags();
        return await puppeteer.launch({
            args: chromeFlags,
            headless: true,
            defaultViewport: this.viewPort,
            executablePath: 'google-chrome-unstable',
        });
    }
    async goToStream() {
        console.log('Going to: ' + this.linkToGo);
        await this.page.goto(this.linkToGo, {
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
//# sourceMappingURL=browser.js.map