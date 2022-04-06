import './basic.css';

export const makeClass = (...classes: string[]) => {
    let names: string[] = [];
    classes.forEach(c => {if (c && c.length > 0) names.push(c)});
    return {className: names.join(' ')};
};

export const makeId = () => {
    const pool = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('');
    let uuid: string[] = [];
    for (let i = 0; i < 8; ++i) uuid.push(pool[0 | Math.random()*pool.length]);
    return uuid.join('');
};