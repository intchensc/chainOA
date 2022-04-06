import * as React from 'react';
import * as ReactDOM from 'react-dom';

import {makeClass} from './basic';
import {Icon} from './icon';
import './tree.css';

export interface TreeNode {
    nodeId: string;
    label: string;
    children?: TreeNode[];
    expand?: boolean;
    data?: any;
};

export interface TreeNodeAction {
    label: string;
    onClick: (node: TreeNode) => void;
    isEnabled?: (node: TreeNode) => boolean;
};

interface TreeProps extends React.HTMLAttributes<HTMLDivElement> {
    nodes: TreeNode[];
    nodeContextMenu?: TreeNodeAction[];

    selectedNode?: TreeNode;
    onSelectNode?: (node: TreeNode) => void;
};

interface TreeContext {
    getActiveId: () => string;
    selectNode: (node: TreeNode) => void;
    getContextMenu: (node: TreeNode) => TreeNodeAction[];
};

export const Tree = (props: TreeProps) => {
    const {nodes, nodeContextMenu, selectedNode, onSelectNode, className, children, ...nativeProps} = props;
    const [activeNode, setActiveNode] = React.useState<TreeNode>(selectedNode);

    const ctx: TreeContext = {
        getActiveId: () => activeNode?activeNode.nodeId:undefined,
        selectNode: (node: TreeNode) => {
            setActiveNode(node);
            if (onSelectNode) onSelectNode(node);
        },
        getContextMenu: (node: TreeNode) => {
            let ret: TreeNodeAction[] = [];
            nodeContextMenu.forEach(n => {
                if (!n.isEnabled || n.isEnabled(node)) ret.push(n);
            });
            return ret;
        }
    };

    if (React.Children.count(children) > 0) {
        throw 'Please use TreeNode[] in tree props instead of Tree.Node element!';
    };

    return (
        <Tree.Context.Provider value={ctx}>
            <div {...makeClass('tree', className)} {...nativeProps}>
                {nodes.map((n, i) => <Tree.Node key={i} node={n}/>)}
            </div>
        </Tree.Context.Provider>
    );
};

Tree.Context = React.createContext<TreeContext>(null);

Tree.Node = (props: {node: TreeNode}) => {
    const {node} = props;
    const [expand, setExpand] = React.useState<boolean>(node.expand);
    const menuAnchor = React.useRef<HTMLDivElement>(null);
    const ctx = React.useContext(Tree.Context);
    const actived = ctx.getActiveId() == node.nodeId;
    const hasChild = node.children && node.children.length > 0;

    React.useEffect(() => {
        menuAnchor.current.parentElement.addEventListener('mouseleave', () => {
            ReactDOM.unmountComponentAtNode(menuAnchor.current);
        });
    }, [menuAnchor]);

    const handleContextMenu = (ev: React.MouseEvent<HTMLLabelElement>) => {
        ev.preventDefault();

        ReactDOM.render((
            <ul>
                {ctx.getContextMenu(node).map((a, i) => {
                    if (a.isEnabled && !a.isEnabled(node)) return null;
                    return <li key={i} onClick={() => {a.onClick(node); ReactDOM.unmountComponentAtNode(menuAnchor.current)}}>{a.label}</li>;
                })}
            </ul>
        ), menuAnchor.current);
    };

    return (
        <div className='tree-node'>
            <div className='tree-entry'>
                <Icon className='tree-icon' type={hasChild ? (expand?'minus-square':'plus-square') : 'file'} onClick={() => {if (hasChild) setExpand(!expand);}} />
                <label {...makeClass('tree-label', actived&&'tree-selected')} onClick={() => ctx.selectNode(node)} onContextMenu={handleContextMenu}>
                    {node.label}
                </label>
                <div className='anchor' ref={menuAnchor}/>
            </div>

            <div className='tree-child' hidden={!expand}>
                {hasChild&&node.children.map((n, i) => <Tree.Node key={i} node={n}/>)}
            </div>
        </div>
    );
};