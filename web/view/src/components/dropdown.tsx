import * as React from 'react';

import {makeClass} from './basic';
import './dropdown.css';

interface DropdownProps extends React.HTMLAttributes<any> {
    label: React.ReactNode;
    right?: boolean;
    trigger?: 'hover'|'click';
    onHide?: () => void;
};

export const Dropdown = (props: DropdownProps) => {
    const {label, right, trigger, onHide, className, children, ...nativeProps} = props;
    const [visible, setVisible] = React.useState<boolean>(false);
    
    const handleClick = () => {
        if (trigger == 'click') {
            if (visible && onHide) onHide();
            setVisible(prev => !prev);
        }
    }

    const handleHover = () => {
        if (trigger != 'click') setVisible(true);
    };

    const handleLeave = () => {
        if (trigger != 'click') {
            if (visible && onHide) onHide();
            setVisible(false);
        }
    };

    return (
        <div {...makeClass('dropdown', className)} {...nativeProps} onMouseLeave={handleLeave}>
            <div className='dropdown-label' onClick={handleClick} onMouseEnter={handleHover}>{label}</div>
            <div className={`anchor${visible?'':' hide'}`}>
                <div className='dropdown-content r-1' style={right?{left: 'auto', right: 0}:undefined}>        
                    {children}
                </div>
            </div>
        </div>
    );
};