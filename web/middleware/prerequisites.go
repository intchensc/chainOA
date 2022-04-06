package middleware

import (
	"team/config"
	"team/common/web"
)

// MustInstalled makes sure database has been configured.
func MustInstalled(next web.Handler) web.Handler {
	return func(c *web.Context) {
		if config.Installed {
			next(c)
		} else {
			c.JSON(200, web.Map{"err": "系统尚未初始化"})
		}
	}
}

// MustNotInstalled makes sure database has NOT been configured.
func MustNotInstalled(next web.Handler) web.Handler {
	return func(c *web.Context) {
		if !config.Installed {
			next(c)
		} else {
			c.JSON(200, web.Map{"err": "系统已经初始化完成"})
		}
	}
}
