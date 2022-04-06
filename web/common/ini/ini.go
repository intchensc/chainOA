package ini

import (
	"fmt"
	"io/ioutil"
	"strconv"
	"strings"
)

type (
	// Ini file data.
	Ini struct {
		sections map[string]map[string]string
	}

	// Value in Ini file.
	Value struct {
		section string
		key     string
		isValid bool
		data    string
	}
)

// New returns an empty ini object.
func New() *Ini {
	return &Ini{sections: make(map[string]map[string]string)}
}

// Load ini from file.
func Load(path string) (*Ini, error) {
	ret := New()

	buf, err := ioutil.ReadFile(path)
	if err != nil {
		return nil, fmt.Errorf("File: %s is NOT readable", path)
	}

	content := string(buf)
	lines := strings.Split(strings.ReplaceAll(content, "\r\n", "\n"), "\n")
	section := ""

	for idx, line := range lines {
		line = strings.TrimSpace(line)

		if len(line) == 0 {
			continue
		}

		start := line[0]
		if start == '#' || start == ';' {
			continue
		} else if start == '[' {
			section, err = parseSection(line, idx+1)
			if err != nil {
				return nil, err
			}
		} else {
			key, value, err := parseKeyValue(line, idx+1)
			if err != nil {
				return nil, err
			}

			if len(value) == 0 {
				continue
			}

			if s, ok := ret.sections[section]; ok {
				s[key] = value
			} else {
				ns := make(map[string]string)
				ns[key] = value
				ret.sections[section] = ns
			}
		}
	}

	return ret, nil
}

// GetValue returns data in ini file by section and key.
func (i *Ini) GetValue(section, key string) *Value {
	ret := &Value{
		section: section,
		key:     key,
		isValid: false,
		data:    "",
	}

	if s, ok := i.sections[section]; ok {
		if v, ok := s[key]; ok {
			ret.isValid = true
			ret.data = v
		}
	}

	return ret
}

// GetString from this ini
func (i *Ini) GetString(section, key string) string {
	return i.GetValue(section, key).MustString()
}

// GetInt from this ini
func (i *Ini) GetInt(section, key string) int {
	return i.GetValue(section, key).MustInt()
}

// GetBool from this ini
func (i *Ini) GetBool(section, key string) bool {
	return i.GetValue(section, key).MustBool()
}

// SetString value into this ini file
func (i *Ini) SetString(section, key, value string) {
	if s, ok := i.sections[section]; ok {
		s[key] = value
	} else {
		ns := make(map[string]string)
		ns[key] = value
		i.sections[section] = ns
	}
}

// SetInt value into this ini file
func (i *Ini) SetInt(section, key string, n int) {
	value := fmt.Sprintf("%d", n)
	i.SetString(section, key, value)
}

// SetBool value into this ini file
func (i *Ini) SetBool(section, key string, b bool) {
	value := fmt.Sprintf("%v", b)
	i.SetString(section, key, value)
}

// Save this ini to file.
func (i *Ini) Save(path string) error {
	var builder strings.Builder

	for section, values := range i.sections {
		if strings.ContainsAny(section, "[] \t=#;") {
			builder.WriteString("[\"")
			builder.WriteString(section)
			builder.WriteString("\"]\r\n")
		} else {
			builder.WriteString("[")
			builder.WriteString(section)
			builder.WriteString("]\r\n")
		}

		for key, value := range values {
			if strings.ContainsAny(key, "[] \t=#;") {
				builder.WriteString("\"")
				builder.WriteString(key)
				builder.WriteString("\" = ")
			} else {
				builder.WriteString(key)
				builder.WriteString(" = ")
			}

			if strings.ContainsAny(value, " \t") {
				builder.WriteString("\"")
				builder.WriteString(value)
				builder.WriteString("\"\r\n")
			} else {
				builder.WriteString(value)
				builder.WriteString("\r\n")
			}
		}

		builder.WriteString("\r\n")
	}

	return ioutil.WriteFile(path, []byte(builder.String()), 0777)
}

// String returns value as string.
func (v *Value) String() (string, error) {
	if !v.isValid {
		return "", fmt.Errorf("Missing configuration for %s.%s", v.section, v.key)
	}
	return v.data, nil
}

// SafeString returns value as string. Using given null value if error occurs.
func (v *Value) SafeString(nullValue string) string {
	if s, e := v.String(); e == nil {
		return s
	}
	return nullValue
}

// MustString returns value as string. Panics on error.
func (v *Value) MustString() string {
	s, e := v.String()
	assert(e)
	return s
}

// Int returns value as int.
func (v *Value) Int() (int, error) {
	if !v.isValid {
		return 0, fmt.Errorf("Missing configuration for %s.%s", v.section, v.key)
	}

	return strconv.Atoi(v.data)
}

// SafeInt returns value as int. Using given null value if error occurs.
func (v *Value) SafeInt(nullValue int) int {
	if n, e := v.Int(); e == nil {
		return n
	}
	return nullValue
}

// MustInt returns value as int. Panics on error.
func (v *Value) MustInt() int {
	n, e := v.Int()
	assert(e)
	return n
}

// Bool returns value as boolean.
func (v *Value) Bool() (bool, error) {
	if !v.isValid {
		return false, fmt.Errorf("Missing configuration for %s.%s", v.section, v.key)
	}

	return strconv.ParseBool(v.data)
}

// SafeBool returns value as boolean. Using given null value if error occurs.
func (v *Value) SafeBool(nullValue bool) bool {
	if b, e := v.Bool(); e == nil {
		return b
	}
	return nullValue
}

// MustBool returns value as boolean. Panics on error.
func (v *Value) MustBool() bool {
	b, e := v.Bool()
	assert(e)
	return b
}

func skipSpace(data string, size, index int) int {
	for index < size {
		c := data[index]
		if c == ' ' || c == '\t' {
			index++
		} else {
			break
		}
	}

	return index
}

func parseSection(data string, lineNo int) (string, error) {
	buf, size := make([]byte, 256), len(data)

	writed := 0
	readed := skipSpace(data, size, 1)

	errSyntax := fmt.Errorf("Bad syntax for session at line: %d", lineNo)
	errLostName := fmt.Errorf("Missing name for section at line: %d", lineNo)

	for readed < size {
		c := data[readed]

		if c == '"' {
			if writed > 0 {
				return "", errSyntax
			}

			readed++
			for readed < size && data[readed] != '"' {
				buf[writed] = data[readed]
				writed++
				readed++
			}

			readed = skipSpace(data, size, readed+1)
			if readed >= size || data[readed] != ']' {
				return "", errSyntax
			}
		} else if c == '#' || c == ';' || c == '[' || c == '=' {
			return "", errSyntax
		} else if c == ' ' || c == '\t' {
			readed = skipSpace(data, size, readed+1)
			if readed < size && data[readed] != ']' {
				return "", errSyntax
			}
		} else if c == ']' {
			if writed == 0 {
				return "", errLostName
			}

			readed = skipSpace(data, size, readed+1)
			if readed >= size || data[readed] == '#' || data[readed] == ';' {
				return string(buf[0:writed]), nil
			}

			break
		} else {
			buf[writed] = c
			writed++
			readed++
		}
	}

	return "", errSyntax
}

func parseKeyValue(data string, lineNo int) (string, string, error) {
	key, value, buf, size := "", "", make([]byte, 256), len(data)

	writed := 0
	readed := skipSpace(data, size, 0)

	errKeySyntax := fmt.Errorf("Base syntax for key at line: %d", lineNo)
	errValueSyntax := fmt.Errorf("Base syntax for value at line: %d", lineNo)

	for readed < size {
		c := data[readed]

		if c == '"' {
			if writed > 0 {
				return "", "", errKeySyntax
			}

			readed++
			for readed < size && data[readed] != '"' {
				buf[writed] = data[readed]
				writed++
				readed++
			}

			readed = skipSpace(data, size, readed+1)
			if readed >= size || data[readed] != '=' {
				return "", "", errKeySyntax
			}
		} else if c == '#' || c == ';' || c == '[' || c == ']' {
			return "", "", errKeySyntax
		} else if c == ' ' || c == '\t' {
			readed = skipSpace(data, size, readed+1)
			if readed >= size || data[readed] != '=' {
				return "", "", errKeySyntax
			}
		} else if c == '=' {
			if writed == 0 {
				return "", "", errKeySyntax
			}

			key = string(buf[0:writed])
			break
		} else {
			buf[writed] = c
			writed++
			readed++
		}
	}

	if readed >= size || data[readed] != '=' || writed == 0 {
		return "", "", errKeySyntax
	}

	writed = 0
	readed = skipSpace(data, size, readed+1)
	for readed < size {
		c := data[readed]

		if c == '"' {
			if writed > 0 {
				return "", "", errValueSyntax
			}

			readed++
			for readed < size && data[readed] != '"' {
				buf[writed] = data[readed]
				writed++
				readed++
			}

			readed = skipSpace(data, size, readed+1)
			if readed < size && data[readed] != ';' && data[readed] != '#' {
				return "", "", errValueSyntax
			}

			break
		} else if c == '#' || c == ';' {
			break
		} else if c == ' ' || c == '\t' {
			readed = skipSpace(data, size, readed+1)
			if readed < size && data[readed] != ';' && data[readed] != '#' {
				return "", "", errValueSyntax
			}
			break
		} else {
			buf[writed] = c
			writed++
			readed++
		}
	}

	if writed > 0 {
		value = string(buf[0:writed])
	}

	return key, value, nil
}

func assert(err error) {
	if err != nil {
		panic(err)
	}
}
