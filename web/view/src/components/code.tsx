import * as React from 'react';

import {makeClass} from './basic';
import './code.css';

interface CodeProps extends React.HTMLAttributes<HTMLPreElement> {
    label?: string;
    data: string;
};

export const Code = (props: CodeProps) => {
    const {label, data, className, ...nativeProps} = props;
    const classes = makeClass('code', className);

    nativeProps.style = {
        ...nativeProps.style,
        borderLeft: '4px solid #C2C2C2',
    }

    return (
        <pre {...classes} {...nativeProps}>
            <h3 className='code-title'>{label||'代码'}</h3>
            <ol className='code-content'>
                {data&&data.split('\n').map((line, idx) => {
                    return <li key={idx}>{line}</li>
                })}
            </ol>
        </pre>
    );
};