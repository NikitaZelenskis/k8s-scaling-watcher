## Goal
This is a web stress testing tool and can be used for other testing purposes. 
It can be hard to test your web application because of security and/or other reasons. This tool allows to bypass most if not all of security features.
This is done by creating containers with vpn and browsers that go to specified link and execude specified js code.

## Warning
This tool is really slow and uses a LOT of memory.
Please use this tool only as last resort if everything else fails

## Before setup
### Linux
 * Install [Docker](https://docs.docker.com/engine/install/)
 * Install [Kubernetes](https://kubernetes.io/docs/tasks/tools/install-kubectl/) (and optionally [kubeadm](https://kubernetes.io/docs/setup/production-environment/tools/kubeadm/install-kubeadm/))
### Windows
 * Make sure WSL 2 is installed and enabled. More info [here](https://docs.microsoft.com/en-us/windows/wsl/install-win10)
 * Install [Docker](https://docs.docker.com/docker-for-windows/install/). Easiest option is to install [Docker Desktop for Windows](https://hub.docker.com/editions/community/docker-ce-desktop-windows/)

## Setup
1. Run setup.sh.
```bash
./setup.sh
```
This wil generate 2 docker images and deployment file for kubernetes.

2. Put all **.ovpn** files in to **`vpn_configs`** folder.\
If configs have passwords create a file inside **`vpn_configs`** with username and password as follows:
```
username
password
```
Then link config files to password inside **`vpn-settings.json`**. See [user documentation](../master/docs/USER_DOCS.md#vpn_configs-and-password-on-ovpn-file) for more detaild explanation.

3. Change **linkToGo** and other settings in **`settings.json`**

4. Change **`browser-script.js`** with script you want to run.\  
Everything in browser-script.js will be executed when the browser page is loaded.

## Usage
1. Run deployments and services from file
```bash
kubectl apply -f deployment.yaml
```
deployment.yaml by default has 5 replicas of executors

2. Rescale container count
```bash
kubectl scale deployments/executor --replicas=5
```
Or send POST request to `http://controller/replicas` with `{'amount': 5}`

### Remove all containers
```bash
kubectl delete -f deployment.yaml
```

## Project structure and other docs
For contributing or making your own changes see [project structure](../master/dev/PROJECT_STRUCTURE.md).  
For documentation see [user documentation](../master/docs/USER_DOCS.md).
