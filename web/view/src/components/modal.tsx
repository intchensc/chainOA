import * as React from 'react';
import * as ReactDOM from 'react-dom';

import {Button} from './button';
import {Icon} from './icon';
import './modal.css';

interface ModelConfigure {
    title: string;
    body: React.ReactNode;

    icon?: 'info'|'warning'|'error';
    okCaption?: string;
    cancelCaption?: string;

    onOk: () => any;
    onCancel?: () => void;
};

export const Modal = {
    __icons: {info: 'info-circle', warning: 'warning-circle', error: 'error'} as any,
    __iconColors: {info: 'fg-success', warning: 'fg-warning', error: 'fg-danger'} as any,

    open: (cfg: ModelConfigure) => {
        const mount = document.createElement('div');
        document.body.appendChild(mount);

        const closer = () => {
            ReactDOM.unmountComponentAtNode(mount);
            mount.remove();
        }

        const onSure = () => {
            let ret = cfg.onOk();
            if (ret !== undefined && ret === false) return;
            closer();            
        };

        const onClose = () => {
            if (cfg.onCancel) cfg.onCancel();
            closer();
        };

        ReactDOM.render(
            <div className='modal'>
                <div className='modal-mask'/>
                <div className='modal-dialog'>
                    <div className='modal-header'>
                        <span>
                            {cfg.icon&&<Icon className={`mr-2 ${Modal.__iconColors[cfg.icon]}`} type={Modal.__icons[cfg.icon]}/>}
                            {cfg.title}
                        </span>
                        <Icon type='close' onClick={onClose}/>
                    </div>

                    <div className='modal-body'>
                        {cfg.body}
                    </div>

                    <div className='modal-footer'>
                        <Button theme='primary' size='sm' onClick={onSure}>{cfg.okCaption||'确定'}</Button>
                        <Button className='ml-2' size='sm' onClick={onClose}>{cfg.cancelCaption||'取消'}</Button>
                    </div>
                </div>
            </div>,
            mount);

        return closer;
    }
};