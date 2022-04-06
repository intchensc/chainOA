import * as React from 'react';

import {makeClass} from './basic';
import './blockquote.css';

export const Blockquote = (props: React.HTMLAttributes<HTMLDivElement>) => {
    const {className, children, ...nativeProps} = props;
    const classes = makeClass('blockquote', className);

    return (
        <div {...classes} {...nativeProps}>
            {children}
        </div>
    )
};
