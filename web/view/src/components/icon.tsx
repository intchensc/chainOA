import * as React from 'react';

import {makeClass} from './basic';
import './icon.css';

export const IconFonts = [
    'check-circle', 'ci', 'dollar', 'compass', 'close-circle', 'frown', 'info-circle', 'left-circle', 'down-circle', 'euro',
    'copyright', 'minus-circle', 'meh', 'plus-circle', 'play-circle', 'question-circle', 'pound', 'right-circle', 'smile-circle', 'trademark',
    'time-circle', 'timeout', 'earth', 'yuan', 'up-circle', 'warning-circle', 'sync', 'transaction', 'undo', 'redo', 
    'reload', 'reloadtime', 'message', 'dashboard', 'issueclose', 'poweroff', 'logout', 'pie-chart', 'setting', 'eye',
    'location', 'edit-square', 'export', 'save', 'import', 'appstore', 'close-square', 'down-square', 'layout', 'left-square',
    'play-square', 'control', 'code-library', 'detail', 'minus-square', 'plus-square', 'right-square', 'project', 'wallet', 'up-square',
    'calculator', 'interaction', 'check-square', 'border', 'add-user', 'delete-team', 'delete-user', 'add-team', 'user', 'team',
    'area-chart', 'line-chart', 'bar-chart', 'point-map', 'container', 'database', 'server', 'mobile', 'tablet', 'redenvelope',
    'book', 'file-done', 'reconciliation', 'file-exception', 'file-sync', 'file-search', 'solution', 'file-protect', 'file-add', 'file-excel',
    'file-exclamation', 'file-pdf', 'file-image', 'file-markdown', 'file-unknown', 'file-ppt', 'file-word', 'file', 'file-zip', 'file-text',
    'file-copy', 'snippets', 'audit', 'diff', 'batch-folding', 'security-scan', 'property-safety', 'safety-certificate', 'insurance', 'alert',
    'delete', 'hour-glass', 'bulb', 'experiment', 'bell', 'trophy', 'rest', 'usb', 'skin', 'home',
    'bank', 'filter', 'funnel-plot', 'like', 'unlike', 'unlock', 'lock', 'customer-service', 'flag', 'money-collect',
    'medicine-box', 'shop', 'rocket', 'shopping', 'folder', 'folder-open', 'folder-add', 'deployment-unit', 'accountbook', 'contacts',
    'carry-out', 'calendar-check', 'calendar', 'scan', 'select', 'box-plot', 'build', 'sliders', 'barcode', 'camera',
    'cluster', 'gateway', 'car', 'printer', 'read', 'cloud-server', 'cloud-upload', 'cloud', 'cloud-download', 'cloud-sync',
    'video', 'notification', 'sound', 'radar-chart', 'qrcode', 'fund', 'image', 'mail', 'table', 'idcard',
    'creditcard', 'heart', 'block', 'error', 'star', 'gold', 'heat-map', 'wifi', 'attachment', 'edit',
    'key', 'api', 'disconnect', 'highlight', 'monitor', 'link', 'man', 'percentage', 'push-pin', 'phone',
    'shake', 'tag', 'wrench', 'tags', 'scissor', 'mr', 'share', 'branches', 'fork', 'shrink', 
    'arrawsalt', 'vertical-right', 'vertical-left', 'right', 'left', 'up', 'down', 'fullscreen', 'fullscreen-exit', 'double-left',
    'double-right', 'arrow-right', 'arrow-up', 'arrow-left', 'arrow-down', 'upload', 'column-height', 'vertical-align-bottom', 'vertical-align-middle', 'to-top',
    'vertical-align-top', 'download', 'sort-desc', 'sort-asc', 'fall', 'swap', 'stock', 'rise', 'indent', 'outdent',
    'menu', 'unordered-list', 'ordered-list', 'align-right', 'align-center', 'align-left', 'pic-center', 'pic-right', 'pic-left', 'bold',
    'font-colors', 'exclaimination', 'font-size', 'info', 'line-height', 'strike-through', 'underline', 'number', 'italic', 'code',
    'column-width', 'check', 'ellipsis', 'dash', 'close', 'enter', 'line', 'minus', 'question', 'rollback', 
    'small-dash', 'pause', 'bg-colors', 'crown', 'drag', 'desktop', 'gift', 'stop', 'fire', 'thunderbolt',
    'check-circle-fill', 'left-circle-fill', 'down-circle-fill', 'minus-circle-fill', 'close-circle-fill', 'info-circle-fill', 'up-circle-fill', 'right-circle-fill', 'plus-circle-fill', 'question-circle-fill',
    'euro-circle-fill', 'frown-fill', 'copyright-circle-fill', 'ci-circle-fill', 'compass-circle-fill', 'dollar-circle-fill', 'poweroff-circle-fill', 'meh-fill', 'play-circle-fill', 'pound-circle-fill',
    'smile-fill', 'stop-fill', 'warning-circle-fill', 'time-circle-fill', 'trademark-circle-fill', 'yuan-circle-fill', 'heart-fill', 'pie-chart-circle-fill', 'dashboard-fill', 'message-fill',
    'check-square-fill', 'down-square-fill', 'minus-square-fill', 'close-square-fill', 'code-library-fill', 'left-square-fill', 'play-square-fill', 'up-square-fill', 'right-square-fill', 'plus-square-fill',
    'accountbook-fill', 'carryout-fill', 'calendar-fill', 'calculator-fill', 'interaction-fill', 'project-fill', 'detail-fill', 'save-fill', 'wallet-fill', 'control-fill',
    'layout-fill', 'appstore-fill', 'mobile-fill', 'tablet-fill', 'book-fill', 'redenvelope-fill', 'safety-certificate-fill', 'property-safety-fill', 'insurance-fill', 'security-scan-fill',
    'file-exclamation-fill', 'file-add-fill', 'file-fill', 'file-excel-fill', 'file-markdown-fill', 'file-text-fill', 'file-ppt-fill', 'file-unknown-fill', 'file-word-fill', 'file-zip-fill',
    'file-pdf-fill', 'file-image-fill', 'diff-fill', 'file-copy-fill', 'snippets-fill', 'batch-folding-fill', 'reconciliation-fill', 'folder-add-fill', 'folder-fill', 'folder-open-fill',
    'database-fill', 'container-fill', 'server-fill', 'calendar-check-fill', 'image-fill', 'idcard-fill', 'creditcard-fill', 'fund-fill', 'read-fill', 'contacts-fill',
    'delete-fill', 'notification-fill', 'flag-fill', 'money-collect-fill', 'medicine-box-fill', 'rest-fill', 'shopping-fill', 'skin-fill', 'video-fill', 'sound-fill',
    'bulb-fill', 'bell-fill', 'filter-fill', 'fire-fill', 'funnel-plot-fill', 'gift-fill', 'hour-glass-fill', 'home-fill', 'trophy-fill', 'location-fill',
    'cloud-fill', 'customer-service-fill', 'experiment-fill', 'eye-fill', 'like-fill', 'lock-fill', 'unlike-fill', 'star-fill', 'unlock-fill', 'alert-fill',
    'api-fill', 'highlight-fill', 'phone-fill', 'edit-fill', 'push-pin-fill', 'rocket-fill', 'thunderbolt-fill', 'tag-fill', 'wrench-fill', 'tags-fill',
    'bank-fill', 'camera-fill', 'error-fill', 'crown-fill', 'mail-fill', 'car-fill', 'printer-fill', 'shop-fill', 'setting-fill', 'usb-fill',
    'golden-fill', 'build-fill', 'box-plot-fill', 'silders-fill', 'html', 'apple', 'android', 'windows', 'android-fill', 'apple-fill',
    'html-fill', 'windows-fill', 'zoomout', 'apartment', 'audio', 'audio-fill', 'robot', 'zoomin', 'robot-fill', 'bug-fill', 
    'bug', 'audio-static', 'comment', 'signal-fill', 'verified', 'shortcut-fill', 'video-camera-add', 'switch-user', 'caret-down', 'backward', 
    'caret-up', 'caret-right', 'caret-left', 'fast-backward', 'forward', 'fast-forward', 'search', 'retweet', 'login', 'step-backward',
    'step-forward', 'swap-right', 'swap-left', 'woman', 'plus', 'eye-close-fill', 'eye-close', 'clear', 'collapse', 'expand', 
    'delete-column', 'merge-cells', 'subnode', 'rotate-left', 'rotate-right', 'insert-row-below', 'insert-row-above', 'table1', 'solit-cells', 'format-painter', 
    'insert-row-right', 'format-painter-fill', 'insert-row-left', 'translate', 'delete-row', 'sisternode', 'type-number', 'type-string', 'type-function', 'type-time', 
    'gif', 'partition', 'index', 'stored-procedure', 'type-binary', 'sql', 'test', 'aim', 'compress', 'expand', 
    'folder-view', 'file-gif', 'group', 'send', 'report', 'view', 'shortcut', 'ungroup'];

interface IconProps extends React.HTMLAttributes<HTMLSpanElement> {
    type: string;
};

export const Icon = (props: IconProps) => {
    const {type, className, ...nativeProps} = props;
    const idx = IconFonts.indexOf(type);
    if (idx < 0) return <span/>;
    return <span {...makeClass('icon', className)} {...nativeProps} dangerouslySetInnerHTML={{__html: `&#xe${(1917+idx).toString(16)};`}}/>;
};
