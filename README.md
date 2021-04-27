## Goal
This is a stress testing tool and can be used for other testing purposes. 
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

2. Create folder **`vpn_configs`** and put all **.ovpn** file in there. If they have password put username and pass in **`pass.txt`** as follows:
```
username
password
```

3. Change **linkToGo** and other settings in **`settings.json`**

4. In root directory create file **`browser-script.js`**  
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
