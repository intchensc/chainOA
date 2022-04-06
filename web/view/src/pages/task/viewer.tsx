import * as React from 'react';
import * as moment from 'moment';

import {Avatar, Button, Drawer, Row, Badge, Icon, Markdown, Tab, Timeline, Modal, Form, Input, Notification, Dropdown, Menu} from '../../components';
import {Task, TaskEvent} from '../../common/protocol';
import {TaskStatus, TaskWeight, ProjectRole} from '../../common/consts';
import {request} from '../../common/request';

const makeTaskEvent = (ev: TaskEvent) => {
    let desc = '';

    switch (ev.event) {
    case 0: desc = '创建了任务'; break;
    case 1: desc = '修改了任务名，原名：' + ev.extra; break;
    case 2: desc = '修改了任务状态为：' + TaskStatus[parseInt(ev.extra)].name; break;
    case 3: desc = '修改了任务的时间，原时间：' + ev.extra; break;
    case 4: desc = '移交了任务，原负责人：' + ev.extra; break;
    case 5: desc = '修改了任务开发者，原开发者：' + ev.extra; break;
    case 6: desc = '修改了任务的测试/验收人员，原人员：' + ev.extra; break;
    case 7: desc = '修改了任务的优先级，原优先级：' + ev.extra; break;
    case 8: desc = '修改了任务的具体内容'; break;
    case 9: desc = '评论了任务'; break;
    default: desc = '对任务的其他内容进行了修改'; break;
    }

    return <p><small>{ev.time}</small>  <strong>{ev.operator}</strong> {desc}</p>;
};

const TaskDetailReadOnly = (props: {task: Task}) => {
    const {task} = props;

    return (
        <div className='pt-3'>
            <Row flex={{align: 'middle', justify: 'space-between'}} className='mx-3 mb-3'>
                <span style={{fontWeight: 'bold', fontSize: 18, maxWidth: 340}} className='text-ellipsis'>
                    {task.name}
                </span>

                <span style={{fontSize: 12}}>
                    <Icon type='pie-chart' className='mr-1'/>{task.proj.name}
                    <Icon type='branches' className='ml-2 mr-1'/>{task.milestone?task.milestone.name:'默认'}
                    <Icon type={TaskStatus[task.state].icon} className='ml-2 mr-1'/>{TaskStatus[task.state].name}
                </span>
            </Row>

            <div className='divider-h mb-2'/>

            <span className='ml-3'>
                <Icon type='notification' className='mr-1'/>{task.creator.name}
                <Icon type='code' className='ml-3 mr-1'/>{task.developer.name}
                <Icon type='experiment' className='ml-3 mr-1'/>{task.tester.name}
                <Icon type='calendar' className='ml-3 mr-1'/>{moment(task.startTime).format('MM月DD日')} - {moment(task.endTime).format('MM月DD日')}
                <Icon type='tag' className='ml-3 mr-1'/>{TaskWeight[task.weight].name}
            </span>

            <div className='divider-h my-1'/>
            
            <div className='mt-3 mx-3' style={{minHeight: 300}}>
                <Markdown.Renderer source={task.content}/>
            </div>

            {task.attachments.length > 0 && (
                <div className='mt-3 mx-3'>
                    附件：
                    {task.attachments.map((a, i) => <a className='link' href={a.url}><Icon type='link' className='mr-1'/>{a.name}</a>)}
                </div>
            )}

            <div className='mt-2'>
                <Tab>
                    <Tab.Pane label='评论'>
                        {task.comments.map((c, i) => (
                            <Row key={i} flex={{align: 'top', justify: 'start'}} className='my-2 pl-2'>
                                <Avatar src={c.avatar} size={32} className='mt-1'/>
                                <div className='ml-2' style={{flex: 1}}>
                                    <p style={{fontSize: 12, marginBottom: 4}}><span>{c.user}</span><span className='ml-3' style={{color: '#ccc'}} title={c.time}>{moment(c.time).fromNow()}</span></p>
                                    <Markdown.Renderer source={c.content}/>
                                </div>
                            </Row>
                        ))}
                    </Tab.Pane>

                    <Tab.Pane label='事件'>
                        <Timeline className='mt-2 pl-3'>
                            {task.events.map((t, i) => <Timeline.Item key={i} className='pb-2'>{makeTaskEvent(t)}</Timeline.Item>)}
                        </Timeline>
                    </Tab.Pane>
                </Tab>
            </div>
        </div>
    );
};

const TaskDetail = (props: {task: Task; closer: () => void; onModified: () => void}) => {
    const [task, setTask] = React.useState<Task>(props.task);
    const [isDirty, setDirty] = React.useState<boolean>(false);
    const [isContentEditorShow, setContentEditorShow] = React.useState<boolean>(false);
    const [isCommentEditorShow, setCommentEditorShow] = React.useState<boolean>(false);

    React.useEffect(() => {
        if (!isDirty) return;
        request({url: `/api/task/${task.id}`, success: setTask});
        props.onModified();
        setDirty(false);
    }, [isDirty]);

    const renameTask = () => {
        let newName: string = task.name;

        Modal.open({
            title: '修改任务名称',
            body: <Input className='my-2' style={{width: 300}} value={newName} onChange={v => newName = v}/>,
            onOk: () => {
                if (newName.length == 0) {
                    Notification.alert('名称不可为空', 'error');
                    return;
                }

                let param = new FormData();
                param.append('name', newName);
                request({url: `/api/task/${task.id}/name`, method: 'PUT', data: param, success: () => setDirty(true)});
            }
        });
    };

    const moveTask = (dir: 'next'|'back') => {
        request({url: `/api/task/${task.id}/${dir}`, method: 'POST', success: () => setDirty(true)});
    };

    const delTask = () => {
        request({url: `/api/task/${task.id}`, method: 'DELETE', success: () => {
            props.closer();
            props.onModified();
        }});
    };

    return (
        <div className='pt-3'>            
            <Row flex={{align: 'middle', justify: 'space-between'}} className='mx-3 mb-3'>
                <span style={{fontWeight: 'bold', fontSize: 18, maxWidth: 540}} className='text-ellipsis'>
                    {task.name}
                    <Icon type='edit' className='fg-primary ml-1' style={{fontWeight: 'normal'}} onClick={renameTask}/>
                </span>

                <span style={{fontSize: 12}}>
                    <Icon type='pie-chart' className='mr-1'/>{task.proj.name}
                    <Icon type='branches' className='ml-2 mr-1'/>{task.milestone?task.milestone.name:'默认'}
                    <Icon type={TaskStatus[task.state].icon} className='ml-2 mr-1'/>{TaskStatus[task.state].name}
                </span>
            </Row>

            <div className='divider-h mb-2'/>

            <span className='ml-3'>
                <TaskDetail.MemberEditor task={task} kind='creator' onModified={() => setDirty(true)}/>
                <TaskDetail.MemberEditor task={task} kind='developer' onModified={() => setDirty(true)}/>
                <TaskDetail.MemberEditor task={task} kind='tester' onModified={() => setDirty(true)}/>
                <TaskDetail.WeightEditor task={task} onModified={() => setDirty(true)}/>
                <TaskDetail.TimeEditor task={task} onModified={() => setDirty(true)}/>
                <span className='mr-2 pointer' onClick={() => setContentEditorShow(true)}><Icon type='edit' className='mr-1'/>编辑</span>
                {task.state>0&&<span className='mr-2 pointer' onClick={() => moveTask('back')}><Icon type='left-circle' className='mr-1'/>上一步</span>}
                {task.state<4&&<span className='mr-2 pointer' onClick={() => moveTask('next')}><Icon type='right-circle' className='mr-1'/>下一步</span>}
                <span className='mr-2 pointer' onClick={delTask}><Icon type='delete' className='mr-1'/>删除</span>
            </span>

            <div className='divider-h my-1'/>

            <div className='mt-3 mx-3' style={{minHeight: 300}}>
                {isContentEditorShow
                    ?<TaskDetail.ContentEditor task={task} onCancel={() => setContentEditorShow(false)} onModified={() => setDirty(true)}/>
                    :<Markdown.Renderer source={task.content}/>}
            </div>

            {task.attachments.length > 0 && (
                <div className='mt-3 mx-3'>
                    附件：
                    {task.attachments.map((a, i) => <a className='link' href={a.url}><Icon type='link' className='mr-1'/>{a.name}</a>)}
                </div>
            )}

            <div className='mt-2'>
                <Tab>
                    <Tab.Pane label='评论'>
                        {task.comments.map((c, i) => (
                            <Row key={i} flex={{align: 'top', justify: 'start'}} className='my-2 pl-2'>
                                <Avatar src={c.avatar} size={32} className='mt-1'/>
                                <div className='ml-2' style={{flex: 1}}>
                                    <p style={{fontSize: 12, marginBottom: 4}}><span>{c.user}</span><span className='ml-3' style={{color: '#ccc'}} title={c.time}>{moment(c.time).fromNow()}</span></p>
                                    <Markdown.Renderer source={c.content}/>
                                </div>
                            </Row>
                        ))}
                    </Tab.Pane>

                    <Tab.Pane label='事件'>
                        <Timeline className='mt-2 pl-3'>
                            {task.events.map((t, i) => <Timeline.Item key={i} className='pb-2'>{makeTaskEvent(t)}</Timeline.Item>)}
                        </Timeline>
                    </Tab.Pane>
                </Tab>
            </div>

            {isCommentEditorShow&&<TaskDetail.CommentEditor task={task} onCancel={() => setCommentEditorShow(false)} onModified={() => setDirty(true)}/>}
            <div style={{position: 'absolute', right: 16, bottom: 16, fontSize: 32, userSelect: 'none'}}>
                <Icon type='message' className='link' onClick={() => setCommentEditorShow(prev => !prev)}/>
            </div>                       
        </div>
    );
};

TaskDetail.MemberEditor = (props: {task: Task, kind: 'creator'|'developer'|'tester', onModified: () => void}) => {
    const title = {creator: '修改负责人', developer: '修改开发人员', tester: '修改测试人员'}[props.kind];
    const icon = {creator: 'notification', developer: 'code', tester: 'experiment'}[props.kind];
    const old = {creator: props.task.creator, developer: props.task.developer, tester: props.task.tester}[props.kind];
    const members = props.task.proj.members.sort((a, b) => {
        if (a.role != b.role) return a.role - b.role;
        return a.user.account.localeCompare(b.user.account);
    });

    const [selected, setSelected] = React.useState<number>(old.id);

    const handleChange = (ev: React.ChangeEvent<HTMLSelectElement>) => {
        let uid = parseInt(ev.target.value);
        setSelected(uid);
    };

    const handleHide = () => {
        if (selected != old.id) {
            let param = new FormData();
            param.append('member', selected.toString());

            request({
                url: `/api/task/${props.task.id}/${props.kind}`,
                method: 'PUT',
                data: param,
                success: props.onModified
            });
        }
    };

    return (
        <Dropdown className='mr-2 pointer' label={<span><Icon type={icon} className='mr-1'/>{old.name}</span>} onHide={handleHide}>
            <div className='p-2'>
                <p className='text-bold mb-1'>{title}</p>
                <Input.Select value={old.id} onChange={handleChange} style={{width: 200}} >
                    {members.map(m => <option key={m.user.id} value={m.user.id}>【{ProjectRole[m.role]}】{m.user.name}</option>)}
                </Input.Select>
            </div>
        </Dropdown>
    );
};

TaskDetail.WeightEditor = (props: {task: Task, onModified: () => void}) => {
    const setWeight = (w: number) => {
        if (w != props.task.weight) {
            let param = new FormData();
            param.append('weight', w.toString());
            param.append('old', TaskWeight[props.task.weight].name);

            request({
                url: `/api/task/${props.task.id}/weight`,
                method: 'PUT',
                data: param,
                success: props.onModified,
            });
        }
    };

    return (
        <Dropdown className='mr-2 pointer' label={<span><Icon type='tag' className='mr-1'/>{TaskWeight[props.task.weight].name}</span>}>
            <Menu theme='light'>
                {TaskWeight.map((w, i) => <Menu.Item key={i} onClick={() => setWeight(i)}><span style={{color: w.color}}>{w.name}</span></Menu.Item>)}
            </Menu>
        </Dropdown>
    );
};

TaskDetail.TimeEditor = (props: {task: Task, onModified: () => void}) => {
    const form = Form.useForm({startTime: {required: '开始时间不可为空'}, endTime: {required: '结束时间不可为空'}});

    const handleSubmit = (ev: React.FormEvent<HTMLFormElement>) => {
        ev.preventDefault();
        request({
            url: `/api/task/${props.task.id}/time`,
            method: 'PUT',
            data: new FormData(ev.currentTarget),
            success: props.onModified,
        });
    };

    return (
        <Dropdown className='mr-2 pointer' trigger='click' label={<span><Icon type='calendar' className='mr-1'/>{moment(props.task.startTime).format('MM月DD日')} - {moment(props.task.endTime).format('MM月DD日')}</span>}>
            <div className='py-2'>
                <p className='px-2 text-bold mb-1'>修改任务计划时间</p>
                <div className='divider-h mb-1'/>
                <div className='px-2'>
                    <Form form={form} onSubmit={handleSubmit}>
                        <Form.Field htmlFor='startTime' label='计划开始时间'>
                            <Input.DatePicker name='startTime' mode='date' value={props.task.startTime}/>
                        </Form.Field>
                        <Form.Field htmlFor='startTime' label='计划结束时间'>
                            <Input.DatePicker name='endTime' mode='date' value={props.task.endTime}/>
                        </Form.Field>
                    </Form>

                    <Button size='sm' theme='primary' fluid onClick={() => form.submit()}>提交修改</Button>
                </div>
            </div>
        </Dropdown>
    );
};

TaskDetail.ContentEditor = (props: {task: Task, onCancel: () => void, onModified: () => void}) => {
    const [content, setContent] = React.useState<string>(props.task.content);

    const uploader = (file: File, done: (url: string) => void) => {
        let param = new FormData();
        param.append('img', file, file.name);
        request({url: '/api/file/upload', method: 'POST', data: param, success: (data: any) => done(data.url)})
    };

    const modify = () => {
        if (props.task.content == content) {
            props.onCancel();
            return;
        }

        if (content.length == 0) {
            Notification.alert('任务详情不可为空', 'error');
            return;
        }

        let param = new FormData();
        param.append('content', content);
        request({
            url: `/api/task/${props.task.id}/content`,
            method: 'PUT',
            data: param,
            success: () => {
                props.onCancel();
                props.onModified();
            }
        })
    };

    return (
        <div>
            <Markdown.Editor value={content} onChange={setContent} rows={12} onUpload={uploader}/>
            <div className='mt-2 center-child'>
                <Button theme='primary' size='sm' onClick={modify}>修改</Button>
                <Button size='sm' onClick={props.onCancel}>取消</Button>
            </div>
        </div>
    )
};

TaskDetail.CommentEditor = (props: {task: Task, onCancel: () => void, onModified: () => void}) => {
    const [content, setContent] = React.useState<string>('');

    const uploader = (file: File, done: (url: string) => void) => {
        let param = new FormData();
        param.append('img', file, file.name);
        request({url: '/api/file/upload', method: 'POST', data: param, success: (data: any) => done(data.url)})
    };

    const modify = () => {
        if (content.length == 0) {
            props.onCancel();
            return;
        }

        let param = new FormData();
        param.append('content', content);
        request({
            url: `/api/task/${props.task.id}/comment`,
            method: 'POST',
            data: param,
            success: () => {
                props.onCancel();
                props.onModified();
            }
        })
    };

    return (
        <div style={{position: 'absolute', left: 32, right: 32, bottom: 64, background: '#fff', boxShadow: '1px 1px 10px rgba(0,0,0,.12)'}}>
            <p className='px-3 pt-2' style={{fontWeight: 'bold', fontSize: 18}}>发表评论</p>

            <div className='divider-h mt-1'/>

            <div className='p-2'>
                <Markdown.Editor value={content} onChange={setContent} rows={4} onUpload={uploader}/>
                <div className='mt-1 center-child'>
                    <Button theme='primary' size='sm' onClick={modify}>发表</Button>
                    <Button size='sm' onClick={props.onCancel}>取消</Button>
                </div>
            </div>
        </div>
    );
};

export const Viewer = {
    open: (id: number, onModified?: () => void) => {
        request({
            url: `/api/task/${id}`,
            success: (t: Task) => {
                if (onModified) {
                    let closer: () => void = null;

                    closer = Drawer.open({
                        width: 800,
                        hideClose: true,
                        body: <TaskDetail task={t} onModified={onModified} closer={() => closer()}/>
                    });
                } else {
                    Drawer.open({
                        width: 600,
                        hideClose: true,
                        body: <TaskDetailReadOnly task={t}/>
                    });
                }
            }
        });
    }
}