package validator

import (
	"sync"

	"github.com/go-playground/validator/v10"
)

var (
	once     sync.Once
	instance *validator.Validate
)

func Get() *validator.Validate {
	once.Do(func() {
		instance = validator.New(validator.WithRequiredStructFields())
	})
	return instance
}

// Validate runs struct validation and returns a field->message map on failure.
func Validate(v any) map[string]string {
	err := Get().Struct(v)
	if err == nil {
		return nil
	}

	errs, ok := err.(validator.ValidationErrors)
	if !ok {
		return map[string]string{"_": err.Error()}
	}

	details := make(map[string]string, len(errs))
	for _, fe := range errs {
		details[fe.Field()] = fieldMessage(fe)
	}
	return details
}

func fieldMessage(fe validator.FieldError) string {
	switch fe.Tag() {
	case "required":
		return "is required"
	case "min":
		return "is too short (min " + fe.Param() + " chars)"
	case "max":
		return "is too long (max " + fe.Param() + " chars)"
	case "email":
		return "must be a valid email address"
	case "oneof":
		return "must be one of: " + fe.Param()
	default:
		return "is invalid"
	}
}
