import { CustomWorker } from './custom-worker.js';
import * as fs from 'fs';
export default class CookieDispenser extends CustomWorker {
    cookieFile;
    cookieSet = false;
    async beforeLinkVisit() {
        this.sendMessage('getCookie');
        // will wait untill this.cookieFile is changed
        async function checkCookieFile() {
            if (this.cookieSet === false) {
                await new Promise((resolve) => {
                    setTimeout(resolve, 100);
                });
                await checkCookieFile();
            }
        }
        checkCookieFile();
    }
    async onMessage(message) {
        this.cookieFile = message.cookieFile;
        if (this.cookieFile == "") {
            this.cookieSet = true;
            console.log("Out of cookies");
            return;
        }
        const cookies = fs.readFileSync(this.cookieFile, 'utf8');
        const deserializedCookies = JSON.parse(cookies);
        await this.page.setCookie(...deserializedCookies);
        console.log("Cookie set to: " + this.cookieFile);
        this.cookieSet = true;
    }
}
//# sourceMappingURL=cookie-dispenser.js.map