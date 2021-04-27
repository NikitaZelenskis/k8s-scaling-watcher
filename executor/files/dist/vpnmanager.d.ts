import { Browser } from './browser';
export declare class VPNManager {
    private ipLookupLink;
    private controllerLink;
    private hostIp;
    private configFile;
    private openVPNProc;
    private socket;
    private browser;
    private maxPingTime;
    constructor(browser: Browser);
    run(): Promise<this>;
    private onSocketMessage;
    private messageSettings;
    private messageConfigFile;
    private lookupIp;
    private waitForController;
    private sleep;
    private startOpenVPN;
    private waitForIpChange;
}
