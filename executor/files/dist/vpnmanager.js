import axios from 'axios';
import { spawn } from 'child_process';
import WebSocket from 'ws';
export class VPNManager {
    constructor(browser) {
        this.ipLookupLink = 'https://api.my-ip.io/ip';
        this.controllerLink = 'controller';
        this.browser = browser;
    }
    async run() {
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
        this.socket.onmessage = async (msg) => {
            this.onSocketMessage(msg);
        };
        return this;
    }
    async onSocketMessage(msg) {
        const message = JSON.parse(msg.data.toString());
        if (message.waitFor !== undefined) {
            this.messageSettings(message);
        }
        else if (message.configFile !== undefined) {
            this.messageConfigFile(message);
        }
    }
    async messageSettings(message) {
        const sleepTime = message.waitFor * 1000;
        this.maxPingTime = message.maxPingTime;
        this.browser.pageReloadTime = message.pageReloadTime * 1000;
        this.browser.streamURL = message.linkToGo;
        console.log('Sleeping for: ' + message.waitFor);
        await this.sleep(sleepTime);
        this.socket.send('getConfig');
    }
    async messageConfigFile(message) {
        if (message.configFile === 'none') {
            console.log('All configuration files are taken');
            process.exit(1);
        }
        else {
            this.configFile = message.configFile;
            this.startOpenVPN(message.configFile);
            if (await this.waitForIpChange()) {
                await this.browser.run();
            }
            else {
                console.log("Couldn't connect to VPN");
                this.openVPNProc.kill('SIGINT');
                this.socket.send('getConfig');
            }
        }
    }
    async lookupIp() {
        return (await axios.get(this.ipLookupLink, { timeout: 10000 })).data;
    }
    // recursive function that waits for connection to controller
    async waitForController() {
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
            }
            catch (error) {
                await vm.sleep(1000);
                await pinger();
            }
        }
        await pinger();
        console.log('Controller is running');
    }
    sleep(ms) {
        return new Promise((resolve) => {
            setTimeout(resolve, ms);
        });
    }
    startOpenVPN(configFile) {
        console.log('Using ' + configFile + ' config file');
        const args = [
            '--route',
            '10.0.0.0',
            '255.0.0.0',
            'net_gateway',
            '--config',
            VPNManager.configsFolder + configFile,
            '--auth-user-pass',
            VPNManager.passwordsFile,
            '--daemon',
        ];
        console.log('Starting up openvpn');
        this.openVPNProc = spawn('openvpn', args);
    }
    async waitForIpChange() {
        const vm = this;
        let pingCount = 0;
        console.log('Waiting for ip to change');
        console.log('Current ip: ' + this.hostIp);
        async function pinger() {
            if ((await vm.lookupIp()) === vm.hostIp) {
                pingCount++;
                if (pingCount <= vm.maxPingTime) {
                    await pinger();
                }
                else {
                    return false;
                }
                console.log('Connecting...');
                await vm.sleep(1000);
            }
        }
        try {
            await pinger();
        }
        catch {
            return false;
        }
        console.log('My ip is: ' + (await vm.lookupIp()));
        return true;
    }
}
VPNManager.configsFolder = '/vpn_configs/';
VPNManager.passwordsFile = '/vpn/pass.txt';
//# sourceMappingURL=vpnmanager.js.map