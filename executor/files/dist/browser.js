import puppeteer from 'puppeteer';
import * as os from 'os';
import * as fs from 'fs';
export class Browser {
    static scriptLocation = '/script/browser-script.js';
    static customWokersLocation = './custom-workers/';
    page;
    browser;
    viewPort = { width: 500, height: 500 };
    // chrome dev tools client
    client = null;
    maxDownloadSpeed = 1048576;
    maxUploadSpeed = 1048576;
    customWorkers = new Map();
    linkToGo;
    pageReloadTime;
    async run() {
        this.browser = await this.createBrowser();
        this.page = await this.browser.newPage();
        this.client = await this.page.target().createCDPSession();
        await this.setBandwidthLimit(this.maxDownloadSpeed, this.maxUploadSpeed);
        this.setPageForWorkers();
        await this.customWorkersBeforeVisit();
        await this.goToLink();
        await this.runScript();
        await this.customWorkersAfterVisit();
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
    async customWorkerMessage(customWorker, message) {
        if (this.customWorkers.get(customWorker) !== undefined) {
            await this.customWorkers.get(customWorker).onMessage(message);
        }
    }
    async addCustomWorkers(customWorkers, socket) {
        for (let i = 0; i < customWorkers.length; i++) {
            try {
                const customWorker = await import(Browser.customWokersLocation + customWorkers[i] + '.js');
                this.customWorkers.set(customWorkers[i], new customWorker.default());
            }
            catch (error) {
                console.log(error);
                console.log('Could not load ' + customWorkers[i]);
                process.exit(1);
            }
            this.customWorkers.get(customWorkers[i]).setName(customWorkers[i]);
            this.customWorkers.get(customWorkers[i]).setBrowser(this.browser);
            this.customWorkers.get(customWorkers[i]).setSocket(socket);
        }
    }
    setPageForWorkers() {
        for (const worker of this.customWorkers.values()) {
            worker.setPage(this.page);
            worker.setClient(this.client);
        }
    }
    async customWorkersBeforeVisit() {
        for (const worker of this.customWorkers.values()) {
            if (worker.beforeLinkVisit !== undefined) {
                await worker.beforeLinkVisit();
            }
        }
    }
    async customWorkersAfterVisit() {
        for (const worker of this.customWorkers.values()) {
            if (worker.afterLinkVisit !== undefined) {
                await worker.afterLinkVisit();
            }
        }
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
    async goToLink() {
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