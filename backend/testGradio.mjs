import { Client, handle_file } from "@gradio/client";
import fs from "fs";

async function test() {
  try {
    const client = await Client.connect("yisol/IDM-VTON");
    console.log("Connected to yisol/IDM-VTON");
    
    // valid images
    const personUrl = "C:/Users/Lenovo/.gemini/antigravity/brain/0dc98a61-d1a2-464e-ab3b-e0ba042df263/.user_uploaded/media_1788954603393.png"; 
    const garmUrl = "https://res.cloudinary.com/demo/image/upload/sample.jpg";

    const result = await client.predict("/tryon", [
        {
          background: handle_file(personUrl),
          layers: [],
          composite: null
        },
        handle_file(garmUrl),
        "A cool shirt",
        true,
        false,
        30,
        42
    ]);

    console.log(result.data);
  } catch (err) {
    console.error("Error connecting:", err);
  }
}

test();
