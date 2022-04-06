package controller

import (
	"fmt"
	"mime/multipart"
	"os"
	"time"

	"team/common/web"
	"team/model/share"
)

// File controller
type File int

// Register implements web.Controller interface.
func (f *File) Register(group *web.Router) {
	group.POST("/upload", f.upload)
	group.POST("/share", f.share)
	group.GET("/share/list", f.getShareList)
	group.GET("/share/:id", f.download)
	group.DELETE("/share/:id", f.deleteShare)
}

func (f *File) upload(c *web.Context) {
	formFiles := c.MultipartForm().File
	uid := c.Session.Get("uid").(int64)

	for _, files := range formFiles {
		for _, fh := range files {
			url := f.save(fh, uid)

			c.JSON(200, web.Map{
				"data": web.Map{
					"url": url,
				},
			})
			return
		}
	}

	c.JSON(200, web.Map{})
}

func (f *File) share(c *web.Context) {
	formFiles := c.MultipartForm().File
	uid := c.Session.Get("uid").(int64)

	for _, files := range formFiles {
		for _, fh := range files {
			url := f.save(fh, uid)
			share.Add(fh.Filename, url, uid, uid, "")
			c.JSON(200, web.Map{})
			return
		}
	}

	c.JSON(200, web.Map{})
}

func (f *File) getShareList(c *web.Context) {
	uid := c.Session.Get("uid").(int64)
	list, err := share.GetAll(uid)
	web.AssertError(err)
	c.JSON(200, web.Map{"data": list})
}

func (f *File) download(c *web.Context) {
	id := c.RouteValue("id").MustInt("")
	info, err := share.Find(id)
	web.AssertError(err)
	//c.FileWithName(200, "."+info.Path, info.Name)
	c.JSON(200, web.Map{"data": info.Path})
}

func (f *File) deleteShare(c *web.Context) {
	id := c.RouteValue("id").MustInt("")
	share.Delete(id)
	c.JSON(200, web.Map{})
}

//将文件保存到服务器
func (f *File) save(fh *multipart.FileHeader, uploader int64) string {
	reader, err := fh.Open()
	web.Assert(err == nil, "打开上传文件失败")
	defer reader.Close()

	dir := fmt.Sprintf("uploads/%d", uploader)
	err = os.MkdirAll(dir, 0777)
	web.Assert(err == nil, "创建上传目录失败")

	now := time.Now()
	path := fmt.Sprintf("%s/%d_%s", dir, now.Unix(), fh.Filename)
	writer, err := os.OpenFile(path, os.O_WRONLY|os.O_CREATE, 0777)
	web.Assert(err == nil, "保存上传文件失败")
	defer writer.Close()

	web.Assert(err == nil, "写入上传文件失败")

	return ("/" + path)
}
