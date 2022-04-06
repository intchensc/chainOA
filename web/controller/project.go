package controller

import (
	"encoding/json"
	"fmt"
	"reflect"
	"team/chain"
	"time"

	"team/common/web"
	"team/model/project"
	"team/model/task"
	"team/model/user"
)

// Project controller
type Project int

// Register implements web.Controller interface.
func (p *Project) Register(group *web.Router) {
	group.POST("", p.create)
	group.GET("/mine", p.mine)
	group.DELETE("/:id", p.delete)

	group.GET("/:id", p.info)
	group.GET("/:id/summary", p.summary)
	group.PUT("/:id/desc", p.setDesc)
	group.PUT("/:id/name", p.rename)

	group.GET("/:id/invites", p.getInviteList)
	group.POST("/:id/member", p.addMember)
	group.PUT(`/:id/member/{uid:[\d]+}`, p.editMember)
	group.DELETE(`/:id/member/{uid:[\d]+}`, p.deleteMember)

	group.GET("/:id/milestone/list", p.getMilestones)
	group.POST("/:id/milestone", p.addMilestone)
	group.PUT(`/:id/milestone/{mid:[\d]+}`, p.editMilestone)
	group.DELETE(`/:id/milestone/{mid:[\d]+}`, p.delMilestone)

	group.GET(`/:id/week/{start:[\d]+}`, p.getWeekReport)

	//上传记录的API
	group.POST("/uploadRecord/:id", p.uploadRecord)
	group.GET("/getRecord", p.getRecord)
}

func (*Project) getRecord(c *web.Context) {
	account := user.Find(c.Session.Get("uid").(int64)).Account

	fmt.Printf("%q", account)

	//从超级账本取出数据
	network, err := chain.UseWalletGateway()
	if err != nil {
		fmt.Printf("Failed to get network: %v", err)
	}

	contract := network.GetContract("record")
	result, err := contract.SubmitTransaction("QueryRecord", account)
	if err != nil {
		fmt.Printf("Failed to commit transaction: %v", err)
	} else {
		fmt.Println("Commit is successful")
	}

	fmt.Println(reflect.TypeOf(result))
	fmt.Printf("The results is %v", result)

	c.JSON(200, web.Map{"data": string(result)})
}

func (*Project) uploadRecord(c *web.Context) {
	uid := c.Session.Get("uid").(int64)
	uploader := user.Find(uid)

	uid1 := c.RouteValue("id").MustInt("错的ID")
	owner := user.Find(uid1)

	department := c.PostFormValue("department").MustString("错的部门")
	content := c.PostFormValue("content").MustString("错的记录内容")
	uploadTime := time.Now().Format("2006-01-02")

	record := project.Record{
		owner.Account,
		department,
		content,
		uploader.Name,
		uploadTime,
	}

	jsonRecord, err := json.Marshal(record)

	fmt.Printf("%q", jsonRecord)

	//写入超级账本
	network, err := chain.UseWalletGateway()
	if err != nil {
		fmt.Printf("Failed to get network: %v", err)
	}

	contract := network.GetContract("record")
	result, err := contract.SubmitTransaction("CreateRecord", string(jsonRecord))
	if err != nil {
		fmt.Printf("Failed to commit transaction: %v", err)
	} else {
		fmt.Println("Commit is successful")
	}

	fmt.Println(reflect.TypeOf(result))
	fmt.Printf("The results is %v", result)

	c.JSON(200, web.Map{})
}

func (*Project) create(c *web.Context) {
	uid := c.Session.Get("uid").(int64)
	name := c.PostFormValue("name").MustString("非法项目名称")
	role, _ := c.PostFormValue("role").Int()

	web.AssertError(project.Add(name, uid, int8(role)))
	c.JSON(200, web.Map{})
}

func (*Project) mine(c *web.Context) {
	uid := c.Session.Get("uid").(int64)
	projs, err := project.GetAllByUser(uid)
	web.AssertError(err)
	c.JSON(200, web.Map{"data": projs})
}

func (*Project) delete(c *web.Context) {
	pid := c.RouteValue("id").MustInt("")
	project.Delete(pid)
	c.JSON(200, web.Map{})
}

func (*Project) info(c *web.Context) {
	pid := c.RouteValue("id").MustInt("")
	proj := project.Find(pid)
	web.Assert(proj != nil, "指定项目不存在或已被删除")

	c.JSON(200, web.Map{"data": proj.Info()})
}

func (*Project) summary(c *web.Context) {
	pid := c.RouteValue("id").MustInt("")
	proj := project.Find(pid)
	web.Assert(proj != nil, "指定项目不存在或已被删除")

	c.JSON(200, web.Map{"data": proj.Summary()})
}

func (*Project) setDesc(c *web.Context) {
	pid := c.RouteValue("id").MustInt("")
	desc := c.PostFormValue("desc").String()
	proj := project.Find(pid)
	web.Assert(proj != nil, "指定项目不存在或已被删除")
	web.AssertError(proj.SetDesc(desc))
	c.JSON(200, web.Map{})
}

func (*Project) rename(c *web.Context) {
	pid := c.RouteValue("id").MustInt("")
	name := c.PostFormValue("name").MustString("无效项目名")

	proj := project.Find(pid)
	web.Assert(proj != nil, "项目不存在或已被删除")

	proj.Name = name
	web.AssertError(proj.Save())
	c.JSON(200, web.Map{})
}

func (*Project) getInviteList(c *web.Context) {
	pid := c.RouteValue("id").MustInt("")
	proj := project.Find(pid)
	web.Assert(proj != nil, "项目不存在或已被删除")

	members := map[int64]bool{}
	for _, one := range proj.Members {
		members[one.UID] = true
	}

	users, err := user.GetAll()
	web.AssertError(err)

	invites := []*user.User{}
	for _, one := range users {
		if _, ok := members[one.ID]; !ok {
			invites = append(invites, one)
		}
	}

	c.JSON(200, web.Map{"data": invites})
}

func (*Project) addMember(c *web.Context) {
	pid := c.RouteValue("id").MustInt("")
	uid := c.PostFormValue("uid").MustInt("无效的用户ID")
	isAdmin, _ := c.PostFormValue("isAdmin").Bool()
	role := c.PostFormValue("role").MustInt("无效的职能")

	proj := project.Find(pid)
	web.Assert(proj != nil, "项目不存在或已被删除")

	for _, one := range proj.Members {
		if one.UID == uid {
			c.JSON(200, web.Map{})
			return
		}
	}

	u := user.Find(uid)
	web.Assert(u != nil && !u.IsLocked, "无效的成员ID")
	web.AssertError(proj.AddMember(uid, int8(role), isAdmin))

	c.JSON(200, web.Map{})
}

func (*Project) editMember(c *web.Context) {
	pid := c.RouteValue("id").MustInt("")
	uid := c.RouteValue("uid").MustInt("")
	role := c.PostFormValue("role").MustInt("无效的职能")
	isAdmin, _ := c.PostFormValue("isAdmin").Bool()

	proj := project.Find(pid)
	web.Assert(proj != nil, "项目不存在或已被删除")

	for _, one := range proj.Members {
		if uid == one.UID {
			one.Role = int8(role)
			one.IsAdmin = isAdmin
			web.AssertError(one.Save())
			c.JSON(200, web.Map{})
			return
		}
	}

	c.JSON(200, web.Map{"err": "成员不存在或已被删除"})
}

func (*Project) deleteMember(c *web.Context) {
	pid := c.RouteValue("id").MustInt("")
	uid := c.RouteValue("uid").MustInt("")

	proj := project.Find(pid)
	web.Assert(proj != nil, "项目不存在或已被删除")

	proj.DelMember(uid)
	c.JSON(200, web.Map{})
}

func (*Project) getMilestones(c *web.Context) {
	pid := c.RouteValue("id").MustInt("")

	proj := project.Find(pid)
	web.Assert(proj != nil, "项目不存在或已被删除")

	c.JSON(200, web.Map{"data": proj.GetMilestones()})
}

func (*Project) addMilestone(c *web.Context) {
	pid := c.RouteValue("id").MustInt("")
	name := c.PostFormValue("name").MustString("里程碑名不可为空")
	startTime, _ := time.Parse("2006-01-02", c.PostFormValue("startTime").MustString("开始时间不可为空"))
	endTime, _ := time.Parse("2006-01-02", c.PostFormValue("endTime").MustString("终止时间不可为空"))
	desc := c.PostFormValue("desc").String()

	proj := project.Find(pid)
	web.Assert(proj != nil, "项目不存在或已被删除")
	web.AssertError(proj.AddMilestone(name, desc, startTime, endTime))

	c.JSON(200, web.Map{})
}

func (*Project) editMilestone(c *web.Context) {
	pid := c.RouteValue("id").MustInt("")
	mid := c.RouteValue("mid").MustInt("")

	name := c.PostFormValue("name").MustString("里程碑名不可为空")
	startTime, _ := time.Parse("2006-01-02", c.PostFormValue("startTime").MustString("开始时间不可为空"))
	endTime, _ := time.Parse("2006-01-02", c.PostFormValue("endTime").MustString("终止时间不可为空"))
	desc := c.PostFormValue("desc").String()

	proj := project.Find(pid)
	web.Assert(proj != nil, "项目不存在或已被删除")
	web.AssertError(proj.EditMilestone(mid, name, desc, startTime, endTime))

	c.JSON(200, web.Map{})
}

func (*Project) delMilestone(c *web.Context) {
	pid := c.RouteValue("id").MustInt("")
	mid := c.RouteValue("mid").MustInt("")

	proj := project.Find(pid)
	web.Assert(proj != nil, "项目不存在或已被删除")

	proj.DelMilestone(mid)
	c.JSON(200, web.Map{})
}

func (*Project) getWeekReport(c *web.Context) {
	pid := c.RouteValue("id").MustInt("")
	start := c.RouteValue("start").MustInt("")

	proj := project.Find(pid)
	web.Assert(proj != nil, "项目不存在或已被删除")

	c.JSON(200, web.Map{"data": task.GetWeekReport(pid, start)})
}
