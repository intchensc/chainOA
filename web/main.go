package main

import (
	"strings"

	"team/common/web"
	"team/config"
	"team/controller"
	"team/middleware"

	rice "github.com/GeertJohan/go.rice"
	_ "github.com/go-sql-driver/mysql"
)

func main() {
	// Load configuration.
	config.Load()

	// Load resources.
	resBox := rice.MustFindBox("view/dist")
	mainPage := strings.ReplaceAll(resBox.MustString("app.html"), "__APP_NAME__", config.App.Name)

	// Create router for httpd service.
	router := web.NewRouter()
	router.Use(middleware.Logger)
	router.Use(middleware.PanicAsError)

	// Statics.
	router.SetPage("/", mainPage)
	router.StaticFS("/assets", resBox.HTTPBox())
	router.StaticFS("/uploads", web.Dir("uploads"))

	// Home. Determine display mode.
	router.GET("/home", controller.Home)

	// Install/Login/Logout API.
	router.UseController("/install", new(controller.Install), middleware.MustNotInstalled)
	router.GET("/logout", controller.Logout, middleware.MustInstalled)
	router.POST("/login", controller.Login, middleware.MustInstalled)

	// Normal API.
	api := router.Group("/api")
	api.Use(middleware.MustInstalled)
	api.Use(middleware.AutoLogin)
	api.Use(middleware.MustLogined)
	api.UseController("/user", new(controller.User))
	api.UseController("/task", new(controller.Task))
	api.UseController("/project", new(controller.Project))
	api.UseController("/document", new(controller.Document))
	api.UseController("/file", new(controller.File))
	api.UseController("/notice", new(controller.Notice))

	// Admin API.
	router.UseController(
		"/admin",
		new(controller.Admin),
		middleware.MustInstalled,
		middleware.AutoLogin,
		middleware.MustLoginedAsAdmin)

	// Start service.
	router.Start(config.App.Addr())
}
