import * as React from 'react';
import * as ReactMarkdown from 'react-markdown';

import {Blockquote} from './blockquote';
import {Button} from './button';
import {Code} from './code';
import {Row, Col} from './grid';
import {Icon} from './icon';
import {Image} from './image';
import {Input} from './input';
import {Modal} from './modal';
import {Notification} from './notification';
import './markdown.css';

type CustomUpload = (file: File, done: (url: string) => void) => void;

interface RendererProps {
    source?: string;
}

interface EditorProps {
    name?: string;
    rows?: number;
    height?: number | string;
    value?: string;
    onChange?: (data: string) => void;
    onUpload?: CustomUpload;
}

const Renderer = (props: RendererProps) => {
    const customRenderers = {
        listItem: (props: any) => {
            let liProps = props['data-sourcepos'] ? { 'data-sourcepos': props['data-sourcepos'] } : {};

            if (props.checked === null) {
                return <li {...liProps}>{props.children}</li>;
            } else {
                return (
                    <li className='task' {...liProps}>
                        <input type='checkbox' checked={props.checked} readOnly={true}/>
                        {props.children}
                    </li>
                );
            }
        },
        image: (props: any) => {
            return <Image {...props}/>
        },
        code: (props: any) => {
            return <Code label={props.language} data={props.value}/>
        },
        blockquote: (props: any) => {
            return <Blockquote>{props.children}</Blockquote>
        },
    };

    return (
        <ReactMarkdown 
            source={props.source || ''} 
            escapeHtml={false}
            className='markdown'
            renderers={customRenderers}/>
    )
};

const Editor = (props: EditorProps) => {
    const [content, setContent] = React.useState<string>(props.value || '');
    const [showPreview, setShowPreview] = React.useState<boolean>(false);
    const textArea = React.useRef<HTMLTextAreaElement>();
    const viewerArea = React.useRef<HTMLDivElement>();

    const toolbar = [
        [
            {useText: true, caption: 'H1', tooltip: '一级标题', modify: (data: string) => `\n# ${data || '一级标题'}  \n`},
            {useText: true, caption: 'H2', tooltip: '二级标题', modify: (data: string) => `\n## ${data || '二级标题'}  \n`},
            {useText: true, caption: 'H3', tooltip: '三级标题', modify: (data: string) => `\n### ${data || '三级标题'}  \n`},
        ],
        [
            {caption: 'bold', tooltip: '粗体', modify: (data: string) => `**${data || '粗体'}**`},
            {caption: 'italic', tooltip: '斜体', modify: (data: string) => `*${data || '斜体'}*`},
            {caption: 'strike-through', tooltip: '删除线', modify: (data: string) => `<s>${data || '删除线'}</s>`},
            {caption: 'underline', tooltip: '下划线', modify: (data: string) => `<u>${data || '下划线'}</u>`},
        ],
        [
            {caption: 'ordered-list', tooltip: '有序表', modify: (data: string) => `\n1. ${data || '第一项'}\n2. 第二项\n`},
            {caption: 'unordered-list', tooltip: '无序表', modify: (data: string) => `\n* ${data || '第一项'}\n* 第二项\n`},
            {caption: 'calendar-check-fill', tooltip: '任务列表', modify: (data: string) => `\n* [ ] ${data || '第一项'}\n* [ ] 第二项\n`},
        ],
        [
            {caption: 'code', tooltip: '代码', modify: (data: string) => `\n\`\`\`\n${data || '代码'}\n\`\`\`  \n`},
            {caption: 'push-pin', tooltip: '引用', modify: (data: string) => `\n> ${data || '引用内容'}\n\n`},
            {caption: 'table', tooltip: '表格', modify: (data: string) => `\n\n| 标题1 | 标题2 |\n|---|---|  \n${data || ''}`},
            {caption: 'link', tooltip: '链接', modify: (data: string) => `[显示内容](${data || '连接地址'})`},
            {caption: 'file-image', tooltip: '图片', action: () => openImgTool()},
        ],
    ];

    const onContentChange = (ev: React.ChangeEvent<HTMLTextAreaElement>) => {
        setContent(ev.target.value);
        props.onChange && props.onChange(ev.target.value);
    };

    const modifyContent = (action: (data: string) => string) => {
        let elem = textArea.current;
        let data = [content];

        let start = elem.selectionStart;
        let end = elem.selectionEnd;
        data = [
            content.substr(0, start),
            content.substr(start, end - start),
            content.substr(end),
        ];

        let modified = (data[0] || '') + action(data[1]) + (data[2] || '');
        setContent(modified);
        props.onChange && props.onChange(modified);

        elem.focus();
    };

    const openImgTool = () => {
        if (!props.onUpload) {
            Notification.alert('未配置上传，功能不可用', 'error');
            return;
        }

        let uploaded: string = null;
        const customUploader = (f: File, done: (url: string) => void) => {
            props.onUpload(f, u => {
                uploaded = u;
                done(u);
            });
        };

        Modal.open({
            title: '图片工具',
            body: <Editor.ImgHelper uploader={customUploader}/>,
            onOk: () => insertImage(uploaded),
        });
    };

    const insertImage = (url: string) => {
        if (url && url.length > 0) modifyContent(data => `![${data || '输入图片TIPS'}](${url})`);
        Notification.alert('插入图片成功', 'info');
    };

    const pasteImage = (ev: React.ClipboardEvent<HTMLTextAreaElement>) => {
        if (!props.onUpload) return;

        if (!(ev.clipboardData && ev.clipboardData.items && ev.clipboardData.items.length > 0)) {
            return;
        }

        let item = ev.clipboardData.items[0];
        if (item.kind == 'file' && item.type.indexOf('image') != -1) {
            let file = item.getAsFile();
            props.onUpload(file, url => insertImage(url));
        }
    };

    const syncScroll = (ev: React.UIEvent<HTMLTextAreaElement>) => {
        viewerArea.current.scrollTop = ev.currentTarget.scrollTop * viewerArea.current.scrollHeight / ev.currentTarget.scrollHeight;
    };
    
    return (
        <div style={{padding: '0px 4px'}}>
            <Row flex={{align: 'middle', justify: 'start'}} className='mb-1'>
                {toolbar.map((group: any[], i: number) => {
                    return (
                        <Button.Group key={i} style={{marginRight: 4}}>
                            {group.map((opt, j) => {
                                return (
                                    <Button key={`${i}_${j}`} title={opt.tooltip} size='sm' onClick={ev => {ev.preventDefault(); opt.action?opt.action():modifyContent(opt.modify)}}>
                                        {opt.useText ? opt.caption : <Icon type={opt.caption} />}
                                    </Button>
                                );
                            })}
                        </Button.Group>
                    );
                })}

                <Button.Group>
                    <Button 
                        title='预览'
                        theme={showPreview ? 'primary' : 'default'}
                        size='sm'
                        onClick={ev => {ev.preventDefault(); setShowPreview(prev => !prev)}}>
                        <Icon type='eye' />
                    </Button>
                </Button.Group>
            </Row>

            <Row>
                <Col span={{xs: showPreview?6:12}}>
                    <Input.Textarea
                        name={props.name}
                        ref={textArea}
                        rows={props.rows || undefined}
                        style={{height: props.height || undefined, width: '100%'}}
                        value={content}
                        onScroll={syncScroll}
                        onChange={onContentChange}
                        onPaste={pasteImage}/>
                </Col>

                <Col span={{xs: showPreview?6:0}} style={{height: '100%'}}>
                    <div ref={viewerArea} className='markdown-viewer' style={{height: textArea.current&&(textArea.current.clientHeight+2)}}>                        
                        <Renderer source={content}/>
                    </div>
                </Col>                
            </Row>
        </div>
    );
};

Editor.ImgHelper = (props: {uploader: CustomUpload}) => {
    const [value, setValue] = React.useState<string>('');

    return (
        <Input placeholder='直接输入外部连接' value={value} onChange={setValue} addon={
            <Input.Uploader accept='image/*' customUpload={f => props.uploader(f, setValue)}>
                <Button size='sm'>选择图片</Button>
            </Input.Uploader>
        }/>
    );
};

export const Markdown = {
    Renderer: Renderer,
    Editor: Editor,
};