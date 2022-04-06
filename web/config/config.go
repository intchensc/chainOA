package config

import (
	"fmt"
	"log"
	"os"

	"team/common/auth"
	"team/common/ini"
	"team/common/orm"
)

// Installed flag.
var Installed = false

// AuthKind for this app.
type AuthKind int

const (
	// AuthKindOnlyBuildin only uses build account.
	AuthKindOnlyBuildin AuthKind = iota
	// AuthKindSMTP uses SMTP auth
	AuthKindSMTP
	// AuthKindLDAP uses LDAP auth
	AuthKindLDAP
)

// ExtraAuth for this app.
var ExtraAuth auth.Provider = nil

// AppInfo holds basic information for this server.
type AppInfo struct {
	Name string
	Port int
	Auth AuthKind
}

// App information of this system.
var App = &AppInfo{
	Name: "chainOA",
	Port: 8090,
	Auth: AuthKindOnlyBuildin,
}

// Addr returns address for this service.
func (a *AppInfo) Addr() string {
	return fmt.Sprintf(":%d", a.Port)
}

// MySQLInfo host information of mysql server to be used.
type MySQLInfo struct {
	Host     string
	User     string
	Password string
	Database string
}

// MySQL information.
var MySQL = &MySQLInfo{
	Host:     "127.0.0.1:3306",
	User:     "root",
	Password: "5210",
	Database: "chainoa",
}

// URL returns MySQL service address.
func (m *MySQLInfo) URL() string {
	return fmt.Sprintf(
		"%s:%s@tcp(%s)/%s?multiStatements=true&charset=utf8&collation=utf8_general_ci",
		m.User, m.Password, m.Host, m.Database)
}

// Load configuration from file.
func Load() {
	if _, err := os.Stat("./team.ini"); err != nil {
		log.Printf("Please visit http://localhost:8080 to configure this system.\n")
		return
	}

	setting, err := ini.Load("./team.ini")
	if err != nil {
		log.Fatalf("Failed to parse configuration file: team.ini. Reason: %v\n", err)
	}

	Read(setting)

	if err = orm.OpenDB("mysql", MySQL.URL()); err != nil {
		log.Fatalf("Failed to connect to MySQL database: %s. Reason: %v", MySQL.URL(), err)
	}

	log.Printf("Service will started at :%d\n", App.Port)
	Installed = true
}

// Read configuration from ini file.
func Read(setting *ini.Ini) {
	defer func() {
		if except := recover(); except != nil {
			log.Fatalf("Parse ./team.ini failed. Reason: %v", except)
		}
	}()

	App.Name = setting.GetString("app", "name")
	App.Port = setting.GetInt("app", "port")
	App.Auth = AuthKind(setting.GetInt("app", "auth"))

	MySQL.Host = setting.GetString("mysql", "host")
	MySQL.User = setting.GetString("mysql", "user")
	MySQL.Password = setting.GetString("mysql", "password")
	MySQL.Database = setting.GetString("mysql", "database")

	switch App.Auth {
	case AuthKindSMTP:
		UseSMTPAuth(
			setting.GetString("smtp_login", "host"),
			setting.GetInt("smtp_login", "port"),
			setting.GetBool("smtp_login", "plain"),
			setting.GetBool("smtp_login", "tls"),
			setting.GetBool("smtp_login", "skip_verify"),
		)
	case AuthKindLDAP:
		UseLDAPAuth(
			setting.GetString("ldap_login", "host"),
			setting.GetInt("ldap_login", "port"),
			setting.GetInt("ldap_login", "protocol"),
			setting.GetString("ldap_login", "bind_dn"),
			setting.GetString("ldap_login", "bind_pswd"),
			setting.GetString("ldap_login", "search_dn"),
			setting.GetBool("ldap_login", "skip_verify"),
		)
	}
}

// Save configuration to file
func Save() error {
	setting := ini.New()

	setting.SetString("app", "name", App.Name)
	setting.SetInt("app", "port", App.Port)
	setting.SetInt("app", "auth", int(App.Auth))

	setting.SetString("mysql", "host", MySQL.Host)
	setting.SetString("mysql", "user", MySQL.User)
	setting.SetString("mysql", "password", MySQL.Password)
	setting.SetString("mysql", "database", MySQL.Database)

	switch App.Auth {
	case AuthKindSMTP:
		smtp := ExtraAuth.(*auth.SMTPProvider)
		setting.SetString("smtp_login", "host", smtp.Host)
		setting.SetInt("smtp_login", "port", smtp.Port)
		setting.SetBool("smtp_login", "plain", smtp.Plain)
		setting.SetBool("smtp_login", "tls", smtp.TLS)
		setting.SetBool("smtp_login", "skip_verify", smtp.SkipVerify)
	case AuthKindLDAP:
		ldap := ExtraAuth.(*auth.LDAPProvider)
		setting.SetString("ldap_login", "host", ldap.Host)
		setting.SetInt("ldap_login", "port", ldap.Port)
		setting.SetInt("ldap_login", "protocol", int(ldap.Protocol))
		setting.SetString("ldap_login", "bind_dn", ldap.BindDN)
		setting.SetString("ldap_login", "bind_pswd", ldap.BindPassword)
		setting.SetString("ldap_login", "search_dn", ldap.SearchDN)
		setting.SetBool("ldap_login", "skip_verify", ldap.SkipVerify)
	}

	return setting.Save("./team.ini")
}

// UseSMTPAuth uses SMTP as extra auth method.
func UseSMTPAuth(host string, port int, plain, tls, skipVerify bool) {
	ExtraAuth = &auth.SMTPProvider{
		Host:       host,
		Port:       port,
		Plain:      plain,
		TLS:        tls,
		SkipVerify: skipVerify,
	}
}

// UseLDAPAuth uses LDAP as extra auth method.
func UseLDAPAuth(host string, port, protocol int, bindDN, bindPswd, searchDN string, skipVerify bool) {
	ExtraAuth = &auth.LDAPProvider{
		Host:         host,
		Port:         port,
		Protocol:     auth.LDAPProtocol(protocol),
		BindDN:       bindDN,
		BindPassword: bindPswd,
		SearchDN:     searchDN,
		SkipVerify:   skipVerify,
	}
}
