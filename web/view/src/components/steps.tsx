import * as React from 'react';

import {makeClass} from './basic';
import './steps.css';

interface StepsProps extends React.HTMLAttributes<HTMLDivElement> {
    current: number;
};

interface StepProps extends React.HTMLAttributes<HTMLDivElement> {
    label: string;
};

interface StepsContextData {
    addStep: (s: string) => void;
    delStep: (s: string) => void;
};

export const Steps = (props: StepsProps) => {
    const {current, className, children, ...nativeProps} = props;
    const [headers, setHeaders] = React.useState<string[]>([]);

    const ctx: StepsContextData = {
        addStep: s => setHeaders(prev => [...prev, s]),
        delStep: s => setHeaders(prev => {let ret = prev.slice(); ret.splice(ret.indexOf(s), 1); return ret}),
    };

    return (
        <Steps.Context.Provider value={ctx}>
            <div {...makeClass('steps', className)} {...nativeProps}>
                <ul className='steps-header'>
                    {headers.map((h, idx) => {
                        return (
                            <li key={idx} {...makeClass('steps-nav', current==idx&&'steps-nav-active')}>
                                <div className='steps-nav-index text-center'>{idx+1}</div>
                                <span className='steps-nav-label'>{h}</span>
                            </li>
                        );
                    })}
                </ul>

                <div className='center-child'>
                    {React.Children.map(children, (child, idx) => {
                        return (
                            <div key={idx} {...makeClass('step', current!=idx&&'step-hide')}>
                                {child}
                            </div>
                        );
                    })}
                </div>
            </div>
        </Steps.Context.Provider>
    )
};

Steps.Context = React.createContext<StepsContextData>(null);

Steps.Step = (props: StepProps) => {
    const {label, className, children, ...nativeProps} = props;
    const ctx = React.useContext(Steps.Context);
    
    React.useEffect(() => {
        ctx.addStep(label);
        return () => ctx.delStep(label);
    }, []);

    return React.useMemo(() => <div {...nativeProps}>{children}</div>, [props]);
};