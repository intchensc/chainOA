package main

import (
	"encoding/json"
	"fmt"
	"github.com/hyperledger/fabric-chaincode-go/shim"
	"github.com/hyperledger/fabric-protos-go/peer"
)

type Record struct {
	Owner      string `json:"owner"`
	Department string `json:"department"`
	Content    string `json:"content"`
	Uploader   string `json:"uploader"`
	UploadTime string `json:"uploadTime"`
	Historys   []HistoryItem
}

type HistoryItem struct {
	TxId   string
	Record Record
}

type RecordChaincode struct {
}

func (t *RecordChaincode) Init(stub shim.ChaincodeStubInterface) peer.Response {
	fmt.Println(" ==== Init ====")

	return shim.Success(nil)
}

func (t *RecordChaincode) Invoke(stub shim.ChaincodeStubInterface) peer.Response {
	// 获取用户意图
	fun, args := stub.GetFunctionAndParameters()
	if fun == "CreateRecord" {
		return t.PutEdu(stub, args) // 添加信息
	} else if fun == "QueryRecord" {
		return t.QueryEduInfoByEntityID(stub, args) // 根据身份证号码及姓名查询详情
	}
	return shim.Error("指定的函数名称错误")

}

// 保存edu
// args: Record
func (t *RecordChaincode) PutEdu(stub shim.ChaincodeStubInterface, args []string) peer.Response {
	var record Record
	_ = json.Unmarshal([]byte(args[0]), &record)
	owner := record.Owner
	b, err := json.Marshal(record)
	if err != nil {
		return shim.Error("error")
	}

	err = stub.PutState(owner, b)
	if err != nil {
		return shim.Error("error")
	}
	return shim.Success(b)
}

// 根据身份证号码查询详情（溯源）
// args: entityID
func (t *RecordChaincode) QueryEduInfoByEntityID(stub shim.ChaincodeStubInterface, args []string) peer.Response {

	// 根据身份证号码查询edu状态
	b, err := stub.GetState(args[0])
	if err != nil {
		return shim.Error("query error")
	}

	if b == nil {
		return shim.Error("no result return")
	}

	// 对查询到的状态进行反序列化
	var edu Record
	err = json.Unmarshal(b, &edu)
	if err != nil {
		return shim.Error("反序列化edu信息失败")
	}

	// 获取历史变更数据
	iterator, err := stub.GetHistoryForKey(edu.Owner)
	if err != nil {
		return shim.Error("根据指定的身份证号码查询对应的历史变更数据失败")
	}
	defer iterator.Close()

	// 迭代处理
	var historys []HistoryItem
	var hisEdu Record
	for iterator.HasNext() {
		hisData, err := iterator.Next()
		if err != nil {
			return shim.Error("获取edu的历史变更数据失败")
		}

		var historyItem HistoryItem
		historyItem.TxId = hisData.TxId
		json.Unmarshal(hisData.Value, &hisEdu)

		if hisData.Value == nil {
			var empty Record
			historyItem.Record = empty
		} else {
			historyItem.Record = hisEdu
		}

		historys = append(historys, historyItem)

	}

	edu.Historys = historys

	// 返回
	result, err := json.Marshal(edu)
	if err != nil {
		return shim.Error("序列化edu信息时发生错误")
	}
	return shim.Success(result)
}

func main() {
	err := shim.Start(new(RecordChaincode))
	if err != nil {
		fmt.Printf("启动RecordChaincode时发生错误: %s", err)
	}
}
