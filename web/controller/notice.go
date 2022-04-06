package controller

import (
	"team/common/web"
	"team/model/notice"
)

// Notice controller
type Notice int

// Register implements web.Controller interface.
func (n *Notice) Register(group *web.Router) {
	group.GET("/list", n.mine)
	group.DELETE("/:id", n.deleteOne)
	group.DELETE("/all", n.deleteAll)
}

func (n *Notice) mine(c *web.Context) {
	list := notice.GetMine(c.Session.Get("uid").(int64))
	c.JSON(200, web.Map{"data": list})
}

func (n *Notice) deleteOne(c *web.Context) {
	notice.Delete(c.RouteValue("id").MustInt("非法的通知ID"))
	c.JSON(200, web.Map{})
}

func (n *Notice) deleteAll(c *web.Context) {
	notice.DeleteAllMine(c.Session.Get("uid").(int64))
	c.JSON(200, web.Map{})
}
