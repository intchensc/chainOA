package ipfs

import (
	"fmt"
	shell "github.com/ipfs/go-ipfs-api"
	"os"
)

func UpToIpfs(string2 string) string {
	// Where your local node is running on localhost:5001

	r, err := os.Open(string2)
	sh := shell.NewShell("localhost:5001")
	cid, err := sh.Add(r)
	if err != nil {
		fmt.Fprintf(os.Stderr, "error: %s", err)
	}
	fmt.Printf("added %s", cid)
	return cid
}
