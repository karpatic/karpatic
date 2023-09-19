async function textToSpeech(text, filename){
    const endpointUrl = 'https://api.elevenlabs.io/v1/text-to-speech/VOICE_ID';
    const requestOptions = {
        method: 'POST',
        body: JSON.stringify({ 
            text,
            voice_settings: {
                stability: 0.5,
                similiarity_boost: 0.9
            }
        }),
        headers: {
            'Content-Type': 'application/json',
            'xi-api-key': process.env.ELEVEN_API_KEY,
        }
    }
}