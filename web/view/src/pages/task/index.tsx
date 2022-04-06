import * as React from 'react';

import {Button, Icon, Row, Input} from '../../components';
import {TaskBrief, Project, ProjectMilestone} from '../../common/protocol';
import {request} from '../../common/request';

import {Board} from './board';
import {Gantt} from './gantt';

export const TaskPage = (props: {uid: number}) => {
    const [useGantt, setUseGantt] = React.useState<boolean>(false);
    const [tasks, setTasks] = React.useState<TaskBrief[]>([]);
    const [visibleTasks, setVisibleTask] = React.useState<TaskBrief[]>([]);
    const [projs, setProjs] = React.useState<Project[]>([]);
    const [isFilterVisible, setFilterVisible] = React.useState<boolean>(false);
    const [filter, setFilter] = React.useState<{p: number, m: number, n: string, me: number}>({p: -1, m: -1, n: '', me: -1});
    const [milestones, setMilestones] = React.useState<ProjectMilestone[]>([]);

    React.useEffect(() => {
        fetchTasks();
    }, []);

    React.useEffect(() => {
        let ret: TaskBrief[] = [];

        tasks.forEach(t => {
            if (filter.m != -1 && (!t.milestone || t.milestone.id != filter.m)) return;
            if (filter.n.length > 0 && t.name.indexOf(filter.n) == -1) return;
            if (filter.p != -1 && t.proj.id != filter.p) return;

            const roles: number[] = [t.creator.id, t.developer.id, t.tester.id];
            if (filter.me != -1 && roles[filter.me] != props.uid) return;
            ret.push(t);
        });

        setVisibleTask(ret);
    }, [tasks, filter]);

    const fetchTasks = () => {
        request({
            url: '/api/task/mine',
            success: (data: TaskBrief[]) => {
                let projects: Project[] = [];
                data.forEach(t => {
                    let idx = projects.findIndex(v => v.id == t.proj.id);
                    if (idx == -1) projects.push(t.proj);
                });
                setProjs(projects);
                setTasks(data);
            }
        });
    };

    const handleProjectChange = (ev: React.ChangeEvent<HTMLSelectElement>) => {
        let selected = parseInt(ev.target.value);
        let idx = projs.findIndex(v => v.id == selected);

        setMilestones(idx==-1?[]:projs[idx].milestones);
        setFilter(prev => {
            return {
                p: selected,
                m: -1,
                n: prev.n,
                me: prev.me,
            }
        });
    };

    const handleMilestoneChange = (ev: React.ChangeEvent<HTMLSelectElement>) => {
        let selected = parseInt(ev.target.value);
        setFilter(prev => {
            return {
                p: prev.p,
                m: selected,
                n: prev.n,
                me: prev.me,
            }
        });
    };

    const handleNameChange = (v: string) => {
        setFilter(prev => {
            return {
                p: prev.p,
                m: prev.m,
                n: v,
                me: prev.me,
            }
        });
    };

    const handleMyRoleChange = (ev: React.ChangeEvent<HTMLSelectElement>) => {
        let selected = parseInt(ev.target.value);
        setFilter(prev => {
            return {
                p: prev.p,
                m: prev.m,
                n: prev.n,
                me: selected,
            }
        });
    }

    const board = React.useMemo(() => <Board tasks={visibleTasks} onModified={fetchTasks}/>, [visibleTasks]);
    const gantt = React.useMemo(() => <Gantt tasks={visibleTasks} onModified={fetchTasks}/>, [visibleTasks]);

    return (
        <div>
            <div style={{padding: '0 8px', borderBottom: '1px solid #E2E2E2'}}>
                <Row flex={{align: 'middle', justify: 'space-between'}}>
                    <label className='text-bold fg-muted' style={{padding: "8px 0", fontSize: '1.2em'}}><Icon type='calendar' className='mr-2'/>任务列表</label>
                    <div>
                        <Button size='sm' onClick={() => fetchTasks()}><Icon className='mr-1' type='reload'/>刷新</Button>
                        <Button size='sm' onClick={() => setUseGantt(prev => !prev)}><Icon className='mr-1' type='view'/>{useGantt?'看板模式':'甘特图'}</Button>
                        <Button size='sm' theme={isFilterVisible?'primary':'default'} onClick={() => setFilterVisible(prev => !prev)}><Icon className='mr-1' type='filter'/>任务过滤</Button>
                    </div>
                </Row>

                <div className={`my-2 center-child ${isFilterVisible?'':' hide'}`}>
                    <div>
                        <label className='mr-1'>选择项目</label>
                        <Input.Select style={{width: 100}} value={filter.p} onChange={handleProjectChange}>
                            <option key={'none'} value={-1}>无要求</option>
                            {projs.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
                        </Input.Select>
                    </div>

                    <div className='ml-3'>
                        <label className='mr-1'>选择里程碑</label>
                        <Input.Select style={{width: 100}} value={filter.m} onChange={handleMilestoneChange}>
                            <option key={'none'} value={-1}>无要求</option>
                            {milestones&&milestones.map((m, i) => <option key={i} value={m.id}>{m.name}</option>)}
                        </Input.Select>
                    </div>

                    <div className='ml-3'>
                        <label className='mr-1'>我的角色</label>
                        <Input.Select style={{width: 100}} value={filter.me} onChange={handleMyRoleChange}>
                            <option value={-1}>无要求</option>
                            <option value={0}>发起者</option>
                            <option value={1}>开发者</option>
                            <option value={2}>测试人</option>
                        </Input.Select>
                    </div>

                    <div className='ml-3'>
                        <label className='mr-1'>任务名</label>
                        <Input style={{width: 150}} value={filter.n} onChange={handleNameChange}/>
                    </div>

                    <Button className='ml-3' size='sm' onClick={() => setFilter({p: -1, m: -1, n: '', me: -1})}>重置</Button>
                </div>
            </div>

            <div className='px-2 mt-3'>
                {useGantt?gantt:board}
            </div>
        </div>
    );
};
