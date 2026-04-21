const https = require('https');
const fs = require('fs');
const path = require('path');

const API_KEY = 'sk_23887c4d20229777b351f8c9a97bfc8f1748c2f9ccea00ad';
const VOICE_RACHEL = 'ZT9u07TYPVl83ejeLakq'; // Rachel — captions & finale
const VOICE_ALAN   = 'SYnlsZzyWoEWknEaaYIx'; // Alan — failure/negative clips
const MODEL = 'eleven_turbo_v2_5';
const SCRIPTS_DIR = path.join(__dirname, 'vo-scripts');
const OUTPUT_DIR = path.join(__dirname, 'public', 'audio', 'vo');

const CLIPS = [
  { name: 'step-1-caption',  voice: VOICE_RACHEL },
  { name: 'step-2-caption',  voice: VOICE_RACHEL },
  { name: 'step-2-failure',  voice: VOICE_ALAN },
  { name: 'step-3-caption',  voice: VOICE_RACHEL },
  { name: 'step-3-failure',  voice: VOICE_ALAN },
  { name: 'step-4-caption',  voice: VOICE_RACHEL },
  { name: 'step-4-failure',  voice: VOICE_ALAN },
  { name: 'step-5-caption',  voice: VOICE_RACHEL },
  { name: 'step-5-failure',  voice: VOICE_ALAN },
  { name: 'step-6-caption',  voice: VOICE_RACHEL },
  { name: 'step-6-failure',  voice: VOICE_ALAN },
  { name: 'step-7-caption',  voice: VOICE_RACHEL },
  { name: 'step-7-failure',  voice: VOICE_ALAN },
  { name: 'finale',          voice: VOICE_RACHEL },
];

function readScript(name) {
  const raw = fs.readFileSync(path.join(SCRIPTS_DIR, name + '.md'), 'utf-8');
  return raw
    .split('\n')
    .filter(line => !line.startsWith('#'))
    .join('\n')
    .trim();
}

function generateClip({ name, voice }) {
  return new Promise((resolve, reject) => {
    const text = readScript(name);
    const voiceLabel = voice === VOICE_RACHEL ? 'Rachel' : 'Alan';
    console.log(`  "${name}" [${voiceLabel}] (${text.length} chars)`);

    const postData = JSON.stringify({
      text,
      model_id: MODEL,
      voice_settings: { stability: 0.55, similarity_boost: 0.75, style: 0.25 },
    });

    const opts = {
      hostname: 'api.elevenlabs.io',
      path: `/v1/text-to-speech/${voice}`,
      method: 'POST',
      headers: {
        'xi-api-key': API_KEY,
        'Content-Type': 'application/json',
        'Accept': 'audio/mpeg',
      },
    };

    const req = https.request(opts, res => {
      if (res.statusCode === 200) {
        const chunks = [];
        res.on('data', c => chunks.push(c));
        res.on('end', () => {
          const buf = Buffer.concat(chunks);
          const outPath = path.join(OUTPUT_DIR, name + '.mp3');
          fs.writeFileSync(outPath, buf);
          console.log(`  ✓ ${name}.mp3 (${(buf.length / 1024).toFixed(0)} KB)`);
          resolve();
        });
      } else {
        let body = '';
        res.on('data', c => body += c);
        res.on('end', () => reject(new Error(`${name}: ${res.statusCode} ${body}`)));
      }
    });

    req.on('error', reject);
    req.write(postData);
    req.end();
  });
}

async function main() {
  console.log('Clearing old VO files...');
  for (const f of fs.readdirSync(OUTPUT_DIR)) {
    if (f.endsWith('.mp3')) {
      fs.unlinkSync(path.join(OUTPUT_DIR, f));
      console.log(`  removed ${f}`);
    }
  }

  console.log(`\nGenerating ${CLIPS.length} clips (Rachel=captions, Alan=failures)\n`);

  for (const clip of CLIPS) {
    await generateClip(clip);
    await new Promise(r => setTimeout(r, 500));
  }

  console.log('\nDone! All clips generated.');
}

main().catch(err => { console.error(err); process.exit(1); });
