import * as React from 'react';

import {makeClass} from './basic';
import './progress.css';

interface ProgressProps {
    percent: number;
    className?: string;
    style?: React.CSSProperties; 
};

export const Progress = (props: ProgressProps) => {
    const {percent, className, style} = props;

    return (
        <div {...makeClass('progress', className)} style={style}>
            <div className='progress-bar'>
                <div className='progress-value select-none pointer' style={{right: `${100-percent}%`}}>{percent.toFixed(2)}%</div>
                <div className='progress-percent' style={{right: `${100-percent}%`}}/>
            </div>
        </div>
    );
};