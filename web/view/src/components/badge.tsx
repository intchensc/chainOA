import * as React from 'react';

import {makeClass} from './basic';
import './badge.css';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
    theme?: 'default'|'primary'|'info'|'warning'|'danger'|'success'|'highlight';
};

const classByTheme = (theme: string) => {
    switch (theme) {
    case 'primary': return 'bg-primary fg-lightest';
    case 'info': return 'bg-info fg-lightest';
    case 'warning': return 'bg-warning fg-lightest';
    case 'danger': return 'bg-danger fg-lightest';
    case 'success': return 'bg-success fg-lightest';
    case 'highlight': return 'bg-black fg-white';
    default: return 'bg-gray fg-darkgray';
    }
};

export const Badge = (props: BadgeProps) => {
    const {theme, className, children, ...nativeProps} = props;
    const classes = makeClass(`badge`, classByTheme(theme||'default'), className);

    return <span {...classes} {...nativeProps}>{children}</span>
};

Badge.Dot = (props: BadgeProps) => {
    const {theme, className, children, ...nativeProps} = props;
    const classes = makeClass(`badge-dot`, classByTheme(theme||'default'), className);

    return <span {...classes} {...nativeProps}></span>
};