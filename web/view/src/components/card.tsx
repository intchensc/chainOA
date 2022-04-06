import * as React from 'react';

import {makeClass} from './basic';
import './card.css';

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
    header?: React.ReactNode;
    footer?: React.ReactNode;
    headerProps?: React.HTMLAttributes<HTMLDivElement>;
    footerProps?: React.HTMLAttributes<HTMLDivElement>;
    bodyProps?: React.HTMLAttributes<HTMLDivElement>;
    bordered?: boolean;
    shadowed?: boolean;
};

export const Card = (props: CardProps) => {
    const {header, headerProps, footer, footerProps, bodyProps, bordered, shadowed, className, children, ...nativeProps} = props;
    const classes = makeClass('card', bordered&&'card-bordered', shadowed&&'card-shadowed', className);

    const extendProps = (cssClass: string, property: React.HTMLAttributes<HTMLDivElement>) => {
        if (!property) return {className: cssClass};

        const {className, ...other} = property;
        return {
            ...other,
            ...makeClass(cssClass, className),
        };
    }

    return (
        <div {...classes} {...nativeProps}>
            {header && <div {...extendProps('card-header', headerProps)}>{header}</div>}
            <div {...extendProps('card-body', bodyProps)}>{children}</div>
            {footer && <div {...extendProps('card-footer', footerProps)}>{footer}</div>}
        </div>
    );
};