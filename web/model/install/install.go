package install

import (
	"crypto/md5"
	"fmt"

	"team/common/orm"
	"team/model/document"
	"team/model/notice"
	"team/model/project"
	"team/model/share"
	"team/model/task"
	"team/model/user"
)

// Status of mysql database installation.
type Status struct {
	Done    bool     `json:"done"`
	IsError bool     `json:"isError"`
	Status  []string `json:"status"`
}

// Job to create tables.
type Job struct {
	Table  string
	Schema interface{}
}

// Run mysql database installation.
func Run(db string, status *Status) {
	err := orm.OpenDB("mysql", db)
	if err != nil {
		status.IsError = true
		status.Status = append(status.Status, "无法连接数据："+err.Error())
		return
	}

	jobs := []Job{
		{Table: "user", Schema: &user.User{}},
		{Table: "notice", Schema: &notice.Notice{}},
		{Table: "project", Schema: &project.Project{}},
		{Table: "project milestone", Schema: &project.Milestone{}},
		{Table: "project member", Schema: &project.Member{}},
		{Table: "task", Schema: &task.Task{}},
		{Table: "task attachment", Schema: &task.Attachment{}},
		{Table: "task event", Schema: &task.Event{}},
		{Table: "task comment", Schema: &task.Comment{}},
		{Table: "document", Schema: &document.Document{}},
		{Table: "share", Schema: &share.Share{}},
	}

	for _, job := range jobs {
		status.Status = append(status.Status, "创建数据表: "+job.Table)

		err = orm.CreateTable(job.Schema)
		if err != nil {
			status.IsError = true
			status.Status = append(status.Status, "出错了："+err.Error())
			return
		}
	}

	status.Done = true
	status.Status = append(status.Status, "应用配置完成!")
}

// AddDefaultAdmin insert a user into database as default admin account.
func AddDefaultAdmin(account, name, pswd string) error {
	hash := md5.New()
	hash.Write([]byte(pswd))

	user := &user.User{
		Account:   account,
		Name:      name,
		Password:  fmt.Sprintf("%X", hash.Sum(nil)),
		IsBuildin: true,
		IsSu:      true,
	}

	_, err := orm.Insert(user)
	return err
}
