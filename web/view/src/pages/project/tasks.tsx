import * as React from 'react';

import {Button, Icon, Row, Input, Drawer} from '../../components';
import {TaskBrief, Project} from '../../common/protocol';
import {ProjectRole} from '../../common/consts';
import {request} from '../../common/request';

import {Creator} from '../task/creator';
import {Board} from '../task/board';
import {Gantt} from '../task/gantt';

export const Tasks = (props: {proj: Project, isAdmin: boolean}) => {
    const {proj, isAdmin} = props;

    const [isGantt, setIsGantt] = React.useState<boolean>(false);
    const [isFilterVisible, setFilterVisible] = React.useState<boolean>(false);
    const [tasks, setTasks] = React.useState<TaskBrief[]>([]);
    const [visibleTasks, setVisibleTask] = React.useState<TaskBrief[]>([]);
    const [filter, setFilter] = React.useState<{mem: number, mid: number, n: string}>({mem: -1, mid: -1, n: ''});

    React.useEffect(() => {
        fetchTasks();
    }, [proj]);

    React.useEffect(() => {
        let ret: TaskBrief[] = [];

        tasks.forEach(t => {
            if (filter.mid != -1 && (!t.milestone || t.milestone.id != filter.mid)) return;
            if (filter.n.length > 0 && t.name.indexOf(filter.n) == -1) return;
            if (filter.mem != -1) {
                if (t.creator.id != filter.mem && t.developer.id != filter.mem && t.tester.id != filter.mem) return;
            }

            ret.push(t);
        });

        setVisibleTask(ret);
    }, [tasks, filter]);

    const fetchTasks = () => {
        request({url: `/api/task/project/${proj.id}`, success: setTasks});
    };

    const publishTask = () => {
        let closer: () => void = null;

        closer = Drawer.open({
            width: 800,
            header: '发布任务',
            body: <div className='pt-2'><Creator proj={proj} onDone={() => {closer(); fetchTasks()}}/></div>, 
        });
    };

    const handleMemberChange = (ev: React.ChangeEvent<HTMLSelectElement>) => {
        let selected = parseInt(ev.target.value);
        setFilter(prev => {
            return {
                mem: selected,
                mid: prev.mid,
                n: prev.n
            }
        });
    };

    const handleMilestoneChange = (ev: React.ChangeEvent<HTMLSelectElement>) => {
        let selected = parseInt(ev.target.value);
        setFilter(prev => {
            return {
                mem: prev.mem,
                mid: selected,
                n: prev.n
            }
        });
    };

    const handleNameChange = (v: string) => {
        setFilter(prev => {
            return {
                mem: prev.mem,
                mid: prev.mid,
                n: v
            }
        });
    };

    const board = React.useMemo(() => <Board tasks={visibleTasks} onModified={isAdmin?fetchTasks:null}/>, [visibleTasks]);
    const gantt = React.useMemo(() => <Gantt tasks={visibleTasks} onModified={isAdmin?fetchTasks:null}/>, [visibleTasks]);

    return (
        <div>
            <div style={{padding: '0 8px', borderBottom: '1px solid #E2E2E2'}}>
                <Row flex={{align: 'middle', justify: 'space-between'}}>
                    <label className='text-bold fg-muted' style={{padding: "8px 0", fontSize: '1.2em'}}>{`【${proj.name}】任务列表`}</label>
                    <div>
                        <Button size='sm' onClick={() => fetchTasks()}><Icon className='mr-1' type='reload'/>刷新</Button>
                        <Button size='sm' onClick={() => setIsGantt(prev => !prev)}><Icon className='mr-1' type='view'/>{isGantt?'看板模式':'甘特图'}</Button>
                        <Button size='sm' theme={isFilterVisible?'primary':'default'} onClick={() => setFilterVisible(prev => !prev)}><Icon className='mr-1' type='filter'/>任务过滤</Button>
                        <Button size='sm' onClick={publishTask}><Icon className='mr-1' type='plus'/>发布任务</Button>
                    </div>
                </Row>

                <div className={`my-2 center-child ${isFilterVisible?'':' hide'}`}>
                    <div>
                        <label className='mr-1'>选择成员</label>
                        <Input.Select style={{width: 150}} value={filter.mem} onChange={handleMemberChange}>
                            <option key={'none'} value={-1}>无要求</option>
                            {proj.members.map(m => <option key={m.user.id} value={m.user.id}>【{ProjectRole[m.role]}】{m.user.name}</option>)}
                        </Input.Select>
                    </div>

                    <div className='ml-3'>
                        <label className='mr-1'>里程碑</label>
                        <Input.Select style={{width: 150}} value={filter.mid} onChange={handleMilestoneChange}>
                            <option key={'none'} value={-1}>无要求</option>
                            {proj.milestones.map((m, i) => <option key={i} value={m.id}>{m.name}</option>)}
                        </Input.Select>
                    </div>

                    <div className='ml-3'>
                        <label className='mr-1'>任务名</label>
                        <Input style={{width: 150}} value={filter.n} onChange={handleNameChange}/>
                    </div>

                    <Button className='ml-3' size='sm' onClick={() => setFilter({mem: -1, mid: -1, n: ''})}>重置</Button>
                </div>
            </div>
            
            <div className='px-2 mt-3'>
                {isGantt?gantt:board}
            </div>
        </div>
    );
};
