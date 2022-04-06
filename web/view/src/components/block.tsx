import * as React from 'react';

import {makeClass} from './basic';
import './block.css';

interface BlockProps extends React.HTMLAttributes<HTMLFieldSetElement> {
    label: string;
};

export const Block = (props: BlockProps) => {
    const {label, className, children, ...nativeProps} = props;
    const classes = makeClass('block', className);

    return (
        <fieldset {...classes} {...nativeProps}>
            <legend className='px-2'>{label}</legend>
            <div className='m-1'>
                {children}
            </div>
        </fieldset>
    );
};