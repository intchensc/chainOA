import * as React from 'react';

import {makeClass} from './basic';
import './form.css';

export interface FormProxy {
    submit: () => void;
};

export interface FormFieldValidator {
    required?: string;
    pattern?: {test: RegExp, message: string};
    range?: {min: number, max: number, message: string};
    length?: {min: number, max: number, message: string};
    equalWith?: {field: string, message: string};
    custom?: (val: string|string[]|number) => string;
};

interface FormProxyWithWrappers extends FormProxy {
    target: React.Ref<HTMLFormElement>;
    errors: {[key: string]: string};
    isFieldRequired: (field: string) => boolean;
    wrapOnChange: (h: React.ChangeEventHandler<HTMLFormElement>) => React.ChangeEventHandler<HTMLFormElement>;
    wrapOnSubmit: (h: React.FormEventHandler<HTMLFormElement>) => React.FormEventHandler<HTMLFormElement>;
}

interface FormProps extends React.FormHTMLAttributes<HTMLFormElement> {
    form: FormProxy | (() => FormProxy);
};

interface FormFieldProps extends React.HTMLAttributes<HTMLDivElement> {
    htmlFor?: string;
    label?: React.ReactNode;
};

interface FormContextData {
    getFieldError: (field: string) => string;
    isFieldRequired: (field: string) => boolean;
}

export const Form = (props: FormProps) => {
    const {form, onChange, onSubmit, className, children, ...nativeProps} = props;

    let formProxy = form;
    if (typeof form == 'function') formProxy = form();

    const {target, errors, isFieldRequired, wrapOnChange, wrapOnSubmit} = (formProxy as FormProxyWithWrappers);
    const classes = makeClass('form', className);

    const ctx: FormContextData = {
        getFieldError: f => f&&errors[f],
        isFieldRequired: f => f&&isFieldRequired(f),
    };

    return (
        <Form.Context.Provider value={ctx}>
            <form ref={target} onChange={wrapOnChange(onChange)} onSubmit={wrapOnSubmit(onSubmit)} {...classes} {...nativeProps}>
                {children}
            </form>
        </Form.Context.Provider>
    );
};

Form.Context = React.createContext<FormContextData>(null);

Form.Field = (props: FormFieldProps) => {
    const {htmlFor, label, className, children, ...nativeProps} = props;
    const ctx = React.useContext(Form.Context);
    const err = ctx.getFieldError(htmlFor);
    const isRequired = ctx.isFieldRequired(htmlFor);

    return (
        <div {...makeClass('form-field', err != null && 'form-field-invalid', className)} {...nativeProps}>
            {label && <label className='form-field-label select-none pointer' htmlFor={htmlFor}>{label}{isRequired&&<span className='ml-1 fg-danger text-bold'>*</span>}</label>}
            <div className='form-field-control'>{children}</div>
            {err && <label className='form-field-error select-none pointer'>{err}</label>}
        </div>
    );
};

Form.useForm = (fields: {[k: string]: FormFieldValidator}): FormProxy => {
    const [errors, setErrors] = React.useState<{[key: string]: string}>({});
    const [submitted, setSubmitted] = React.useState<boolean>(false);
    const target = React.useRef<HTMLFormElement>(null);

    const getField = (name: string): string|string[]|number => {
        let el = target.current[name];
        if (!el) return null;

        if (el instanceof RadioNodeList) {
            let first: any = el[0];
            if (first.type == 'radio') {
                return el.value;
            } else {
                let selected: string[] = [];
                el.forEach((node: any) => { if (node.checked) selected.push(node.value) });
                return selected;
            }
        } else {
            let checkType: any = el;
            if (checkType.type == 'checkbox' || checkType.type == 'radio') {
                return checkType.checked;
            } else {
                return el.value;
            }
        }
    };

    const validate = () => {
        let newErrors: {[key: string]: string} = {};
        let errCount = 0;

        for (let k in fields) {
            let field = fields[k];
            let val = getField(k);

            if (field.custom) {
                let err = field.custom(val);
                if (err != null) {
                    newErrors[k] = err;
                    errCount++;
                }

                continue;
            }

            if (!val) {
                if (field.required) {
                    newErrors[k] = field.required;
                    errCount++;
                }

                continue;
            }

            if (field.equalWith && val != getField(field.equalWith.field)) {
                newErrors[k] = field.equalWith.message;
                errCount++;
                continue;
            }

            let valStr = val.toString();
            if (field.pattern && !field.pattern.test.test(valStr.toString())) {
                newErrors[k] = field.pattern.message;
                errCount++;
                continue;
            }

            if (field.length && (valStr.length < field.length.min || valStr.length > field.length.max)) {
                newErrors[k] = field.length.message;
                errCount++;
                continue;
            }

            if (field.range) {
                let check: number;

                if (typeof val != 'number') {
                    try {                    
                        check = parseFloat(val.toString());
                    } catch (e) {
                        check = Infinity;
                    }
                } else {
                    check = val;
                }

                if (check < field.range.min || check > field.range.max) {
                    newErrors[k] = field.range.message;
                    errCount++;
                }
            }
        }

        setErrors(newErrors);
        return errCount == 0;
    };

    const isFieldRequired = (name: string): boolean => {
        return (fields[name] && fields[name].required != null);
    };

    const submit = () => {
        let input = document.createElement('input');
        input.type = 'submit';
        target.current.appendChild(input);

        input.click();
        input.disabled = true;
        input.remove();
    };

    const wrapOnChange = (h: React.ChangeEventHandler<HTMLFormElement>) => {
        return (ev: React.ChangeEvent<HTMLFormElement>) => {
            if (submitted) validate();
            if (h) h(ev);
        };
    };

    const wrapOnSubmit = (h: React.FormEventHandler<HTMLFormElement>) => {
        return (ev: React.FormEvent<HTMLFormElement>) => {
            if (!submitted) setSubmitted(true);

            if (validate()) {
                if (h) h(ev);
            } else {
                ev.preventDefault();
            }
        };
    };

    const proxy: FormProxyWithWrappers = {
        submit,
        errors,
        target,
        wrapOnChange,
        wrapOnSubmit,
        isFieldRequired,
    };

    return proxy;
};
