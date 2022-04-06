import * as React from 'react';
import * as ReactDOM from 'react-dom';

import {Icon} from './icon';
import './notification.css';

type Placement = 'top-left'|'top-right'|'bottom-left'|'bottom-right'|'alert';
type AlertType = 'info'|'warning'|'error';

export const Notification = {
    __instances: ({} as {[key: string]: HTMLDivElement}),
    __icons: {info: 'info-circle', warning: 'warning-circle', error: 'error'} as any,
    __colors: {info: 'fg-success', warning: 'fg-warning', error: 'fg-danger'} as any,

    getContainer: (placement: Placement): HTMLDivElement => {
        const container = Notification.__instances[placement];
        if (container) return container;
    
        const div = document.createElement('div');
        document.body.appendChild(div);
        div.className = `notification notification-${placement}`;
        Notification.__instances[placement] = div;
        return div;
    },

    open: (caption: string, message: string, placement?: Placement, duration?: number) => {    
        const mount = document.createElement('div');
        Notification.getContainer(placement||'top-right').appendChild(mount);
    
        const closer = () => { ReactDOM.unmountComponentAtNode(mount); mount.remove(); };
        const timer = setTimeout(closer, duration||5000);
    
        ReactDOM.render(
            <div className='notice'>
                <div className='notice-title'>
                    <h3>{caption}</h3>
                    <Icon className='notice-close' type='close' onClick={() => {clearTimeout(timer); closer();}}/>
                </div>
                <p className='mt-2 fg-darkgray'>{message}</p>
            </div>,
            mount);
    },

    alert: (message: string, type?: AlertType) => {    
        const mount = document.createElement('div');
        const realtype = type||'error';
        Notification.getContainer('alert').appendChild(mount);

        setTimeout(() => { ReactDOM.unmountComponentAtNode(mount); mount.remove(); }, 5000);
    
        ReactDOM.render(
            <div className='mb-4'>
                <span className='alert'>
                    <Icon className={`mr-2 ${Notification.__colors[realtype]}`} type={Notification.__icons[realtype]}/> 
                    <span className='mr-2'>{message}</span>
                </span>
            </div>,
            mount);
    },
};