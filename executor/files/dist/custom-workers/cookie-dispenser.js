import { CustomWorker } from './custom-worker.js';
import * as fs from 'fs';
export default class CookieDispenser extends CustomWorker {
    static cookiesFolder = CustomWorker.customWorkersFoler + 'cookie-dispensary/';
    cookieFile;
    cookieSet = false;
    async beforeLinkVisit() {
        this.sendMessage('getCookie');
        // will wait untill this.cookieFile is changed
        const vm = this;
        async function checkCookieFile() {
            if (vm.cookieSet === false) {
                await new Promise((resolve) => {
                    setTimeout(resolve, 100);
                });
                await checkCookieFile();
            }
        }
        await checkCookieFile();
    }
    async onMessage(message) {
        this.cookieFile = message;
        if (this.cookieFile === '') {
            this.cookieSet = true;
            console.log('Out of cookies');
            return;
        }
        const cookies = fs.readFileSync(CookieDispenser.cookiesFolder + this.cookieFile, 'utf8');
        const deserializedCookies = JSON.parse(cookies);
        await this.page.setCookie(...deserializedCookies);
        console.log('Cookie set to: ' + this.cookieFile);
        this.cookieSet = true;
    }
}
//# sourceMappingURL=cookie-dispenser.js.map