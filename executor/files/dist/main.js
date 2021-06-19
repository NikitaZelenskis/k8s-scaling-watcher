import { Browser } from './browser.js';
import { VPNManager } from './vpnmanager.js';
(async () => {
    const browser = new Browser();
    const vpnManager = new VPNManager(browser);
    await vpnManager.run();
})();
//# sourceMappingURL=main.js.map