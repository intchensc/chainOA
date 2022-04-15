package share

import (
	"fmt"
	"os"
	"strconv"
	"time"

	"team/common/orm"
	"team/model/user"
)

type (
	// Share schema
	Share struct {
		ID      int64     `json:"id"`
		Name    string    `json:"name" orm:"type=VARCHAR(128),notnull"`
		Path    string    `json:"url" orm:"type=VARCHAR(128),notnull"`
		Jiafang int64     `json:"jiafang"`
		Yifang  int64     `json:"yifang"`
		Time    time.Time `json:"time" orm:"default=CURRENT_TIMESTAMP"`
		Ipfs    string    `json:"ipfs" orm:"type=VARCHAR(128)"`
	}
)

func SetIPFS(string2 string, id int64) error {
	//rows, err := orm.Query("SELECT * FROM `share` WHERE path=\"" + path + "\"")
	fmt.Println("IDDDDD:", id)
	file := &Share{ID: id}
	err := orm.Read(file)
	if err != nil {
		fmt.Println("选择更新出错", err)
	}
	file.Ipfs = string2
	err = orm.Update(file)
	if err != nil {
		fmt.Println("更新数据出错")
	}
	//fmt.Printf("rows:%q\n\n\n", rows)
	//defer rows.Close()
	//for rows.Next() {
	//	one := &Share{}
	//	if err = orm.Scan(rows, one); err != nil {
	//		return err
	//	}
	//	one.Ipfs = string2
	//	fmt.Println("one--->>>>>", one)
	//	err := orm.Update(one)
	//	if err != nil {
	//		fmt.Println(err)
	//		return err
	//	}
	//}
	return nil
}

// GetAll returns all shared files.
func GetAll(uid int64) ([]map[string]interface{}, error) {
	suid := strconv.FormatInt(uid, 10)

	rows, err := orm.Query("SELECT * FROM `share` WHERE jiafang=" + suid + " OR yifang=" + suid)
	if err != nil {
		return nil, err
	}
	fmt.Printf("rows:%q\n\n\n", rows)
	defer rows.Close()

	list := []map[string]interface{}{}
	for rows.Next() {
		one := &Share{}
		if err = orm.Scan(rows, one); err != nil {
			return nil, err
		}

		jiafang, _ := user.FindInfo(one.Jiafang)
		yifang, _ := user.FindInfo(one.Yifang)

		list = append(list, map[string]interface{}{
			"id":      one.ID,
			"name":    one.Name,
			"url":     one.Path,
			"jiafang": jiafang,
			"yifang":  yifang,
			"time":    one.Time.Format("2006-01-02 15:04:05"),
			"ipfs":    one.Ipfs,
		})
	}
	fmt.Printf("The 1 is %v", list)

	return list, nil
}

// Find shared file info by ID.
func Find(ID int64) (*Share, error) {
	file := &Share{ID: ID}
	err := orm.Read(file)
	return file, err
}

// 将文件地址保存到数据库
func Add(name, url string, jiafang, yifang int64, ipfs string) error {
	_, err := orm.Insert(&Share{
		Name:    name,
		Path:    url,
		Jiafang: jiafang,
		Yifang:  yifang,
		Time:    time.Now(),
		Ipfs:    ipfs,
	})

	return err
}

// Delete a shared file.
func Delete(ID int64) {
	file := &Share{ID: ID}
	err := orm.Read(file)
	if err == nil {
		os.Remove("." + file.Path)
		orm.Delete("share", ID)
	}
}
