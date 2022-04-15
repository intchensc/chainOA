import * as React from 'react';
import * as moment from 'moment';

import {
    Input,
    Button,
    Icon,
    Drawer,
    Table,
    TableColumn,
    Modal,
    Notification,
    Form,
    FormProxy,
    FormFieldValidator
} from '../../components';
import {Share, User} from '../../common/protocol';
import { request } from '../../common/request';
// @ts-ignore
import { Document, Page, pdfjs  } from 'react-pdf';
// @ts-ignore
import SignatureCanvas from 'react-signature-canvas'
import SignPage from "../../components/sign";
pdfjs.GlobalWorkerOptions.workerSrc = "https://cdn.bootcss.com/pdf.js/2.12.313/pdf.worker.js";



export const SharePage = () => {
    const [files, setFiles] = React.useState<Share[]>([]);
    const [users, setUsers] = React.useState<User[]>([]);
    const [numPages, setNumPages] = React.useState();
    const [pageNumber, setPageNumber] = React.useState(1);
    const [imgData, setImgData] = React.useState("111");


    React.useEffect(() => fetchAll(), []);
    React.useEffect(() => fetchUser(), []);


    const schema: TableColumn[] = [
        {label: '合同名称', dataIndex: 'name', align: 'left'},
        {label: '甲方', dataIndex: 'jiafang'},
        {label: '乙方', dataIndex: 'yifang'},
        {label: '上传时间', dataIndex: 'time', sorter: (a: Share, b: Share) => moment(a.time).diff(moment(b.time))},
        {label: 'IPFS', align: 'right',dataIndex:'ipfs'},
        {label: '操作', renderer: (data: Share) => (
            <span>
                <a className='link' href='javascript:void(0)' onClick={() => signpdf(data)}>签章</a>
                <div className='divider-v'/>
                <a className='link' href='javascript:void(0)' onClick={() => delShare(data)}>删除</a>
            </span>
        )}
    ];

    const fetchAll = () => {
        request({url: '/api/file/share/list', success: setFiles});
    };

    const fetchUser = ()=>{
        request({url: "/api/file/share/userlist", success:setUsers})
    }



    // @ts-ignore
    const onDocumentLoadSuccess = ({ numPages })=> {
        setNumPages(numPages);
    };


    const temp = (str:string) => {
        setImgData(str)
    }

    const signpdf = (data: Share) => {
        request({
            url: `/api/file/share/${data.id}`,
            success: (t:string)=>{
                Modal.open({
                    body: (
                        <div>
                            <a className='link' href={t} target="_blank">查看</a>
                            <SignPage id={data.id} url={t}/>
                        </div>
                    ),
                    onOk(): any {
                    },
                    title: "电子签章"

                })
                console.log()
            }
        })



    };

    const sign = (data: Share) => {
        new Promise((resolve, reject) => {
            let param = new FormData();
            param.append('img',imgData);

            let request = new XMLHttpRequest();
            request.open('POST', '/api/file/share');
            request.onerror = () => reject();
            request.onload = () => request.status == 200?resolve():reject();
            request.send(param);
        })
            .then(() => Notification.alert('上传成功', 'info'), () => Notification.alert('上传失败', 'error'))
    };

    const uploader = (file: File) => {

        new Promise((resolve, reject) => {
            let param = new FormData();
            param.append('file', file, file.name);
            let request = new XMLHttpRequest();
            request.open('POST', '/api/file/share');
            request.onerror = () => reject();
            request.onload = () => request.status == 200?resolve():reject();
            request.send(param);
        })
        .then(() => Notification.alert('上传成功', 'info'), () => Notification.alert('上传失败', 'error'))
    };


    const delShare = (data: Share) => {
        Modal.open({
            title: '删除确认',
            body: <div className='my-2'>确定要删除文件【{data.name}】吗？</div>,
            onOk: () => {
                request({url: `/api/file/share/${data.id}`, method: 'DELETE', success: fetchAll});
            }
        });
    };



    const form = Form.useForm({
        yifang: {required: '乙方'},
    });


    const submit = (ev: React.FormEvent<HTMLFormElement>) => {
        ev.preventDefault();
        let param = new FormData(ev.currentTarget);
        request({
            url: '/api/file/share',
            method: 'POST',
            data: param,
            success: () => {
                Notification.alert('合同上传成功', 'info');
                fetchAll()
            }
        })
    };


    return (
        <div className='m-4'>
            <div className='mb-3'>
                <Form form={form} onSubmit={submit}>
                    <Form.Field htmlFor="yifang">
                        <Input.Select name='yifang'>
                            {users.map(u => <option key={u.id} value={u.id}>{u.name}</option>)}
                        </Input.Select>
                    </Form.Field>
                    <Form.Field>
                        <Input.Uploader name="file">
                            <Button size='sm'><Icon type='upload' className='mr-1'/>上传合同</Button>
                        </Input.Uploader>
                    </Form.Field>
                    <Button theme='primary' onClick={ev => {ev.preventDefault(); form.submit();}}><Icon type='plus' className='mr-1'/>提交合同</Button>
                </Form>

            </div>
            <Table dataSource={files} columns={schema} pagination={15}/>
        </div>
    );
};