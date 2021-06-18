import { Browser } from '../browser.js';
import puppeteer, { Page } from 'puppeteer';
export interface CustomWorker {
  beforeLinkVisit?(): Promise<void>;
  afterLinkVisit?(): Promise<void>;
  onMessage?(message: any): Promise<void>;
}

export class CustomWorker {
  protected name: string;
  protected browser: Browser;
  protected page: Page;
  protected client: puppeteer.CDPSession;
  private socket: WebSocket;

  public setBrowser(browser: Browser): void {
    this.browser = browser;
  }
  public setPage(page: Page): void {
    this.page = page;
  }
  public setClient(client: puppeteer.CDPSession): void {
    this.client = client;
  }
  public setSocket(socket: WebSocket): void {
    this.socket = socket;
  }

  public setName(name: string): void {
    this.name = name;
  }
  protected sendMessage(message: string): void {
    this.socket.send('CustomWorker:' + this.name + ',' + message);
  }
}
