import * as React from 'react';

import {makeClass, makeId} from './basic';
import './menu.css';

interface MenuProps extends React.HTMLAttributes<HTMLUListElement> {
    theme?: 'dark' | 'light';
    mode?: 'vertical' | 'horizontal';
    width?: number | string;
    defaultActive?: string;
};

interface SubMenuProps extends React.HTMLAttributes<HTMLLIElement> {
    label: React.ReactNode;
    collapse?: 'true'|'false'|'disabled';
};

interface MenuContextData {
    menuId: string;
    submenuMode: 'vertical' | 'horizontal';
    getActiveMenuItem: () => string;
    setActiveMenuItem: (key: string) => void;
};

export const Menu = (props: MenuProps) => {
    const {mode, theme, width, defaultActive, className, children, ...nativeProps} = props;
    const [activeItem, setActiveItem] = React.useState<string>(defaultActive);
    const [menuId] = React.useState<string>(props.id || makeId());

    const context: MenuContextData = {
        menuId: menuId,
        submenuMode: mode || 'vertical', 
        getActiveMenuItem: () => activeItem,
        setActiveMenuItem: (k: string) => setActiveItem(k),
    };

    const makeChildren = (id: string) => {
        if (!children) return null;

        return React.Children.map(children, (child: any, idx: number) : React.ReactNode => {
            if (!child || !child.type) return child;
            
            const type = child.type;
            if (type.isSubMenu) {
                return makeSubMenu(child);
            } else if (type.isMenuItem) {
                return makeItem(child, 20);
            } else {
                return child;
            }
        });
    };

    const makeSubMenu = (node: any) => {
        const {props, ...otherAttrs} = node;
        const {style, children, ...otherProps} = props;

        let newStyle = {...style};
        if (!mode || mode === 'vertical') {
            newStyle.paddingLeft = 20;
            newStyle.paddingRight = 20;
        }

        let newChildren = React.Children.map(children, (child: any, idx: number) => {
            if (!child) return null;
            if (child.type && child.type.isMenuItem) return makeItem(child, 36);
            return child;
        });

        return {
            ...otherAttrs,
            props: {
                style: newStyle,
                children: newChildren,
                ...otherProps,
            }
        }
    };

    const makeItem = (node: any, offset: number) => {
        const {props, ...otherAttrs} = node;
        const {style, ...otherProps} = props;

        let newStyle = {...style};
        if (!mode || mode === 'vertical') {
            newStyle.paddingLeft = offset;
            newStyle.paddingRight = 20;
        }

        return {
            ...otherAttrs,
            props: {
                style: newStyle,
                ...otherProps,
            }
        }
    };

    if (width) {
        nativeProps.style = {...nativeProps.style, width: width};
    }

    return (
        <Menu.Context.Provider value={context}>
            <ul {...makeClass('menu', `menu-${mode||'verticle'}`, `menu-${theme||'light'}`, className)} role='menu' {...nativeProps}>
                {makeChildren(props.id || menuId)}
            </ul>
        </Menu.Context.Provider>
    );
};

Menu.Context = React.createContext<MenuContextData>(null);

Menu.Divider = () => {
    return <li className='menu-divider'></li>
};

const SubMenu = (props: SubMenuProps) => {
    const {label, collapse, style, children, ...nativeProps} = props;
    const [visible, setVisible] = React.useState<boolean>(collapse&&(collapse=='false'||collapse=='disabled'));
    const ctx = React.useContext(Menu.Context);
    const popup = React.useRef<HTMLDivElement>(null);

    // Fix React.onMouseLeave using 'mouseout' instead of 'mouseleave' event.
    React.useEffect(() => {
        if (!popup.current) return;

        if (ctx.submenuMode == 'vertical') {
            const autoToggle = () => { collapse!= 'disabled'&&setVisible(prev => !prev);}
            popup.current.addEventListener('click', autoToggle);
            return () => popup.current.removeEventListener('click', autoToggle);
        } else {
            const autoShow = () => setVisible(true);
            const autoHide = () => setVisible(false);
            popup.current.addEventListener('mouseenter', autoShow);
            popup.current.parentElement.addEventListener('mouseleave', autoHide);
            return () => {
                popup.current.removeEventListener('mouseenter', autoShow);
                popup.current.parentElement.removeEventListener('mouseleave', autoHide);
            };
        }
    }, [popup.current]);

    const handleSubMenuClick = () => {
        if (ctx.submenuMode == 'horizontal') setVisible(false);
    };

    return (
        <li className='menu-item-group' role='menuitem' {...nativeProps}>
            <div ref={popup} className={`submenu-title${visible?' submenu-opened':''}`} style={style}>
                {label}
                {collapse!='disabled'&&<i className='submenu-arrow'/>}
            </div>
            <ul className={visible?'submenu':'submenu-hide'} role='menu' onClick={handleSubMenuClick}>{children}</ul>
        </li>
    );
};

const Item = (props: React.HTMLAttributes<HTMLLIElement>) => {
    const {className, children, onClick, ...nativeProps} = props;
    const ctx = React.useContext(Menu.Context);
    const [itemId] = React.useState<string>(props.id||`${ctx.menuId}-${makeId()}`);
    const classes = makeClass('menu-item', ctx.getActiveMenuItem() === itemId && 'menu-item-active', className);

    const click = (ev: React.MouseEvent<any>) => {
        ctx.setActiveMenuItem(itemId);
        if (onClick) onClick(ev);
    };

    return (
        <li role='menuitem' {...classes} {...nativeProps} onClick={click}>
            {children}
        </li>
    );
};

SubMenu.isSubMenu = true;
Item.isMenuItem = true;

Menu.SubMenu = SubMenu;
Menu.Item = Item;

