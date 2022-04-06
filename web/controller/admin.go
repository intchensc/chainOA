package controller

import (
	"team/common/web"
	"team/model/user"
)

// Admin controller
type Admin int

// Register implements web.Controller interface.
func (a *Admin) Register(group *web.Router) {
	group.POST("/user", a.addUser)
	group.PUT("/user/:id", a.editUser)
	group.PUT("/user/:id/lock", a.lockUser)
	group.DELETE("/user/:id", a.deleteUser)
	group.GET("/user/list", a.users)
}

func (a *Admin) addUser(c *web.Context) {
	account := c.PostFormValue("account").MustString("请填写新用户帐号")
	name := c.PostFormValue("name").MustString("新用户名称不可为空")
	pswd := c.PostFormValue("pswd").MustString("初始密码不可为空")
	cfmPswd := c.PostFormValue("cfmPswd").String()
	isSu, _ := c.PostFormValue("isSu").Bool()

	web.Assert(cfmPswd == pswd, "两次输入的新密码不一致")
	web.AssertError(user.AddBuildIn(account, name, pswd, isSu))
	c.JSON(200, web.Map{})
}

func (a *Admin) editUser(c *web.Context) {
	uid := c.RouteValue("id").MustInt("")
	account := c.PostFormValue("account").MustString("用户帐号不可为空")
	name := c.PostFormValue("name").MustString("用户显示名称不可为空")
	isSu, _ := c.PostFormValue("isSu").Bool()

	find := user.Find(uid)
	if find == nil {
		web.Assert(false, "编辑的用户不存在或已删除")
	}

	find.Account = account
	find.Name = name
	find.IsSu = isSu
	web.AssertError(find.Save())
	c.JSON(200, web.Map{})
}

func (a *Admin) lockUser(c *web.Context) {
	uid := c.RouteValue("id").MustInt("")
	find := user.Find(uid)
	web.Assert(find != nil, "帐号不存在或已被删除")

	find.IsLocked = !find.IsLocked
	web.AssertError(find.Save())

	c.JSON(200, web.Map{})
}

func (a *Admin) deleteUser(c *web.Context) {
	uid := c.RouteValue("id").MustInt("")
	user.Delete(uid)
	c.JSON(200, web.Map{})
}

func (a *Admin) users(c *web.Context) {
	users, err := user.GetAll()
	web.AssertError(err)
	c.JSON(200, web.Map{"data": users})
}
