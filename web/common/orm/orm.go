package orm

import (
	"database/sql"
	"encoding/json"
	"errors"
	"fmt"
	"reflect"
	"strconv"
	"strings"
	"time"
)

var (
	// AutoIncrementKeyword for database driver.
	AutoIncrementKeyword = "AUTO_INCREMENT"
)

var (
	// TimeFormat for datatime
	TimeFormat = "2006-01-02 15:04:05"
	// ErrNotValid means database has NOT beed configured.
	ErrNotValid = errors.New("NOT VALID")
	// ErrNotFound means record can NOT be found in database.
	ErrNotFound = errors.New("RECORD NOT FOUND")
	// ErrUnsupportType means using type that unsupported
	ErrUnsupportType = errors.New("UNSUPPORT TYPE")
	// ErrBadParam means parameter is in bad format.
	ErrBadParam = errors.New("BAD PARAMETER")
)

var db *sql.DB

// OpenDB starts connection with database
func OpenDB(driver, addr string) error {
	conn, err := sql.Open(driver, addr)
	if err != nil {
		return err
	}

	err = conn.Ping()
	if err != nil {
		return err
	}

	conn.SetMaxOpenConns(64)
	db = conn
	return nil
}

// CreateTable by value type. `v` is a pointer of struct to generated table.
//
// All public fields in struct except those have tag `orm:"-"` will be treated
// as table column using **lowercase** name in sql table.
//
// For example:
// ```
// type UserTable struct {
//     // A field named 'id'(NOT case sensitive) will be treated as primary key.
//     // Note: 'id' field must be int64
//     ID      int64
//
//     // Numbers
//     Level     uint32
//     Money     int64
//     SomeFloat float32
//
//     // Type of strings in sql will be treated as TEXT by default.
//     // You can use 'type' keyword to specify another type that compatible with strings
//     Account string `orm:"type=VARCHAR(64),unique,notnull"`
//     Name    string `orm:"type=VARCHAR(64),unique,notnull"`
//     Avatar  string `orm:"type=VARCHAR(128),default=NULL"`
//
//     // Field with type : time.Time will be treated as TIMESTAMP by default
//     LoginTime    time.Time
//     RegisterTime time.Time `orm:"type=DATETIME,default=NOW()"`
//
//     // Struct/pointer/array/slice field will be serialized to JSON string
//     // and stored as 'TEXT' by default
//     Tags 	[]string
//     UserData *OtherType
//
//     // Field do NOT want to generated columns in table must has tag : `orm:"-"`
//     SomeRuntimeData int32 `orm:"-"`
// }
//
// // This will created a table named 'usertable'
// orm.CreateTable(&UserTable{})
// ```
func CreateTable(v interface{}) error {
	if db == nil {
		return ErrNotValid
	}

	rv := reflect.ValueOf(v)
	if rv.Kind() != reflect.Ptr || rv.IsNil() {
		return ErrUnsupportType
	}

	de := rv.Elem()
	dt := de.Type()
	if de.Kind() != reflect.Struct {
		return ErrUnsupportType
	}

	var builder strings.Builder
	builder.WriteString("CREATE TABLE IF NOT EXISTS `")
	builder.WriteString(strings.ToLower(dt.Name()))
	builder.WriteString("`(\n")

	fields := []string{}
	hasID := false

	for i := 0; i < dt.NumField(); i++ {
		fv := de.Field(i)
		if !fv.IsValid() || !fv.CanSet() {
			continue
		}

		ft := dt.Field(i)
		name := strings.ToLower(ft.Name)
		if name == "id" {
			fields = append(fields, "`id` BIGINT NOT NULL PRIMARY KEY "+AutoIncrementKeyword)
			hasID = true
		} else {
			tag := ft.Tag.Get("orm")
			if tag == "-" {
				continue
			}

			fields = append(fields, fmt.Sprintf("`%s` %s", name, makeFiledDesc(fv, tag)))
		}
	}

	if len(fields) == 0 {
		return ErrBadParam
	}

	if !hasID {
		fields = append(fields, "`id` BIGINT NOT NULL PRIMARY KEY "+AutoIncrementKeyword)
	}

	builder.WriteString(strings.Join(fields, ",\n"))
	builder.WriteString(") DEFAULT CHARSET utf8;")

	_, err := db.Exec(builder.String())
	return err
}

// Exec SQL without results like DELETE/UPDATE/INSERT
func Exec(sql string, args ...interface{}) (sql.Result, error) {
	if db == nil {
		return nil, fmt.Errorf("orm.Exec on invalid connection")
	}

	return db.Exec(sql, args...)
}

// Query with results.
func Query(sql string, args ...interface{}) (*sql.Rows, error) {
	if db == nil {
		return nil, fmt.Errorf("orm.Exec on invalid connection")
	}

	return db.Query(sql, args...)
}

// Scan current row in result set into struct.
func Scan(rows *sql.Rows, v interface{}) error {
	rv := reflect.ValueOf(v)
	if rv.Kind() != reflect.Ptr || rv.IsNil() {
		return ErrUnsupportType
	}

	de := rv.Elem()
	if de.Kind() != reflect.Struct {
		return rows.Scan(v)
	}

	cols, err := rows.Columns()
	if err != nil {
		return err
	}

	colSize := len(cols)
	vals := make([]interface{}, colSize, colSize)
	ptrs := make([][]byte, colSize, colSize)

	for i := 0; i < colSize; i++ {
		ptrs[i] = make([]byte, 1, 1)
		vals[i] = &ptrs[i]
	}

	rows.Scan(vals...)

	for i := 0; i < colSize; i++ {
		fv := de.FieldByNameFunc(func(name string) bool { return strings.ToLower(name) == cols[i] })
		if err = deserialize(fv, ptrs[i]); err != nil {
			return err
		}
	}

	return nil
}

// Insert data into database.
func Insert(v interface{}) (sql.Result, error) {
	rv := reflect.ValueOf(v)
	if rv.Kind() != reflect.Ptr || rv.IsNil() {
		return nil, ErrUnsupportType
	}

	de := rv.Elem()
	dt := de.Type()
	if de.Kind() != reflect.Struct {
		return nil, ErrUnsupportType
	}

	var builder strings.Builder

	builder.WriteString("INSERT INTO `")
	builder.WriteString(strings.ToLower(dt.Name()))
	builder.WriteString("`(")

	keys := []string{}
	holders := []string{}
	vals := []interface{}{}

	for i := 0; i < dt.NumField(); i++ {
		ft := dt.Field(i)
		name := strings.ToLower(ft.Name)
		tag := ft.Tag.Get("orm")
		if tag == "-" || name == "id" {
			continue
		}

		fv := de.Field(i)
		if !fv.IsValid() || !fv.CanSet() {
			continue
		}

		val, err := serialize(fv)
		if err != nil {
			return nil, err
		}

		keys = append(keys, "`"+name+"`")
		holders = append(holders, "?")
		vals = append(vals, val)
	}

	if len(keys) == 0 {
		return nil, fmt.Errorf("orm.Insert No valid fields found in record: %+v", v)
	}

	builder.WriteString(strings.Join(keys, ","))
	builder.WriteString(") VALUES(")
	builder.WriteString(strings.Join(holders, ","))
	builder.WriteString(");")

	return Exec(builder.String(), vals...)
}

// Read one record from database
func Read(v interface{}, cols ...string) error {
	rv := reflect.ValueOf(v)
	if rv.Kind() != reflect.Ptr || rv.IsNil() {
		return ErrUnsupportType
	}

	de := rv.Elem()
	dt := de.Type()
	if de.Kind() != reflect.Struct {
		return ErrUnsupportType
	}

	var builder strings.Builder

	builder.WriteString("SELECT * FROM `")
	builder.WriteString(strings.ToLower(dt.Name()))
	builder.WriteString("` WHERE ")

	conditions := []string{}
	vals := []interface{}{}

	if cols != nil && len(cols) > 0 {
		for _, col := range cols {
			fv := de.FieldByNameFunc(func(name string) bool { return strings.ToLower(name) == col })
			if !fv.IsValid() {
				return ErrBadParam
			}

			val, err := serialize(fv)
			if err != nil {
				return err
			}

			conditions = append(conditions, "`"+col+"`=?")
			vals = append(vals, val)
		}
	} else {
		fv := de.FieldByNameFunc(func(name string) bool { return strings.ToLower(name) == "id" })
		if !fv.IsValid() || fv.Kind() != reflect.Int64 {
			return ErrBadParam
		}

		conditions = append(conditions, "`id`=?")
		vals = append(vals, fv.Int())
	}

	builder.WriteString(strings.Join(conditions, " AND "))

	rows, err := Query(builder.String(), vals...)
	if err != nil {
		return err
	}

	defer rows.Close()

	if !rows.Next() {
		return ErrNotFound
	}

	return Scan(rows, v)
}

// Update one record from database
func Update(v interface{}) error {
	rv := reflect.ValueOf(v)
	if rv.Kind() != reflect.Ptr || rv.IsNil() {
		return ErrUnsupportType
	}

	de := rv.Elem()
	dt := de.Type()
	if de.Kind() != reflect.Struct {
		return ErrUnsupportType
	}

	var builder strings.Builder

	builder.WriteString("UPDATE `")
	builder.WriteString(strings.ToLower(dt.Name()))
	builder.WriteString("` SET ")

	id := int64(-1)
	keys := []string{}
	vals := []interface{}{}

	for i := 0; i < dt.NumField(); i++ {
		ft := dt.Field(i)
		name := strings.ToLower(ft.Name)
		tag := ft.Tag.Get("orm")
		if tag == "-" {
			continue
		}

		fv := de.Field(i)
		if !fv.IsValid() || !fv.CanSet() {
			continue
		}

		if name == "id" {
			id = fv.Int()
		} else {
			val, err := serialize(fv)
			if err != nil {
				return err
			}

			keys = append(keys, "`"+name+"`=?")
			vals = append(vals, val)
		}
	}

	if id < 0 {
		return ErrBadParam
	}

	builder.WriteString(strings.Join(keys, ","))
	builder.WriteString(fmt.Sprintf(" WHERE `id`=%d", id))

	_, err := Exec(builder.String(), vals...)
	if err != nil {
		return err
	}

	return nil
}

// Delete a record from data by ID
func Delete(table string, id int64) error {
	_, err := Exec("DELETE FROM `"+table+"` WHERE `id`=?", id)
	return err
}

func makeFiledDesc(fv reflect.Value, tag string) string {
	opts := strings.Split(tag, ",")
	isUnique := false
	isNotNull := false
	defaultValue := ""
	specialType := ""

	for _, opt := range opts {
		opt = strings.TrimSpace(opt)
		if opt == "unique" {
			isUnique = true
			continue
		}

		if opt == "notnull" {
			isNotNull = true
		}

		if strings.Index(opt, "default=") == 0 {
			defaultValue = opt[8:]
			continue
		}

		if strings.Index(opt, "type=") == 0 {
			specialType = opt[5:]
		}
	}

	extra := ""
	if isUnique {
		extra = extra + " UNIQUE"
	}

	if isNotNull {
		extra = extra + " NOT NULL"
	}

	if defaultValue != "" {
		extra = extra + " DEFAULT " + defaultValue
	}

	if specialType == "" {
		switch fv.Kind() {
		case reflect.Bool, reflect.Int8:
			specialType = "TINYINT"
		case reflect.Int16:
			specialType = "SMALLINT"
		case reflect.Int32:
			specialType = "INTEGER"
		case reflect.Int, reflect.Int64:
			specialType = "BIGINT"
		case reflect.Uint8:
			specialType = "TINYINT UNSIGNED"
		case reflect.Uint16:
			specialType = "SMALLINT UNSIGNED"
		case reflect.Uint32:
			specialType = "INTEGER UNSIGNED"
		case reflect.Uint64, reflect.Uint:
			specialType = "BIGINT UNSIGNED"
		case reflect.Float32:
			specialType = "FLOAT"
		case reflect.Float64:
			specialType = "DOUBLE"
		case reflect.String:
			specialType = "TEXT"
		case reflect.Struct:
			if fv.Type() == reflect.TypeOf(time.Time{}) {
				specialType = "TIMESTAMP"
			} else {
				specialType = "TEXT"
			}
		default:
			specialType = "TEXT"
		}
	}

	return specialType + extra
}

func serialize(v reflect.Value) (interface{}, error) {
	switch v.Kind() {
	case reflect.Bool:
		return v.Bool(), nil
	case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64:
		return v.Int(), nil
	case reflect.Uint, reflect.Uint8, reflect.Uint16, reflect.Uint32, reflect.Uint64:
		return v.Uint(), nil
	case reflect.Float32, reflect.Float64:
		return v.Float(), nil
	case reflect.String:
		return v.String(), nil
	case reflect.Array, reflect.Slice:
		data, err := json.Marshal(v.Interface())
		if err != nil {
			return nil, err
		}

		return string(data), nil
	case reflect.Struct:
		if v.Type() == reflect.TypeOf(time.Time{}) {
			t := v.Interface().(time.Time)
			return t.Format(TimeFormat), nil
		}

		data, err := json.Marshal(v.Interface())
		if err != nil {
			return nil, err
		}

		return string(data), nil
	default:
		return nil, ErrUnsupportType
	}
}

func deserialize(v reflect.Value, raw []byte) error {
	if !v.IsValid() {
		return nil
	}

	switch v.Kind() {
	case reflect.Bool:
		n, err := strconv.Atoi(string(raw))
		if err != nil {
			return err
		}

		v.SetBool(n != 0)
	case reflect.Int, reflect.Int8, reflect.Int16, reflect.Int32, reflect.Int64:
		n, err := strconv.ParseInt(string(raw), 10, 64)
		if err != nil {
			return err
		}

		v.SetInt(n)
	case reflect.Uint, reflect.Uint8, reflect.Uint16, reflect.Uint32, reflect.Uint64:
		n, err := strconv.ParseUint(string(raw), 10, 64)
		if err != nil {
			return err
		}

		v.SetUint(n)
	case reflect.Float32, reflect.Float64:
		n, err := strconv.ParseFloat(string(raw), 64)
		if err != nil {
			return err
		}

		v.SetFloat(n)
	case reflect.String:
		v.SetString(string(raw))
	case reflect.Array, reflect.Slice:
		err := json.Unmarshal(raw, v.Addr().Interface())
		if err != nil {
			return err
		}
	case reflect.Struct:
		if v.Type() == reflect.TypeOf(time.Time{}) {
			t, err := time.Parse(TimeFormat, string(raw))
			if err != nil {
				return err
			}

			v.Set(reflect.ValueOf(t))
			return nil
		}

		err := json.Unmarshal(raw, v.Addr().Interface())
		if err != nil {
			return err
		}
	default:
		return ErrUnsupportType
	}

	return nil
}
