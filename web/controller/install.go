package controller

import (
	"team/common/web"
	"team/config"
	"team/model/install"
)

// Install prepares databases
type Install struct {
	output *install.Status
}

// Register implements web.Controller interface.
func (i *Install) Register(group *web.Router) {
	group.POST("/configure", i.configure)
	group.GET("/status", i.status)
	group.POST("/admin", i.createAdmin)
}

func (i *Install) configure(c *web.Context) {
	appName := c.FormValue("name").MustString("无效的站点名称")
	appPort := c.FormValue("port").MustInt("无效的监听端口")
	appLoginType := c.FormValue("loginType").MustInt("无效的认证方式")
	mysqlHost := c.FormValue("mysqlHost").MustString("无效MySQL地址")
	mysqlUser := c.FormValue("mysqlUser").MustString("无效MySQL用户")
	mysqlPswd := c.FormValue("mysqlPswd").String()
	mysqlDB := c.FormValue("mysqlDB").MustString("数据名不可为空")

	web.Assert(appPort > 0 && appPort < 65535, "无效的端口参数")

	i.output = &install.Status{}
	i.output.Done = false
	i.output.IsError = false
	i.output.Status = []string{"连接数据库..."}

	config.App.Name = appName
	config.App.Port = int(appPort)
	config.App.Auth = config.AuthKind(appLoginType)
	config.MySQL = &config.MySQLInfo{
		Host:     mysqlHost,
		User:     mysqlUser,
		Password: mysqlPswd,
		Database: mysqlDB,
	}

	switch config.App.Auth {
	case config.AuthKindSMTP:
		smtpHost := c.FormValue("smtpLoginHost").MustString("无效的SMTP地址")
		smtpPort := int(c.FormValue("smtpLoginPort").MustInt("端口号不可为空"))
		smtpPlain := c.FormValue("smtpLoginKind").MustInt("未选择SMTP登录方式") == 0
		smtpTLS, _ := c.FormValue("smtpLoginTLS").Bool()
		smtpSkipVerfiy, _ := c.FormValue("smtpLoginSkipVerify").Bool()
		config.UseSMTPAuth(smtpHost, smtpPort, smtpPlain, smtpTLS, smtpSkipVerfiy)
	case config.AuthKindLDAP:
		ldapHost := c.FormValue("ldapLoginHost").MustString("无效的LDAP主机地址")
		ldapPort := int(c.FormValue("ldapLoginPort").MustInt("端口号不可为空"))
		ldapProtocol := int(c.FormValue("ldapLoginProtocol").MustInt("协议不可为空"))
		ldapBindDN := c.FormValue("ldapLoginBindDN").MustString("无效的绑定DN")
		ldapBindPswd := c.FormValue("ldapLoginBindPswd").MustString("无效的绑定密码")
		ldapSearchDN := c.FormValue("ldapLoginSearchDN").MustString("无效的用户基准DN")
		ldapSkipVerfiy, _ := c.FormValue("ldapLoginSkipVerify").Bool()
		config.UseLDAPAuth(ldapHost, ldapPort, ldapProtocol, ldapBindDN, ldapBindPswd, ldapSearchDN, ldapSkipVerfiy)
	}

	go install.Run(config.MySQL.URL(), i.output)
	c.JSON(200, web.Map{})
}

func (i *Install) status(c *web.Context) {
	c.JSON(200, web.Map{"data": i.output})
}

func (i *Install) createAdmin(c *web.Context) {
	account := c.FormValue("account").MustString("帐号不可为空")
	name := c.FormValue("name").MustString("显示名称不可为空")
	pswd := c.FormValue("pswd").MustString("超级管理员必须设置密码")

	err := install.AddDefaultAdmin(account, name, pswd)
	web.Assert(err == nil, "创建默认管理员失败")
	web.Assert(config.Save() == nil, "保存配置失败")

	config.Installed = true
	c.JSON(200, web.Map{})
}
