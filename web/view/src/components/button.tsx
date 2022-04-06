import * as React from 'react';

import {makeClass} from './basic';
import './button.css';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
    theme?: 'default' | 'primary' | 'warning' | 'info' | 'success' | 'danger' | 'link';
    size?: 'lg' | 'sm' | 'xs';
    rounded?: boolean;
    fluid?: boolean;
}

export const Button = (props: ButtonProps) => {
    const {theme, size, rounded, fluid, className, children, ...nativeProps} = props;
    const classes = makeClass('btn', `btn-${theme||'default'}`, size && `btn-${size}`, rounded && 'rounded', fluid && 'w-100', className);
    return <button {...classes} {...nativeProps}>{children}</button>;
};

Button.Group = (props: React.HTMLAttributes<any>) => {
    const {className, children, ...nativeProps} = props;
    const classes = makeClass('btn-group', className);
    return <div {...classes} {...nativeProps}>{children}</div>;
};
