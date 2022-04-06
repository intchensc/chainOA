package controller

import (
	"team/common/web"
	"team/model/user"
)

// User controller
type User int

// Register implements web.Controller interface.
func (u *User) Register(group *web.Router) {
	group.GET("", u.info)
	group.PUT("/name", u.rename)
	group.PUT("/pswd", u.setPswd)
	group.PUT("/avatar", u.setAvatar)
}

func (*User) info(c *web.Context) {
	uid := c.Session.Get("uid").(int64)
	c.JSON(200, web.Map{"data": user.Find(uid)})
}

func (*User) rename(c *web.Context) {
	uid := c.Session.Get("uid").(int64)
	name := c.FormValue("name").MustString("请填写新昵称")

	web.AssertError(user.Rename(uid, name))
	c.JSON(200, web.Map{})
}

func (*User) setPswd(c *web.Context) {
	uid := c.Session.Get("uid").(int64)
	oldPswd := c.FormValue("oldPswd").MustString("请填写原始密码")
	newPswd := c.FormValue("newPswd").MustString("请输入新密码")
	cfmPswd := c.FormValue("cfmPswd").MustString("请再次确认新密码")

	web.Assert(newPswd == cfmPswd, "两次输入的新密码不一致")
	web.AssertError(user.SetPassword(uid, oldPswd, newPswd))

	c.JSON(200, web.Map{})
}

func (*User) setAvatar(c *web.Context) {
	//uid := c.Session.Get("uid").(int64)
	//me := user.Find(uid)
	//
	//fhs := c.MultipartForm().File["img"]
	//web.Assert(len(fhs) > 0, "更新头像参数错误")
	//
	//me.Avatar, _ = new(File).save(fhs[0], uid)
	//web.AssertError(me.Save())
	//
	//c.JSON(200, web.Map{"data": me.Avatar})
}
