import * as React from 'react';
import * as moment from 'moment';

import {TaskBrief} from '../../common/protocol';
import {TaskStatus} from '../../common/consts';
import {Viewer} from './viewer';

interface GanttProps {
    tasks: TaskBrief[];
    onModified?: () => void;
};

export const Gantt = (props: GanttProps) => {
    const [summary, setSummary] = React.useState<JSX.Element>(null);
    const [timeline, setTimeline] = React.useState<JSX.Element>(null);
    const [brief, setBrief] = React.useState<JSX.Element>(null);
    const [graph, setGraph] = React.useState<JSX.Element>(null);
    const [scollWidth, setScrollWidth] = React.useState<number>(20);
    const timelineRef = React.useRef<HTMLDivElement>();
    const briefRef = React.useRef<HTMLDivElement>();

    const CellWidth = 36;
    const CellHeight = 22;

    React.useEffect(() => {
        let counter: {[key: string]: number} = {created: 0, underway: 0, testing: 0, finished: 0};
        let groups: {[key: number]: TaskBrief[]} = {};
        let start = moment().startOf('d');
        let end = moment().startOf('d');

        props.tasks.forEach(task => {
            switch (task.state) {
            case 0: counter.created++; break;
            case 1: counter.underway++; break;
            case 2: counter.testing++; break;
            case 3: counter.finished++; break;
            }

            if (!groups[task.developer.id]) {
                groups[task.developer.id] = [task];
            } else {
                groups[task.developer.id].push(task);
            }

            let taskStart = moment(task.startTime);
            let taskEnd = moment(task.endTime);

            if (start.diff(taskStart) > 0) {
                start = taskStart;
            }

            if (end.diff(taskEnd) < 0) {
                end = taskEnd;
            }
        });

        if (end.diff(start, 'd') < 45) end = moment(start).add(45, 'd');

        const inner = document.createElement('div');
        inner.style.overflowY = 'scroll';
        document.body.appendChild(inner);
        setScrollWidth(inner.offsetWidth - inner.clientWidth);
        document.body.removeChild(inner);

        makeSummary(counter);
        makeTimeline(start, end);
        makeBrief(groups);
        makeGraph(groups, start, end);
    }, [props.tasks]);

    const makeSummary = (counter: {[key: string]: number}) => {
        setSummary(
            <div style={{color: 'white', textAlign: 'center', marginBottom: 16}}>
                {TaskStatus.map(status => {
                    if (status.type == 'archived') return null;

                    return [
                        <span key={`${status.type}_title`} style={{backgroundColor: '#343a40', padding: '0 8px'}}>{status.name}</span>,
                        <span key={`${status.type}_number`} style={{backgroundColor: status.color, padding: '0 8px', marginRight: 16}}>{counter[status.type]}</span>,
                    ];
                })}
            </div>
        );
    };

    const makeTimeline = (start: moment.Moment, end: moment.Moment) => {
        interface IDay {
            day: number;
            weekday: string;
            isWeekend: boolean;
        }

        const _desc = ['日', '一', '二', '三', '四', '五', '六'];
        const _generate = (output: JSX.Element[], startX: number, days: IDay[], month: number) => {
            output.push(<text x={startX + days.length * CellWidth * 0.5} y={CellHeight * 0.5}>{month+1}月</text>);            
            output.push(<line x1={startX + days.length * CellWidth+0.5} y1={0} x2={startX + days.length * CellWidth+0.5} y2={CellHeight} fill='none' stroke='black'/>);

            days.forEach((info, idx) => {
                let posX = startX + idx * CellWidth;
                output.push(<text x={posX + CellWidth * 0.5} y={CellHeight * 1.5} fill={info.isWeekend ? 'goldenrod' : '#a7a7a7'}>{info.weekday}</text>);
                output.push(<text x={posX + CellWidth * 0.5} y={CellHeight * 2.5} fill={info.isWeekend ? 'goldenrod' : '#a7a7a7'}>{info.day}</text>);
                output.push(<line x1={posX + CellWidth+0.5} y1={CellHeight} x2={posX + CellWidth+0.5} y2={CellHeight * 3} stroke='black'/>);                     
            });
        };
        
        let graphs: JSX.Element[] = [];
        let days: IDay[] = [];

        let width = (end.diff(start, 'd') + 1) * CellWidth;
        let month = start.month();
        let posX = 0;

        for (let cur = moment(start); cur.diff(end) <= 0; cur.add(1, 'd')) {
            if (cur.month() != month) {
                if (days.length > 0) _generate(graphs, posX, days, month);

                posX += days.length * CellWidth;
                days = [];
                month = cur.month();
            }

            let weekday = cur.weekday();
            days.push({
                day: cur.date(),
                weekday: _desc[weekday],
                isWeekend: weekday == 6 || weekday == 0,
            });
        }

        if (days.length > 0) _generate(graphs, posX, days, month);

        setTimeline(
            <div ref={timelineRef} style={{width: '100%', height: CellHeight * 3, overflow: 'hidden', border: '1px solid black', background: '#495057'}}>
                <svg width={width} height={CellHeight * 3}>
                    <g textAnchor='middle' dominantBaseline='middle' fill='#a7a7a7' style={{fontWeight: "bolder"}}>                 
                        {...graphs}
                    </g>

                    <path d={`M0 ${CellHeight+0.5} H${width} M0 ${CellHeight*2+0.5} H${width} Z`} fill='none' stroke='black'/>
                </svg>
            </div>
        );
    };

    const makeBrief = (groups: {[key:number]: TaskBrief[]}) => {
        if (props.tasks.length == 0) {
            setBrief(null);
            return;
        }

        let graphs: JSX.Element[] = [];
        let height = props.tasks.length * CellHeight;
        let posY = 0;

        for (const k in groups) {
            let tasks = groups[k];
            let groupH = tasks.length * CellHeight;
            graphs.push(<text x={40} y={posY + groupH * 0.5}>{tasks[0].developer.name}</text>);
            graphs.push(<line x1={0} y1={posY + groupH+0.5} x2={80} y2={posY + groupH+0.5} stroke='black' fill='none'/>);

            tasks.forEach((task, idx) => {
                let startY = posY + idx * CellHeight;
                graphs.push(<text x={230} y={startY + CellHeight*0.5}>{task.name.length > 20 ? (task.name.substr(0, 20) + '...') : task.name}</text>);
                graphs.push(<text x={420} y={startY + CellHeight*0.5}>{task.creator.name}</text>);
                graphs.push(<text x={500} y={startY + CellHeight*0.5}>{task.tester.name}</text>);
            });

            posY += groupH;
        }

        setBrief(
            <div
                ref={briefRef}
                style={{
                    width: 540, 
                    minWidth: 540, 
                    maxHeight: `calc(100vh - ${200+scollWidth}px)`, 
                    height: height, 
                    marginBottom: 16, 
                    overflow: 'hidden', 
                    border: '1px solid black', borderRight: 'none', borderTop: 'none', 
                    background: '#495057'}}>
                <svg width={540} height={height}>
                    <g textAnchor='middle' dominantBaseline='middle' fill='#a7a7a7'>
                        {...graphs}
                    </g>

                    <g stroke='black'>
                        <path d={`M80.5 0 V${height} M380.5 0 V${height} M460.5 0 V${height} Z`} />
                        {props.tasks.map((_, idx) => {
                            return <line x1={80} y1={(idx + 1) * CellHeight+0.5} x2={540} y2={(idx + 1) * CellHeight+0.5} />
                        })}
                    </g>                    
                </svg>
            </div>
        );
    };

    const makeGraph = (groups: {[key:number]: TaskBrief[]}, start: moment.Moment, end: moment.Moment) => {
        if (props.tasks.length == 0) {
            setGraph(null);
            return;
        }

        let items: JSX.Element[] = [];
        let grid: JSX.Element[] = [];

        let days = end.diff(start, 'd') + 1;
        let width = days * CellWidth;
        let height = props.tasks.length * CellHeight;
        let count = 0;

        for (let i = 1; i < days; ++i) {
            grid.push(<line x1={CellWidth*i+0.5} y1={0} x2={CellWidth*i+0.5} y2={height} stroke='#b8b9bb'/>);
        }

        for (let i = 1; i < props.tasks.length; ++i) {
            grid.push(<line x1={0} y1={CellHeight*i+0.5} x2={width} y2={CellHeight*i+0.5} stroke='#b8b9bb'/>);
        }

        grid.push(<line x1={0} y1={CellHeight*props.tasks.length-0.5} x2={width} y2={CellHeight*props.tasks.length-0.5} stroke='#b8b9bb'/>);

        for (const k in groups) {
            let tasks = groups[k];
            tasks.forEach(task => {
                let used = moment(task.endTime).diff(moment(task.startTime), 'd') + 1;
                let tid = task.id;
                let offset = moment(task.startTime).diff(start, 'd');

                items.push(<rect 
                    x={offset*CellWidth+2} 
                    y={count*CellHeight+2}
                    rx={8}
                    ry={8}
                    opacity={0.9}
                    width={used*CellWidth-4} 
                    height={CellHeight-4} 
                    fill={TaskStatus[task.state].color} 
                    onClick={() => Viewer.open(task.id, props.onModified)}/>);

                items.push(<text
                    x={offset*CellWidth+CellWidth*0.5} 
                    y={count*CellHeight+CellHeight*0.5}
                    fill='white'
                    style={{fontSize: '10px'}}>{used}天</text>);

                count++;
            })
        }

        setGraph(
            <div style={{width: '100%', maxHeight: 'calc(100vh - 200px)', overflow: 'auto', border: '1px solid #b8b9bb'}} onScroll={syncScroll}>
                <svg width={width} height={height}>
                    {...grid}

                    <g textAnchor='middle' dominantBaseline='middle'> 
                        {...items}
                    </g>
                </svg>
            </div>
        );
    };

    const syncScroll = (ev: React.UIEvent<HTMLDivElement>) => {
        timelineRef.current.scrollLeft = ev.currentTarget.scrollLeft;
        briefRef.current.scrollTop = ev.currentTarget.scrollTop;
    };

    return (
        <div style={{width: '100%', maxHeight: '100%'}}>
            {summary}

            <div style={{display: 'flex'}}>                
                <div style={{width: 540, height: CellHeight * 3, border: '1px solid black', borderRight: 'none', background: '#495057'}}>
                    <svg width={540} height={CellHeight * 3}>
                        <path d={`M80.5 0 V${CellHeight*3} M380.5 0 V${CellHeight*3} M460.5 0 V${CellHeight*3} Z`} stroke='black'/>
                        <g textAnchor='middle' dominantBaseline='middle' fill='#a7a7a7' style={{fontWeight: "bolder"}}>                  
                            <text x={40} y={CellHeight*1.5}>开发人员</text>
                            <text x={230} y={CellHeight*1.5}>任务内容</text>
                            <text x={420} y={CellHeight*1.5}>发起者</text>
                            <text x={500} y={CellHeight*1.5}>验收人员</text>
                        </g>
                    </svg>
                </div>

                {timeline}
            </div>

            <div style={{display: 'flex'}}>
                {brief}
                {graph}
            </div>
        </div>
    );
};