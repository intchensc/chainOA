import * as React from 'react';
import * as moment from 'moment';

import {DragDropContext, Draggable, Droppable, ResponderProvided} from 'react-beautiful-dnd';

import {Badge, Button, Card, Col, Dropdown, Empty, Icon, Menu, Row} from '../../components';
import {TaskBrief} from '../../common/protocol';
import {TaskStatus, TaskWeight} from '../../common/consts';
import {request} from '../../common/request';
import {Viewer} from './viewer';

interface BoardProps {
    tasks: TaskBrief[];
    onModified?: () => void;
};

interface SortMethod {
    name: string;
    exec: (a: TaskBrief, b: TaskBrief) => number;
};

interface TaskGroup {
    sorter: number;
    tasks: TaskBrief[];
};

export const Board = (props: BoardProps) => {
    const [groups, setGroups] = React.useState<TaskGroup[]>([]);

    const sorters: SortMethod[] = [
        {
            name: '默认排序',
            exec: (a, b) => {
                if (a.bringTop != b.bringTop) {
                    return a.bringTop ? -1 : 1;
                } else if (a.weight != b.weight) {
                    return b.weight - a.weight;
                } else {
                    moment(a.endTime).diff(moment(b.endTime), 'd');
                }
            }
        },
        {
            name: '按发布时间',
            exec: (a, b) => {
                let offset = moment(a.startTime).diff(moment(b.startTime))
                if (offset != 0) return offset;
                
                if (a.weight != b.weight) {
                    return b.weight - a.weight;
                } else if (a.bringTop != b.bringTop) {
                    return a.bringTop ? -1 : 1;
                } else {
                    return 0;
                }
            }
        },
        {
            name: '按截止时间',
            exec: (a, b) => {
                let offset = moment(a.endTime).diff(moment(b.endTime))
                if (offset != 0) return offset;
                
                if (a.weight != b.weight) {
                    return b.weight - a.weight;
                } else if (a.bringTop != b.bringTop) {
                    return a.bringTop ? -1 : 1;
                } else {
                    return 0;
                }
            }
        },
    ];

    React.useEffect(() => {
        let ret: TaskGroup[] = [
            {sorter: groups[0]?groups[0].sorter:0, tasks: []},
            {sorter: groups[1]?groups[1].sorter:0, tasks: []},
            {sorter: groups[2]?groups[2].sorter:0, tasks: []},
            {sorter: groups[3]?groups[3].sorter:0, tasks: []},
        ];

        props.tasks.forEach(t => ret[t.state].tasks.push(t));
        ret.forEach(g => g.tasks.sort(sorters[g.sorter].exec));

        setGroups(ret);
    }, [props.tasks]);

    const onSort = (group: number, method: number) => {
        if (groups[group].sorter != method) {
            let ret = [...groups];
            ret[group].tasks.sort(sorters[method].exec);
            ret[group].sorter = method;
            setGroups(ret);
        }
    };

    const onDrop = (data: any, provided: ResponderProvided) => {
        if (!data.destination) return;

        let moveTo = TaskStatus.findIndex(v => v.type == data.destination.droppableId);
        if (moveTo < 0) return;

        request({
            url: `/api/task/${data.draggableId}/status`,
            method: 'PUT',
            data: new URLSearchParams({'moveTo': `${moveTo}`}),
            success: props.onModified,
        });
    };

    return (
        <DragDropContext onDragEnd={onDrop}>
            <Row space={8}>
                {groups.map((g, i) => {
                    const state = TaskStatus[i];

                    return (
                        <Col span={{xs:3}}>
                            <Card
                                headerProps={{className: 'p-0 fg-white'}}
                                bodyProps={{className: 'px-1 pb-1'}}
                                header={
                                    <Row flex={{align: 'middle', justify: 'space-between'}} style={{padding: '4px 8px', background: state.color}}>
                                        <span><Icon type={state.icon} className='mr-1'/>{state.name}</span>
                                        <div>
                                            <Dropdown right={i==3} label={<span style={{color: 'rgba(255, 255, 255, 0.65)', fontSize: 14, fontWeight: 'bold'}}>{sorters[g.sorter].name}</span>}>
                                                <Menu>
                                                    {sorters.map((s, j) => <Menu.Item key={j} onClick={() => onSort(i, j)}>{s.name}</Menu.Item>)}
                                                </Menu>
                                            </Dropdown>
                                            <Badge className='bg-white fg-dark ml-2'>{g.tasks.length}</Badge>
                                        </div>
                                    </Row>}
                                shadowed>

                                {g.tasks.length == 0 && (
                                    <Droppable droppableId={state.type} type='LIST'>
                                        {(provided, snapshot) => (
                                            <div ref={provided.innerRef} {...provided.droppableProps}>
                                                {snapshot.isDraggingOver?provided.placeholder:<Empty label='暂无数据'/>}
                                            </div>
                                        )}
                                    </Droppable>
                                )}

                                {g.tasks.length > 0 && (
                                    <Droppable droppableId={state.type} type='LIST'>
                                        {(provided, snapshot) => (
                                            <div ref={provided.innerRef} {...provided.droppableProps}>
                                                {g.tasks.map((t, i) => {
                                                    const weight = TaskWeight[t.weight];
                                                    const now = moment();
                                                    const endTime = moment(t.endTime);

                                                    return (
                                                        <Draggable draggableId={`${t.id}`} index={i} isDragDisabled={props.onModified == null}>
                                                            {(p, s) => (
                                                                <div ref={p.innerRef} {...p.draggableProps} {...p.dragHandleProps}>
                                                                    <Card key={t.id} className='my-1 fg-muted' bordered style={{borderLeft: `4px solid ${endTime.diff(now) < 0?'red':'gray'}`}}>
                                                                        <Row flex={{align: 'middle', justify: 'space-between'}} style={{fontSize: 12}}>
                                                                            <span><Icon type='pie-chart' className='mr-1'/>{t.proj.name}</span>
                                                                            <span><Icon type='branches' className='mr-1'/>{t.milestone?t.milestone.name:'默认'}</span>
                                                                        </Row>
                                                                        <Button
                                                                            theme='link' 
                                                                            className='p-0' 
                                                                            fluid 
                                                                            style={{textAlign: 'left', fontWeight: 'bold', textOverflow: 'ellipsis', whiteSpace: 'nowrap', overflow: 'hidden'}}
                                                                            onClick={() => Viewer.open(t.id, props.onModified)}>
                                                                            {t.bringTop&&<Badge theme='highlight' className='mr-1'>置顶</Badge>}
                                                                            <span style={{color: weight.color}}>{weight.name}</span>
                                                                            {t.name}
                                                                        </Button>
                                                                        <Row flex={{align: 'middle', justify: 'space-between'}} style={{fontSize: 12}}>
                                                                            <span><Icon type='calendar' className='mr-1'/>{t.endTime}</span>
                                                                            <span>
                                                                                {t.creator.name}<Icon type='right'/>{t.developer.name}<Icon type='right'/>{t.tester.name}
                                                                            </span>
                                                                        </Row>
                                                                    </Card>
                                                                </div>
                                                            )}
                                                        </Draggable>
                                                    );
                                                })}
                                                {snapshot.isDraggingOver&&provided.placeholder}
                                            </div>
                                        )}
                                    </Droppable>
                                )}
                            </Card>   
                        </Col>
                    );
                })}
            </Row>
        </DragDropContext>
    );
};