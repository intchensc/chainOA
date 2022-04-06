import * as React from 'react';
import * as ReactDOM from 'react-dom';

import './loading.css';

export const Loading = () => {
    const [visible, setVisible] = React.useState<boolean>(false);

    // To avoid network shake, display loading after .05s
    React.useEffect(() => {
        let t = setTimeout(() => setVisible(true), 50);
        return () => clearTimeout(t);
    }, []);

    return (
        <div className='text-center' hidden={!visible}>
            <span className='loading-tips'>
                <svg className='loading-anim mr-2' style={{width: 14, height: 14, fill: 'currentColor', verticalAlign: 'middle', overflow: 'hidden'}} viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
                    <path d="M538.5344 266.4448a133.12 133.12 0 1 1 133.12-133.12 133.4272 133.4272 0 0 1-133.12 133.12zM255.0144 372.1984a121.6768 121.6768 0 1 1 121.6768-121.6768 121.856 121.856 0 0 1-121.6768 121.6768zM134.72 647.424a107.3664 107.3664 0 1 1 107.3664-107.264A107.52 107.52 0 0 1 134.72 647.424z m120.32 272.4608a90.9824 90.9824 0 1 1 90.9824-90.9824A91.1616 91.1616 0 0 1 255.04 919.8848zM538.5344 1024a79.36 79.36 0 1 1 79.36-79.36 79.36 79.36 0 0 1-79.36 79.36z m287.6928-134.144a64.1792 64.1792 0 1 1 64.1792-64.1792 64.3584 64.3584 0 0 1-64.1792 64.1792z m117.76-296.704a52.6336 52.6336 0 1 1 52.6592-52.6336 52.608 52.608 0 0 1-52.6336 52.6336z m-158.72-338.7136a40.96 40.96 0 1 1 12.0064 28.8512 40.5248 40.5248 0 0 1-12.0064-28.8512z"/>
                </svg>
                努力加载中，请稍后
            </span>
        </div>
    );
};

Loading.closer = [] as (() => void)[];

Loading.show = () => {
    const mount = document.createElement('div');
    mount.className = 'loading';
    document.body.appendChild(mount);

    Loading.closer.push(() => {
        ReactDOM.unmountComponentAtNode(mount);
        mount.remove();
    })

    ReactDOM.render(<Loading/>, mount);
};

Loading.hide = () => {
    if (Loading.closer.length == 0) return;
    let c = Loading.closer.splice(0, 1)[0];
    if (c) c();
};
