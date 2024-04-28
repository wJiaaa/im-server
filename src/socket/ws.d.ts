/*
 * @Description: Description
 * @Author: wJiaaa
 * @LastEditors: wJiaaa
 */
type MessageType = "receiveTopMessage" | "receiveDeleteMessage"
    | "receiveRevokeMessage" | "updateGroupAnnouncement"
    | "addFriend" | "addFriendResult" | "addGroup"
    | "receiveMessage";
// 定义一个映射接口，将每种消息类型映射到相应的数据类型
interface MessageDataMap {
    receiveTopMessage: TopMessageData;
    receiveDeleteMessage: DeleteMessageData;
    receiveRevokeMessage: RevokeMessageData;
    updateGroupAnnouncement: GroupAnnouncementData;
    addFriend: AddFriendData;
    addFriendResult: AddFriendResultData;
    addGroup: AddGroupData;
    receiveMessage: ReceiveMessageData;
}
// 定义每种消息类型对应的数据类型
interface TopMessageData {
    topMsgId: string;
    sessionId: number;
    topMsgUserId: string
}

interface DeleteMessageData {
    msgId: string;
    sessionId: number;
    previousMsgId: string
}

interface RevokeMessageData {
    /* 数据类型定义 */
    msgId: string;
    sessionId: number;
}

interface GroupAnnouncementData {
    groupId: string;
}

interface AddFriendData {
    /** id标识 */
    id: number;
    /** 当前好友添加状态 */
    status: number;
    /** 备注 */
    remark: string | null;
    /** 申请人id */
    applicantId: string;
    /** 申请人名称 */
    applicantUsername: string;
    /** 申请人头像 */
    applicantAvatar: string;
    /** 被申请人id */
    friendId: string;
    /** 被申请人名称 */
    friendUsername: string;
    /** 被申请人头像 */
    friendAvatar: string;
}

interface AddFriendResultData {
    /** id标识 */
    id: number;
    /** 当前好友添加状态 */
    status: number;
}

interface AddGroupData {
    createdAt: Date;
    deletedAt: Date | null;
    groupId: string;
    groupName: string;
    sessionId: number;
    sessionType: number;
    userId: string;
    avatar: string;
}
interface ReceiveMessageData {
    msgId: string;
}
