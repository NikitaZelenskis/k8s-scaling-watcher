# Documentation for users
#### **`template-deployment.yaml`** and **`deployment.yaml`**
To change default file and folder locations there is a possibility to change them in `template-deployment.yaml` or `deployment.yaml` by changing path variable. 

#### **`setup.sh`**
`setup.sh` has 3 arugments.  
`-h` or `--help` to show usage of `setup.sh`.  
`-b` or `--build` to build all docker images  
`-d` or `--deplotment` to generate deployment file.  
By default uses `-b -d`
#### **`vpn_configs` and `pass.txt`**
By default all openvpn configurations go to `vpn_configs` folder from root.  
If configuration files use password they will use `pass.txt` folder from root by default in following format:
```
username
password
```
#### **`settings.json`**
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

#### **`browser-script.js`**
To execute js in browser when page is loaded you need to create `browser-script.js` in root folder by default.
