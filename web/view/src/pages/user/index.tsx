import * as React from 'react';

import {Avatar, Button, Card, Drawer, Empty, Form, Icon, Input, Notification, Row} from '../../components';
import {request} from '../../common/request';
import {User, Notice} from '../../common/protocol';
import {Viewer} from '../task/viewer';

interface UserPageProps {
    user: User;
    notices: Notice[];

    onInfoChanged: () => void;
    onNoticeChanged: () => void;
};

export const UserPage = (props: UserPageProps) => {
    const [avatar, setAvatar] = React.useState<string>(props.user.avatar);
    const [notices, setNotices] = React.useState<Notice[]>(props.notices);

    const makeNotice = (notice: Notice) => {
        let link = <a className='link' onClick={() => Viewer.open(notice.tid, () => {})}>{notice.tname}</a>;

        switch (notice.ev) {
        case 0: return <p style={{marginBottom: 2}}><b>{notice.operator}</b>创建了{link}</p>;
        case 1: return <p style={{marginBottom: 2}}><b>{notice.operator}</b>重命名{link}</p>;
        case 2: return <p style={{marginBottom: 2}}><b>{notice.operator}</b>修改了{link}的状态</p>;
        case 3: return <p style={{marginBottom: 2}}><b>{notice.operator}</b>修改了{link}的时间计划</p>;
        case 4: return <p style={{marginBottom: 2}}><b>{notice.operator}</b>移交了{link}</p>;
        case 5: return <p style={{marginBottom: 2}}><b>{notice.operator}</b>重新指派了{link}的开发者</p>;
        case 6: return <p style={{marginBottom: 2}}><b>{notice.operator}</b>重新指定了{link}的测试者</p>;
        case 7: return <p style={{marginBottom: 2}}><b>{notice.operator}</b>修改了{link}的优先级</p>;
        case 8: return <p style={{marginBottom: 2}}><b>{notice.operator}</b>修改了{link}的具体内容</p>;
        case 9: return <p style={{marginBottom: 2}}><b>{notice.operator}</b>评论了{link}</p>;
        default: return <p style={{marginBottom: 2}}><b>{notice.operator}</b>对{link}进行了其他修改</p>;
        }
    }

    const uploadAvatar = (img: File) => {
        let data = new FormData();
        data.append('img', img, img.name);

        request({
            url: '/api/user/avatar',
            method: 'PUT',
            data: data,
            success: (data: string) => {
                setAvatar(data);
                props.onInfoChanged();
            }
        });
    };

    const openRenameEditor = () => {
        let closer = Drawer.open({
            width: 300,
            header: '修改昵称',
            body: <UserPage.RenameEditor onFinish={() => {
                props.onInfoChanged();
                closer();
            }}/>
        });
    }

    const openPasswordEditor = () => {
        let closer = Drawer.open({
            width: 300, 
            header: '重置密码', 
            body: <UserPage.PasswordEditor onFinish={() => closer()}/>
        });
    };

    const clearNotices = () => {
        request({
            url: '/api/notice/all', 
            method: 'DELETE', 
            success: () => {
                setNotices([]);
                props.onNoticeChanged();
            }
        });
    };

    const deleteNotice = (id: number) => {
        request({
            url: `/api/notice/${id}`, 
            method: 'DELETE',
            success: () => {
                setNotices(prev => {
                    let ret = [...prev];
                    let idx = ret.findIndex(v => v.id == id);
                    ret.splice(idx, 1);
                    return ret;
                });
                props.onNoticeChanged();
            }
        });
    };

    return (
        <div className='p-2'>
            <div className='text-center mt-2 mb-4'>
                <Input.Uploader accept='image/*' customUpload={uploadAvatar}>
                    <Avatar src={avatar} size={80}/>
                </Input.Uploader>

                <p className='fg-muted mt-2 mb-0' style={{fontSize: 18, fontWeight: 'bolder'}}>{props.user.name}</p>
                <p className='fg-muted'>{props.user.account}</p>
                <div className='mt-2'>
                    <Button size='sm' className='mr-1' onClick={openRenameEditor}>修改昵称</Button>
                    <Button size='sm' onClick={openPasswordEditor}>重置密码</Button>
                </div>
            </div>

            <Card header={<Row flex={{align: 'middle', justify: 'space-between'}}>消息列表<Button theme='link' size='sm' onClick={clearNotices}>清空</Button></Row>} bordered>
                {notices.length == 0 ? <Empty label='列表为空'/> : (
                    <ul>
                        {notices.map(n => {
                            return (
                                <li key={n.id} className='m-1 ml-3'>
                                    {makeNotice(n)}
                                    <Row flex={{align: 'middle', justify: 'space-between'}}>
                                        <label><Icon type='calendar' className='mr-1'/>{n.time}</label>
                                        <label><a onClick={() => deleteNotice(n.id)}>删除</a></label>
                                    </Row>
                                </li>
                            );
                        })}
                    </ul>
                )}
            </Card>
        </div>
    );
};

UserPage.RenameEditor = (props: {onFinish: () => void}) => {
    const form = Form.useForm({
        name: {required: '新昵称不可为空', length: {min: 3, max: 64, message: '昵称长度非法'}},
    });

    const submit = (ev: React.FormEvent<HTMLFormElement>) => {
        ev.preventDefault();
        
        request({
            url: '/api/user/name',
            method: 'PUT',
            data: new FormData(ev.currentTarget),
            success: () => {
                Notification.alert('修改昵称完成', 'info');
                props.onFinish();
            }
        });
    };

    return (
        <Form form={form} onSubmit={submit} className='mx-2'>
            <Form.Field htmlFor='name'>
                <Input name='name' placeholder='新昵称'/>
            </Form.Field>

            <Button theme='primary' size='sm' fluid onClick={ev => {ev.preventDefault(); form.submit()}}>提交修改</Button>
        </Form>
    );
};

UserPage.PasswordEditor = (props: {onFinish: () => void}) => {
    const form = Form.useForm({
        oldPswd: {required: '原始密码不可为空'},
        newPswd: {required: '密码不可为空', length: {min: 6, max: 512, message: '密码最少6位'}, pattern: {test: /[\w_\d]+/, message: '密码只能包含字母、数字和下划线'}},
        cfmPswd: {required: '请再次确认新密码', equalWith: {field: 'newPswd', message: '两次输入的密码不一致！'}}
    });

    const submit = (ev: React.FormEvent<HTMLFormElement>) => {
        ev.preventDefault();
        
        request({
            url: '/api/user/pswd',
            method: 'PUT',
            data: new FormData(ev.currentTarget),
            success: () => {
                Notification.alert('重置密码成功', 'info');
                props.onFinish();
            }
        });
    };

    return (
        <Form form={form} onSubmit={submit} className='mx-2'>
            <Form.Field htmlFor='oldPswd'>
                <Input.Password name='oldPswd' placeholder='原始密码'/>
            </Form.Field>
            <Form.Field htmlFor='newPswd'>
                <Input.Password name='newPswd' placeholder='新的密码'/>
            </Form.Field>
            <Form.Field htmlFor='cfmPswd'>
                <Input.Password name='cfmPswd' placeholder='确认新密码'/>
            </Form.Field>

            <Button theme='primary' size='sm' fluid onClick={ev => {ev.preventDefault(); form.submit()}}>提交修改</Button>
        </Form>
    );
};