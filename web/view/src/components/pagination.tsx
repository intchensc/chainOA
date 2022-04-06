import * as React from 'react';

import {Icon} from './icon';
import './pagination.css';

interface PaginationProps {
    current: number;
    total: number;

    onChange?: (page: number) => void,
};

export const Pagination = (props: PaginationProps) => {
    const [controls, setControls] = React.useState<React.ReactNode[]>([]);

    React.useEffect(() => {
        let ctrls: React.ReactNode[] = [];

        if (props.total <= 5) {
            for (let i = 0; i < props.total; i++) ctrls.push(makeItem(i));
        } else {
            if (props.current < 3) {
                for (let i = 0; i < 4; i++) ctrls.push(makeItem(i));
                ctrls.push(<button key='divider'>••</button>);
                ctrls.push(makeItem(props.total-1));
            } else if (props.current > props.total-4) {
                ctrls.push(makeItem(0));
                ctrls.push(<button key='divider'>••</button>);
                for (let i = props.total-4; i < props.total; i++) ctrls.push(makeItem(i));
            } else {
                ctrls.push(makeItem(0));
                ctrls.push(<button key='left-divider'>••</button>);
                for (let i = props.current-1; i <= props.current+1 && i < props.total-1; i++) ctrls.push(makeItem(i));
                ctrls.push(<button key='right-divider'>••</button>);
                ctrls.push(makeItem(props.total-1));
            }
        }

        setControls(ctrls);
    }, [props]);

    const makeItem = (idx: number) => {
        return (
            <button
                key={idx}
                className={idx==props.current ? 'pagination-active' : undefined} 
                onClick={() => moveTo(idx)}>
                {idx+1}
            </button>
        );
    };

    const moveTo = (page: number) => {
        if (props.onChange) props.onChange(page);
    };

    return (
        <div className='pagination'>
            <button key='prev' disabled={props.current<1} onClick={() => moveTo(props.current-1)}><Icon type='left'/></button>
            {controls}
            <button key='next' disabled={props.current+1>=props.total} onClick={() => moveTo(props.current+1)}><Icon type='right'/></button>
        </div>
    );
};