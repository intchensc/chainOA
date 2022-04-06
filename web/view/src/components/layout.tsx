import * as React from 'react';

import {makeClass} from './basic';
import './layout.css';

interface LayoutHeaderProps extends React.HTMLAttributes<HTMLElement> {
    theme?: 'dark' | 'light';
};

interface LayoutSiderProps extends React.HTMLAttributes<HTMLElement> {
    width?: number | string;
    theme?: 'dark' | 'light';
};

interface LayoutContextData {
    addSider: () => void;
    delSider: () => void;
};

export const Layout = (props: React.HTMLAttributes<HTMLElement>) => {
    const {className, children, ...nativeProps} = props;
    const [siders, setSiders] = React.useState<number>(0);
    const classes = makeClass('layout', siders>0&&'layout-has-sider', className);

    const ctx: LayoutContextData = {
        addSider: () => setSiders(prev => prev+1),
        delSider: () => setSiders(prev => prev-1),
    };

    return (
        <Layout.Context.Provider value={ctx}>
            <section {...classes} {...nativeProps}>
                {children}
            </section>
        </Layout.Context.Provider>
    );
};

Layout.Context = React.createContext<LayoutContextData>(null);

Layout.Header = (props: LayoutHeaderProps) => {
    const {theme, className, children, ...nativeProps} = props;
    const classes = makeClass('layout-header', `layout-header-${theme||'dark'}`, className);

    return React.useMemo(() => (
        <header {...classes} {...nativeProps}>
            {children}
        </header>
    ), [props]);
};

Layout.Sider = (props: LayoutSiderProps) => {
    const ctx = React.useContext(Layout.Context);
    
    const child = React.useMemo(() => {
        const {width, theme, className, children, ...nativeProps} = props;
        const desiredWidth = width ? (typeof width === 'number' ? `${width}px` : width) : '200px';
        const classes = makeClass('layout-sider', `layout-sider-${theme||'dark'}`, className);

        nativeProps.style = {
            ...nativeProps.style,
            flex: `0 0 ${desiredWidth}px`,
            maxWidth: desiredWidth,
            minWidth: desiredWidth,
            width: desiredWidth,
        };

        return <aside {...classes} {...nativeProps}>{children}</aside>;
    }, [props]);

    React.useEffect(() => {
        ctx.addSider();
        return () => ctx.delSider();
    }, []);

    return child;
};

Layout.Content = (props: React.HTMLAttributes<HTMLElement>) => {
    const {className, children, ...nativeProps} = props;
    const classes = makeClass('layout-content', className);

    return React.useMemo(() => (
        <main {...classes} {...nativeProps}>
            {children}
        </main>
    ), [props]);
};

Layout.Footer = (props: React.HTMLAttributes<HTMLElement>) => {
    const {className, children, ...nativeProps} = props;

    return React.useMemo(() => (
        <footer {...makeClass('layout-footer', className)} {...nativeProps}>
            {children}
        </footer>
    ), [props]);
};