import * as React from 'react';
import * as moment from 'moment';

import {Input, Button, Icon, Drawer, Table, TableColumn, Modal, Notification, Form} from '../../components';
import {Share} from '../../common/protocol';
import { request } from '../../common/request';
// @ts-ignore
import { Document, Page, pdfjs  } from 'react-pdf';
// @ts-ignore
import SignatureCanvas from 'react-signature-canvas'
import SignPage from "../../components/sign";
pdfjs.GlobalWorkerOptions.workerSrc = "https://cdn.bootcss.com/pdf.js/2.12.313/pdf.worker.js";



export const SharePage = () => {
    const [progress, setProgress] = React.useState<number>(0);
    const [files, setFiles] = React.useState<Share[]>([]);
    const [numPages, setNumPages] = React.useState();
    const [pageNumber, setPageNumber] = React.useState(1);
    const [pdfUrl, setPdfUrl] = React.useState("")

    React.useEffect(() => fetchAll(), []);

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

    // @ts-ignore
    const onDocumentLoadSuccess = ({ numPages })=> {
        setNumPages(numPages);
    };



    const signpdf = (data: Share) => {
        request({url: `/api/file/share/${data.id}`, success: setPdfUrl});

        Drawer.open({
            width: 800,
            header: '电子签章',
            body: (
                <div>
                    <Document file={pdfUrl} onLoadSuccess={onDocumentLoadSuccess} loading={true}>
                        <Page pageNumber={pageNumber}/>
                    </Document>
                    <SignPage/>
                </div>
                ),
            })
    };

    const uploader = (file: File) => {
        setProgress(0);

        new Promise((resolve, reject) => {
            let param = new FormData();
            param.append('file', file, file.name);

            let request = new XMLHttpRequest();
            request.open('POST', '/api/file/share');
            request.upload.onprogress = (e: ProgressEvent) => setProgress(e.loaded * 100 / e.total);
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

    const [signImg, setSignImg] = React.useState('');
    const [signTip, setSignTip] = React.useState('请签名');

    let sigCanvas: any;
    const clearSign = () => {
        sigCanvas.clear();
    };
    const handleSign = () => {
        setSignImg(sigCanvas.toDataURL('image/png'));
    };

    return (
        <div className='m-4'>
            <div className='mb-3'>
                <Input.Uploader customUpload={uploader}>
                    <Button size='sm'><Icon type='upload' className='mr-1'/>上传合同</Button>
                </Input.Uploader>

            </div>
            <Table dataSource={files} columns={schema} pagination={15}/>
        </div>
    );
};