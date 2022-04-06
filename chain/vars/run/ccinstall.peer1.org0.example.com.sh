#!/bin/bash
# Script to install chaincode onto a peer node
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_ID=cli
export CORE_PEER_ADDRESS=192.168.1.107:7002
export CORE_PEER_TLS_ROOTCERT_FILE=/vars/keyfiles/peerOrganizations/org0.example.com/peers/peer1.org0.example.com/tls/ca.crt
export CORE_PEER_LOCALMSPID=org0-example-com
export CORE_PEER_MSPCONFIGPATH=/vars/keyfiles/peerOrganizations/org0.example.com/users/Admin@org0.example.com/msp
cd /go/src/github.com/chaincode/record

  go env -w GOPROXY=https://goproxy.cn,direct

if [ ! -f "record_go_1.0.tar.gz" ]; then
  cd go
  GO111MODULE=on
  go mod vendor
  cd -
  peer lifecycle chaincode package record_go_1.0.tar.gz \
    -p /go/src/github.com/chaincode/record/go/ \
    --lang golang --label record_1.0
fi

peer lifecycle chaincode install record_go_1.0.tar.gz
