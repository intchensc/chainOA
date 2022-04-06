import * as React from 'react';
import * as moment from 'moment';

import {makeClass} from './basic';
import {Button} from './button';
import {Card} from './card';
import {Row, Col} from './grid';
import {Icon} from './icon';
import './datetime.css';

type DateTimeElem = 'year'|'month'|'day'|'time'|'none';

interface DateTimeProps {
    mode?: 'datetime'|'date'|'time',
    value?: string;
    onChange: (newValue: string) => void;
};

interface DateTimeElemProps {
    date: moment.Moment;
    onSwitch: (datetime: moment.Moment, to: DateTimeElem) => void;
    onSelect: (datetime: moment.Moment) => void;
}

export const DateTime = (props: DateTimeProps) => {
    const [value, setValue] = React.useState<moment.Moment>(moment(props.value&&props.value.length>0?props.value:undefined));
    const [view, setView] = React.useState<JSX.Element>(null);
    const mode = props.mode || 'datetime';

    React.useEffect(() => pickView(value, mode=='time'?'time':'day', props.value), [props]);

    const pickView = (date: moment.Moment, to: DateTimeElem, defaultValue: string) => {
        let commonProps = {date: date, onSwitch: (d: moment.Moment, t: DateTimeElem) => pickView(d, t, defaultValue), onSelect: select};

        switch (to) {
        case 'year': 
            setView(<DateTime.YearPicker {...commonProps}/>);
            break;
        case 'month':
            setView(<DateTime.MonthPicker {...commonProps}/>);
            break;
        case 'day':
            setView(<DateTime.DayPicker hasTime={mode!='date'} {...commonProps}/>);
            break;
        case 'time':
            setView(<DateTime.TimePicker hasDate={mode!='time'} {...commonProps}/>);
            break;
        default:
            setValue(moment(props.value&&props.value.length>0?props.value:undefined));
            props.onChange(props.value);
            break;
        }
    };

    const select = (date: moment.Moment) => {
        setValue(date);

        if (mode == 'datetime') props.onChange(date.format('YYYY-MM-DD HH:mm:ss'));
        else if (mode == 'date') props.onChange(date.format('YYYY-MM-DD'));
        else props.onChange(date.format('HH:mm:ss'));
    };

    return view;
};

DateTime.YearPicker = (props: DateTimeElemProps) => {
    const [value, setValue] = React.useState<moment.Moment>(props.date);
    const [years, setYears] = React.useState<JSX.Element[]>([]);

    const getStartYear = () => {
        let start = moment('1000-01-01');
        while (moment(start).add(14, 'year').year() < value.year()) start = start.add(15, 'year');
        return start;
    };

    React.useEffect(() => {
        let start = getStartYear().year();
        let rows: JSX.Element[] = [];
        let row: JSX.Element[] = [];

        for (let count = 0; count < 15; count++) {
            row.push(<td key={start+count} className={start+count==value.year()?'selected':undefined} onClick={() => setValue(moment(value).set('year', start+count))}>{start+count}年</td>);
            if (row.length == 3) {
                rows.push(<tr key={rows.length}>{row}</tr>);
                row = [];
            }
        }
        
        setYears(rows);
    }, [value]);

    return (
        <Card
            header={(
                <Row flex={{align: 'middle', justify: 'space-between'}} style={{height: 32, padding: '0 8px'}}>
                    <Icon type='left' className='fg-dark' onClick={() => setValue(moment(value).subtract(15, 'year'))}/>
                    <label style={{fontSize: 14}}>{`${getStartYear().year()}年 - ${getStartYear().year()+14}年`}</label>
                    <Icon type='right' className='fg-dark' onClick={() => setValue(moment(value).add(15, 'year'))}/>
                </Row>)}
            footer={(
                <Row flex={{align: 'middle', justify: 'space-between'}} style={{height: 32}}>
                    <Button theme='link' onClick={() => props.onSwitch(value, 'day')}>设置日期</Button>
                    <Button.Group>
                        <Button size='sm' onClick={ev => {ev.preventDefault(); setValue(moment(value).set('year', moment().year())); }}>现在</Button>
                        <Button size='sm' onClick={ev => {ev.preventDefault(); props.onSelect(value)}}>确定</Button>
                        <Button size='sm' onClick={ev => {ev.preventDefault(); props.onSwitch(value, 'none')}}>取消</Button>
                    </Button.Group>
                </Row>
            )}
            style={{position: 'absolute', width: 256, top: 4, left: -2, zIndex: 1000}}
            shadowed>
            <table className='datepicker-year'>
                <tbody>
                    {years}
                </tbody>
            </table>
        </Card>
    );
};

DateTime.MonthPicker = (props: DateTimeElemProps) => {
    const [value, setValue] = React.useState<moment.Moment>(props.date);
    const months = [
        ['一月', '二月', '三月', '四月'],
        ['五月', '六月', '七月', '八月'],
        ['九月', '十月', '十一月', '十二月'],
    ];
    
    return (
        <Card
            header={<p style={{height: 32, padding: '0 8px', textAlign: 'center'}}>选择月份</p>}
            footer={(
                <Row flex={{align: 'middle', justify: 'space-between'}} style={{height: 32}}>
                    <Button theme='link' onClick={() => props.onSwitch(value, 'day')}>设置日期</Button>
                    <Button.Group>
                        <Button size='sm' onClick={ev => {ev.preventDefault(); setValue(moment(value).set('month', moment().month())); }}>现在</Button>
                        <Button size='sm' onClick={ev => {ev.preventDefault(); props.onSelect(value)}}>确定</Button>
                        <Button size='sm' onClick={ev => {ev.preventDefault(); props.onSwitch(value, 'none')}}>取消</Button>
                    </Button.Group>
                </Row>
            )}
            style={{position: 'absolute', width: 256, top: 4, left: -2, zIndex: 1000}}
            shadowed>
            <table className='datepicker-month'>
                <tbody>
                    {months.map((r, i) => {
                        return (
                            <tr key={i}>
                                {r.map((m, j) => <td key={m} className={i*4+j==value.month()?'selected':undefined} onClick={() => setValue(moment(value).set('month', i*4+j))}>{m}</td>)}
                            </tr>
                        );
                    })}
                </tbody>
            </table>
        </Card>
    );
};

DateTime.DayPicker = (props: DateTimeElemProps & {hasTime?: boolean}) => {
    const [value, setValue] = React.useState<moment.Moment>(moment(props.date));
    const [days, setDays] = React.useState<JSX.Element[][]>([]);

    React.useEffect(() => {
        let tableDays: JSX.Element[][] = [];
            let month = value.month();

            let tableStart = moment(value).startOf('month').startOf('week');
            let tableEnd = moment(value).endOf('month').endOf('week').subtract(1, 'day');
            let weekOfYear = tableStart.weeks();
            let lastWeek: JSX.Element[] = [];

            for (let day = moment(tableStart); day.diff(tableEnd, 'days') <= 0; day.add(1, 'day')) {
                let dayRef = moment(day);
                let dayMonth = dayRef.month();
                let dayValue = dayRef.date();

                if (day.weeks() != weekOfYear) {
                    weekOfYear = day.weeks();
                    tableDays.push(lastWeek);
                    lastWeek = [];
                }

                lastWeek.push((
                    <td
                        key={dayRef.dayOfYear()}
                        {...makeClass(dayMonth<month&&'prev', dayMonth>month&&'next', dayRef.dayOfYear()==value.dayOfYear()&&'selected')}
                        onClick={() => setValue(dayRef)}>
                        {dayValue}
                    </td>
                ));
            }

            if (lastWeek.length > 0) tableDays.push(lastWeek);
            setDays(tableDays);
    }, [value]);

    const useNow = (ev: React.MouseEvent<HTMLButtonElement>) => {
        ev.preventDefault();

        let now = moment();
        now.set('hour', value.hour());
        now.set('minute', value.minute());
        now.set('second', value.second());
        setValue(now);
    };

    return (
        <Card
            header={(
                <Row flex={{align: 'middle', justify: 'space-between'}} style={{height: 32, padding: '0 8px'}}>
                    <Icon type='left' className='fg-dark' onClick={() => setValue(prev => moment(prev.subtract(1, 'month')))}/>
                    <Button theme='link' className='fg-dark' onClick={ev => {ev.preventDefault(), props.onSwitch(value, 'year')}}>{value.year()} 年</Button>
                    <Button theme='link' className='fg-dark' onClick={ev => {ev.preventDefault(), props.onSwitch(value, 'month')}}>{value.month()+1} 月</Button>
                    <Icon type='right' className='fg-dark' onClick={() => setValue(prev => moment(prev.add(1, 'month')))}/>
                </Row>)}
            footer={(
                <Row flex={{align: 'middle', justify: props.hasTime?'space-between':'end'}} style={{height: 32}}>
                    {props.hasTime && <Button theme='link' onClick={() => props.onSwitch(value, 'time')}>设置时间</Button>}
                    <Button.Group>
                        <Button size='sm' onClick={useNow}>现在</Button>
                        <Button size='sm' onClick={ev => {ev.preventDefault(); props.onSelect(value)}}>确定</Button>
                        <Button size='sm' onClick={ev => {ev.preventDefault(); props.onSwitch(value, 'none')}}>取消</Button>
                    </Button.Group>
                </Row>
            )}
            style={{position: 'absolute', width: 256, top: 4, left: -2, zIndex: 1000}}
            shadowed>
            <table className='datepicker-day'>
                <thead>
                    <tr>
                        <th>日</th>
                        <th>一</th>
                        <th>二</th>
                        <th>三</th>
                        <th>四</th>
                        <th>五</th>
                        <th>六</th>
                    </tr>
                </thead>
                <tbody>
                    {days.map((week, i) => { return <tr key={i}>{week}</tr> })}
                </tbody>
            </table>
        </Card>
    );
};

DateTime.TimePicker = (props: DateTimeElemProps & {hasDate?: boolean}) => {
    const [value, setValue] = React.useState<moment.Moment>(moment(props.date));
    const hours = ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', '15', '16', '17', '18', '19', '20', '21', '22', '23'];
    const minAndSecs = [
        '00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14', 
        '15', '16', '17', '18', '19', '20', '21', '22', '23', '24', '25', '26', '27', '28', '29',
        '30', '31', '32', '33', '34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44',
        '45', '46', '47', '48', '49', '50', '51', '52', '53', '54', '55', '56', '57', '58', '59'];

    const useNow = (ev: React.MouseEvent<HTMLButtonElement>) => {
        ev.preventDefault();

        let now = moment();
        now.set('year', value.year());
        now.set('month', value.month());
        now.set('date', value.date());
        setValue(now);
    };

    return (
        <Card
            header={(
                <Row flex={{align: 'middle', justify: 'center'}} style={{height: 32}}>
                    选择时间
                </Row>)}
            footer={(
                <Row flex={{align: 'middle', justify: props.hasDate?'space-between':'end'}} style={{height: 32}}>
                    {props.hasDate && <Button theme='link' onClick={() => props.onSwitch(value, 'day')}>设置日期</Button>}
                    <Button.Group>
                        <Button size='sm' onClick={useNow}>现在</Button>
                        <Button size='sm' onClick={ev => {ev.preventDefault(); props.onSelect(value)}}>确定</Button>
                        <Button size='sm' onClick={ev => {ev.preventDefault(); props.onSwitch(value, 'none')}}>取消</Button>
                    </Button.Group>
                </Row>
            )}
            style={{position: 'absolute', width: 256, top: 4, left: -2, zIndex: 1000}}
            shadowed>
            <Row className='p-2 text-center'>
                <Col span={{xs: 4}}>时</Col>
                <Col span={{xs: 4}}>分</Col>
                <Col span={{xs: 4}}>秒</Col>
            </Row>
            <div className='datepicker-time'>
                <ul>
                    {hours.map((h, i) => <li key={i} className={value.hour()==i?`selected`:undefined} onClick={() => setValue(moment(value.set('hour', i)))}>{h}</li>)}
                </ul>
                <ul>
                    {minAndSecs.map((m, i) => <li key={i} className={value.minute()==i?`selected`:undefined} onClick={() => setValue(moment(value.set('minute', i)))}>{m}</li>)}
                </ul>
                <ul>
                    {minAndSecs.map((s, i) => <li key={i} className={value.second()==i?`selected`:undefined} onClick={() => setValue(moment(value.set('second', i)))}>{s}</li>)}
                </ul>
            </div>
        </Card>
    );
};

