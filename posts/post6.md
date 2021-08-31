# Text to speech



## Finding an engine

Integrating a TTS engine came with some constraints.

- Free
- Open source (preferred)
- Runs offline
- Fast



After exploring several tools, I came across [Mycroft AI](https://mycroft.ai/)'s [mimic](https://mycroft-ai.gitbook.io/docs/mycroft-technologies/mimic-overview).

#### Mimic

Mimic is a fast, light-weight Text to Speech (TTS) engine based on Carnegie Mellon University's FLITE software. Mimic uses text as an input, and outputs speech using the chosen voice.

I installed mimic for a test run. The installation is a little heavy, but straightforward and I encountered no issues. 

Mimic has some cool features we want. For one, it is completely open source. (I tried reading its license but it is more complicated than normal licenses, with different parts of its code being licensed differently).

After installing its dependencies and building its [development branch](https://github.com/MycroftAI/mimic1), I could run it from my bash shell.

**It runs well offline. It is fairly fast and responsive.** 

Synthesizing about 10 words to speech takes around half a second on my machine.

I experimented with different words, statements and punctuations and it handles them well. 

The synthesis is slightly robotic, and they claim to have solved this in mimic 2. Unfortunately mimic 2 is very heavy, and hence only runs on the cloud.



**Mimic supports arguments for changing speech rate, voice, and pitch.**

I experimented with different settings and the results were good, and up to expectations. 

Since we're using electron to build this app, I will be required to write an interface that would run this TTS service as a child process and listen to its events. I eventually wrote a TTS wrapper that coordinates the conversational agent with mimic.



**Mimic comes with a standard issue of 6 voices.**

And they worked well. The documentation states that all one needs to do to add a voice, is pass a voice file as an argument.

They have several voice files available that can use different speech modelling techniques (diphone, clustergen, hts). 

So adding desired voices in the application will be a breeze.

**Note**: They have also mentioned that we can create our own voice files. And if required, voice files can be loaded on the fly using URLs.



A little bit about types of voices from their documentation:



*Diphone voices* are less computationally expensive and quite intelligible but they lack naturalness (sound more robotic). 

*clustergen voices* can sound more natural and intelligible at the expense of size and computational requirements.

*hts voices* usually may sound a bit more synthetic than clustergen voices, but have much smaller size.



In the app, we can give at least 2 options of each kind so that the user can make a decision based on their hardware and quality expectation.

For translations, they recommended using eSpeak. This has not been implemented in the conversational agent.



## Speech settings

From mimic's documentation, I learned that we can easily customize the following:

- Voice
- Speed
- Pitch
- Language



#### Getting speech output



In a bash shell, to simply speak a string of text with default settings, we type:

```bash
mimic "Hello"
```

where "Hello" is the text to be spoken aloud.



To list available voices:

```bash
mimic -lv
```



To use a particular voice:

```bash
mimic -t "Hello" -voice srt
```

where "srt" is the voice we wish to use.



To change the speed:

```bash
mimic -t "Hello" --setf duration_stretch=2
```

using `duration_stretch=2` runs the TTS at 0.5x speed. It can be though of as time dilation.



To change the pitch:

```bash
mimic -t "Hello" --setf int_f0_target_mean=150
```

using `int_f0_target_mean=150` runs the TTS at a 50% higher pitch. Default pitch is 100.



As discussed above, language settings using eSpeak have not been integrated in the conversational agent. Still, I have provisioned a language change in the TTS settings for future use.

## Mimic in the conversational agent

For everyone to be able to install mimic, I created a bash script that can be triggered from within the app.

`../install-mimic.sh`:

```bash
#script created from https://mycroft-ai.gitbook.io/docs/mycroft-technologies/mimic-overview
echo "Install script can be found at https://mycroft-ai.gitbook.io/docs/mycroft-technologies/mimic-overview"
echo "Installing dependencies"
sudo apt install -y gcc make pkg-config automake libtool libicu-dev libpcre2-dev libasound2-dev
echo "Cloning mimic"
cd $HOME
git clone https://github.com/MycroftAI/mimic.git
cd $HOME/mimic
echo "Generating build script"
./autogen.sh
echo "Configure build script"
./configure --prefix="/usr/local"
echo "Build"
make
echo "Validating build"
make check
echo "Installing mimic"
sudo make install
echo "Installation complete"
```



When a user clicks on install mimic button in the settings:

In `src/settings.js`:

```javascript
function installMimic() {
    if(Speaker.mimicIsInstalled){
       alert('mimic is already installed');
       return;
    }
    execute('gnome-terminal -e "sh ../install-mimic.sh"',function(output){
    });
}
```



#### Customizing the settings

To expose TTS related methods, I created the `Speaker`class.

Speaker class allows the user to change voice, speed and pitch settings.



In `src/chatData.js`:

```javascript
class Speaker {
    static SETTINGS = {
      SPEED: 1,
      PITCH: 100,
      VOICE: 0,
      LANGUAGE: 0
    };

    static DEFAULT_SPEAKER_SETTINGS = {
        SPEED: 1,
        PITCH: 100,
        VOICE: 0,
        LANGUAGE: 0
    };

    static mimicVoices = [];

    static mimicIsInstalled;
}
```



Settings are stored in a file located at `settings/speech`

The file simply stores a json stringified version of the settings object:

```json
{"SPEED":0.6666666666666666,"PITCH":"100","VOICE":1,"LANGUAGE":0}
```



`Speaker` class provides methods to store and retrieve these settings from the file.

In `src/chatData.js` (class `Speaker`):

```javascript
    static savePreferencesToFile() {
        try{
            fs.writeFileSync(SPEAKER_SETTINGS_FILE,JSON.stringify(Speaker.SETTINGS));
        }catch(e){
            alert('Could not write speech settings to '+SPEAKER_SETTINGS_FILE);
        }
    }

    static readPreferencesFromFile() {
        try{
            const data = fs.readFileSync(SPEAKER_SETTINGS_FILE);
            if(data.length < 5){
                Speaker.SETTINGS = this.DEFAULT_SPEAKER_SETTINGS;
                Speaker.savePreferencesToFile();
            }else{
                Speaker.SETTINGS = JSON.parse(data.toString());
                logv(Speaker.SETTINGS);
            }
        }catch(e){
            Speaker.SETTINGS = this.DEFAULT_SPEAKER_SETTINGS;
            Speaker.savePreferencesToFile();
        }
    }
```



One other setting that the app needs to store is whether TTS needs to run i.e if the user has enabled TTS.

For that, we maintain a static boolean. But this setting needs to span across screens, even when this file is re-instantiated. 

For that, this value is published to the AppState class maintained by the electron app.



In `src/chatData.js` (class `Speaker`):

```javascript
static SPEAKER_ACTIVE = false;

    static appState;

    static saveSettings() {
        // logv(getAppState());
        Speaker.appState = getAppState();
        AppState.getChatState();
        logv('fetched app state:');
        logv(Speaker.appState);
        logv(typeof this.appState);
        Speaker.appState.Speaker = Speaker.SPEAKER_ACTIVE;
        setAppState(Speaker.appState);
        //saving preferences
        Speaker.savePreferencesToFile();
        logv('saved speaker settings to global state')
    }

    static loadSettings() {
        Speaker.appState = getAppState();
        AppState.getChatState();
        logv('fetched app state:');
        logv(Speaker.appState);
        logv(typeof this.appState);
        Speaker.SPEAKER_ACTIVE = Speaker.appState.Speaker;
        if(Speaker.SPEAKER_ACTIVE === undefined){
            Speaker.SPEAKER_ACTIVE = false;
        }
        //get settings from file
        Speaker.readPreferencesFromFile();
    };

```



Settings also lets user set a different voice. The settings file only stores the index of voice being used. It sets the actual voice by looking up in the voices array.

**Warning**: This means that upon changing the voice files of mimic, voice settings might change. Setting them once more should solve it.

Upon instantiation of chat window, voices are first populated.



In `src/chatData.js` (class `Speaker`):

```js
static populateVoices() {
        execute('mimic -lv',function(raw){
            let vArray = raw.split('available: ')[1].trim().split(' ');
            Speaker.mimicVoices = vArray;
        });
}
```





#### Implementing speech

Speech is generated by running a mimic command with the right settings. The command constructor simply reads settings and builds a bash string.



In `src/chatData.js` (class `Speaker`):

```js
static speak(text) {
        //don't speak if speaker disabled
        if(!Speaker.SPEAKER_ACTIVE) return;
        logv(`speaking ${text}`);
        if(Speaker.mimicIsInstalled){
            //generate command
            let command = `mimic -t "${text}" -voice ${Speaker.mimicVoices[Speaker.SETTINGS.VOICE]} --setf duration_stretch=${Speaker.SETTINGS.SPEED} --setf int_f0_target_mean=${Speaker.SETTINGS.PITCH}`;
            logv(command);
            execute(command,function(raw){
            });
        }else{
            logv('mimic is not installed, turning off tts');
        }
    }
```



Finally, we trigger speech from chat when:

- A new message is received
- `SPEAKER_ACTIVE` is set to `true`



In `src/chatData.js` (class `ChatData`):

```js
static async sendChatMessage(text) {
        //add self message first
        let body = Message.createNewMessage(text);
        this.addNewMessage(new Message(SENDER_PERSON,body));
        let response = await sendPostRequest(URLProvider.messageUrl,body);
        if(response.isError){
            alert('Sending message failed');
        }else{
            let messageCount = response.body.length;
            if(messageCount>0){
                for (let mess of response.body){
                    let message = new Message(SENDER_BOT,mess);
                    //SPEAK!
                    Speaker.speak(message.message);
                    this.addNewMessage(message);
                }
            }else{
                //construct a message
                let message = new Message(SENDER_UNKNOWN,"No response received");
                this.addNewMessage(message);
            }
        }
    }
```

