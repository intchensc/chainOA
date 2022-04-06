import * as React from 'react';

import {Layout, Icon, Menu, Empty, Badge, Row, Button, FormProxy, FormFieldValidator, Modal, Form, Input} from '../../components';
import {Project} from '../../common/protocol';
import {request} from '../../common/request';
import {ProjectRole} from '../../common/consts';

import {Summary} from './summary';
import {Tasks} from './tasks';
import {Manager} from './manager';
import {Milestones} from './milestones';
import {Weeks} from './week';

export const ProjectPage = (props: {uid: number}) => {
    const [projs, setProjs] = React.useState<Project[]>([]);
    const [page, setPage] = React.useState<JSX.Element>();

    React.useEffect(() => {
        fetchProjs();
    }, []);

    const fetchProjs = () => {
        setPage(null);
        request({url: '/api/project/mine', success: setProjs});
    };

    const addProj = () => {
        let form: FormProxy = null;
        let closer: () => void = null;

        const validates: {[k: string]: FormFieldValidator} = {
            name: {required: '项目名不可为空'},
        };

        const submit = (ev: React.FormEvent<HTMLFormElement>) => {
            ev.preventDefault();
            request({
                url: `/api/project`, 
                method: 'POST', 
                data: new FormData(ev.currentTarget), 
                success: () => {
                    fetchProjs();
                    closer();
                }
            });
        };

        closer = Modal.open({
            title: '新建项目',
            body: (
                <Form style={{width: 400}} form={() => {form = Form.useForm(validates); return form}} onSubmit={submit}>
                    <input name='admin' value={props.uid} hidden/>

                    <Form.Field htmlFor='name' label='项目名'>
                        <Input name='name'/>
                    </Form.Field>

                    <Form.Field htmlFor='role' label='担任角色'>
                        <Input.Select name='role'>
                            {ProjectRole.map((r, i) => <option key={i} value={i}>{r}</option>)}
                        </Input.Select>
                    </Form.Field>
                </Form>
            ),
            onOk: () => {form.submit(); return false},
        })
    };

    return (
        <Layout style={{width: '100%', height: '100%'}}>
            <Layout.Sider width={200} theme='light'>            
                <div style={{padding: '0 8px', borderBottom: '1px solid rgb(204,204,204)'}}>
                    <Row flex={{align: 'middle', justify: 'space-between'}}>
                        <label className='text-bold fg-muted' style={{padding: '8px 0', fontSize: '1.2em'}}><Icon type='pie-chart' className='mr-2'/>项目列表</label>
                        <Button theme='link' size='sm' onClick={addProj}>
                            <Icon type='plus' className='mr-1'/>新建
                        </Button>
                    </Row>
                </div>

                {projs.length == 0?<Empty label='您还未加入任何项目'/>:(
                    <Menu theme='light'>
                        {projs.map(p => {
                            let isAdmin = false;

                            for (let i = 0; i < p.members.length; ++i) {
                                if (p.members[i].user.id == props.uid) {
                                    isAdmin = p.members[i].isAdmin || false;
                                    break;
                                }
                            }

                            return (
                                <Menu.SubMenu key={p.id} collapse='disabled' label={<Row flex={{align: 'middle', justify: 'space-between'}}>{p.name}<Badge className='ml-2' theme='info'>{isAdmin?'管理员':'成员'}</Badge></Row>}>
                                    <Menu.Item onClick={() => setPage(<Tasks proj={p} isAdmin={isAdmin}/>)}>任务列表</Menu.Item>
                                    {isAdmin&&<Menu.Item onClick={() => setPage(<Manager pid={p.id} onDelete={fetchProjs}/>)}>项目管理</Menu.Item>}
                                </Menu.SubMenu>
                            );
                        })}
                    </Menu>
                )}
            </Layout.Sider>

            <Layout.Content>
                {page||(
                    <div className='w-100 h-100 center-child'>
                        <Empty label='请在左侧选择具体操作'/>
                    </div>
                )}
            </Layout.Content>
        </Layout>
    );
};