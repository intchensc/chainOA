package middleware

import (
	"team/common/web"
)

// PanicAsError helps to use `panic` returns JSON error response
func PanicAsError(next web.Handler) web.Handler {
	return func(c *web.Context) {
		defer func() {
			if except := recover(); except != nil {
				err := except.(error)
				c.JSON(200, web.Map{"err": err.Error()})
			}
		}()

		next(c)
	}
}
