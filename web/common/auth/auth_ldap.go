package auth

import (
	"crypto/tls"
	"fmt"

	"gopkg.in/ldap.v3"
)

// LDAPProtocol definition.
type LDAPProtocol int

const (
	// LDAPUnencrypted protocol
	LDAPUnencrypted LDAPProtocol = iota
	// LDAPTLS protocol
	LDAPTLS
	// LDAPStartTLS protocol
	LDAPStartTLS
)

// LDAPProvider implements auth using LDAP
type LDAPProvider struct {
	Host         string
	Port         int
	Protocol     LDAPProtocol
	BindDN       string
	BindPassword string
	SearchDN     string
	SkipVerify   bool
}

// Verify implement.
func (l *LDAPProvider) Verify(account, password string) error {
	var (
		conn *ldap.Conn
		err  error
	)

	tlsCfg := &tls.Config{InsecureSkipVerify: l.SkipVerify}

	if l.Protocol == LDAPTLS {
		conn, err = ldap.DialTLS("tcp", fmt.Sprintf("%s:%d", l.Host, l.Port), tlsCfg)
	} else {
		conn, err = ldap.Dial("tcp", fmt.Sprintf("%s:%d", l.Host, l.Port))
	}

	if err != nil {
		return fmt.Errorf("Failed to connect to LDAP server: %v", err)
	}

	defer conn.Close()

	if l.Protocol == LDAPStartTLS {
		if err = conn.StartTLS(tlsCfg); err != nil {
			return fmt.Errorf("Failed to STARTTLS: %v", err)
		}
	}

	if err = conn.Bind(l.BindDN, l.BindPassword); err != nil {
		return fmt.Errorf("Bind to LDAP server failed: %v", err)
	}

	req := ldap.NewSearchRequest(
		l.SearchDN,
		ldap.ScopeWholeSubtree,
		ldap.DerefAlways,
		0,
		0,
		false,
		fmt.Sprintf("(sAMAccountName=%s)", account),
		[]string{"sAMAccountName"},
		nil,
	)

	rsp, err := conn.Search(req)
	if err != nil {
		return fmt.Errorf("Failed to Search LDAP. %v", err)
	}

	if len(rsp.Entries) == 0 {
		return fmt.Errorf("User %s NOT found", account)
	}

	return conn.Bind(rsp.Entries[0].DN, password)
}
