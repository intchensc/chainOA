import * as React from 'react';
import * as ReactDOM from 'react-dom';

import {Icon} from './icon';
import {makeClass} from './basic';
import './image.css';

export const Image = (props: React.ImgHTMLAttributes<HTMLImageElement>) => {
    const {className, ...nativeProps} = props;

    const handleClick = (ev: React.MouseEvent<HTMLImageElement>) => {
        let layer = document.createElement('div');
        layer.className = 'imgviewer';
        document.body.appendChild(layer);
        ReactDOM.render([
            <div key='close' className='imgviewer-close' onClick={() => {ReactDOM.unmountComponentAtNode(layer); layer.remove()}}>
                <Icon type='close' className='fg-gray'/>
            </div>,
            <div key='content' className='imgviewer-panel'>
                <img src={ev.currentTarget.src}/>
            </div>
        ], layer);
    };

    return <img {...makeClass('img', className)} {...nativeProps} onClick={handleClick}/>
};