import * as React from 'react';

import {makeClass} from './basic';
import './timeline.css';

interface TimelineItemProps extends React.LiHTMLAttributes<HTMLLIElement> {
    icon?: React.ReactNode;
};

export const Timeline = (props: React.HTMLAttributes<HTMLUListElement>) => {
    const {className, children, ...nativeProps} = props;

    return (
        <ul {...makeClass('timeline', className)} {...nativeProps}>
            {children}
        </ul>
    );
};

Timeline.Item = (props: TimelineItemProps) => {
    const {icon, className, children, ...nativeProps} = props;

    return (
        <li {...makeClass('timeline-item', className)} {...nativeProps}>
            <span className='timeline-item-icon'>{icon||<i className='timeline-item-default-icon'/>}</span>
            <div className='timeline-item-content'>
                {children}
            </div>
        </li>
    );
};