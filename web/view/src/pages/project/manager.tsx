import * as React from 'react';

import {Table, Modal, Input, Form, FormProxy, FormFieldValidator, TableColumn, Avatar, Badge, Icon, Row, Card, Button} from '../../components';
import {Project, ProjectMember, User} from '../../common/protocol';
import {request} from '../../common/request';
import {ProjectRole} from '../../common/consts';

export const Manager = (props: {pid: number, onDelete: () => void}) => {
    const [proj, setProj] = React.useState<Project>();
    const refName = React.useRef<HTMLInputElement>(null);

    const memberSchema: TableColumn[] = [
        {label: '头像', renderer: (data: ProjectMember) => <Avatar size={32} src={data.user.avatar}/>},
        {label: '昵称', renderer: (data: ProjectMember) => data.user.name},
        {label: '帐号', renderer: (data: ProjectMember) => data.user.account},
        {label: '角色', renderer: (data: ProjectMember) => <Badge theme='primary'>{ProjectRole[data.role]}</Badge>},
        {label: '管理权限', renderer: (data: ProjectMember) => <Input.Switch on={data.isAdmin} disabled/>},
        {label: '操作', renderer: (data: ProjectMember) => (
            <span>
                <a className='link' onClick={() => editMember(data)}>编辑</a>
                <div className='divider-v'/>
                <a className='link' onClick={() => uploadRecord(data)}>写入档案</a>
                <div className='divider-v'/>
                <a className='link' onClick={() => delMember(data)}>删除</a>
            </span>
        )}
    ];

    React.useEffect(() => fetchProject(), [props]);

    const fetchProject = () => {
        request({url: `/api/project/${props.pid}`, success: (data: Project) => {
            data.members.sort((a, b) => a.user.account.localeCompare(b.user.account));
            setProj(data);
        }});
    };

    const rename = () => {
        let newName = refName.current.value;

        Modal.open({
            title: '更新项目名',
            body: <div className='my-2'>确定要将【{proj.name}】改为【{newName}】吗？该操作需要手动刷新！</div>,
            onOk: () => {
                request({
                    url: `/api/project/${props.pid}/name`, 
                    method: 'PUT', 
                    data: new URLSearchParams({'name': newName}),
                    success: () => {}
                });
            }
        });
    };

    const addMember = () => {
        request({
            url: `/api/project/${props.pid}/invites`,
            success: (data: User[]) => {
                let form: FormProxy = null;
                let closer: () => void = null;

                const validate: {[k:string]:FormFieldValidator} = {
                    uid: {required: '请选择邀请的成员'},
                    role: {required: '请设置成员的职能'},
                };

                const submit = (ev: React.FormEvent<HTMLFormElement>) => {
                    ev.preventDefault();
                    request({
                        url: `/api/project/${props.pid}/member`, 
                        method: 'POST', 
                        data: new FormData(ev.currentTarget), 
                        success: () => {closer(); fetchProject()}});
                };

                closer = Modal.open({
                    title: '邀请成员',
                    body: (
                        <Form style={{width: 300}} form={() => {form = Form.useForm(validate); return form}} onSubmit={submit}>
                            <Form.Field htmlFor='uid' label='可邀请用户'>
                                <Input.Select name='uid'>
                                    {data.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                                </Input.Select>
                            </Form.Field>
                            <Form.Field htmlFor='role' label='职能'>
                                <Input.Select name='role'>
                                    {ProjectRole.map((r, i) => <option key={i} value={i}>{r}</option>)}
                                </Input.Select>
                            </Form.Field>
                            <Form.Field>
                                <Input.Checkbox name='isAdmin' value='1' label='管理权限'/>
                            </Form.Field>
                        </Form> 
                    ),
                    onOk: () => {form.submit(); return false}
                })
            }
        });
    };

    //上传记录的API
    const uploadRecord = (m: ProjectMember) => {
        let form: FormProxy = null;
        let closer: () => void = null;

        const validate: {[k:string]:FormFieldValidator} = {
            department: {required: '请填写被记录人所在部门'},
            content: {required: '请填写记录内容'},
        };

        const submit = (ev: React.FormEvent<HTMLFormElement>) => {
            ev.preventDefault();
            request({
                url: `/api/project/uploadRecord/${m.user.id}`,
                method: 'POST',
                data: new FormData(ev.currentTarget),
                success: () => {closer();}});
        };

        closer = Modal.open({
            title: '添加记录',
            body: (
                <Form style={{width: 300}} form={() => {form = Form.useForm(validate); return form}} onSubmit={submit}>
                    <Form.Field htmlFor='department' label='所属部门'>
                        <Input name='department'/>
                    </Form.Field>

                    <Form.Field htmlFor='content' label='记录内容'>
                        <Input name='content'/>
                    </Form.Field>
                </Form>
            ),
            onOk: () => {form.submit(); return false}
        });
    };

    const editMember = (m: ProjectMember) => {
        let form: FormProxy = null;
        let closer: () => void = null;

        const validate: {[k:string]:FormFieldValidator} = {
            role: {required: '请设置成员的职能'},
        };

        const submit = (ev: React.FormEvent<HTMLFormElement>) => {
            ev.preventDefault();
            request({
                url: `/api/project/${props.pid}/member/${m.user.id}`, 
                method: 'PUT', 
                data: new FormData(ev.currentTarget), 
                success: () => {closer(); fetchProject()}});
        };

        closer = Modal.open({
            title: '编辑成员',
            body: (
                <Form style={{width: 300}} form={() => {form = Form.useForm(validate); return form}} onSubmit={submit}>
                    <Form.Field htmlFor='role' label='职能'>
                        <Input.Select name='role' value={m.role}>
                            {ProjectRole.map((r, i) => <option key={i} value={i}>{r}</option>)}
                        </Input.Select>
                    </Form.Field>
                    <Form.Field>
                        <Input.Checkbox name='isAdmin' value='1' label='管理权限' checked={m.isAdmin}/>
                    </Form.Field>
                </Form> 
            ),
            onOk: () => {form.submit(); return false}
        });
    };

    const delMember = (m: ProjectMember) => {
        Modal.open({
            title: '删除确认',
            body: <div className='my-2'>确定要删除成员【{m.user.name}】吗？</div>,
            onOk: () => {
                request({
                    url: `/api/project/${props.pid}/member/${m.user.id}`, 
                    method: 'DELETE', 
                    success: fetchProject
                });
            }
        });
    };

    const delProj = () => {
        Modal.open({
            title: '删除确认',
            body: <div className='my-2'>请再次确认：要删除项目【{proj.name}】吗？</div>,
            onOk: () => {
                request({url: `/api/project/${proj.id}`, method: 'DELETE', success: props.onDelete});
            }
        });
    };

    return (
        <div className='m-4'>
            <Card
                className='mt-3'
                headerProps={{className: 'py-2'}}
                bodyProps={{className: 'p-2'}}
                header={
                    <span>
                        <Icon type='info-circle' className='mr-2'/>项目名称
                    </span>
                }
                bordered
                shadowed>

                <div className='input'>
                    <input ref={refName} defaultValue={proj?proj.name:''}/>
                </div>
                
                <Button size='sm' theme='primary' className='mt-2' onClick={rename}>更新</Button>
            </Card>

            <Card
                className='mt-3'
                bodyProps={{className: 'p-2'}}
                header={
                    <Row flex={{align: 'middle', justify: 'space-between'}}>
                        <span>
                            <Icon type='idcard' className='mr-2'/>
                            成员列表
                        </span>
                        <Button theme='link' onClick={addMember}><Icon type='plus' className='mr-1'/>添加成员</Button>
                    </Row>
                }
                bordered
                shadowed>
                <Table dataSource={proj?proj.members:[]} columns={memberSchema}/>
            </Card>

            <Card
                className='mt-3'
                headerProps={{className: 'py-2'}}
                bodyProps={{className: 'p-0'}}
                header={
                    <span>
                        <Icon type='info-circle' className='mr-2'/>危险操作区
                    </span>
                }
                bordered
                shadowed>
                <Card className='m-2'>
                    <Row flex={{align: 'middle', justify: 'space-between'}}>
                        <div>
                            <p className='text-bold'>删除本项目</p>
                            <p>删除项目操作不可恢复，请三思而后行！！！</p>
                        </div>

                        <Button theme='danger' onClick={delProj}>确认删除</Button>
                    </Row>
                </Card>
            </Card>
        </div>
    );
};