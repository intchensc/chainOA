export const ProjectRole = [
    '策划',
    '研发',
    '测试',
    '运营',
    '美术',
];

export const TaskStatus = [
    {
        type: 'created',
        name: '待办中',
        icon: 'calendar-check',
        color: '#6c757d',
    },
    {
        type: 'underway',
        name: '进行中',
        icon: 'build',
        color: '#17a2b8',
    },
    {
        type: 'testing',
        name: '测试中',
        icon: 'experiment',
        color: '#007bff',
    },
    {
        type: 'finished',
        name: '已完成',
        icon: 'check-circle',
        color: '#28a745',
    },
    {
        type: 'archived',
        name: '已验收',
        icon: 'file-done',
        color: '#28a745',
    }
];

export const TaskWeight = [
    { name: '[一般] ', color: 'green' },
    { name: '[次要] ', color: 'blue' },
    { name: '[主要] ', color: 'orange' },
    { name: '[严重] ', color: '#f50' },
];