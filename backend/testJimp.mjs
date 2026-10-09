import { Jimp } from 'jimp';

async function testJimp() {
  const personUrl = "https://raw.githubusercontent.com/gradio-app/gradio/main/test/test_files/bus.png";
  const garmUrl = "https://raw.githubusercontent.com/yisol/IDM-VTON/main/example/garment/00044_00.jpg";

  console.log("Loading images...");
  const [person, garment] = await Promise.all([
    Jimp.read(personUrl),
    Jimp.read(garmUrl)
  ]);

  console.log("Compositing...");
  const scale = 0.6; // 60% of person width
  const targetWidth = person.bitmap.width * scale;
  garment.resize(targetWidth, Jimp.AUTO);

  // Position at center horizontal, bottom half
  const x = (person.bitmap.width - garment.bitmap.width) / 2;
  const y = person.bitmap.height - garment.bitmap.height - 50;

  person.composite(garment, x, y, {
    mode: Jimp.BLEND_SOURCE_OVER,
    opacitySource: 0.9,
    opacityDest: 1
  });

  const buffer = await person.getBufferAsync(Jimp.MIME_JPEG);
  console.log("Done! Buffer length:", buffer.length);
}

testJimp().catch(console.error);
