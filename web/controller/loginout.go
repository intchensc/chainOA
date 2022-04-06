package controller

import (
	"crypto/md5"
	"fmt"
	"log"
	"net/http"

	"team/common/web"
	"team/config"
	"team/model/user"
)

// Login handler
func Login(c *web.Context) {
	account := c.PostFormValue("account").MustString("登录帐号未填写")
	password := c.PostFormValue("password").MustString("登录密码未填写")
	remember, _ := c.PostFormValue("remember").Bool()

	logined := user.FindByAccount(account)
	if logined == nil || !logined.IsBuildin {
		web.Assert(config.ExtraAuth != nil, "帐号或密码不正确")

		err := config.ExtraAuth.Verify(account, password)
		if err != nil {
			log.Printf("Failed verify account by extra auth. %v\n", err)
		}
		web.Assert(err == nil, "帐号验证失败")

		if logined == nil {
			logined, err = user.AddExternal(account)
			web.Assert(err == nil, "导入第三方帐号失败")
		}
	} else {
		hash := md5.New()
		hash.Write([]byte(password))

		encodedPswd := fmt.Sprintf("%X", hash.Sum(nil))
		web.Assert(logined.Password == encodedPswd, "帐号或密码不正确")
	}

	web.Assert(!logined.IsLocked, "帐号已被禁止登录，请联系管理员解除锁定！")

	if remember {
		cookie := logined.GetAutoLoginCookie(c.RemoteIP())
		if cookie != nil {
			c.SetCookie(&http.Cookie{
				Name:    cookie.Name,
				Value:   cookie.Value,
				Expires: cookie.Expires,
			})
		}
	}

	c.Session.Set("uid", logined.ID)
	c.JSON(200, web.Map{})
}

// Logout handler.
func Logout(c *web.Context) {
	c.EndSession()
	c.Redirect(302, "/")
}
