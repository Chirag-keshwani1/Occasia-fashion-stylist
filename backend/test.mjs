import { Client } from "@gradio/client";

async function inspect() {
  try {
    const app = await Client.connect("Nymbo/Virtual-Try-On");
    const endpoints = app.view_api();
    console.log(JSON.stringify(endpoints, null, 2));
  } catch (err) {
    console.error("Inspect failed:", err.message);
  }
}
inspect();
