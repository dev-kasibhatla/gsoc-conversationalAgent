# Asynchronous Speech Recognition

In my proposal I had suggested using [Mozilla Deepspeech](https://github.com/mozilla/DeepSpeech) as the voice recognition module.

But implementing an ASR system took several unexpected turns.

#### Deepspeech

DeepSpeech is an open source embedded (offline, on-device) speech-to-text engine which can run in real time on devices ranging from a Raspberry Pi 4 to high power GPU servers.It uses a model trained by machine learning techniques, based on Baidu's Deep Speech research paper. Project DeepSpeech uses Google's TensorFlow project to make the implementation easier.Once installed, deepspeech binary can do speech-to-text on short, approximately 5 second, audio files (currently only WAVE files with 16-bit, 16 kHz, mono are supported in the Python client)Alternatively, quicker inference can be performed using Nvidia GPUs.

Deepspeech also has several pre-trained models available, and could run inference with and without a GPU, so it seemed ideal.

Mozilla deepspeech provides pre-trained models in the following packages:

- The Python package
- The command-line client
- The Node.JS package

Any of these could be used in electron app. 



#### Problems with deepspeech

The first mistake I made was not reading the documentation thoroughly, with all the warnings and hints.

As soon as I was knee deep in deepspeech installation, I ran into several dependency conflicts, due to the version specific installation requirements of other components required for running the project. Their documentation clearly states one must use a virtual environment to avoid such conflicts. 

But even after I installed deepspeech properly in a virtual environment, running inference was still troublesome. It would always crash, and I tried several solutions but looking up in their forums, but it wouldn't work.

Deepspeech also required me to record a `.wav` file separately and then run inference on it. So live transcription would have been a giant challenge.

So I started looking for alternatives. And that's when I stumbled across



#### voice2json

`voice2json` is a collection of [command-line tools](http://voice2json.org/commands.html) for **offline speech/intent recognition** on Linux. It is free, open source ([MIT](https://opensource.org/licenses/MIT)), and [supports 18 human languages](http://voice2json.org/#supported-languages).

Now what I loved about voice2json is that they let you choose your voice model, and inference engine. voice2json is simply a wrapper. They maintain an extensive repository of voice files that is up to date.

Their documentation also states:

> `voice2json` is **optimized for**:
>
> - Sets of voice commands that are described well [by a grammar](http://voice2json.org/sentences.html)
> - Commands with [uncommon words or pronunciations](http://voice2json.org/commands.html#pronounce-word)
> - Commands or intents that [can vary at runtime](http://voice2json.org/#unique-features)
>
> It can be used to:
>
> - Add voice commands to [existing applications or Unix-style workflows](http://voice2json.org/recipes.html#create-an-mqtt-transcription-service)
>
> - Provide basic [voice assistant functionality](http://voice2json.org/recipes.html#set-and-run-timers) completely offline on modest hardware
>
> - Bootstrap more [sophisticated speech/intent recognition systems](http://voice2json.org/recipes.html#train-a-rasa-nlu-bot)
>
>   
>
> Supported speech to text systems include:
>
> - CMU’s [pocketsphinx](https://github.com/cmusphinx/pocketsphinx)
> - Dan Povey’s [Kaldi](https://kaldi-asr.org/)
> - Mozilla’s [DeepSpeech](https://github.com/mozilla/DeepSpeech) 0.9
> - Kyoto University’s [Julius](https://github.com/julius-speech/julius)



I don't think I understood some parts completely until much later. I installed  `voice2json`. But downloading a voice profile was a huge problem. And the steps in their documentation wouldn't work. I had to browse their repository at an older time, where I could download an older version of `voice2json`, its profiles and offline documentation.

Once I installed it correctly, next step was to fetch a model and train it correctly. Each of their models had 3 versions: low, medium and high. Models with a low configuration were smaller ( ~ 90 MB), and ran live inference well. 

So first, I installed Mozilla deepspeech model with low configuration. But it wouldn't train! Threw similar errors like the ones I got when I was trying deepspeech for the first time. I tried downloading the model with medium configuration, and tried fixing dependency issues, but nothing worked.

Next, I tried CMU's pocketsphinx and Dan Povey's Kaldi.

Both of them trained well, and worked fine. Well kind of fine. When I started testing inference I realised what they meant by

>  Sets of voice commands that are described well [by a grammar](http://voice2json.org/sentences.html)

The models came with a dictionary. And it would only identify words defined in that dictionary. The grammar they're talking about defines sounds that describe each word in the dictionary. And defining every new word was incredibly hard. This is not what this project needed, it needed a speech recognition software with a rich vocabulary.

This wasn't very obvious to me in the beginning when I was excited by `voice2json`, since all the 4 libraries it uses implement fully featured rich offline voice to text inference.

It was time to move on. During my adventures reading about speech recognition libraries, I read a lot of praises about `Kaldi`.

It was time to try `Kaldi`.



#### Kaldi

[Kaldi](https://github.com/kaldi-asr/kaldi) is a well maintained and heavily contributed-to open source project. Their documentation is a detailed website. Their [website](https://kaldi-asr.org/) is a little 20th century. But very well done, and very elaborate.

Needless to say the installation wasn't straightforward, and after installation, kaldi presented the same problem Mozilla Deepspeech did. There was no inbuilt method for live transcription. So I had to record a separate wav file, and run inference on it. This does botch down the experience a little bit, but it was worth a try.

So I wrote a simple function in the conversational agent that records speech using `arecord` for 10 seconds, and then runs inference on that file using kaldi. Once it gets a result, it deletes the file. *Long live bash scripting.*

This was working, but I wasn't satisfied. I finally stumbled upon `vosk-api`, a library I had read about several times before, but never really gave it a closer look.



#### vosk-api

[Vosk](https://github.com/alphacep/vosk-api) is an offline open source speech recognition toolkit. It enables speech recognition models for 18 languages and dialects.

Vosk models are small (50 Mb) but provide continuous large vocabulary transcription, zero-latency response with streaming API, reconfigurable vocabulary and speaker identification.

Speech recognition bindings implemented for various programming languages like Python, Java, Node.JS, C#, C++ and others.

This was perfect! It has everything this project requires. I immediately followed the [instructions](https://alphacephei.com/vosk/install) and installed vosk from pip. Next, I cloned their repository to get access to all the examples. I chose the smallest US English model ( ~80 MB ) as it would provide the best experience for fast live transcription. I also tried the medium sized model ( ~500 MB ), but it took way too long to load, and the transcription though way more accurate, was extremely slow.

I Finally settled on vosk-api which uses kaldi. It works really well, it is extremely extensible, trained voice models with different languages, sizes and accuracies are already available online.

All available models can be found [here](https://alphacephei.com/vosk/models).

Example for installing a model:

```bash
git clone https://github.com/alphacep/vosk-api
cd vosk-api/python/example
wget https://alphacephei.com/kaldi/models/vosk-model-small-en-us-0.15.zip
unzip vosk-model-small-en-us-0.15.zip
mv vosk-model-small-en-us-0.15 model
python3 ./test_simple.py test.wav
```



There are some changes I had to make to vosk-api for it to work with our app, so just installing vosk won't do the trick. 

To make vosk-api work with the conversational agent:

In `~/.bashrc`:

Set the variable $VOSK.

For example:



From this project's repository folder:

Copy `files/test_mic2.py` 

To  `$VOSK/python/example/test_mic2.py`:



## Integrating ASR

Like in the case of Text-to-speech, ASR gets its own class.

It primarily does the following:

- Published ASR state to Appstate
- Checks if vosk-api is correctly installed
- When enabled, starts live inference using a connected microphone. System decides the microphone precedence.
- When disabled, kills the ASR process.



For publishing ASR state.

In  `src/chatData.js (class ASR):`

```js
static saveSettings() {
        ASR.appState = getAppState();
        AppState.getChatState();
        ASR.appState.ASR = ASR.ASR_ACTIVE;
        setAppState(ASR.appState);
        //saving preferences
    }

    static loadSettings() {
        ASR.appState = getAppState();
        AppState.getChatState();
        ASR.ASR_ACTIVE = ASR.appState.ASR;
        if(ASR.ASR_ACTIVE === undefined){
            ASR.ASR_ACTIVE = false;
        }
        //get settings from file
        ASR.updateUI();
    };
```



To check if vosk is installed

In  `src/chatData.js (class ASR):`

```js
 static voskInstalled1 = false;
    static voskInstalled2 = false;
    static isVoskInstalled() {
        execute(bashCheckVoskModule,function(output){
           logv(output);
           if(output == 1){
               ASR.voskInstalled1 = true;
           }else{
               ASR.voskInstalled1 = false;
           }
        });

        execute(bashCheckVoskPath,function(output){
            if(output.length>5){
                ASR.voskInstalled2 = true;
            }else{
                ASR.voskInstalled2 = false;
            }
        });
    }

```



Toggling ASR state

In  `src/chatData.js (class ASR):`

```javascript
static toggleASRState() {
  ASR.ASR_ACTIVE = !ASR.ASR_ACTIVE;
  ASR.updateUI();
  ASR.saveSettings();
  ASR.startASR();
}
```



Live speech inference

In  `src/chatData.js (class ASR):`

```js
static ASRProcess;
    static ASRProcessActive=false;
    static ASRProcessInitialised = false;
    static inputStream;
    //manage our own ASR process
    static startASR() {
        if(!ASR.ASR_ACTIVE){
            try{
                logv('trying to kill asr process');
                logv(ASR.ASRProcess.pid);
                ASR.inputStream.push('SIGINT');
                ASR.inputStream.push(null);
                ASR.inputStream.pipe(ASR.ASRProcess.stdin);
                ASR.ASRProcess.kill("SIGTERM");
                ASR.ASRProcess.kill();
                execute('echo 1 > $VOSK/python/example/shouldExit',function(){});
            }catch(e){
                logv('failed killing ASR process');
                logv(e);
            }
            return;
        }
        console.log( process.env.PATH );
        execute('echo 0 > $VOSK/python/example/shouldExit',function(){});
        ASR.ASRProcess = spawn('bash', ['bash/asr/startasr.bash'], {detached:false, shell:true});        
        ASR.ASRProcessInitialised = false;
        ASR.ASRProcessActive = true;
        ASR.ASRProcess.stdout.setEncoding('utf8');
        logv(stream);
        ASR.inputStream = new stream.Readable();
        ASR.ASRProcess.stdout.on('data', (data) => {
            if(data.includes('partial') || data.includes('text')) {
                ASR.ASRProcessInitialised=true;
                //count occurences
                data = data.toString();
                data.replaceAll('\n',',\n');
                let js = JSON.parse(data);
                if(js.partial !== undefined){
                    if(js.partial.length>0){
                        if(js.partial.length>ASR.currentString)
                            ASR.currentString = js.partial;
                        else
                            ASR.currentString += js.partial;
                    }
                }
                if(js.text !== undefined){
                    if(js.text.length>0){
                        ASR.currentString = js.text;
                    }
                }
                logv(ASR.currentString);
                // ASR.ASRProcess.stdout.flush();
                ASR.updateUI();
            }else{
                logv('ASR spawn response:');
                logv(data.toString());
            }
        });
        ASR.ASRProcess.stderr.on('data',function(data){
            logv(data.toString());
        });
        ASR.ASRProcess.on('exit',function(code){
            logv('asr was killed');
            ASR.ASRProcessInitialised = false;
            ASR.ASRProcessActive = false;
            ASR.ASR_ACTIVE = false;
            ASR.saveSettings();
            ASR.updateUI();
        });

        ASR.ASRProcess.on('close', (code) => {
            console.log(`ASR process exited with code ${code}`);
        });

        ASR.ASRProcess.on('SIGINT', () =>
        {
            logv('ASR process received SIGINT');
        })
    }
```



To read inference output, I had to read `STDOUT` pipe of the initialised process. This worked very well in the terminal console, but not so well inside the app. I would get a response once every 10 seconds, and I would get huge chunks of output at once, not one line at a time like the python script was sending. Upon some research, I found out that the python script needs to *flush output*.

So I had to make a small change to the script.

In `$VOSK/python/example/test_mic2.py`:



As indicated in the second post, communication with a process proved to be a little tricky. Using streams worked. I created a new stream and assigned it to `STDIN`. Writing to this stream and then pushing successfully writes to the process. This works well when the process is listening to `STDIN` input. But no amount of flushing `SIGTERM` and `SIGINT` actually killed the process for me.

So again, I had to cheat a little. To kill the process I would write `0` to `$VOSK/python/example/shouldExit` file. Then a small change in `$VOSK/python/example/test_mic2.py`:



This worked just fine, and the ASR would properly exit.



