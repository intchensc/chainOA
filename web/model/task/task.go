package task

import (
	"errors"
	"time"

	"team/common/orm"
	"team/model/notice"
	"team/model/project"
	"team/model/user"
)

// Task events.
const (
	EventCreate       = 0
	EventModName      = 1
	EventModState     = 2
	EventModTime      = 3
	EventModCreator   = 4
	EventModDeveloper = 5
	EventModTester    = 6
	EventModWeight    = 7
	EventModContent   = 8
	EventComment      = 9
)

var (
	// TimeInfinite is the time never reached.
	TimeInfinite, _ = time.Parse("2006-01-02", "2000-01-01")
)

type (
	// Task schema
	Task struct {
		ID          int64     `json:"id"`
		PID         int64     `json:"pid"`
		MID         int64     `json:"mid"`
		Creator     int64     `json:"creator"`
		Developer   int64     `json:"developer"`
		Tester      int64     `json:"tester"`
		Name        string    `json:"name" orm:"type=VARCHAR(128),notnull"`
		BringTop    bool      `json:"bringTop"`
		Weight      int8      `json:"weight"`
		State       int8      `json:"state"`
		StartTime   time.Time `json:"startTime" orm:"default=CURRENT_TIMESTAMP"`
		EndTime     time.Time `json:"endTime" orm:"notnull,default='2000-01-01'"`
		ArchiveTime time.Time `json:"archiveTime" orm:"notnull,default='2000-01-01'"`
		Content     string    `json:"content"`
	}

	// Attachment schema
	Attachment struct {
		ID   int64  `json:"id"`
		TID  int64  `json:"tid"`
		Name string `json:"name" orm:"type=VARCHAR(128),notnull"`
		Path string `json:"url" orm:"type=VARCHAR(128),notnull"`
	}

	// Comment schema
	Comment struct {
		ID      int64     `json:"id"`
		TID     int64     `json:"tid"`
		UID     int64     `json:"uid"`
		Time    time.Time `json:"time" orm:"default=CURRENT_TIMESTAMP"`
		Comment string    `json:"comment"`
	}

	// Event schema
	Event struct {
		ID    int64     `json:"id"`
		TID   int64     `json:"tid"`
		UID   int64     `json:"uid"`
		Event int8      `json:"ev"`
		Time  time.Time `json:"time" orm:"default=CURRENT_TIMESTAMP"`
		Extra string    `json:"extra"`
	}
)

// GetAllByUID returns tasks by user ID.
func GetAllByUID(uid int64) ([]map[string]interface{}, error) {
	rows, err := orm.Query(
		"SELECT `id`,`pid`,`mid`,`creator`,`developer`,`tester`,`name`,`bringtop`,`weight`,`state`,`starttime`,`endtime` "+
			"FROM `task` WHERE `state`<4 AND (`creator`=? OR `developer`=? OR `tester`=?)",
		uid, uid, uid)

	if err != nil {
		return nil, err
	}

	defer rows.Close()

	list := []map[string]interface{}{}
	for rows.Next() {
		one := &Task{}
		if err = orm.Scan(rows, one); err != nil {
			return nil, err
		}

		list = append(list, one.Brief())
	}

	return list, nil
}

// GetAllByPID returns tasks by project ID.
func GetAllByPID(pid int64) ([]map[string]interface{}, error) {
	rows, err := orm.Query(
		"SELECT `id`,`pid`,`mid`,`creator`,`developer`,`tester`,`name`,`bringtop`,`weight`,`state`,`starttime`,`endtime` "+
			"FROM `task` WHERE `state`<4 AND `pid`=?",
		pid)

	if err != nil {
		return nil, err
	}

	defer rows.Close()

	list := []map[string]interface{}{}
	for rows.Next() {
		one := &Task{}
		if err = orm.Scan(rows, one); err != nil {
			return nil, err
		}

		list = append(list, one.Brief())
	}

	return list, nil
}

// GetWeekReport returns tasks belongs this week.
func GetWeekReport(pid, weekStart int64) map[string]interface{} {
	end := weekStart + 3600*24*7

	undone := []map[string]interface{}{}
	done := []map[string]interface{}{}

	rowsUndone, err := orm.Query(
		"SELECT `id`,`pid`,`mid`,`creator`,`developer`,`tester`,`name`,`bringtop`,`weight`,`state`,`starttime`,`endtime` "+
			"FROM `task` WHERE `pid`=? AND UNIX_TIMESTAMP(`endtime`)<=? AND (`state`<4 OR UNIX_TIMESTAMP(`archivetime`)>?)",
		pid, end, end)
	if err == nil {
		defer rowsUndone.Close()

		for rowsUndone.Next() {
			one := &Task{}
			if err = orm.Scan(rowsUndone, one); err == nil {
				undone = append(undone, one.Brief())
			}
		}
	}

	rowsDone, err := orm.Query(
		"SELECT `id`,`pid`,`mid`,`creator`,`developer`,`tester`,`name`,`bringtop`,`weight`,`state`,`starttime`,`endtime` "+
			"FROM `task` WHERE `pid`=? AND `state`=4 AND UNIX_TIMESTAMP(`archivetime`)>=? AND UNIX_TIMESTAMP(`archivetime`)<=?",
		pid, weekStart, end)
	if err == nil {
		defer rowsDone.Close()

		for rowsDone.Next() {
			one := &Task{}
			if err = orm.Scan(rowsDone, one); err == nil {
				done = append(done, one.Brief())
			}
		}
	}

	return map[string]interface{}{
		"unarchived": undone,
		"archived":   done,
	}
}

// GetAllByMID returns tasks by project ID.
func GetAllByMID(mid int64) ([]map[string]interface{}, error) {
	rows, err := orm.Query(
		"SELECT `id`,`pid`,`mid`,`creator`,`developer`,`tester`,`name`,`bringtop`,`weight`,`state`,`starttime`,`endtime` "+
			"FROM `task` WHERE `mid`=?",
		mid)

	if err != nil {
		return nil, err
	}

	defer rows.Close()

	list := []map[string]interface{}{}
	for rows.Next() {
		one := &Task{}
		if err = orm.Scan(rows, one); err != nil {
			return nil, err
		}

		list = append(list, one.Brief())
	}

	return list, nil
}

// Find task by ID
func Find(ID int64) *Task {
	t := &Task{ID: ID}
	if err := orm.Read(t); err != nil {
		return nil
	}

	return t
}

// Add new task
func Add(name string, pid int64, mid int64, weight int8, bringTop bool, creator, developer, tester int64, startTime, endTime time.Time, content string) *Task {
	add := &Task{
		PID:         pid,
		MID:         mid,
		Creator:     creator,
		Developer:   developer,
		Tester:      tester,
		Name:        name,
		BringTop:    bringTop,
		Weight:      int8(weight),
		State:       0,
		StartTime:   startTime,
		EndTime:     endTime,
		ArchiveTime: TimeInfinite,
		Content:     content,
	}

	rs, err := orm.Insert(add)
	if err != nil {
		return nil
	}

	add.ID, _ = rs.LastInsertId()
	return add
}

// AddAttachment adds attachment file information to db.
func (t *Task) AddAttachment(name, url string) {
	orm.Insert(&Attachment{
		TID:  t.ID,
		Name: name,
		Path: url,
	})
}

// GetAttachments returns attachment files' list of this task.
func (t *Task) GetAttachments() []*Attachment {
	list := []*Attachment{}

	rows, err := orm.Query("SELECT * FROM `attachment` WHERE `tid`=?", t.ID)
	if err != nil {
		return list
	}

	defer rows.Close()

	for rows.Next() {
		one := &Attachment{}
		if err = orm.Scan(rows, one); err != nil {
			continue
		}

		list = append(list, one)
	}

	return list
}

// SetName changes task's name
func (t *Task) SetName(name string) error {
	if name == t.Name {
		return nil
	}

	_, err := orm.Exec("UPDATE `task` SET `name`=? WHERE `id`=?", name, t.ID)
	return err
}

// SetMember changes Creator/Developer/Tester of this project.
func (t *Task) SetMember(role string, uid int64) error {
	_, err := orm.Exec("UPDATE `task` SET `"+role+"`=? WHERE `id`=?", uid, t.ID)
	return err
}

// SetWeight changes task's weight.
func (t *Task) SetWeight(weight int8) error {
	_, err := orm.Exec("UPDATE `task` SET `weight`=? WHERE `id`=?", weight, t.ID)
	return err
}

// SetState changes task's state.
func (t *Task) SetState(operator int64, state int8, isAdmin bool) error {
	if state < 0 || state > 4 {
		return errors.New("非法的任务状态")
	}

	if !isAdmin {
		validOperator := false
		switch t.State {
		case 0:
			validOperator = (operator == t.Developer && state == 1)
		case 1:
			validOperator = (operator == t.Developer && state < 3)
		case 2:
			validOperator = (operator == t.Tester && state > 0 && state < 4) || operator == t.Creator
		case 3:
			validOperator = (operator == t.Tester && state > 0 && state < 3) || operator == t.Creator
		case 4:
			validOperator = operator == t.Creator
		}

		if !validOperator {
			return errors.New("无权限更改")
		}
	}

	if t.State == 4 {
		t.ArchiveTime = TimeInfinite
	} else if state == 4 {
		t.ArchiveTime = time.Now()
	}

	_, err := orm.Exec("UPDATE `task` SET `state`=?,`archivetime`=? WHERE `id`=?", state, t.ArchiveTime.Format("2006-01-02"), t.ID)
	return err
}

// SetTime changes task's timeline.
func (t *Task) SetTime(start, end time.Time) error {
	proj := project.Find(t.PID)
	if proj == nil {
		return errors.New("任务所属项目不存在或已删除")
	}

	milestone := proj.FindMilestone(t.MID)
	if milestone != nil {
		if start.Before(milestone.StartTime) || end.After(milestone.EndTime) {
			return errors.New("任务时间与所属里程碑不匹配")
		}
	}

	_, err := orm.Exec(
		"UPDATE `task` SET `starttime`=?,`endtime`=? WHERE `id`=?",
		start.Format("2006-01-02"), end.Format("2006-01-02"), t.ID)
	return err
}

// SetContent changes task's content.
func (t *Task) SetContent(content string) error {
	_, err := orm.Exec("UPDATE `task` SET `content`=? WHERE `id`=?", content, t.ID)
	return err
}

// AddComment for this task.
func (t *Task) AddComment(uid int64, content string) error {
	_, err := orm.Insert(&Comment{
		TID:     t.ID,
		UID:     uid,
		Time:    time.Now(),
		Comment: content,
	})

	return err
}

// GetComments returns all comments of this task
func (t *Task) GetComments() []map[string]interface{} {
	list := []map[string]interface{}{}

	rows, err := orm.Query("SELECT * FROM `comment` WHERE `tid`=?", t.ID)
	if err != nil {
		return list
	}

	defer rows.Close()

	for rows.Next() {
		one := &Comment{}
		if err = orm.Scan(rows, one); err != nil {
			return list
		}

		name, avatar := user.FindInfo(one.UID)

		list = append(list, map[string]interface{}{
			"time":    one.Time.Format("2006-01-02 15:04:05"),
			"user":    name,
			"avatar":  avatar,
			"content": one.Comment,
		})
	}

	return list
}

// LogEvent records operation log and notify all users related to this task.
func (t *Task) LogEvent(operator int64, ev int8, extra string) {
	orm.Insert(&Event{
		TID:   t.ID,
		UID:   operator,
		Event: ev,
		Time:  time.Now(),
		Extra: extra,
	})

	notified := map[int64]bool{}
	notified[t.Creator] = t.Creator == operator
	notified[t.Developer] = t.Developer == operator
	notified[t.Tester] = t.Tester == operator

	if !notified[t.Creator] {
		notice.Add(t.ID, operator, t.Creator, ev)
		notified[t.Creator] = true
	}

	if !notified[t.Developer] {
		notice.Add(t.ID, operator, t.Developer, ev)
		notified[t.Developer] = true
	}

	if !notified[t.Tester] {
		notice.Add(t.ID, operator, t.Tester, ev)
		notified[t.Tester] = true
	}
}

// GetEvents returns all events of this task.
func (t *Task) GetEvents() []map[string]interface{} {
	list := []map[string]interface{}{}

	rows, err := orm.Query("SELECT * FROM `event` WHERE `tid`=? ORDER BY `time` DESC", t.ID)
	if err != nil {
		return list
	}

	defer rows.Close()

	for rows.Next() {
		one := &Event{}
		if err = orm.Scan(rows, one); err != nil {
			return list
		}

		name, _ := user.FindInfo(one.UID)

		list = append(list, map[string]interface{}{
			"time":     one.Time.Format("2006-01-02 15:04:05"),
			"operator": name,
			"event":    one.Event,
			"extra":    one.Extra,
		})
	}

	return list
}

// Brief return brief message for this task.
func (t *Task) Brief() map[string]interface{} {
	creator := user.Find(t.Creator)
	developer := user.Find(t.Developer)
	tester := user.Find(t.Tester)
	proj := project.Find(t.PID)

	brief := map[string]interface{}{
		"id":   t.ID,
		"name": t.Name,
		"proj": map[string]interface{}{
			"id":   proj.ID,
			"name": proj.Name,
		},
		"bringTop": t.BringTop,
		"weight":   t.Weight,
		"state":    t.State,
		"creator": map[string]interface{}{
			"id":   creator.ID,
			"name": creator.Name,
		},
		"developer": map[string]interface{}{
			"id":   developer.ID,
			"name": developer.Name,
		},
		"tester": map[string]interface{}{
			"id":   tester.ID,
			"name": tester.Name,
		},
		"startTime": t.StartTime.Format("2006-01-02"),
		"endTime":   t.EndTime.Format("2006-01-02"),
	}

	if milestone := proj.FindMilestone(t.MID); milestone != nil {
		brief["milestone"] = map[string]interface{}{
			"id":   t.MID,
			"name": milestone.Name,
		}
	}

	return brief
}

// Detail returns detail information for this task.
func (t *Task) Detail() map[string]interface{} {
	proj := project.Find(t.PID)

	return map[string]interface{}{
		"id":          t.ID,
		"name":        t.Name,
		"proj":        proj,
		"milestone":   proj.FindMilestone(t.MID),
		"weight":      t.Weight,
		"state":       t.State,
		"creator":     user.Find(t.Creator),
		"developer":   user.Find(t.Developer),
		"tester":      user.Find(t.Tester),
		"startTime":   t.StartTime.Format("2006-01-02"),
		"endTime":     t.EndTime.Format("2006-01-02"),
		"content":     t.Content,
		"comments":    t.GetComments(),
		"events":      t.GetEvents(),
		"attachments": t.GetAttachments(),
	}
}

// Delete task.
func (t *Task) Delete() {
	orm.Delete("task", t.ID)
	orm.Exec("DELETE FROM `event` WHERE `tid`=?", t.ID)
	orm.Exec("DELETE FROM `notice` WHERE `tid`=?", t.ID)
}
