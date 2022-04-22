//用于标记修改状态，提交时批量处理
class AttachmentState {
    static toadd = 'to-be-added';
    static adding = 'adding';
    static added = undefined;

    static changed = 'changed';

    static todel = 'to-be-deleted'
    static deleting = 'deleting';
    static deleted = 'deleted';
}

export default AttachmentState;
