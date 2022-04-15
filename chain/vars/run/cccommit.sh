#!/bin/bash
# Script to instantiate chaincode
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_ID=cli
export CORE_PEER_ADDRESS=192.168.1.107:7002
export CORE_PEER_TLS_ROOTCERT_FILE=/vars/keyfiles/peerOrganizations/org0.example.com/peers/peer1.org0.example.com/tls/ca.crt
export CORE_PEER_LOCALMSPID=org0-example-com
export CORE_PEER_MSPCONFIGPATH=/vars/keyfiles/peerOrganizations/org0.example.com/users/Admin@org0.example.com/msp
export ORDERER_ADDRESS=192.168.1.107:7004
export ORDERER_TLS_CA=/vars/keyfiles/ordererOrganizations/example.com/orderers/orderer1.example.com/tls/ca.crt
SID=$(peer lifecycle chaincode querycommitted -C mychannel -O json \
  | jq -r '.chaincode_definitions|.[]|select(.name=="contract")|.sequence' || true)

if [[ -z $SID ]]; then
  SEQUENCE=1
else
  SEQUENCE=$((1+$SID))
fi

peer lifecycle chaincode commit -o $ORDERER_ADDRESS --channelID mychannel \
  --name contract --version 1.0 --sequence $SEQUENCE \
  --peerAddresses 192.168.1.107:7002 \
  --tlsRootCertFiles /vars/keyfiles/peerOrganizations/org0.example.com/peers/peer1.org0.example.com/tls/ca.crt \
  --peerAddresses 192.168.1.107:7003 \
  --tlsRootCertFiles /vars/keyfiles/peerOrganizations/org1.example.com/peers/peer1.org1.example.com/tls/ca.crt \
  --init-required \
  --cafile $ORDERER_TLS_CA --tls
