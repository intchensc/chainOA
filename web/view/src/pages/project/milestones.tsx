import * as React from 'react';
import * as moment from 'moment';

import * as echarts from 'echarts/lib/echarts';
import 'echarts/lib/component/title';
import 'echarts/lib/component/tooltip';
import 'echarts/lib/component/legend';
import 'echarts/lib/chart/pie';

import { FormProxy, FormFieldValidator, Modal, Form, Input, Card, Icon, Button, Timeline, Markdown, Layout, Empty, Badge, Row, Drawer } from '../../components';
import { ProjectMilestone, TaskBrief, Project } from '../../common/protocol';
import { request } from '../../common/request';
import { TaskStatus } from '../../common/consts';
import { Viewer } from '../task/viewer';
import { Creator } from '../task/creator';

interface MilestoneChartElement {
    state: number;
    name: string;
    value: number;
    color: string;
    isDelayed: boolean;
}

interface ViewMilestone {
    target: ProjectMilestone;
    tasks: TaskBrief[];
    summary: MilestoneChartElement[];
}

export const Milestones = (props: {proj: Project, isAdmin: boolean}) => {
    const [milestones, setMilestones] = React.useState<ProjectMilestone[]>([]);
    const [view, setView] = React.useState<ViewMilestone>();

    const validator: {[k:string]:FormFieldValidator} = {
        name: {required: '里程碑名称不可为空'},
        startTime: {required: '请设置计划开始时间'},
        endTime: {required: '请设置计划结束时间'},
    };

    React.useEffect(() => fetchMilestones(), [props]);

    const fetchMilestones = () => {
        request({url: `/api/project/${props.proj.id}/milestone/list`, success: (data: ProjectMilestone[]) => {
            data.sort((a, b) => b.id - a.id)
            setMilestones(data);
            if (data.length > 0) {
                viewMilestone(data[0]);
            } else {
                setView(null);
            }
        }});
    };

    const publishTask = (m: ProjectMilestone) => {
        let closer: () => void = null;

        closer = Drawer.open({
            width: 800,
            header: '发布任务',
            body: <div className='pt-2'><Creator proj={props.proj} milestone={m} onDone={() => {closer(); viewMilestone(m)}}/></div>, 
        });
    };

    const uploadForDesc = (file: File, done: (url: string) => void) => {
        let param = new FormData();
        param.append('img', file, file.name);        
        request({url: '/api/file/upload', method: 'POST', data: param, success: (data: any) => done(data.url)});
    };

    const addMilestone = () => {
        let form: FormProxy = null;
        let closer: () => void = null;

        const submit = (ev: React.FormEvent<HTMLFormElement>) => {
            ev.preventDefault();
            request({
                url: `/api/project/${props.proj.id}/milestone`, 
                method: 'POST', 
                data: new FormData(ev.currentTarget), 
                success: () => {closer(); fetchMilestones()}});
        };

        closer = Modal.open({
            title: '新建里程碑',
            body: (
                <Form style={{width: 650}} form={() => {form = Form.useForm(validator); return form}} onSubmit={submit}>
                    <Form.Field htmlFor='name' label='名称'>
                        <Input name='name' autoComplete='off'/>
                    </Form.Field>
                    <Form.Field htmlFor='startTime' label='开始时间'>
                        <Input.DatePicker name='startTime' mode='date' value={moment().format('YYYY-MM-DD')}/>
                    </Form.Field>
                    <Form.Field htmlFor='endTime' label='结束时间'>
                        <Input.DatePicker name='endTime' mode='date' value={moment().add(1, 'd').format('YYYY-MM-DD')}/>
                    </Form.Field>
                    <Form.Field htmlFor='desc' label='描述'>
                        <Markdown.Editor name='desc' rows={10} onUpload={uploadForDesc}/>
                    </Form.Field>
                </Form> 
            ),
            onOk: () => {form.submit(); return false}
        });
    };

    const editMilestone = (m: ProjectMilestone) => {
        let form: FormProxy = null;
        let closer: () => void = null;

        const submit = (ev: React.FormEvent<HTMLFormElement>) => {
            ev.preventDefault();
            request({
                url: `/api/project/${props.proj.id}/milestone/${m.id}`, 
                method: 'PUT', 
                data: new FormData(ev.currentTarget), 
                success: () => {closer(); fetchMilestones()}});
        };

        closer = Modal.open({
            title: '编辑里程碑',
            body: (
                <Form style={{width: 650}} form={() => {form = Form.useForm(validator); return form}} onSubmit={submit}>
                    <Form.Field htmlFor='name' label='名称'>
                        <Input name='name' autoComplete='off' value={m.name}/>
                    </Form.Field>
                    <Form.Field htmlFor='startTime' label='开始时间'>
                        <Input.DatePicker name='startTime' mode='date' value={m.startTime}/>
                    </Form.Field>
                    <Form.Field htmlFor='endTime' label='结束时间'>
                        <Input.DatePicker name='endTime' mode='date' value={m.endTime}/>
                    </Form.Field>
                    <Form.Field htmlFor='desc' label='描述'>
                        <Markdown.Editor name='desc' rows={10} value={m.desc} onUpload={uploadForDesc}/>
                    </Form.Field>
                </Form>
            ),
            onOk: () => {form.submit(); return false}
        });
    };

    const delMilestone = (m: ProjectMilestone) => {
        Modal.open({
            title: '删除确认',
            body: <div className='my-2'>确定要删除里程碑【{m.name}】吗（相关任务的里程碑会被置空）？</div>,
            onOk: () => {
                request({
                    url: `/api/project/${props.proj.id}/milestone/${m.id}`, 
                    method: 'DELETE', 
                    success: fetchMilestones
                });
            }
        });
    };

    const viewMilestone = (m: ProjectMilestone) => {
        request({
            url: `/api/task/milestone/${m.id}`,
            success: (data: TaskBrief[]) => {
                let summary: MilestoneChartElement[] = [];
                data.forEach(t => {
                    let idx = summary.findIndex(v => v.state == t.state)
                    if (idx < 0) {
                        summary.push({
                            state: t.state,
                            name: TaskStatus[t.state].name,
                            value: 1,
                            color: TaskStatus[t.state].color,
                            isDelayed: t.state < 3 && moment(t.endTime).isBefore(),
                        })
                    } else {
                        summary[idx].value++;
                    }
                });

                setView({
                    target: m,
                    tasks: data,
                    summary: summary,
                })
            }
        });
    };

    return (
        <Layout style={{height: '100vh'}}>
            <Layout.Sider width={300} theme='light' style={{background: 'white'}}>
                <div style={{padding: '8px 16px', borderBottom: '1px solid #e2e2e2'}}>
                    {props.isAdmin ? (
                        <Row flex={{align: 'middle', justify: 'space-between'}}>
                            <label className='text-bold fg-muted' style={{fontSize: '1.2em'}}>
                                <Icon type='idcard' className='mr-1'/>里程计划
                            </label>

                            <Button size='xs' theme='link' onClick={addMilestone}><Icon type='plus' className='mr-1'/>新建里程碑</Button>
                        </Row>
                    ) : (
                        <label className='text-bold fg-muted' style={{fontSize: '1.2em'}}>
                            <Icon type='idcard' className='mr-1'/>里程计划
                        </label>
                    )}                    
                </div>

                {milestones.length > 0 ? (
                    <Timeline className='p-4'>
                        {milestones.map((m, i) => (
                            <Timeline.Item icon={<Icon type='flag-fill'/>} key={i}>
                                <Card
                                    style={(view&&view.target.id==m.id)?{borderColor: 'silver'}:{}}
                                    header={(
                                        <Row flex={{align: 'middle', justify: 'space-between'}}>
                                            <span style={{fontSize: 14}}>{m.name}</span>
                                            {moment(m.startTime).isAfter()?<Badge className='mr-1'>未开始</Badge>:(moment(m.endTime).isBefore()?<Badge className='mr-1' theme='success'>已结束</Badge>:<Badge className='mr-1' theme='info'>进行中</Badge>)}
                                        </Row>)}
                                    onClick={() => viewMilestone(m)}
                                    bordered
                                    shadowed>
                                    <span>
                                        {props.isAdmin ? [
                                            <a key='edit' className='link' onClick={ev => {ev.preventDefault(); ev.stopPropagation(); editMilestone(m)}}>编辑</a>,
                                            <div key='d-0' className='divider-v'/>,
                                            <a key='publish' className='link' onClick={ev => {ev.preventDefault(); ev.stopPropagation(); publishTask(m)}}>发布任务</a>,
                                            <div key='d-0' className='divider-v'/>,
                                            <a key='delete' className='link' onClick={ev => {ev.preventDefault(); ev.stopPropagation(); delMilestone(m)}}>删除</a>,
                                        ] : [
                                            <a key='publish' className='link' onClick={ev => {ev.preventDefault(); ev.stopPropagation(); publishTask(m)}}>发布任务</a>,
                                        ]}
                                    </span>
                                </Card>
                            </Timeline.Item>
                        ))}
                    </Timeline>
                ) : (
                    <Empty label="暂无里程碑" className='mt-4'/>
                )}
                
            </Layout.Sider>

            <Layout.Content>
                {!view?(
                    <div className='w-100 h-100 center-child'>
                        <Empty label='选择里程碑查看详情'/>
                    </div>
                ):(
                    <div className='p-2'>
                        <label style={{fontSize: 16, fontWeight: 'bolder'}}><Icon type='flag-fill' className='mr-1'/>【{view.target.name}】详情</label>
                        <div className='divider-h pt-2'/>

                        <div className='py-2'>
                            <Markdown.Renderer source={view.target.desc||'管理员很懒，并没写什么描述'}/>
                        </div>

                        <p className='mt-2' style={{fontSize: 15, fontWeight: 'bolder'}}>时间节点</p>
                        <div className='divider-h'/>
                        <ul style={{listStyle: 'inside', marginTop: 8}}>
                            <li>开始：{view.target.startTime}</li>
                            <li>截止：{view.target.endTime}</li>
                        </ul>

                        <p className='mt-3' style={{fontSize: 15, fontWeight: 'bolder'}}>关联任务</p>
                        <div className='divider-h mb-2'/>
                        
                        {view.tasks.length == 0&&'暂无关联任务'}
                        {view.tasks.length > 0&&(
                            <div>
                                <div className='mb-3'>
                                    <Milestones.Charts elems={view.summary}/>
                                </div>

                                <p className='mb-2'>
                                    <small>
                                        <b>标志含义：</b>
                                        {TaskStatus.map((s, i) => (
                                            <span key={i} className='mr-2'><Icon type={s.icon} style={{color: s.color}} className='mr-1'/>{s.name}</span>
                                        ))}
                                        <span><Icon type='warning-circle' className='mr-1 fg-danger'/>已逾期</span>
                                    </small> 
                                </p>

                                {view.tasks.map(t => (
                                    <p key={t.id}>
                                        {(t.state < 3 && moment(t.endTime).isBefore()) &&<Icon type='warning-circle' className='fg-danger mr-1'/>}
                                        <Icon type={TaskStatus[t.state].icon} style={{color: TaskStatus[t.state].color}}/>
                                        <a href='#' className='fg-info ml-1' onClick={() => Viewer.open(t.id, props.isAdmin ? () => viewMilestone(view.target) : null)}>{t.name}</a>
                                        <small className='ml-1 text-bold'>
                                            {t.creator.name}<Icon type='right'/>{t.developer.name}<Icon type='right'/>{t.tester.name}
                                        </small>
                                    </p>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </Layout.Content>
        </Layout>
    );
}

Milestones.Charts = (props: {elems: MilestoneChartElement[]}) => {
    const ref = React.useRef<HTMLDivElement>();

    React.useEffect(() => {
        if (!ref.current) return;

        let pie = echarts.init(ref.current);
        let delay = [
            {name: '正常', value: 0},
            {name: '逾期', value: 0},
        ];

        props.elems.forEach(item => {
            delay[item.isDelayed?1:0].value++
        })

        pie.setOption({
            title: {
                text: '完成情况统计',
                left: 'center',
            },
            tooltip: {
                trigger: 'item',
                formatter: '{b} : {c} ({d}%)',
            },
            legend: {
                bottom: 0,
                left: 'center',
                data: props.elems.map(item => item.name),
            },
            series: [
                {
                    type: 'pie',
                    radius: '50%',
                    center: ['30%', '50%'],
                    selectedMode: 'single',
                    data: props.elems.map(item => ({name: item.name, value: item.value})),
                    itemStyle: {
                        emphasis: {
                            shadowBlur: 10,
                            shadowOffsetX: 0,
                            shadowColor: 'rgba(0, 0, 0, .5)',
                        }
                    }
                },
                {
                    type: 'pie',
                    radius: '50%',
                    center: ['70%', '50%'],
                    selectedMode: 'single',
                    data: delay,
                    itemStyle: {
                        emphasis: {
                            shadowBlur: 10,
                            shadowOffsetX: 0,
                            shadowColor: 'rgba(0, 0, 0, .5)',
                        }
                    }
                }
            ],
        })
    }, [props]);

    return <div ref={ref} style={{width: '100%', height: 200}}/>
}