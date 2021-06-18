import { CustomWorker } from './custom-worker.js';
const fs = require('fs');

export class CookieDispenser extends CustomWorker{
  private cookieFile: string = null;

  public async beforeLinkVisit() : Promise<void>{
    this.sendMessage('getCookie');

    //will wait untill this.cookieFile is changed
    async function checkCookieFile(){
      if(this.cookieFile === null){
        await new Promise((resolve) => {
          setTimeout(resolve, 100);
        });
        await checkCookieFile();
      }
    }
    checkCookieFile();
    
  }

  public async onMessage(message: any) : Promise<void>{
    this.cookieFile = message.cookieFile;
    const cookies = fs.readFileSync(this.cookieFile, 'utf8');

    const deserializedCookies = JSON.parse(cookies);
    await this.page.setCookie(...deserializedCookies);
  }
}