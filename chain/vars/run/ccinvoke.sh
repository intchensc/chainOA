#!/bin/bash
# Script to invoke chaincode
export CORE_PEER_TLS_ENABLED=true
export CORE_PEER_ID=cli
export CORE_PEER_ADDRESS=192.168.1.107:7002
export CORE_PEER_TLS_ROOTCERT_FILE=/vars/keyfiles/peerOrganizations/org0.example.com/peers/peer1.org0.example.com/tls/ca.crt
export CORE_PEER_LOCALMSPID=org0-example-com
export CORE_PEER_MSPCONFIGPATH=/vars/keyfiles/peerOrganizations/org0.example.com/users/Admin@org0.example.com/msp
export ORDERER_ADDRESS=192.168.1.107:7004
export ORDERER_TLS_CA=/vars/keyfiles/ordererOrganizations/example.com/orderers/orderer1.example.com/tls/ca.crt
peer chaincode invoke -o $ORDERER_ADDRESS --cafile $ORDERER_TLS_CA \
  --tls -C mychannel -n record  \
  --peerAddresses 192.168.1.107:7002 \
  --tlsRootCertFiles /vars/discover/mychannel/org0-example-com/tlscert \
  --peerAddresses 192.168.1.107:7003 \
  --tlsRootCertFiles /vars/discover/mychannel/org1-example-com/tlscert \
  -c '{"Args":["QueryRecord","Jack"]}'
