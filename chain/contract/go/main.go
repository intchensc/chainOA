/*
SPDX-License-Identifier: Apache-2.0
*/

package main

import (
	"encoding/json"
	"fmt"
	"github.com/hyperledger/fabric-contract-api-go/contractapi"
)

// SmartContract provides functions for managing a record
type SmartContract struct {
	contractapi.Contract
}

// record describes basic details of what makes up a record
type Contract struct {
	Title      string `json:"title"`
	Jiafang string `json:"jiafang"`
	Yifang    string `json:"yifang"`
	LocalPath   string `json:"localPath"`
	IpfsPath string `json:"ipfsPath"`
	Time string `json:"time"`
}


// Createrecord adds a new record to the world state with given details
func (s *SmartContract) CreateContract(ctx contractapi.TransactionContextInterface, title string, jiafang string, yifang string, localpath string, ipfspath string, time string) error {
	contract := Contract{
		Title: title,
		Jiafang: jiafang,
		Yifang: yifang,
		LocalPath: localpath,
		IpfsPath: ipfspath,
		Time: time,
	}

	recordAsBytes, _ := json.Marshal(contract)

	return ctx.GetStub().PutState(ipfspath, recordAsBytes)
}

// Queryrecord returns the record stored in the world state with given id
func (s *SmartContract) QueryContract(ctx contractapi.TransactionContextInterface, ipfspath string) (*Contract, error) {
	recordAsBytes, err := ctx.GetStub().GetState(ipfspath)

	if err != nil {
		return nil, fmt.Errorf("Failed to read from world state. %s", err.Error())
	}

	if recordAsBytes == nil {
		return nil, fmt.Errorf("%s does not exist", ipfspath)
	}

	contract := new(Contract)
	_ = json.Unmarshal(recordAsBytes, contract)

	return contract, nil
}



func main() {

	chaincode, err := contractapi.NewChaincode(new(SmartContract))

	if err != nil {
		fmt.Printf("Error create fabrecord chaincode: %s", err.Error())
		return
	}

	if err := chaincode.Start(); err != nil {
		fmt.Printf("Error starting fabrecord chaincode: %s", err.Error())
	}
}
