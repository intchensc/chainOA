package web

import (
	"bufio"
	"net"
	"net/http"
)

type (
	// Responser is wrapper for original http.ResponseWriter
	Responser struct {
		writer     http.ResponseWriter
		statusCode int
		statusDone bool
	}
)

// Status returns current response status.
func (r *Responser) Status() int {
	return r.statusCode
}

// Header implements http.ResponseWriter interface.
func (r *Responser) Header() http.Header {
	return r.writer.Header()
}

// Write implements http.ResponseWriter interface.
func (r *Responser) Write(data []byte) (int, error) {
	return r.writer.Write(data)
}

// WriteHeader implements http.ResponseWriter interface.
func (r *Responser) WriteHeader(code int) {
	if r.statusDone {
		return
	}

	r.statusCode = code
	r.statusDone = true
	r.writer.WriteHeader(code)
}

// Flush send buffer.
func (r *Responser) Flush() {
	r.writer.(http.Flusher).Flush()
}

// Hijack implements http.Hijacker interface.
func (r *Responser) Hijack() (net.Conn, *bufio.ReadWriter, error) {
	return r.writer.(http.Hijacker).Hijack()
}
