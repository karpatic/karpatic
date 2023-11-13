import 'dotenv/config'; 

import fs from "fs";
import path from 'path';
import OpenAI from "openai";

async function createSpeech(input, voice='echo', speed=1.0, model='tts-1') { 
    const openai = new OpenAI(process.env.OPENAI_API_KEY); 
    // Speed [ `0.25` - `4.0`]. default = `1.0`. 
    // The maximum length is 4096 characters.
    const mp3Response = await openai.audio.speech.create({
        input, voice, model, speed, response_format: 'mp3'
    }); 

    // Convert the response to an ArrayBuffer and then to a Buffer.
    const buffer = Buffer.from(await mp3Response.arrayBuffer());
    return buffer
} 

async function saveSpeech(mp3SaveFilePath,buffer) { 
    
    // Write the Buffer to a file.
    await fs.promises.writeFile(mp3SaveFilePath, buffer);

    // Log the location of the saved mp3 file.
    // console.log(`Audio saved to ${mp3SaveFilePath}`);
}
// pass json to chatGPT and ask it to extract the text for speech using gpt4.
async function getTextFromJson(json){
    const openai = new OpenAI(process.env.OPENAI_API_KEY); 
    let text = !json.title ? '' : `Title:   ${json.title} \n `
    text += !json.summary  ? '' : `Summary: ${json.summary} \n `
    text += `Content: ${JSON.stringify(json.content)}`
    const response = await openai.chat.completions.create({
        model: "gpt-4-1106-preview", 
        messages: [
            {"role": "system", "content": `
You are an assistant to a webpage to audio service. 
You will be given a webpage you must convert it to a form of text ready for reading aloud.
Start every conversion with a with a statement "You are listening to the audio version of this webpage" followed by the title and summary.
Under no circumstances should code be read and should be paraphrased or skipped. 
`},
            {"role": "user", "content": `${text}`}
        ]
    }); 
    let data = response.choices[0].message.content
    // console.log('GET TEXT FROM JSON ', response, data)
    return data
}
async function speechFromDir(fromFolder, toFolder){
    // get all files in SAVETO.
  const files = fs.readdirSync(fromFolder);
  for (let i = 0; i < files.length; i++) {
      const filename = path.join(fromFolder, files[i]);
      const stat = fs.lstatSync(filename);
      if (stat.isDirectory()) {
        speechFromDir(filename, toFolder); //recurse
      } else if (filename.indexOf('.json') >= 0) {
        let file = fs.readFileSync(filename, 'utf8');
        let json = JSON.parse(file);  
        if(json?.meta?.audio){
            let text = await getTextFromJson(json); 
            let buffer = await createSpeech(text);
            let file = files[i].substring(0, files[i].length -5)
            // console.log('file', file)
            let savePath = path.join(toFolder, file)+'.mp3'
            // console.log('savePath', savePath)
            saveSpeech(savePath, buffer) 
        }
      }
  }
} 

// export
export { createSpeech, saveSpeech, getTextFromJson, speechFromDir }


// console.log(OpenAI.Audio.Speech);  // Audio Speech // Assistant // Completions + Functions

// thread Id = thread_YkCHeyvt4cpTx3dsRCAXamji
// run Id = run_dXteBI7ldfWlJ27tlaQXygVQ

/*
const thread = await openai.beta.threads.create();
console.log('thread', thread.id);

// Add a Comment to a Thread
const message = await openai.beta.threads.messages.create( thread.id, { role: "user", content: "I need to solve the equation `3x + 11 = 14`. Can you help me?" } );

// Add Chatbot with Thread
const run = await openai.beta.threads.runs.create( thread.id, { assistant_id: "asst_md7rq9HME4C3uUnmrMwRqiDi", instructions: "Please address the user as Jane Doe. The user has a premium account." } );
console.log('run', run.id);
*/
/*
const run = await openai.beta.threads.runs.retrieve(
    "thread_YkCHeyvt4cpTx3dsRCAXamji",
    "run_dXteBI7ldfWlJ27tlaQXygVQ"
);
const messages = await openai.beta.threads.messages.list( "thread_YkCHeyvt4cpTx3dsRCAXamji" );
console.log(messages);
*/