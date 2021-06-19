# Documentation for users
### **`template-deployment.yaml`** and **`deployment.yaml`**
To change default file and folder locations there is a possibility to change them in `template-deployment.yaml` or `deployment.yaml` by changing path variable. 

### **`setup.sh`**
`setup.sh` has 3 arugments.  
`-h` or `--help` to show usage of `setup.sh`.  
`-b` or `--build` to build all docker images  
`-d` or `--deplotment` to generate deployment file.  
By default uses `-b -d`
### **`vpn_configs` and password on .ovpn file**
By default all openvpn configurations go to `vpn_configs` folder from root.  

If configuration file uses password you need to create a file with folloing format:
```
username
password
```

Then in `vpn-settings.json` link file to config as follows:
```
{
  "settings": [
    {"vpnSelector": "config-name", "passFile": "password file"}
  ]
}
```
* `vpnSelector` uses [go implemeantation of RE2 regexp](https://github.com/google/re2/wiki/Syntax) to select configurations for which password file is ment.
* `passFile` is password file name inside `vpn_configs`

Multiple configurations can be added.
##### Example:
```
k8s-scaling-watcher/
├─ vpn_configs/
│  ├─ config1.ovpn
│  ├─ de-config1.ovpn
│  ├─ de-password.txt
│  ├─ nl-config1.ovpn
│  ├─ nl-config2.ovpn
│  ├─ nl-password.txt
```

`config1.ovpn` has no password.\
`nl-config1.ovpn` and `nl-config2.ovpn` have same password stored in `nl-password.txt`\
and de-config1.ovpn has password that is stored in `de-password.txt`.\
Then `vpn-settings.json` should look like this:
```json
{
  "settings": [
    {"vpnSelector": "^(nl)", "passFile": "nl-password.txt"},
    {"vpnSelector": "^(de)", "passFile": "de-password.txt"}
  ]
}
```


### **`settings.json`**
* `linkToGo` _Type: string_  
Link that browsers will initially go to.
* `vpnPriorities` _Type: string[]_  
Will prioritise configurations that follow [go implemeantation of RE2 regexp](https://github.com/google/re2/wiki/Syntax) in same order as in array. If none are matched will pick a random configuration.
##### Example: 
```
"vpnPriorities": 
[^(de|fr|uk|nl|pl)",
  "^(ua|ru)"
]
```
Will first prioritise all files that start with `de`, `fr`, `uk`, `nl` or `pl`.  
After that will prioritise all files that start with `ua` or `ru`.  
At last wil chose random remaining file.
* `timeBetweenContainers` _Type: number_  
Is a delay between when containers will go to `linkToGo`
* `maxPingTime` _Type: number_  
Time before timeout of openvpn configuration in seconds.   
E.G. time to wait for openvpn connection to be created.
* `pageReloadTime` _Type: number_  
Will refresh page every `pageReloadTime` seconds.
* `maxDownloadSpeed` _Type: number_  
Maximum download speed. _This feature doesn't seem to be working correctly_
* `maxUploadSpeed` _Type: number_  
Maximum upload speed. _This feature doesn't seem to be working correctly_
* `ipLookupLink` _Type: string_  
Link to service that will give your public ip address. Needs to return plain text.


### **`browser-script.js`**
To execute js in browser when page is loaded you need to create `browser-script.js` in root folder by default.

### **`custom workers`**
When `browser-script.js` is not enough. A custom worker can be made. A custom worker has access to socket, page, client and browser. `cookie-dispensary` is an example of a custom worker (see [executor](/executor/files/custom-workers/cookie-dispenser.ts) and [controller](/controller/app/customworker/cookiedispenser.go)).\
To create a custom worker first create a file inside [`/controller/app/customworker`](/controller/app/customworker) it should have fallowing format:
``` go
package customworker

type Example struct {
	CustomWorker
}

func (c *Example) init() {
}

func (c *Example) OnMessage(message string, ip string) string {
}

func (c *Example) OnConnectionClose(ip string) {
}
```
Second register your custom worker by adding it to to [`/controller/app/customworker/customworker.go`](/controller/app/customworker/customworker.go) as follows:
``` go
func GetCustomWorkers() map[string]CustomWorker {
	var customWorkers map[string]CustomWorker = make(map[string]CustomWorker)
	customWorkers["cookie-dispenser"] = &CookieDispatcher{}
  customWorkers["example"] = &Example{}

	initCustomWorkers(customWorkers)
	return customWorkers
}
```
Name of custom worker is important as it needs to be same as `.ts` file in [`/executor/files/custom-workers`](/executor/files/custom-workers).
`CustomWorker` interface has following methods that need to be implemented:
* `init()` is run to initialize variables/state of `CustomWorker`. For example in [`/controller/app/customworker/cookiedispenser.go`](/controller/app/customworker/cookiedispenser.go) it is used to read all cookies.
* `OnMessage(message string, ip string) string` is run when custom worker receives a message. For example in [`/controller/app/customworker/cookiedispenser.go`](/controller/app/customworker/cookiedispenser.go) it is used to give executor cookie file when it asks for it.
  - `message`: message received from executer
  - `ip`: ip of executer of the message
  - Returns: message to executor. 

Third you need to create `.ts` file inside [`/executor/files/custom-workers`](/executor/files/custom-workers) with same name as registered in [`/controller/app/customworker/customworker.go`](/controller/app/customworker/customworker.go).
It should have following format:
``` ts
import { CustomWorker } from './custom-worker.js';

export default class Example extends CustomWorker {

}
```
`CustomWorker` has following methods and attributes:
* `browser` _Type: [puppeteer.Browser](https://github.com/puppeteer/puppeteer/blob/v10.0.0/docs/api.md#class-browser)_ \
Browser instance of chrome
* `page` _Type: [puppeteer.Page](https://github.com/puppeteer/puppeteer/blob/v10.0.0/docs/api.md#class-page)_ \
Page instance inside browser.
* `client` _Type: [puppeteer.CDPSession](https://github.com/puppeteer/puppeteer/blob/v10.0.0/docs/api.md#class-cdpsession)_ \
Client that talks to Chrome Devtools Protocol.
* static `customWorkersFoler` _Type: string_ \
  Path to custom-workers folder
* `sendMessage(message)` 
  - `message` _Type: string_ \
  Message to send to controller
  - returns: _Type: void_
* `beforeLinkVisit()` _Optional_\
Will be executed before the link is visited.
  - returns: _Type: Promise\<void>_
* `afterLinkVisit()` _Optional_\
Will be executed after the link is visited.
  - returns: _Type: Promise\<void>_
* `onMessage(message)` _Optional_\
Will be executed when there is a message from controller.
  - `message` _Type: Object_ \
  Message that is received from controller.
  - returns: _Type: Promise\<void>_

For example see: [`/executor/files/custom-workers/cookie-dispenser.ts`](/executor/files/custom-workers/cookie-dispenser.ts)