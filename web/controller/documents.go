package controller

import (
	"time"

	"team/common/web"
	"team/model/document"
	"team/model/user"
)

// Document controller
type Document int

// Register implements web.Controller interface.
func (d *Document) Register(group *web.Router) {
	group.POST("", d.create)
	group.GET("/list", d.getAll)
	group.GET("/:id", d.detail)
	group.PUT("/:id/title", d.rename)
	group.PUT("/:id/content", d.edit)
	group.DELETE("/:id", d.delete)
}

func (d *Document) create(c *web.Context) {
	uid := c.Session.Get("uid").(int64)
	title := c.PostFormValue("title").MustString("无效文档名")
	parent := c.PostFormValue("parent").MustInt("无效父节点")

	web.AssertError(document.Add(uid, parent, title))
	c.JSON(200, web.Map{})
}

func (d *Document) getAll(c *web.Context) {
	list, err := document.GetAll()
	web.AssertError(err)
	c.JSON(200, web.Map{"data": list})
}

func (d *Document) detail(c *web.Context) {
	id := c.RouteValue("id").MustInt("")
	doc, err := document.Find(id)
	web.AssertError(err)

	creator, _ := user.FindInfo(doc.Author)
	modifier, _ := user.FindInfo(doc.Modifier)

	c.JSON(200, web.Map{"data": map[string]interface{}{
		"id":       doc.ID,
		"parent":   doc.Parent,
		"title":    doc.Title,
		"creator":  creator,
		"modifier": modifier,
		"tile":     doc.Time.Format("2006-01-02"),
		"content":  doc.Content,
	}})
}

func (d *Document) rename(c *web.Context) {
	uid := c.Session.Get("uid").(int64)
	did := c.RouteValue("id").MustInt("")
	title := c.PostFormValue("title").MustString("无效文档名")

	doc, err := document.Find(did)
	web.AssertError(err)

	doc.Title = title
	doc.Modifier = uid
	doc.Time = time.Now()
	web.AssertError(doc.Save())

	c.JSON(200, web.Map{})
}

func (d *Document) edit(c *web.Context) {
	uid := c.Session.Get("uid").(int64)
	did := c.RouteValue("id").MustInt("")
	content := c.PostFormValue("content").MustString("内容不可为空")

	doc, err := document.Find(did)
	web.AssertError(err)

	doc.Content = content
	doc.Modifier = uid
	doc.Time = time.Now()
	web.AssertError(doc.Save())

	c.JSON(200, web.Map{})
}

func (d *Document) delete(c *web.Context) {
	id := c.RouteValue("id").MustInt("")
	document.Delete(id)
	c.JSON(200, web.Map{})
}
