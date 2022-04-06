package web

import (
	"errors"
	"strconv"
)

// Value holds request parameter.
type Value struct {
	data []string
}

var errMissing = errors.New("Parameter NOT exists")

// Bool returns parsed boolean value.
func (v *Value) Bool() (bool, error) {
	if v.data == nil || len(v.data) == 0 {
		return false, nil
	}

	return strconv.ParseBool(v.data[0])
}

// MustBool panics when Bool() returns error.
func (v *Value) MustBool(errMsg string) bool {
	b, e := v.Bool()
	Assert(e == nil, errMsg)
	return b
}

// Int returns parsed integer value
func (v *Value) Int() (int64, error) {
	if v.data == nil || len(v.data) == 0 {
		return 0, errMissing
	}

	return strconv.ParseInt(v.data[0], 10, 64)
}

// MustInt panics when Int() returns error.
func (v *Value) MustInt(errMsg string) int64 {
	n, e := v.Int()
	Assert(e == nil, errMsg)
	return n
}

// Ints returns parsed interger array
func (v *Value) Ints() ([]int, error) {
	if v.data == nil {
		return []int{}, errMissing
	}

	ret := []int{}
	for _, s := range v.data {
		n, err := strconv.ParseInt(s, 10, 64)
		if err != nil {
			return ret, err
		}

		ret = append(ret, int(n))
	}

	return ret, nil
}

// MustInts panics when Ints() returns error.
func (v *Value) MustInts(errMsg string) []int {
	n, e := v.Ints()
	Assert(e == nil, errMsg)
	return n
}

// Uint return parsed unsigned integer value.
func (v *Value) Uint() (uint64, error) {
	if v.data == nil || len(v.data) == 0 {
		return 0, errMissing
	}

	return strconv.ParseUint(v.data[0], 10, 32)
}

// MustUint panics when Uint() returns error
func (v *Value) MustUint(errMsg string) uint64 {
	u, e := v.Uint()
	Assert(e == nil, errMsg)
	return u
}

// Uints returns parsed unsigned interger array
func (v *Value) Uints() ([]uint64, error) {
	if v.data == nil {
		return nil, errMissing
	}

	ret := []uint64{}
	for _, s := range v.data {
		n, err := strconv.ParseUint(s, 10, 64)
		if err != nil {
			return nil, err
		}

		ret = append(ret, n)
	}

	return ret, nil
}

// MustUints panics when Uints() returns error
func (v *Value) MustUints(errMsg string) []uint64 {
	u, e := v.Uints()
	Assert(e == nil, errMsg)
	return u
}

// Float returns parsed float value.
func (v *Value) Float() (float64, error) {
	if v.data == nil || len(v.data) == 0 {
		return 0, errMissing
	}

	return strconv.ParseFloat(v.data[0], 32)
}

// MustFloat panics when Float() returns error.
func (v *Value) MustFloat(errMsg string) float64 {
	f, e := v.Float()
	Assert(e == nil, errMsg)
	return f
}

// Floats returns parsed float array
func (v *Value) Floats() ([]float64, error) {
	if v.data == nil {
		return nil, errMissing
	}

	ret := []float64{}
	for _, s := range v.data {
		n, err := strconv.ParseFloat(s, 64)
		if err != nil {
			return nil, err
		}

		ret = append(ret, n)
	}

	return ret, nil
}

// MustFloats panics when Floats() returns error.
func (v *Value) MustFloats(errMsg string) []float64 {
	f, e := v.Floats()
	Assert(e == nil, errMsg)
	return f
}

// String returns raw string value.
func (v *Value) String() string {
	if v.data == nil || len(v.data) == 0 {
		return ""
	}

	return v.data[0]
}

// MustString panics if named value NOT exists
func (v *Value) MustString(errMsg string) string {
	if v.data == nil || len(v.data) == 0 || len(v.data[0]) == 0 {
		panic(errors.New(errMsg))
	}

	return v.data[0]
}

// Strings returns raw string array value.
func (v *Value) Strings() []string {
	return v.data
}

// MustStrings panics if named value NOT exists
func (v *Value) MustStrings(errMsg string) []string {
	if v.data == nil {
		panic(errors.New(errMsg))
	}

	return v.data
}
