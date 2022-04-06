import * as React from 'react';

import {makeClass} from './basic';
import {Icon} from './icon';
import './avatar.css';

interface AvatarProps extends React.HTMLAttributes<HTMLSpanElement> {
    size: number|string;
    src?: string;
    shape?: 'circle'|'square';
}

export const Avatar = (props: AvatarProps) => {
    const {src, shape, size, className, ...nativeProps} = props;
    const shapeClass = (shape||'circle') == 'circle' ? 'rounded' : 'r-1';

    nativeProps.style = {
        ...nativeProps.style,
        width: size,
        height: size,
    }

    return (
        (src && src.trim().length > 0) ? (
            <span {...makeClass('avatar', shapeClass, className)} {...nativeProps}>
                <img src={src}/>
            </span>
        ):(
            <span {...makeClass('avatar', 'bg-darkgray', shapeClass, className)} {...nativeProps}>
                <Icon className='fg-white' style={{fontSize: size, lineHeight: '1em'}} type='user'/>
            </span>
        )
    );
};
