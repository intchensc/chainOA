package auth

// Provider for custom login method.
type Provider interface {
	Verify(account, password string) error
}
