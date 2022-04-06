import * as React from 'react';

import {Avatar, Badge, Drawer, Layout, Menu, Icon} from '../../components';
import {request} from '../../common/request';
import {User, Notice} from '../../common/protocol';

import {UserPage} from '../user';
import {TaskPage} from '../task';
import {ProjectPage} from '../project';
import {DocumentPage} from '../document';
import {SharePage} from '../share';
import {AdminPage} from '../admin';
import {RecordPage} from "../record";

interface MainMenu {
    name: string;
    id: string;
    icon: string;
    click: () => void;
    needAdmin?: boolean;
};

export const Home = () => {
    const [user, setUser] = React.useState<User>({account: 'Unknown', id: 0});
    const [notices, setNotices] = React.useState<Notice[]>([]);
    const [page, setPage] = React.useState<JSX.Element>();

    const menus: MainMenu[] = [
        {name: '工作台', id: 'task', icon: 'dashboard', click: () => setPage(<TaskPage uid={user.id}/>)},
        {name: '项目', id: 'project', icon: 'pie-chart', click: () => setPage(<ProjectPage uid={user.id}/>)},
        {name: '文档', id: 'document', icon: 'read', click: () => setPage(<DocumentPage/>)},
        {name: '档案', id: 'record', icon: 'read', click: () => setPage(<RecordPage/>)},
        {name: '合同', id: 'share', icon: 'cloud-upload', click: () => setPage(<SharePage/>)},
        {name: '管理', id: 'admin', icon: 'setting', click: () => setPage(<AdminPage/>), needAdmin: true},
    ];

    React.useEffect(() => {
        fetchUserInfo();
        fetchNotices();
        setInterval(fetchNotices, 60000);
    }, []);

    const fetchUserInfo = () => {
        request({url: '/api/user', success: setUser, dontShowLoading: true});
    };

    const fetchNotices = () => {
        request({url: '/api/notice/list', success: setNotices, dontShowLoading: true});
    };

    const openProfiler = () => {
        Drawer.open({
            width: 350,
            header: '用户信息',
            body: <UserPage
                user={user} 
                notices={notices} 
                onInfoChanged={fetchUserInfo} 
                onNoticeChanged={fetchNotices}/>,
        });
    };

    return (
        <Layout style={{width: '100vw', height: '100vh'}}>
            <Layout.Sider width={64}>
                <div className='text-center mt-3 mb-1'>
                    <div onClick={openProfiler}>
                        <Avatar size={48} src={user.avatar}/>                        
                        {notices.length > 0&&<div style={{marginTop: -20}}><Badge theme='danger' className='r-1'>{notices.length}</Badge></div>}
                    </div>
                </div>

                <Menu defaultActive='task' theme='dark'>
                    {user&&menus.map(m => {
                        if (m.needAdmin && !user.isSu) return null;

                        return (
                            <Menu.Item className='text-center px-0 py-2' style={{lineHeight: 'normal'}} key={m.id} id={m.id} title={m.name} onClick={m.click}>
                                <Icon type={m.icon} style={{fontSize: 24}}/><br/>
                                <label style={{fontSize: 11}}>{m.name}</label>
                            </Menu.Item>
                        );
                    })}
                </Menu>

                <div style={{position: 'absolute', left: 0, bottom: 16, width: '100%', textAlign: 'center'}}>
                    <Icon style={{fontSize: 24}} type='export' title='退出' onClick={() => location.href = '/logout'}/><br/>
                    <label style={{fontSize: 11}}>退出登录</label>
                </div>
            </Layout.Sider>

            <Layout.Content>
                {page||<TaskPage uid={user.id}/>}
            </Layout.Content>
        </Layout>
    );
};