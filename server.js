require('dotenv').config();
const express = require('express');
const path = require('path');

const app = express();
const port = process.env.PORT || 8080;

app.use(express.json());

// Serve static files from the current directory
app.use(express.static(__dirname));

// Configuration from environment variables or defaults
const DEFAULT_PROMPT = process.env.TTS_PROMPT || "Read aloud in a warm, welcoming tone. 텍스트에 포함된 대괄호 표기(예: [sighs], [laughs])는 소리 내어 읽지 말고, 해당 효과(한숨, 웃음 등)를 목소리에 반영하여 자연스럽게 표현해 주세요";
const DEFAULT_MODEL = process.env.TTS_MODEL || "gemini-3.1-flash-tts-preview";
const DEFAULT_VOICE = process.env.TTS_VOICE || "Achernar";
const DEFAULT_LANG = process.env.TTS_LANG || "ko-kr";

async function getAccessToken() {
    try {
        const response = await fetch('http://metadata.google.internal/computeMetadata/v1/instance/service-accounts/default/token', {
            headers: { 'Metadata-Flavor': 'Google' }
        });
        const data = await response.json();
        return data.access_token;
    } catch (error) {
        console.error('Failed to get access token from metadata server:', error);
        // Fallback or error handling for local development if needed
        return null;
    }
}

app.post('/api/generateAudio', async (req, res) => {
    const { text, languageCode, modelName, name, speakingRate } = req.body;
    
    if (!text) {
        return res.status(400).json({ error: 'Text is required' });
    }
    
    const token = await getAccessToken();
    if (!token) {
        return res.status(500).json({ error: 'Failed to authenticate with Google Cloud' });
    }
    
    const url = 'https://texttospeech.googleapis.com/v1beta1/text:synthesize';
    
    const payload = {
        audioConfig: {
            audioEncoding: "LINEAR16",
            pitch: 0,
            speakingRate: speakingRate || 1
        },
        input: {
            prompt: DEFAULT_PROMPT,
            text: text
        },
        voice: {
            languageCode: languageCode ? languageCode.toLowerCase() : DEFAULT_LANG,
            modelName: modelName || DEFAULT_MODEL,
            name: name || DEFAULT_VOICE
        }
    };
    
    try {
        const apiResponse = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`,
                'X-Goog-User-Project': 'tts-testing-493601'
            },
            body: JSON.stringify(payload)
        });
        
        const data = await apiResponse.json();
        console.log('API Response:', JSON.stringify(data));
        res.json(data);
    } catch (error) {
        console.error('Failed to call Vertex AI API:', error);
        res.status(500).json({ error: 'Failed to generate audio' });
    }
});

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
