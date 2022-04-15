package project

import (
	"errors"
	"sync"
	"time"

	"team/common/orm"
	"team/model/user"
)

type (

	// Project schema
	Project struct {
		ID   int64  `json:"id"`
		Name string `json:"name" orm:"type=VARCHAR(64),unique,notnull"`
		Desc string `json:"-"`

		// Runtime data.
		Milestones []*Milestone `json:"milestones" orm:"-"`
		Members    []*Member    `json:"members" orm:"-"`
	}

	// Milestone schema
	Milestone struct {
		ID        int64     `json:"id"`
		PID       int64     `json:"-"`
		Name      string    `json:"name" orm:"type=VARCHAR(64),notnull"`
		StartTime time.Time `json:"-" orm:"notnull,default='2000-01-01'"`
		EndTime   time.Time `json:"-" orm:"notnull,default='2000-01-01'"`
		Desc      string    `json:"desc"`
	}

	Record struct {
		Owner      string `json:"owner"`
		Department string `json:"department"`
		Content    string `json:"content"`
		Uploader   string `json:"uploader"`
		UploadTime string `json:"uploadTime"`
		Historys   []HistoryItem
	}

	HistoryItem struct {
		TxId   string
		Record Record
	}

	// Member schema
	Member struct {
		ID      int64 `json:"id"`
		PID     int64 `json:"-"`
		UID     int64 `json:"-"`
		Role    int8  `json:"role"`
		IsAdmin bool  `json:"isAdmin"`

		// Runtime data
		User *user.User `json:"user" orm:"-"`
	}
)

var (
	// Global project cache.
	projectCache = sync.Map{}
)

// GetAll returns all projects in db
func GetAll() ([]*Project, error) {
	rows, err := orm.Query("SELECT * FROM `project`")
	if err != nil {
		return nil, err
	}

	defer rows.Close()

	projs := []*Project{}
	for rows.Next() {
		one := &Project{}
		if err = orm.Scan(rows, one); err != nil {
			return nil, err
		}

		projs = append(projs, one)
	}

	return projs, nil
}

// GetAllByUser returns all project that the given user has joined.
func GetAllByUser(uid int64) ([]*Project, error) {
	rows, err := orm.Query("SELECT * FROM `member` WHERE `uid`=?", uid)
	if err != nil {
		return nil, err
	}

	defer rows.Close()

	projs := []*Project{}
	for rows.Next() {
		one := &Member{}
		if err = orm.Scan(rows, one); err != nil {
			return nil, err
		}

		proj := Find(one.PID)
		if proj != nil {
			projs = append(projs, proj)
		}
	}

	return projs, nil
}

// Find project
func Find(ID int64) *Project {
	exists, ok := projectCache.Load(ID)
	if ok {
		return exists.(*Project)
	}

	proj := &Project{ID: ID}
	if err := orm.Read(proj); err != nil {
		return nil
	}

	proj.FetchMilestones()
	proj.FetchMembers()

	projectCache.Store(proj.ID, proj)
	return proj
}

// Add a new project.
func Add(name string, uid int64, role int8) error {
	rows, err := orm.Query("SELECT COUNT(*) FROM `project` WHERE `name`=?", name)
	if err != nil {
		return err
	}

	defer rows.Close()

	count := 0
	rows.Next()
	rows.Scan(&count)
	if count != 0 {
		return errors.New("同名项目已存在")
	}

	admin := user.Find(uid)
	if admin == nil {
		return errors.New("默认管理员不存在或已被删除")
	}

	if admin.IsLocked {
		return errors.New("默认管理员当前被禁止登录")
	}

	proj := &Project{Name: name, Milestones: []*Milestone{}, Members: []*Member{}}
	rs, err := orm.Insert(proj)
	if err != nil {
		return errors.New("写入新项目失败")
	}

	proj.ID, _ = rs.LastInsertId()
	proj.Members = append(proj.Members, &Member{PID: proj.ID, UID: uid, Role: role, IsAdmin: true, User: admin})
	orm.Insert(proj.Members[0])
	projectCache.Store(proj.ID, proj)
	return nil
}

// Delete an existed project by ID
func Delete(ID int64) {
	orm.Delete("project", ID)

	orm.Exec("DELETE FROM `milestone` WHERE `pid`=?", ID)
	orm.Exec("DELETE FROM `member` WHERE `pid`=?", ID)
	orm.Exec("DELETE FROM `task` WHERE `pid`=?", ID)

	projectCache.Delete(ID)
}

// SetDesc changes project's description.
func (p *Project) SetDesc(desc string) error {
	if _, err := orm.Exec("UPDATE `project` SET `desc`=? WHERE `id`=?", desc, p.ID); err != nil {
		return err
	}

	p.Desc = desc
	return nil
}

// Info returns detail information
func (p *Project) Info() map[string]interface{} {
	members := []map[string]interface{}{}
	for _, one := range p.Members {
		if !one.User.IsLocked {
			members = append(members, map[string]interface{}{
				"user":    one.User,
				"role":    one.Role,
				"isAdmin": one.IsAdmin,
			})
		}
	}

	milestones := []*Milestone{}
	now := time.Now()
	for _, one := range p.Milestones {
		if one.EndTime.After(now) {
			milestones = append(milestones, one)
		}
	}

	return map[string]interface{}{
		"id":         p.ID,
		"name":       p.Name,
		"milestones": milestones,
		"members":    members,
	}
}

// Summary returns project's detail information.
func (p *Project) Summary() map[string]interface{} {
	info := map[string]interface{}{
		"desc":       p.Desc,
		"members":    len(p.Members),
		"milestones": len(p.Milestones),
		"tasks":      0,
		"delayed":    0,
	}

	rowsTasks, err := orm.Query("SELECT COUNT(*) FROM `task` WHERE `state`<3 AND `pid`=?", p.ID)
	if err == nil {
		defer rowsTasks.Close()
		count := 0
		rowsTasks.Next()
		rowsTasks.Scan(&count)
		info["tasks"] = count
	}

	rowsDelayed, err := orm.Query("SELECT COUNT(*) FROM `task` WHERE `state`<3 AND `endtime`<? AND `pid`=?", time.Now().Format("2006-01-02"), p.ID)
	if err == nil {
		defer rowsDelayed.Close()
		count := 0
		rowsDelayed.Next()
		rowsDelayed.Scan(&count)
		info["delayed"] = count
	}

	return info
}

// FetchMilestones preloads all valid(NOT ended) milestones for this project.
func (p *Project) FetchMilestones() {
	p.Milestones = []*Milestone{}

	rows, err := orm.Query("SELECT * FROM `milestone` WHERE `pid`=?", p.ID)
	if err != nil {
		return
	}

	defer rows.Close()

	for rows.Next() {
		one := &Milestone{}
		if err = orm.Scan(rows, one); err != nil {
			continue
		}

		p.Milestones = append(p.Milestones, one)
	}
}

// GetMilestones returns readable milestones of this project.
func (p *Project) GetMilestones() []map[string]interface{} {
	list := []map[string]interface{}{}

	for _, one := range p.Milestones {
		list = append(list, map[string]interface{}{
			"id":        one.ID,
			"name":      one.Name,
			"startTime": one.StartTime.Format("2006-01-02"),
			"endTime":   one.EndTime.Format("2006-01-02"),
			"desc":      one.Desc,
		})
	}

	return list
}

// AddMilestone adds new milestone to this project.
func (p *Project) AddMilestone(name, desc string, startTime, endTime time.Time) error {
	add := &Milestone{
		PID:       p.ID,
		Name:      name,
		StartTime: startTime,
		EndTime:   endTime,
		Desc:      desc,
	}

	rs, err := orm.Insert(add)
	if err == nil {
		add.ID, _ = rs.LastInsertId()
		p.Milestones = append(p.Milestones, add)
	}

	return err
}

// DelMilestone deletes milestone by ID
func (p *Project) DelMilestone(mid int64) {
	orm.Delete("milestone", mid)
	orm.Exec("UPDATE `task` SET `mid`=-1 WHERE `mid`=?", mid)

	idx := -1
	for i, one := range p.Milestones {
		if one.ID == mid {
			idx = i
			break
		}
	}

	if idx > -1 {
		p.Milestones = append(p.Milestones[:idx], p.Milestones[idx+1:]...)
	}
}

// FindMilestone returns milestone by ID
func (p *Project) FindMilestone(mid int64) *Milestone {
	for _, one := range p.Milestones {
		if one.ID == mid {
			return one
		}
	}

	return nil
}

// EditMilestone modifies milestone in this project.
func (p *Project) EditMilestone(mid int64, name, desc string, start, end time.Time) error {
	milestone := p.FindMilestone(mid)
	if milestone == nil {
		return errors.New("编辑的里程碑不存在或已删除")
	}

	milestone.Name = name
	milestone.StartTime = start
	milestone.EndTime = end
	milestone.Desc = desc

	return orm.Update(milestone)
}

// FetchMembers preloads all members for this project.
func (p *Project) FetchMembers() {
	p.Members = []*Member{}

	rows, err := orm.Query("SELECT * FROM `member` WHERE `pid`=?", p.ID)
	if err != nil {
		return
	}

	defer rows.Close()

	for rows.Next() {
		one := &Member{}
		if err = orm.Scan(rows, one); err != nil {
			continue
		}

		u := user.Find(one.UID)
		if u != nil {
			one.User = u
			p.Members = append(p.Members, one)
		}
	}
}

// AddMember adds member to this project.
func (p *Project) AddMember(uid int64, role int8, isAdmin bool) error {
	add := &Member{
		PID:     p.ID,
		UID:     uid,
		Role:    role,
		IsAdmin: isAdmin,
	}

	rs, err := orm.Insert(add)
	if err == nil {
		add.ID, _ = rs.LastInsertId()
		add.User = user.Find(uid)
		p.Members = append(p.Members, add)
	}

	return err
}

// IsAdmin returns true if given user is administrator of this project.
func (p *Project) IsAdmin(uid int64) bool {
	for _, one := range p.Members {
		if one.UID == uid {
			return one.IsAdmin
		}
	}

	return false
}

// DelMember remove given user from this project.
func (p *Project) DelMember(uid int64) {
	backup := []*Member{}
	for _, one := range p.Members {
		if one.UID != uid {
			backup = append(backup, one)
		}
	}
	p.Members = backup
	orm.Exec("DELETE FROM `member` WHERE `pid`=? AND `uid`=?", p.ID, uid)
}

// Save project.
func (p *Project) Save() error {
	return orm.Update(p)
}

// Save modified member.
func (m *Member) Save() error {
	return orm.Update(m)
}
