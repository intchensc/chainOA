import * as React from 'react';

import {makeClass} from './basic';
import './breadcrumb.css';

export const Breadcrumb = (props: React.HTMLAttributes<HTMLSpanElement>) => {
    const {className, children, ...nativeProps} = props;
    const classes = makeClass('breadcrumb', className);
    const lastElement = React.Children.count(children)-1;

    return (
        <span {...classes} {...nativeProps}>
            {React.Children.map(children, (c, i) => {
                return i==lastElement?c:[c,<span className='mx-1 fg-muted text-bold'>/</span>]
            })}
        </span>
    );
};

Breadcrumb.Item = (props: React.HTMLAttributes<HTMLAnchorElement>) => {
    const {className, children, ...nativeProps} = props;
    const classes = makeClass('breadcrumb-item', className);

    return (
        <a {...classes} {...nativeProps}>
            {children}
        </a>
    );
};