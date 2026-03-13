//src\services\settingsApi.js

import api from "./api";

export const fetchNotificationSettingsApi = async () => {
  const res = await api.get(
    "/api/v1/common/orders/get-notification-settings/"
  );
  return res.data;
};

export const changeNotificationSettingsApi = async (payload) => {
  const res = await api.post(
    "/api/v1/common/orders/change-notification-settings/",
    payload
  );
  return res.data;
};

export const reportBugApi = async (payload) => {
  const res = await api.post(
    "/api/v1/common/orders/report-bug/",
    payload
  );
  return res.data;
};

export const deleteAccountApi = async (payload) => {
  const res = await api.post(
    "/api/v1/common/orders/delete-account/",
    // payload
  );
  return res.data;
};
