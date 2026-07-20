//src\services\supportchat.js

import api from "./api";

export const getSupportChatList = async () => {
  const res = await api.get(
    "/api/v1/common/merchant/support-chat-list/"
  );

  return res.data;
};

export const sendSupportMessage = async (
  payload
) => {
  const res = await api.post(
    "/api/v1/common/merchant/send-message/",
    payload
  );

  return res.data;
};