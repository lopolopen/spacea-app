import { HubConnectionBuilder } from "@aspnet/signalr";

const API_BASE_URL = window._env_.REACT_APP_API_BASE_URL || process.env.REACT_APP_API_BASE_URL;

const webhookHub = new HubConnectionBuilder()
  .withUrl(`${API_BASE_URL}webhookhub`)
  // .withAutomaticReconnect(2000)
  .build();

(async function () {
  try {
    await webhookHub.start()
  } catch (err) {
    console.log(err);
  }
})();

export { webhookHub };
