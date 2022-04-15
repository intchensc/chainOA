package web

import (
	"errors"
	"net/http"
	"regexp"
	"strings"
)

type (
	// Handler for HTTP request
	Handler func(c *Context)

	// Middleware interface
	Middleware func(next Handler) Handler

	// Controller to register routes in same group.
	Controller interface {
		Register(group *Router)
	}

	// Dispatcher message
	Dispatcher struct {
		pattern *regexp.Regexp
		router  *Router
		names   []string
		handler Handler
	}

	// Router to dispatch HTTP request.
	Router struct {
		prefix      string
		notFound    Handler
		middlewares []Middleware
		children    map[string]*Router
		dispatchers map[string][]*Dispatcher
	}
)

// NewRouter returns a new root router
func NewRouter() *Router {
	return &Router{
		prefix:      "",
		middlewares: []Middleware{},
		children:    make(map[string]*Router),
		dispatchers: make(map[string][]*Dispatcher),
		notFound:    WrapFunc(http.NotFound),
	}
}

// Wrap http.Handler to web.Handler
func Wrap(handler http.Handler) Handler {
	return func(c *Context) {
		handler.ServeHTTP(c.rsp, c.req)
	}
}

// Dir returns a http.FileSystem for StaticFS
func Dir(path string) http.FileSystem {
	return http.Dir(path)
}

// WrapFunc wraps original http handle function to web.Handler
func WrapFunc(handle func(w http.ResponseWriter, r *http.Request)) Handler {
	return func(c *Context) {
		handle(c.rsp, c.req)
	}
}

// AssertError panics when err exists.
func AssertError(err error) {
	if err != nil {
		panic(err)
	}
}

// Assert panics when pdf expr failed.
func Assert(expr bool, errMsg string) {
	if !expr {
		panic(errors.New(errMsg))
	}
}

// Start httpd service
func (r *Router) Start(addr string) error {
	return http.ListenAndServe(addr, r)
}

// ServeHTTP implements http.Handler
func (r *Router) ServeHTTP(rsp http.ResponseWriter, req *http.Request) {
	c := &Context{
		Session:     nil,
		req:         req,
		rsp:         &Responser{writer: rsp, statusCode: 200, statusDone: false},
		routeParams: make(map[string]string),
		queryParams: nil,
	}

	dispachers, ok := r.dispatchers[req.Method]
	if !ok {
		r.Invoke(c, r.notFound)
		return
	}

	for _, test := range dispachers {
		matches := test.pattern.FindSubmatch([]byte(req.URL.Path))
		if matches != nil && string(matches[0]) == req.URL.Path {
			params := matches[1:]
			for idx, param := range params {
				c.routeParams[test.names[idx]] = string(param)
			}

			test.router.Invoke(c, test.handler)
			return
		}
	}

	r.Invoke(c, r.notFound)
}

// Invoke handler
func (r *Router) Invoke(c *Context, handler Handler) {
	caller := handler

	for i := len(r.middlewares) - 1; i >= 0; i-- {
		caller = r.middlewares[i](caller)
	}

	c.Session = Sessions.Start(c)
	caller(c)
}

// SetNotFound hooks 404 error handler.
func (r *Router) SetNotFound(handler Handler) {
	r.notFound = handler
}

// SetPage serves given url as simple HTML page.
func (r *Router) SetPage(url string, html string) {
	r.GET(url, func(c *Context) {
		c.HTML(200, html)
	})
}

// Add a new route
func (r *Router) Add(method string, pattern string, handler Handler, middlewares ...Middleware) {
	pattern = r.prefix + pattern

	names := []string{}
	paths := strings.Split(pattern, "/")
	pattern = ""

	for _, path := range paths {
		if path == "" {
			continue
		}

		size := len(path)
		start := path[0]
		end := path[size-1]

		if start == ':' {
			name := path[1:]
			names = append(names, name)
			if name == "id" {
				pattern = pattern + `/([\d]+)`
			} else {
				pattern = pattern + `/([\w]+)`
			}
		} else if start == '{' && end == '}' {
			idx := strings.Index(path, ":")
			names = append(names, path[1:idx])
			pattern = pattern + "/(" + path[idx+1:size-1] + ")"
		} else {
			pattern = pattern + "/" + path
		}
	}

	if len(pattern) == 0 {
		pattern = "/"
	}

	caller := handler
	if middlewares != nil && len(middlewares) > 0 {
		for i := len(middlewares) - 1; i >= 0; i-- {
			caller = middlewares[i](caller)
		}
	}

	dispatcher := &Dispatcher{
		pattern: regexp.MustCompile(pattern),
		router:  r,
		names:   names,
		handler: caller,
	}

	_, ok := r.dispatchers[method]
	if ok {
		r.dispatchers[method] = append(r.dispatchers[method], dispatcher)
	} else {
		r.dispatchers[method] = []*Dispatcher{dispatcher}
	}
}

// StaticFS registered a static file server by given filesystem.
func (r *Router) StaticFS(prefix string, fs http.FileSystem, middlewares ...Middleware) {
	uri := strings.TrimRight(prefix, "/") + "/"
	r.Add("GET", uri+`[\s\S]+`, Wrap(http.StripPrefix(uri, http.FileServer(fs))), middlewares...)
}

// GET route register
func (r *Router) GET(pattern string, handler Handler, middlewares ...Middleware) {
	r.Add("GET", pattern, handler, middlewares...)
}

// POST route register
func (r *Router) POST(pattern string, handler Handler, middlewares ...Middleware) {
	r.Add("POST", pattern, handler, middlewares...)
}

// PUT route register
func (r *Router) PUT(pattern string, handler Handler, middlewares ...Middleware) {
	r.Add("PUT", pattern, handler, middlewares...)
}

// PATCH route register
func (r *Router) PATCH(pattern string, handler Handler, middlewares ...Middleware) {
	r.Add("PATCH", pattern, handler, middlewares...)
}

// DELETE route register
func (r *Router) DELETE(pattern string, handler Handler, middlewares ...Middleware) {
	r.Add("DELETE", pattern, handler, middlewares...)
}

// Group some routers into a parent node.
func (r *Router) Group(prefix string) *Router {
	group, ok := r.children[prefix]
	if ok {
		return group
	}

	group = &Router{
		prefix:      r.prefix + prefix,
		notFound:    r.notFound,
		middlewares: append([]Middleware{}, r.middlewares...),
		children:    make(map[string]*Router),
		dispatchers: r.dispatchers,
	}

	r.children[prefix] = group
	return group
}

// Use a middlewere in this route
func (r *Router) Use(middleware Middleware) {
	r.middlewares = append(r.middlewares, middleware)
	for _, child := range r.children {
		child.middlewares = append(child.middlewares, middleware)
	}
}

// UseController is a useful method to register routes in same group.
func (r *Router) UseController(prefix string, controller Controller, middlewares ...Middleware) {
	group := r.Group(prefix)

	if middlewares != nil && len(middlewares) > 0 {
		group.middlewares = append(group.middlewares, middlewares...)
	}

	controller.Register(group)
}
