import * as React from 'react';
import * as moment from 'moment';

import {Input, Button, Icon, Progress, Table, TableColumn, Modal, Notification} from '../../components';
import {Record} from '../../common/protocol';
import { request } from '../../common/request';

export const RecordPage = () => {
    const [isUploading, setIsUploading] = React.useState<boolean>(false);
    const [progress, setProgress] = React.useState<number>(0);
    const [records, setRecord] = React.useState<[]>([]);

    React.useEffect(() => fetchAll(), []);

    const schema: TableColumn[] = [
        {label: '所有人', dataIndex: 'owner', align: 'left'},
        {label: '所属部门', dataIndex: 'department'},
        {label: '记录内容', dataIndex: 'content'},
        {label: '上传人',dataIndex:"uploader" ,align: 'right'},
        {label: '上传时间',dataIndex:"uploadTime"},
    ];

    const fetchAll = () => {
        request({url: '/api/project/getRecord',  method: 'GET', success: setRecord});
    };



    return (
        <div className='m-4'>
            {isUploading&&(
                <div>
                    <Progress percent={progress}/>
                </div>
            )}
            {records}
            {/*<Table dataSource={records} columns={schema} pagination={15}/>*/}
        </div>
    );
};