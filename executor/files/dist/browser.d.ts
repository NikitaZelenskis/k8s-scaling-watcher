export declare class Browser {
    private page;
    private browser;
    streamURL: string;
    private viewPort;
    private headless;
    pageReloadTime: number;
    run(): Promise<void>;
    screenshot(): Promise<void>;
    private getFlags;
    private createBrowser;
    private goToStream;
    private runScript;
    private setReloadInterval;
}
