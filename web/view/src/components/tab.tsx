import * as React from 'react';

import {makeClass} from './basic';
import './tab.css';

interface PaneProps extends React.HTMLAttributes<HTMLDivElement> {
    label: React.ReactNode;
};

interface TabProps extends React.HTMLAttributes<HTMLDivElement> {
    defaultActive?: number;

    onTabChange?: () => void;
};

interface TabContextData {
    addHeader: (h: React.ReactNode) => void;
    delHeader: (h: React.ReactNode) => void;
};

export const Tab = (props: TabProps) => {
    const {defaultActive, onTabChange, className, children, ...nativeProps} = props;
    const [headers, setHeaders] = React.useState<React.ReactNode[]>([]);
    const [activeTab, setActiveTab] = React.useState<number>(defaultActive||0);

    const ctx: TabContextData = {
        addHeader: h => setHeaders(prev => [...prev, h]),
        delHeader: h => setHeaders(prev => {let ret = prev.slice(); ret.splice(prev.indexOf(h), 1); return ret}),
    };

    const handleTabClick = (idx: number) => {
        setActiveTab(idx);
        if (onTabChange) onTabChange();
    };

    return (
        <Tab.Context.Provider value={ctx}>
            <div {...makeClass('tab', className)} {...nativeProps}>
                <ul className='tab-nav'>
                    {headers.map((h, idx) => {
                        return <li key={idx} className={activeTab==idx?'tab-active':undefined} onClick={() => handleTabClick(idx)}>{h}</li>;
                    })}
                </ul>

                {React.Children.map(children, (child, idx) => {
                    return <div key={idx} {...makeClass('tab-pane', activeTab!=idx&&'tab-hide')}>{child}</div>;
                })}
            </div>
        </Tab.Context.Provider>
    );
};

Tab.Context = React.createContext<TabContextData>(null);

Tab.Pane = (props: PaneProps) => {
    const {label, className, children, ...nativeProps} = props;
    const ctx = React.useContext(Tab.Context);
    
    React.useEffect(() => {
        ctx.addHeader(label);
        return () => ctx.delHeader(label);
    }, []);

    return React.useMemo(() => <div {...nativeProps}>{children}</div>, [props]);
};
