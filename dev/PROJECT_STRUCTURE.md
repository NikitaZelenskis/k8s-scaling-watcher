# Project Structure
### Coding style
For js all rules are defined in [`.eslintrc.cjs`](/executor/files/.eslintrc.cjs).
Run `npm run eslint` to view all formating errors.
Run `npm run eslint-fix` to automatically format all files.

### Kubernetes
Kuberenetes is used as container orchestrator for this project.

### [**`template-deployment.yaml`**](/template-deployment.yaml) and [**`setup.sh`**](/setup.sh)
Kubernetes does not have relative paths thus there exists [`setup.sh`](/setup.sh) that generates deployment from [`template-deployment.yaml`](/template-deployment.yaml) with relative paths.  
[`setup.sh`](/setup.sh) is also used to execute boilerplate setup code.

### **`executor`**
Inside executor folder there is Dockerfile which creates container with puppeteer and openvpn.
[`executor/files`](/executor/files/) contains all files that are used to create executor container. All code in [`executor/files`](/executor/files/) is in TypeScript (TS) and is compiled into folder [`executor/files/dist`](/executor/files/dist). 
### **`controller`**
Controller is made from standard go image. Then application is build and run.
Controller application is a webserver used to communicate between executor containers and to keep track which executor container uses which vpn configuration.
[`controller/app`](/controller/app) has all files for creating container image.  
[`controller/app/httphandler`](/controller/app/httphandler/httphandler.go) creates and handles all connections from other containers using websocket. Also stores all settings from [`settings.json`](/settings.json) and `vpn-settings.json`
[`controller/app/confighandler`](/controller/app/confighandler/confighandler.go) keeps track which executor container uses which vpn configuration.
### [**`settings.json`**](/settings.json) stores all initial settings for controller and executor. 

### **`custom-workers`** 
If user wants to run a custom script accessing socket, page, client and/or browser. This could be done via custom worker.
`custom-workers` contains all files that will be accesible to custom-workers.
[`controller/app/customworker`](/controller/app/customworker) conatins all controllers custom workers.
[`executor/files/custom-workers`](/executor/files/custom-workers) contains all controllers custom workers.
For more details see [user documentation](/docs/USER_DOCS.md#custom-workers)
