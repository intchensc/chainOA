package chain

import (
	"fmt"
	"github.com/hyperledger/fabric-sdk-go/pkg/core/config"
	"github.com/hyperledger/fabric-sdk-go/pkg/gateway"
	"os"
)

const (
	ccID      = "contract"
	channelID = "mychannel"
	orgName   = "org1.example.com"
	orgAdmin  = "Admin"
)

/*
To run this app, make sure that one of the wallet files such as Admin.id from
vars/profiles/vscode/wallets directory is copied onto ./wallets directory,
then this example code will use the wallet file and connection file to make
connections to Fabric network
*/
func UseWalletGateway() (*gateway.Network, error) {
	wallet, err := gateway.NewFileSystemWallet("chain/wallets")
	if err != nil {
		fmt.Printf("Failed to create wallet: %s\n", err)
		os.Exit(1)
	}

	if !wallet.Exists("Admin") {
		fmt.Println("Failed to get Admin from wallet")
		os.Exit(1)
	}

	gw, err := gateway.Connect(
		gateway.WithConfig(config.FromFile("chain/connection.json")),
		gateway.WithIdentity(wallet, "Admin"),
	)

	if err != nil {
		fmt.Printf("Failed to connect: %v", err)
	}

	if gw == nil {
		fmt.Println("Failed to create gateway")
	}

	return gw.GetNetwork("mychannel")
}
