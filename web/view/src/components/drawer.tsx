import * as React from 'react';
import * as ReactDOM from 'react-dom';

import {makeClass, makeId} from './basic';
import {Icon} from './icon';
import './drawer.css';

interface DrawerInstance {
    id: string;
    el: React.RefObject<HTMLDivElement>;
    width: number;
};

interface DrawerProps {
    id?: string;
    width: number;
    header?: React.ReactNode;
    body: React.ReactNode;
    hideClose?: boolean;
    onClose?: () => void;
};

export const Drawer = (props: DrawerProps) => {
    const {id, width, header, body, hideClose, onClose} = props;
    const ref = React.useRef<HTMLDivElement>();

    React.useEffect(() => {
        Drawer.instances.push({id: id, el: ref, width: width});
        setTimeout(() => Drawer.update(), 0.001);
    }, []);

    return (
        <div className='drawer'>
            <div className='drawer-mask' onClick={onClose}/>
            <div ref={ref} className='drawer-pane' style={{width: width}}>
                <div className='drawer-body'>
                    {header&&<div {...makeClass('drawer-header', !hideClose&&'drawer-header-closeable')}>
                        {header}
                        {!hideClose&&<Icon type='close' onClick={onClose}/>}
                    </div>}
                    {body}
                </div>
            </div>
        </div>
    );
};

Drawer.instances = [] as DrawerInstance[];

Drawer.update = () => {
    let num = Drawer.instances.length;
    if (num == 0) return;

    let offsets = 0;
    for (let i = num - 1; i >= 0; i--) {
        let ins = Drawer.instances[i];
        
        offsets += ins.width;
        ins.el.current.style.transform = `translateX(-${offsets}px)`;
    }
};

Drawer.open = (cfg: DrawerProps) => {
    const id = cfg.id||makeId();
    const onClose = cfg.onClose;
    const mount = document.createElement('div');
    document.body.appendChild(mount);

    const closer = () => {
        let idx = Drawer.instances.findIndex(v => v.id == id);
        if (idx < 0) return;

        let ins = Drawer.instances[idx];
        mount.className = 'drawer-hiding';
        ins.el.current.addEventListener('transitionend', () => {
            if (onClose) onClose();
            ReactDOM.unmountComponentAtNode(mount);
            mount.remove();
        });

        Drawer.instances.splice(idx, 1);
        Drawer.update();
    }

    cfg.id = id;
    cfg.width = Math.max(cfg.width, 150);
    cfg.onClose = closer;

    ReactDOM.render(<Drawer {...cfg}/>, mount);
    return closer;
};
