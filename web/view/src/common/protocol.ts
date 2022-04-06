/**
 * 用户信息
 */
export interface User {
    /**
     * 唯一ID
     */
    id: number,
    /**
     * 帐号
     */
    account?: string,
    /**
     * 显示名称
     */
    name?: string,
    /**
     * 头像
     */
    avatar?: string,
    /**
     * 是否是内置帐号
     */
    isBuildin?: boolean,
    /**
     * 是否是超级管理员
     */
    isSu?: boolean,
    /**
     * 是否被锁定登录
     */
    isLocked?: boolean,
}

/**
 * 项目成员
 */
export interface ProjectMember {
    /**
     * 成员信息
     */
    user: User;
    /**
     * 成员角色，参见`ProjectRole`
     */
    role: number;
    /**
     * 是否是项目管理员
     */
    isAdmin?: boolean;
}

/**
 * 项目里程
 */
export interface ProjectMilestone {
    /**
     * 唯一ID
     */
    id: number;
    /**
     * 显示名称
     */
    name: string;
    /**
     * 计划开始时间
     */
    startTime: string;

    /**
     * 计划截止时间
     */
    endTime: string;

    /**
     * 描述
     */
    desc?: string;
}

/**
 * 项目信息
 */
export interface Project {
    /**
     * 唯一ID
     */
    id: number;
    /**
     * 显示名称
     */
    name: string;
    /**
     * 成员列表
     */
    members?: ProjectMember[];
    /**
     * 分支列表
     */
    milestones?: ProjectMilestone[];
}

/**
 * 项目统计数据
 */
export interface ProjectSummary {
    /**
     * 自定义简介
     */
    desc: string;
    /**
     * 成员数
     */
    members: number;
    /**
     * 里程碑数
     */
    milestones: number;
    /**
     * 进行中的任务数
     */
    tasks: number;
    /**
     * 逾期任务
     */
    delayed: number;
}

/**
 * 周报
 */
export interface ProjectWeek {
    /**
     * 已完成验收的
     */
    archived: TaskBrief[];
    /**
     * 未完成验收的
     */
    unarchived: TaskBrief[];
}

/**
 * 评论
 */
export interface TaskComment {
    /**
     * 时间
     */
    time: string;
    /**
     * 人
     */
    user: string,
    /**
     * 头像
     */
    avatar: string;
    /**
     * 内容
     */
    content: string;
}

/**
 * 任务相关操作事件
 */
export interface TaskEvent {
    /**
     * 时间
     */
    time: string;
    /**
     * 操作人员
     */
    operator: string;
    /**
     * 事件
     */
    event: number;
    /**
     * 事件附加参数
     */
    extra: string;
}

/**
 * 任务摘要
 */
export interface TaskBrief {
    /**
     * 唯一ID
     */
    id: number;
    /**
     * 显示名
     */
    name: string;
    /**
     * 所属项目
     */
    proj: {id: number, name: string};
    /**
     * 里程碑
     */
    milestone: {id: number, name: string};
    /**
     * 是否置顶
     */
    bringTop: boolean;
    /**
     * 权重
     */
    weight: number;
    /**
     * 当前的状态
     */
    state: number;
    /**
     * 创建者/需求发起方
     */
    creator: {id: number, name: string};
    /**
     * 开发者/乙方
     */
    developer: {id: number, name: string};
    /**
     * 测试者/验收方
     */
    tester: {id: number, name: string};
    /**
     * 计划开始时间
     */
    startTime: string;
    /**
     * 计划截止时间
     */
    endTime: string;
}

/**
 * 服务器返回的任务数据类型
 */
export interface Task {
    /**
     * 任务唯一ID
     */
    id: number;

    /**
     * 任务标题
     */
    name: string;

    /**
     * 所属项目
     */
    proj: Project,

    /**
     * 所属分支
     */
    milestone: ProjectMilestone,

    /**
     * 权重
     */
    weight: number;

    /**
     * 当前的状态
     */
    state: number;

    /**
     * 创建者/需求发起方
     */
    creator: User,

    /**
     * 开发者/乙方
     */
    developer: User,

    /**
     * 测试者/验收方
     */
    tester: User,

    /**
     * 计划开始时间
     */
    startTime: string;

    /**
     * 计划截止时间
     */
    endTime: string;

    /**
     * 任务标签列表
     */
    tags?: number[];

    /**
     * 任务内容
     */
    content?: string;

    /**
     * 任务附件列表
     */
    attachments?: {name: string, url: string}[];

    /**
     * 评论
     */
    comments?: TaskComment[];

    /**
     * 事件
     */
    events?: TaskEvent[];
}

/**
 * 通知事件
 */
export interface Notice {
    /**
     * 唯一ID
     */
    id: number;
    /**
     * 相关任务ID
     */
    tid: number;
    /**
     * 相关任务名
     */
    tname: string;
    /**
     * 相关操作人员
     */
    operator: string;
    /**
     * 时间
     */
    time: string;
    /**
     * 事件
     */
    ev: number;
}

/**
 * 文档
 */
export interface Document {
    /**
     * 唯一ID
     */
    id: number;
    /**
     * 父节点ID
     */
    parent: number;
    /**
     * 标题
     */
    title: string;
    /**
     * 创建者
     */
    creator?: string;
    /**
     * 最近更新人
     */
    modifier?: string;
    /**
     * 最近更新时间
     */
    time?: string;
    /**
     * 内容
     */
    content?: string;
}

/**
 * 分享文件
 */
export interface Share {
    /**
     * 唯一ID
     */
    id: number;
    /**
     * 文件名
     */
    name: string;
    /**
     * 甲方
     */
    jiafang: string;

    /**
     * 乙方
     */
    yifang: string;
    /**
     * 时间
     */
    time: string;
    /**
     * 大小
     */
    ipfs: string;
}

/*
    档案记录
*/
export interface Record{
    owner: string; //档案所有人
    department: string; //所属部门
    content: string; //档案内容
    uploader: string; //上传人
    uploadTime: string; //时间
    
}