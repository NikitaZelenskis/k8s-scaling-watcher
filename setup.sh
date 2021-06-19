#!/bin/bash

function build (){
  echo "Building controller image...."
  docker build controller -t vpncontroller
  echo "Building executor image..."
  docker build executor -t openvpnclient
  echo "Done building images."
}

function generate_deployment (){
  echo "Generating deployment file..."
  #check for wsl
  distro=$(uname -a)
  if echo ${distro,,} | grep -q microsoft ; then
    sed "s|{{PATH-TO-CHANGE}}|/run/desktop/mnt/host${PWD:4}|g" template-deployment.yaml > deployment.yaml
  else
    sed "s|{{PATH-TO-CHANGE}}|${PWD}|g" template-deployment.yaml > deployment.yaml
  fi
  echo "Done generating deployment file."
} 

function show_usage (){
  echo "Usage: $0 [options...]. Default: $0 -b -d"
  echo "Options:"
  echo "-h|--help, Print help"
  echo "-b|--build, Build docker images"
  echo "-d|--deplotment, Generate deployment file for kubernetes"
}

function check_docker (){
  $(docker > /dev/null 2>&1)
  docker_exit_code=$?
  if [[ docker_exit_code -eq 127 ]];then
    echo "Docker not found. Please make sure docker is installed"
    exit 127
  elif [[ docker_exit_code -eq 1 ]]; then
    echo "Docker not enabled."
    exit 1
  fi
}

function create_empty_files (){
  mkdir vpn_configs > /dev/null 2>&1
  mkdir custom-workers/cookie-dispensary > /dev/null 2>&1
  touch browser-script.js
  if [[ !  (-f vpn-settings.json) ]];then
    touch vpn-settings.json
    echo "{\"settings\": []}" > vpn-settings.json 
  fi
}

create_empty_files
check_docker

if [[ -z "$1" ]];then
  build
  generate_deployment
  exit 0
fi

#process all arguments
while [ ! -z "$1" ]; do
  if [[ "$1" == "--help" ]] || [[ "$1" == "-h"  ]];then
    show_usage
  elif [[ "$1" == "--build" ]] || [[ "$1" == "-b"  ]];then
    build
    shift
  elif [[ "$1" == "--deplotment" ]] || [[ "$1" == "-d" ]];then
    generate_deployment
    shift
  else
    echo "Incorrect input provided"
    show_usage
  fi
shift
done

