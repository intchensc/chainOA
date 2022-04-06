package user

import (
	"crypto/md5"
	"encoding/base64"
	"encoding/json"
	"errors"
	"fmt"
	"sync"
	"time"

	"team/common/orm"
)

const (
	// AutoLoginCookieKey key to store auto login data in cookie
	AutoLoginCookieKey = "login_token"
	// AutoLoginSecret to sign login token
	AutoLoginSecret = "@team.auto_login_secret_01"
)

type (
	// User schema.
	User struct {
		ID              int64  `json:"id"`
		Account         string `json:"account" orm:"type=VARCHAR(64),unique,notnull"`
		Name            string `json:"name" orm:"type=VARCHAR(32),unique,notnull"`
		Avatar          string `json:"avatar" orm:"type=VARCHAR(128)"`
		Password        string `json:"-" orm:"type=CHAR(32)"`
		IsBuildin       bool   `json:"isBuildin"`
		IsSu            bool   `json:"isSu"`
		IsLocked        bool   `json:"isLocked"`
		AutoLoginExpire int64  `json:"-"`
	}

	// AutoLoginData holds auto login data.
	AutoLoginData struct {
		ID   int64
		IP   string
		Sign string
	}

	// AutoLoginCookie holds cookie data needs to send back to client
	AutoLoginCookie struct {
		Name    string
		Value   string
		Expires time.Time
	}
)

// Global user cache.
var userCache = sync.Map{}

// GetAll returns all users from db.
func GetAll() ([]*User, error) {
	users := []*User{}

	rows, err := orm.Query("SELECT * FROM `user`")
	if err != nil {
		return users, err
	}

	defer rows.Close()

	for rows.Next() {
		one := &User{}
		if err = orm.Scan(rows, one); err != nil {
			return users, err
		}

		one.Password = ""
		userCache.Store(one.ID, one)
		users = append(users, one)
	}

	return users, nil
}

// Find user by ID.
func Find(ID int64) *User {
	exists, ok := userCache.Load(ID)
	if ok {
		return exists.(*User)
	}

	user := &User{ID: ID}
	if err := orm.Read(user); err != nil {
		return nil
	}

	userCache.Store(ID, user)
	return user
}

// FindByAccount returns user by account
func FindByAccount(account string) *User {
	user := &User{Account: account}
	if err := orm.Read(user, "account"); err != nil {
		return nil
	}

	userCache.Store(user.ID, user)
	return user
}

// FindInfo returns name and avatar of user by ID.
func FindInfo(ID int64) (string, string) {
	exists := Find(ID)
	if exists == nil {
		return "Unknown", ""
	}

	return exists.Name, exists.Avatar
}

// AddBuildIn adds build-in account
func AddBuildIn(account, name, pswd string, isSu bool) error {
	hashPswd := md5.New()
	hashPswd.Write([]byte(pswd))

	one := &User{
		Account:   account,
		Name:      name,
		Avatar:    "",
		Password:  fmt.Sprintf("%X", hashPswd.Sum(nil)),
		IsSu:      isSu,
		IsBuildin: true,
		IsLocked:  false,
	}

	if err := Add(one); err != nil {
		return err
	}

	return nil
}

// AddExternal adds custom account.
func AddExternal(account string) (*User, error) {
	one := &User{
		Account:   account,
		Name:      account,
		Avatar:    "",
		IsSu:      false,
		IsBuildin: false,
		IsLocked:  false,
	}

	if err := Add(one); err != nil {
		return nil, err
	}

	return one, nil
}

// Add a new user.
func Add(added *User) error {
	rows, err := orm.Query("SELECT COUNT(*) FROM `user` WHERE `account`=? OR `name`=?", added.Account, added.Name)
	if err != nil {
		return err
	}

	defer rows.Close()

	count := 0
	rows.Next()
	rows.Scan(&count)
	if count != 0 {
		return errors.New("帐号或昵称已存在")
	}

	result, err := orm.Insert(added)
	if err != nil {
		return err
	}

	added.ID, _ = result.LastInsertId()
	userCache.Store(added.ID, added)
	return nil
}

// Delete an existed user.
func Delete(uid int64) {
	orm.Delete("user", uid)
	orm.Exec("DELETE FROM `member` WHERE `uid`=?", uid)
	userCache.Delete(uid)
}

// CheckAutoLogin checks cookie data for auto login. <0 means failed.
func CheckAutoLogin(data, ip string) int64 {
	j, err := base64.StdEncoding.DecodeString(data)
	if err != nil {
		return -1
	}

	param := &AutoLoginData{}
	err = json.Unmarshal(j, param)
	if err != nil || ip != param.IP {
		return -1
	}

	code := fmt.Sprintf("%d|%s|%s", param.ID, param.IP, AutoLoginSecret)
	hash := md5.New()

	hash.Write([]byte(code))
	sign := fmt.Sprintf("%X", hash.Sum(nil))
	if sign != param.Sign {
		return -1
	}

	user := Find(param.ID)
	if user == nil {
		return -1
	}

	now := time.Now()
	if user.IsLocked || user.AutoLoginExpire <= now.Unix() {
		return -1
	}

	return user.ID
}

// Rename an existing user.
func Rename(uid int64, name string) error {
	u := Find(uid)
	if u == nil {
		return fmt.Errorf("指定用户【%d】不存在或已被删除", uid)
	}

	if u.Name != name {
		_, err := orm.Exec("UPDATE `user` SET `name`=? WHERE `id`=?", name, uid)
		if err != nil {
			return fmt.Errorf("更新数据库失败！")
		}

		u.Name = name
		return nil
	}

	return nil
}

// SetPassword changes user's password
func SetPassword(uid int64, old, pswd string) error {
	u := &User{ID: uid}
	if err := orm.Read(u); err != nil {
		return err
	}

	if !u.IsBuildin {
		return errors.New("第三方帐号无法重置密码")
	}

	hashOld := md5.New()
	hashOld.Write([]byte(old))
	checkOld := fmt.Sprintf("%X", hashOld.Sum(nil))
	if checkOld != u.Password {
		return errors.New("原始密码错误")
	}

	hashNew := md5.New()
	hashNew.Write([]byte(pswd))
	wanted := fmt.Sprintf("%X", hashNew.Sum(nil))

	_, err := orm.Exec("UPDATE `user` SET `password`=? WHERE `id`=?", wanted, uid)
	return err
}

// GetAutoLoginCookie returns auto login cookie data.
func (u *User) GetAutoLoginCookie(ip string) *AutoLoginCookie {
	expire := time.Now().Add(30 * 24 * time.Hour)
	code := fmt.Sprintf("%d|%s|%s", u.ID, ip, AutoLoginSecret)
	sign := md5.New()
	sign.Write([]byte(code))

	token := &AutoLoginData{
		ID:   u.ID,
		IP:   ip,
		Sign: fmt.Sprintf("%X", sign.Sum(nil)),
	}

	j, err := json.Marshal(token)
	if err == nil {
		u.AutoLoginExpire = expire.Unix()
		orm.Update(u)

		return &AutoLoginCookie{
			Name:    AutoLoginCookieKey,
			Value:   base64.StdEncoding.EncodeToString(j),
			Expires: expire,
		}
	}

	return nil
}

// Save user data to database.
func (u *User) Save() error {
	_, err := orm.Exec("UPDATE `user` SET `name`=?,`avatar`=?,`issu`=?,`islocked`=? WHERE `id`=?", u.Name, u.Avatar, u.IsSu, u.IsLocked, u.ID)
	return err
}
