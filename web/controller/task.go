package controller

import (
	"strconv"
	"time"

	"team/common/web"
	"team/model/project"
	"team/model/task"
	"team/model/user"
)

// Task controller
type Task int

// Register implements web.Controller interface.
func (t *Task) Register(group *web.Router) {
	group.GET("/mine", t.mine)
	group.GET("/project/:id", t.project)
	group.GET("/milestone/:id", t.milestone)

	group.GET("/:id", t.info)
	group.DELETE("/:id", t.delete)
	group.POST("", t.create)
	group.POST("/:id/back", t.moveBack)
	group.POST("/:id/next", t.moveNext)

	group.PUT("/:id/name", t.setName)
	group.PUT("/:id/creator", t.setCreator)
	group.PUT("/:id/developer", t.setDeveloper)
	group.PUT("/:id/tester", t.setTester)
	group.PUT("/:id/weight", t.setWeight)
	group.PUT("/:id/time", t.setTime)
	group.PUT("/:id/content", t.setContent)
	group.PUT("/:id/status", t.setStatus)
	group.POST("/:id/comment", t.addComment)
}

func (*Task) mine(c *web.Context) {
	uid := c.Session.Get("uid").(int64)

	list, err := task.GetAllByUID(uid)
	web.AssertError(err)

	c.JSON(200, web.Map{"data": list})
}

func (*Task) project(c *web.Context) {
	pid := c.RouteValue("id").MustInt("")

	proj := project.Find(pid)
	web.Assert(proj != nil, "项目不存在或已删除")

	list, err := task.GetAllByPID(pid)
	web.AssertError(err)

	c.JSON(200, web.Map{"data": list})
}

func (*Task) milestone(c *web.Context) {
	mid := c.RouteValue("id").MustInt("")
	list, err := task.GetAllByMID(mid)
	web.AssertError(err)
	c.JSON(200, web.Map{"data": list})
}

func (*Task) create(c *web.Context) {
	name := c.PostFormValue("name").MustString("任务名不可空")
	pid := c.PostFormValue("pid").MustInt("无效的项目ID")
	mid := c.PostFormValue("mid").MustInt("无效的分支")
	weight := c.PostFormValue("weight").MustInt("无效的优先级")
	cid, _ := c.PostFormValue("creator").Int()
	did := c.PostFormValue("developer").MustInt("开发人员未指定")
	tid := c.PostFormValue("tester").MustInt("测试人员未指定")
	startTime, _ := time.Parse("2006-01-02", c.PostFormValue("startTime").MustString("开始时间未指定"))
	endTime, _ := time.Parse("2006-01-02", c.PostFormValue("endTime").MustString("结束时间未指定"))
	content := c.PostFormValue("content").MustString("任务内容不可空")

	me := user.Find(c.Session.Get("uid").(int64))
	creator := user.Find(cid)
	developer := user.Find(did)
	tester := user.Find(tid)
	web.Assert(developer != nil && tester != nil, "开发者与测试人员不可为空")

	if creator == nil {
		creator = me
	}

	proj := project.Find(pid)
	web.Assert(proj != nil, "任务所属项目不存在或已删除")

	milestone := proj.FindMilestone(mid)
	if milestone != nil {
		web.Assert(
			startTime.After(milestone.StartTime) && endTime.Before(milestone.EndTime),
			"任务时间计划与所属里程碑不匹配")
	}

	t := task.Add(name, pid, mid, int8(weight), me.IsSu, creator.ID, did, tid, startTime, endTime, content)
	//fhs, ok := c.MultipartForm().File["files[]"]
	//if ok {
	//	helper := new(File)
	//	for _, fh := range fhs {
	//		url, _ := helper.save(fh, me.ID)
	//		t.AddAttachment(fh.Filename, url)
	//	}
	//}

	t.LogEvent(me.ID, task.EventCreate, "")
	c.JSON(200, web.Map{})
}

func (*Task) info(c *web.Context) {
	tid := c.RouteValue("id").MustInt("")

	t := task.Find(tid)
	web.Assert(t != nil, "任务不存在或已被删除")

	c.JSON(200, web.Map{"data": t.Detail()})
}

func (*Task) delete(c *web.Context) {
	tid := c.RouteValue("id").MustInt("")
	uid := c.Session.Get("uid").(int64)

	t := task.Find(tid)
	web.Assert(t != nil, "任务不存在或已被删除")

	if t.Creator != uid {
		proj := project.Find(t.PID)
		web.Assert(proj != nil, "任务所属项目不存在或已删除")
		web.Assert(proj.IsAdmin(uid), "只有创建者或项目管理员可以删除该任务")
	}

	t.Delete()
	c.JSON(200, web.Map{})
}

func (*Task) setName(c *web.Context) {
	uid := c.Session.Get("uid").(int64)
	tid := c.RouteValue("id").MustInt("")
	name := c.PostFormValue("name").MustString("任务名不可为空")

	edit := task.Find(tid)
	web.Assert(edit != nil, "任务不存在或已被删除")

	if edit.Creator != uid {
		proj := project.Find(edit.PID)
		web.Assert(proj != nil, "任务所属项目不存在或已删除")
		web.Assert(proj.IsAdmin(uid), "只有发布者及项目管理员可以更改名称")
	}

	old := edit.Name
	web.AssertError(edit.SetName(name))

	edit.LogEvent(uid, task.EventModName, old)
	c.JSON(200, web.Map{})
}

func (*Task) setCreator(c *web.Context) {
	operator := c.Session.Get("uid").(int64)
	tid := c.RouteValue("id").MustInt("")
	uid := c.PostFormValue("member").MustInt("人员ID无效")

	edit := task.Find(tid)
	web.Assert(edit != nil, "任务不存在或已被删除")

	if edit.Creator == uid {
		c.JSON(200, web.Map{})
		return
	}

	creator := user.Find(uid)
	web.Assert(creator != nil && !creator.IsLocked, "指定人员不存在或已删除")

	if edit.Creator != operator {
		proj := project.Find(edit.PID)
		web.Assert(proj != nil, "任务所属项目不存在或已删除")
		web.Assert(proj.IsAdmin(operator), "只有发布者及项目管理员可以移交任务")
	}

	oldCreator, _ := user.FindInfo(edit.Creator)
	web.AssertError(edit.SetMember("creator", uid))

	edit.LogEvent(operator, task.EventModCreator, oldCreator)
	c.JSON(200, web.Map{})
}

func (*Task) setDeveloper(c *web.Context) {
	operator := c.Session.Get("uid").(int64)
	tid := c.RouteValue("id").MustInt("")
	uid := c.PostFormValue("member").MustInt("人员ID无效")

	edit := task.Find(tid)
	web.Assert(edit != nil, "任务不存在或已被删除")

	if edit.Developer == uid {
		c.JSON(200, web.Map{})
		return
	}

	developer := user.Find(uid)
	web.Assert(developer != nil && !developer.IsLocked, "指定人员不存在或已删除")

	if edit.Creator != operator {
		proj := project.Find(edit.PID)
		web.Assert(proj != nil, "任务所属项目不存在或已删除")
		web.Assert(proj.IsAdmin(operator), "只有发布者及项目管理员可以更改开发人员")
	}

	oldDeveloper, _ := user.FindInfo(edit.Developer)
	web.AssertError(edit.SetMember("developer", uid))

	edit.LogEvent(operator, task.EventModDeveloper, oldDeveloper)
	c.JSON(200, web.Map{})
}

func (*Task) setTester(c *web.Context) {
	operator := c.Session.Get("uid").(int64)
	tid := c.RouteValue("id").MustInt("")
	uid := c.PostFormValue("member").MustInt("人员ID无效")

	edit := task.Find(tid)
	web.Assert(edit != nil, "任务不存在或已被删除")

	if edit.Tester == uid {
		c.JSON(200, web.Map{})
		return
	}

	tester := user.Find(uid)
	web.Assert(tester != nil && !tester.IsLocked, "指定人员不存在或已删除")

	if edit.Creator != operator {
		proj := project.Find(edit.PID)
		web.Assert(proj != nil, "任务所属项目不存在或已删除")
		web.Assert(proj.IsAdmin(operator), "只有发布者及项目管理员可以更改测试人员")
	}

	oldTester, _ := user.FindInfo(edit.Tester)
	web.AssertError(edit.SetMember("tester", uid))

	edit.LogEvent(operator, task.EventModTester, oldTester)
	c.JSON(200, web.Map{})
}

func (*Task) setWeight(c *web.Context) {
	operator := c.Session.Get("uid").(int64)
	tid := c.RouteValue("id").MustInt("")
	weight := int8(c.PostFormValue("weight").MustInt("无效的优先级"))
	old := c.PostFormValue("old").MustString("无效的旧优先级")

	edit := task.Find(tid)
	web.Assert(edit != nil, "任务不存在或已被删除")

	if edit.Weight == weight {
		c.JSON(200, web.Map{})
		return
	}

	if edit.Creator != operator {
		proj := project.Find(edit.PID)
		web.Assert(proj != nil, "任务所属项目不存在或已删除")
		web.Assert(proj.IsAdmin(operator), "只有发布者及项目管理员可以更改优先级")
	}

	web.AssertError(edit.SetWeight(weight))

	edit.LogEvent(operator, task.EventModWeight, old)
	c.JSON(200, web.Map{})
}

func (*Task) setTime(c *web.Context) {
	uid := c.Session.Get("uid").(int64)
	tid := c.RouteValue("id").MustInt("")
	startTime, _ := time.Parse("2006-01-02", c.PostFormValue("startTime").MustString("未指定开始时间"))
	endTime, _ := time.Parse("2006-01-02", c.PostFormValue("endTime").MustString("未指定结束时间"))

	edit := task.Find(tid)
	web.Assert(edit != nil, "任务不存在或已被删除")

	if edit.Creator != uid {
		proj := project.Find(edit.PID)
		web.Assert(proj != nil, "任务所属项目不存在或已删除")
		web.Assert(proj.IsAdmin(uid), "只有发布者及项目管理员可以更改优先级")
	}

	oldTime := edit.StartTime.Format("2006-01-02") + "/" + edit.EndTime.Format("2006-01-02")
	web.AssertError(edit.SetTime(startTime, endTime))

	edit.LogEvent(uid, task.EventModTime, oldTime)
	c.JSON(200, web.Map{})
}

func (*Task) setContent(c *web.Context) {
	tid := c.RouteValue("id").MustInt("")
	uid := c.Session.Get("uid").(int64)
	content := c.PostFormValue("content").MustString("任务内容不可为空")

	edit := task.Find(tid)
	web.Assert(edit != nil, "任务不存在或已被删除")
	web.AssertError(edit.SetContent(content))

	edit.LogEvent(uid, task.EventModContent, "")
	c.JSON(200, web.Map{})
}

func (*Task) setStatus(c *web.Context) {
	tid := c.RouteValue("id").MustInt("")
	status := int8(c.FormValue("moveTo").MustInt("非法的任务状态"))
	uid := c.Session.Get("uid").(int64)

	edit := task.Find(tid)
	web.Assert(edit != nil, "任务不存在或已被删除")

	if edit.State == status {
		c.JSON(200, &web.Map{})
		return
	}

	proj := project.Find(edit.PID)
	web.Assert(proj != nil, "任务所在项目不存在或已被删除")
	web.AssertError(edit.SetState(uid, status, proj.IsAdmin(uid)))

	edit.LogEvent(uid, task.EventModState, strconv.Itoa(int(status)))
	c.JSON(200, web.Map{})
}

func (*Task) moveBack(c *web.Context) {
	uid := c.Session.Get("uid").(int64)
	tid := c.RouteValue("id").MustInt("")

	edit := task.Find(tid)
	web.Assert(edit != nil, "任务不存在或已被删除")

	proj := project.Find(edit.PID)
	web.Assert(proj != nil, "任务所属项目不存在或已删除")
	web.AssertError(edit.SetState(uid, edit.State-1, proj.IsAdmin(uid)))

	edit.LogEvent(uid, task.EventModState, strconv.Itoa(int(edit.State)))
	c.JSON(200, web.Map{})
}

func (*Task) moveNext(c *web.Context) {
	tid := c.RouteValue("id").MustInt("")
	uid := c.Session.Get("uid").(int64)

	edit := task.Find(tid)
	web.Assert(edit != nil, "任务不存在或已被删除")

	proj := project.Find(edit.PID)
	web.Assert(proj != nil, "任务所属项目不存在或已删除")
	web.AssertError(edit.SetState(uid, edit.State+1, proj.IsAdmin(uid)))

	edit.LogEvent(uid, task.EventModState, strconv.Itoa(int(edit.State)))
	c.JSON(200, web.Map{})
}

func (*Task) addComment(c *web.Context) {
	uid := c.Session.Get("uid").(int64)
	tid := c.RouteValue("id").MustInt("")
	content := c.PostFormValue("content").MustString("任务内容不可为空")

	t := task.Find(tid)
	web.Assert(t != nil, "任务不存在或已被删除")
	web.AssertError(t.AddComment(uid, content))

	t.LogEvent(uid, task.EventComment, "")
	c.JSON(200, web.Map{})
}
