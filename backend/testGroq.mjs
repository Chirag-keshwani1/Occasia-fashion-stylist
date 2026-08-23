import { Groq } from "groq-sdk";
import dotenv from "dotenv";
dotenv.config();

async function testGroq() {
  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    const chatCompletion = await groq.chat.completions.create({
      messages: [{ role: 'user', content: 'hello' }],
      model: process.env.GROQ_MODEL,
    });
    console.log("Success:", chatCompletion.choices[0]?.message?.content);
  } catch (error) {
    console.error("Groq Error:", error.message);
  }
}

testGroq();
