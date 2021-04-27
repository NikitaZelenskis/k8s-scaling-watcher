import axios from 'axios';
import { spawn, ChildProcess } from 'child_process';
import WebSocket from 'ws';
import { Browser } from './browser.js';

export class VPNManager {
  static configsFolder = '/vpn_configs/';
  static passwordsFile = '/vpn/pass.txt';
  private ipLookupLink = 'https://api.my-ip.io/ip';
  private controllerLink = 'controller';
  private hostIp: string;
  private configFile: string;
  private openVPNProc: ChildProcess;
  private socket: WebSocket;
  private browser: Browser;
  private maxPingTime: number;

  constructor(browser: Browser) {
    this.browser = browser;
  }

  public async run(): Promise<VPNManager> {
    this.hostIp = await this.lookupIp();
    await this.waitForController();
    this.socket = new WebSocket('ws://' + this.controllerLink + '/ws');

    this.socket.onclose = () => {
      console.log('Connection is closed. Exiting...');
      process.exit(1);
    };

    this.socket.onopen = () => {
      console.log('Successfully Connected to socket');
      this.socket.send('getSettings');
    };

    this.socket.onmessage = async (msg: WebSocket.MessageEvent) => {
      this.onSocketMessage(msg);
    };
    return this;
  }

  private async onSocketMessage(msg: WebSocket.MessageEvent) {
    const message = JSON.parse(msg.data.toString());
    if (message.waitFor !== undefined) {
      this.messageSettings(message);
    } else if (message.configFile !== undefined) {
      this.messageConfigFile(message);
    }
  }

  private async messageSettings(message) {
    const sleepTime = message.waitFor * 1000;
    this.maxPingTime = message.maxPingTime;
    this.browser.pageReloadTime = message.pageReloadTime * 1000;
    this.browser.streamURL = message.linkToGo;
    console.log('Sleeping for: ' + message.waitFor);
    await this.sleep(sleepTime);
    this.socket.send('getConfig');
  }

  private async messageConfigFile(message) {
    if (message.configFile === 'none') {
      console.log('All configuration files are taken');
      process.exit(1);
    } else {
      this.configFile = message.configFile;
      this.startOpenVPN(message.configFile);
      if (await this.waitForIpChange()) {
        await this.browser.run();
      } else {
        console.log("Couldn't connect to VPN");
        this.openVPNProc.kill('SIGINT');
        this.socket.send('getConfig');
      }
    }
  }

  private async lookupIp(): Promise<string> {
    return (await axios.get(this.ipLookupLink, { timeout: 10000 })).data
  }

  // recursive function that waits for connection to controller
  private async waitForController() {
    const vm = this;
    let response = null;

    console.log('Waiting for controller');

    async function pinger() {
      // recursive function that waits for controller connection
      try {
        response = await axios.get('http://' + vm.controllerLink + '/ping');
        if (response.data !== 'Pong') {
          throw 'Wrong response. WHAAAT?';
        }
      } catch (error) {
        await vm.sleep(1000);
        await pinger();
      }
    }
    await pinger();
    console.log('Controller is running');
  }

  private sleep(ms: number) {
    return new Promise((resolve) => {
      setTimeout(resolve, ms);
    });
  }

  private startOpenVPN(configFile: string) {
    
    console.log('Using ' + configFile + ' config file');
    const args = [
      '--route',
      '10.0.0.0',
      '255.0.0.0',
      'net_gateway', // ignore ips in that range
      '--config',
      VPNManager.configsFolder + configFile, // use configfile
      '--auth-user-pass',
      VPNManager.passwordsFile, // password for config
      '--daemon',
    ];
    console.log('Starting up openvpn');
    this.openVPNProc = spawn('openvpn', args);
  }

  private async waitForIpChange(): Promise<boolean> {
    const vm = this;
    let pingCount = 0;
    console.log('Waiting for ip to change');
    console.log('Current ip: ' + this.hostIp);
    async function pinger() {
      if ((await vm.lookupIp()) === vm.hostIp) {
        pingCount++;
        if (pingCount <= vm.maxPingTime) {
          await pinger();
        } else {
          return false;
        }
        console.log('Connecting...');
        await vm.sleep(1000);
      }
    }
    try {
      await pinger();
    } catch {
      return false;
    }
    console.log('My ip is: ' + (await vm.lookupIp()));
    return true;
  }
}
