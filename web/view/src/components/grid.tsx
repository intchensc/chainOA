import * as React from 'react';

import {makeClass} from './basic';
import './grid.css';

interface RowProps extends React.HTMLAttributes<HTMLElement> {
    flex?: {
        align?: 'top' | 'middle' | 'bottom' | 'baseline';
        justify?: 'start' | 'end' | 'center' | 'space-around' | 'space-between';
    };
    space?: number;
};

interface ColProps extends React.HTMLAttributes<HTMLElement> {
    offset?: {xs?: number; sm?: number; md?: number; lg?: number};
    span?: {xs?: number; sm?: number; md?: number; lg?: number};
    hideIn?: ('xs'|'sm'|'md'|'lg')[];
};

interface GridContextData {
    space: number;
};

const GridContext = React.createContext<GridContextData>({space: 0});

export const Row = (props: RowProps) => {
    const {flex, space, className, children, ...nativeProps} = props;
    const classes = [];
    
    if (flex) {
        classes.push('row-flex');
        classes.push(`row-flex-${flex.align||'top'}`);
        classes.push(`row-flex-${flex.justify||'start'}`);
    } else {
        classes.push('row');
    }

    classes.push(className);
    return (
        <GridContext.Provider value={{space: space || 0}}>
            <div {...makeClass(...classes)} {...nativeProps}>
                {children}
            </div>
        </GridContext.Provider>        
    );
};

export const Col = (props: ColProps) => {
    const {offset, span, hideIn, children, ...nativeProps} = props;
    const classes = [`col`];

    if (offset) {
        let map: any = offset;
        for (let k in offset) classes.push(`col-${k}-offset${map[k]}`);
    }

    if (span) {
        let map: any = span;
        for (let k in span) classes.push(`col-${k}${map[k]}`);
    }

    if (hideIn) {
        hideIn.forEach(v => classes.push(`hide-${v}`));
    }

    if (nativeProps.className) classes.push(nativeProps.className);
    nativeProps.className = classes.join(' ');

    return (
        <GridContext.Consumer>
            {data => {
                if (data.space != 0) {
                    nativeProps.style = {
                        padding: `0 ${data.space / 2}px`,
                        ...nativeProps.style,
                    };
                }               

                return (
                    <div {...nativeProps}>
                        {children}
                    </div>
                );
            }}
        </GridContext.Consumer>
    );
}