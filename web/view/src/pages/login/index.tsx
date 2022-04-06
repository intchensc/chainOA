import * as React from 'react';

import {Button, Form, Input} from '../../components';
import {request} from '../../common/request';

export const Login = () => {
    const form = Form.useForm({
        account: {required: '帐号不可为空'},
        password: {required: '密码不可为空'},
    });

    const submit = (ev: React.FormEvent<HTMLFormElement>) => {
        ev.preventDefault();
        request({
            url: '/login',
            method: 'POST',
            data: new FormData(ev.currentTarget),
            success: () => location.href = '/',
        });
    };

    return (
        <div className='fullscreen center-child bg-light'>
            <div>
                <p className='text-logo fg-muted text-center'>团队协作平台</p>

                <Form form={form} onSubmit={submit}>
                    <Form.Field htmlFor='account'>
                        <Input name='account' placeholder='登录帐号'/>
                    </Form.Field>
                    <Form.Field htmlFor='password'>
                        <Input.Password name='password' placeholder='用户密码'/>
                    </Form.Field>
                    <Form.Field>
                        <Input.Checkbox name='remember' label='一个月自动登录' value='1' checked/>
                    </Form.Field>
                    
                    <Button theme='primary' size='sm' fluid onClick={ev => {ev.preventDefault(); form.submit()}}>登录</Button>    
                </Form>
            </div>
        </div>
    );
};