package document

import (
	"errors"
	"time"

	"team/common/orm"
	"team/model/user"
)

type (
	// Document schema
	Document struct {
		ID       int64     `json:"id"`
		Parent   int64     `json:"parent" orm:"default='-1'"`
		Title    string    `json:"title" orm:"type=VARCHAR(64),notnull"`
		Author   int64     `json:"author"`
		Modifier int64     `json:"modifier"`
		Time     time.Time `json:"time" orm:"default=CURRENT_TIMESTAMP"`
		Content  string    `json:"content"`
	}
)

// GetAll returns all documents from db.
func GetAll() ([]map[string]interface{}, error) {
	docs := []map[string]interface{}{}

	rows, err := orm.Query("SELECT * FROM `document`")
	if err != nil {
		return docs, err
	}

	defer rows.Close()

	for rows.Next() {
		one := &Document{}

		if err = orm.Scan(rows, one); err != nil {
			return docs, err
		}

		creator, _ := user.FindInfo(one.Author)
		modifier, _ := user.FindInfo(one.Modifier)

		docs = append(docs, map[string]interface{}{
			"id":       one.ID,
			"parent":   one.Parent,
			"title":    one.Title,
			"creator":  creator,
			"modifier": modifier,
			"tile":     one.Time.Format("2006-01-02"),
		})
	}

	return docs, nil
}

// Find document by ID
func Find(ID int64) (*Document, error) {
	doc := &Document{ID: ID}
	err := orm.Read(doc)
	return doc, err
}

// Add a new document.
func Add(creator, parent int64, title string) error {
	rows, err := orm.Query("SELECT COUNT(*) FROM `document` WHERE `parent`=? AND `title`=?", parent, title)
	if err != nil {
		return err
	}

	defer rows.Close()

	count := 0
	rows.Next()
	rows.Scan(&count)
	if count != 0 {
		return errors.New("同级目录下已存在同名文档")
	}

	_, err = orm.Insert(&Document{
		Parent:   parent,
		Title:    title,
		Author:   creator,
		Modifier: creator,
		Time:     time.Now(),
		Content:  "",
	})

	return err
}

// Delete a document.
func Delete(ID int64) {
	doc := &Document{ID: ID}
	err := orm.Read(doc)
	if err != nil {
		return
	}

	orm.Exec("UPDATE `document` SET `parent`=? WHERE `parent`=?", doc.Parent, ID)
	orm.Delete("document", ID)
}

// Save modified document.
func (d *Document) Save() error {
	return orm.Update(d)
}
