import * as React from 'react';

import {Empty} from './empty';
import {Row, Col} from './grid';
import {Input} from './input';
import {Pagination} from './pagination';
import {makeClass} from './basic';
import './table.css';

export interface TableColumn {
    label: string;
    dataIndex?: string;
    align?: "left" | "center" | "right" | "justify" | "char";
    width?: number|string;

    renderer?: (record: any, row: number, cell: number) => React.ReactNode;
    sorter?: (a: any, b: any) => number;
    filter?: (record: any, key: string) => boolean;
};

interface TableProps extends React.TableHTMLAttributes<HTMLTableElement> {
    dataSource: any[];
    columns: TableColumn[];
    pagination?: number;
    emptyLabel?: string;
    size?: 'sm'|'lg';
};

export const Table = (props: TableProps) => {
    const {dataSource, columns, pagination, emptyLabel, size, className, ...nativeProps} = props;
    const classes = makeClass('table', size && `table-${size}`, className);

    const [records, setRecords] = React.useState<any[]>([]);
    const [sortTimes, setSortTimes] = React.useState<number[]>(new Array<number>(columns.length).fill(0));
    const [page, setPage] = React.useState<number>(0);
    const [totalPage, setTotalPage] = React.useState<number>(1);
    const [displayNumber, setDisplayNumber] = React.useState<number>(pagination||10);

    React.useEffect(() => {
        if (!dataSource||dataSource.length == 0) {
            setRecords([]);
            setPage(0);
            setTotalPage(1);
            return;
        }

        let total = Math.max(1, Math.ceil(dataSource.length/displayNumber));
        let curPage = Math.min(page, total-1);
        setPage(curPage);
        setTotalPage(total);

        let start = curPage*displayNumber;
        let end = Math.min((curPage+1)*displayNumber, dataSource.length);
        setRecords(dataSource.slice(start, end));
    }, [dataSource, displayNumber, page, totalPage]);
    
    const makeHeader = (col: TableColumn, idx: number) => {
        let sorted = sortTimes[idx];

        return (
            <th key={idx} scope='col' onClick={() => sortRecords(idx)}>
                {col.label}
                {col.sorter && (
                    <span className='table-sorter'>
                        <i className={`table-sorter-indicator asc${(sorted>0 && sorted%2==1)?' active':''}`}/>
                        <i className={`table-sorter-indicator desc${(sorted>0 && sorted%2==0)?' active':''}`}/>
                    </span>
                )}
            </th>
        );
    };

    const makeRecord = (record: any, idx: number) => {
        return (
            <tr key={`row_${idx}`}>
                {columns.map((col: TableColumn, cell: number) => {
                    return (
                        <td key={`col_${idx}_${cell}`} align={col.align}>
                            {col.renderer ? col.renderer(record, idx, cell) : record[col.dataIndex]}
                        </td>
                    );
                })}
            </tr>
        );
    };

    const sortRecords = (col: number) => {
        if (records.length == 0) return;

        let by = columns[col];
        if (!by || !by.sorter) return;

        let times = [...sortTimes];
        let sorted = times[col];
        if (sorted % 2 == 0) {
            setRecords(records.sort(by.sorter));
        } else {
            setRecords(records.sort((a: any, b: any) => 0 - by.sorter(a, b)));
        }
        times[col]++;
        setSortTimes(times);
    };

    return (
        <table {...classes} {...nativeProps}>
            <colgroup>
                {columns.map((col, idx) => <col key={idx} width={col.width}/>)}
            </colgroup>

            <thead>
                <tr>{columns.map((col, idx) => makeHeader(col, idx))}</tr>
            </thead>

            <tbody>
                {records.length > 0 ? (
                    records.map((record: any, idx: number) => makeRecord(record, idx))
                ) : (
                    <tr className='table-empty'><td colSpan={columns.length}><Empty label={emptyLabel||'暂无数据'}/></td></tr>
                )}
            </tbody>

            <tfoot>
                <tr>
                    <td colSpan={columns.length}>
                        <Row flex={{align: 'middle', justify: 'space-between'}}>
                            <div className='pl-2'>
                                <Input.Select value={displayNumber} onChange={ev => setDisplayNumber(parseInt(ev.target.value))}>
                                    <option value={5}>5 条/页</option>
                                    <option value={10}>10 条/页</option>
                                    <option value={15}>15 条/页</option>
                                    <option value={20}>20 条/页</option>
                                    <option value={25}>25 条/页</option>
                                    <option value={50}>50 条/页</option>
                                </Input.Select>
                                <small className='ml-2'>总计 {dataSource ? dataSource.length : 0} 条数据。</small>
                            </div>
                            <Pagination current={page} total={totalPage} onChange={idx => setPage(idx)}/>
                        </Row>
                    </td>
                </tr>
            </tfoot>
        </table>
    );
};