package notice

import (
	"time"

	"team/common/orm"
	"team/model/user"
)

type (
	// Notice schema
	Notice struct {
		ID       int64     `json:"id"`
		Time     time.Time `json:"time" orm:"default=CURRENT_TIMESTAMP"`
		UID      int64     `json:"uid"`
		TID      int64     `json:"tid"`
		Operator int64     `json:"operator"`
		Event    int8      `json:"event"`
	}
)

// GetMine returns all notices of give user.
func GetMine(uid int64) []map[string]interface{} {
	list := []map[string]interface{}{}

	rows, err := orm.Query("SELECT `notice`.`id` AS id, `notice`.`tid` AS tid, `task`.`name` AS tname, `notice`.`operator` AS operator, `notice`.`time` AS time, `notice`.`event` AS ev FROM `notice` LEFT JOIN `task` ON `notice`.`tid`=`task`.`id` WHERE `uid`=?", uid)
	if err != nil {
		return list
	}

	defer rows.Close()

	type Note struct {
		ID       int64
		TID      int64
		TName    string
		Operator int64
		Time     time.Time
		Ev       int16
	}

	for rows.Next() {
		one := &Note{}
		if err = orm.Scan(rows, one); err != nil {
			return list
		}

		operator, _ := user.FindInfo(one.Operator)
		list = append(list, map[string]interface{}{
			"id":       one.ID,
			"tid":      one.TID,
			"tname":    one.TName,
			"operator": operator,
			"time":     one.Time.Format("2006-01-02 15:04:05"),
			"ev":       one.Ev,
		})
	}

	return list
}

// Add notice to db.
func Add(tid, operator, to int64, ev int8) {
	orm.Insert(&Notice{
		Time:     time.Now(),
		TID:      tid,
		UID:      to,
		Operator: operator,
		Event:    ev,
	})
}

// Delete notice by ID.
func Delete(ID int64) {
	orm.Delete("notice", ID)
}

// DeleteAllMine deletes all notices of mine.
func DeleteAllMine(uid int64) {
	orm.Exec("DELETE FROM `notice` WHERE `uid`=?", uid)
}
