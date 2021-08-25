const {URLProvider, execute} = require("./comm");
const {sendPostRequest} = require("./comm");
const {logv} = require("./common");
const {getAppState, setAppState, AppState} = require("./main");
const fs = require('fs')
const {exec,spawn, spawnSync} = require('child_process');
const stream = require('stream');

const CHAT_BOX_ID = "chat-box", START_BUTTON_SPACE = "start-chat-space";

class ChatData {
    static waitingForResponse = false;
    static chatBegun = false;
    static appState;
    //type: Message
    static chatMessages = [];

    static init() {
        this.clearChat();
        this.loadAllChatMessages();
        this.insertStartChatButton();
        if(ChatData.chatBegun === undefined){
            ChatData.chatBegun = false;
        }
        this.initChatSync();
        //todo: set chatBegun correctly
    }

    static writeChatMessageToWindow(message) {
        //todo: highly redundant. Remove this function if it doesn't server any other
        //purpose in the future
        document.getElementById(CHAT_BOX_ID).appendChild(this.getMessageNode(message));
    }

    static getMessageNode (message) {
        let node = document.createElement("div");
        if(message.messageType === SENDER_BOT) {
            node.innerHTML = chatMessageThey.replace("%text%",message.message);
        }else if(message.messageType === SENDER_PERSON){
            node.innerHTML = chatMessageUser.replace("%text%",message.message);
        }else{
            logv('encountered a label message');
            node.innerHTML = chatMessageLabel.replace("%text%",message.content);
        }
        return node;
    }

    static clearChat() {
        document.getElementById(CHAT_BOX_ID).innerHTML = "";
    }

    static insertStartChatButton() {
        return;
        logv(`chat begun: ${this.chatBegun}`);
        document.getElementById(START_BUTTON_SPACE).innerHTML="";
        if(this.chatBegun) {
            return;
        }
        let node = document.createElement("div");
        node.innerHTML = startChatButton;
        document.getElementById(START_BUTTON_SPACE).appendChild(node);
    }

    static getChatMessageHistory() {
        // logv(getAppState());
        this.appState = getAppState();
        AppState.getChatState();
        logv('fetched app state:');
        logv(this.appState);
        logv(typeof this.appState);
        this.chatMessages = this.appState.chatHistory;
    }

    static saveChatMessageHistory() {
        //get any other changes that happened first
        this.appState = getAppState();
        //set the changes this class makes
        this.appState.chatHistory = this.chatMessages;
        logv('app state after chat module changed it:');
        logv(this.appState);
        setAppState(this.appState);
    }

    static async syncChatState() {
        await AppState.getChatState();
        // logv(`current appstate chatstate is:${AppState.chatState}, and chatBegun is ${ChatData.chatBegun}`);
        if(AppState.chatState === ChatData.chatBegun){
            // logv('Chat states are in sync');
        }else{
            logv('Chat states are not in sync');
            if(AppState.chatState){
                logv('starting chat');
                await ChatData.startChat();
            }else{
                logv('stopping chat');
                ChatData.chatBegun = false;
            }
        }
    }

    static initChatSync() {
        let syncTimer = setInterval(this.syncChatState, 5000);
    }

    /**
     * Used when user switches to a different page and comes back
     */
    static loadAllChatMessages() {
        ChatData.clearChat();
        this.getChatMessageHistory();
        logv('chat message history fetched');
        if(this.chatMessages === undefined) {
            this.chatMessages = [];
            this.addNewMessage(new Message(SENDER_UNKNOWN,"The chat hasn't begun"));
            ChatData.chatBegun = false;
        }else{
            logv(`${this.chatMessages.length} messages found`);
            for (let message of this.chatMessages) {
                logv(message);
                this.writeChatMessageToWindow(message);
            }
        }
    }
    //line 510 - stop chat
    static async startChat() {
        logv('start chat called');
        // this.clearChat();
        let response = await sendPostRequest(URLProvider.messageUrl,Message.createNewMessage("start"));
        if(response.isError){
            logv('starting a chat with conversational agent failed.');
            alert('starting a chat with conversational agent failed.');
            ChatData.chatBegun = false;
        }else{
            ChatData.chatBegun = true;
            logv('received a valid response. Counting messages');
            let messageCount = response.body.length;
            logv(messageCount);
            if(messageCount>0){
                for (let mess of response.body){
                    let message = new Message(SENDER_BOT,mess);
                    this.addNewMessage(message);
                    Speaker.speak(message.message);
                }f
            }else{
                //construct a message
                let message = new Message(SENDER_UNKNOWN,"No response received");
                this.addNewMessage(message);
            }
            logv('chat has begun');
        }
        this.insertStartChatButton();
    }

    static addNewMessage(message) {
        logv('adding new message');
        logv(message);
        this.chatMessages.push(message);
        this.writeChatMessageToWindow(message);
        this.saveChatMessageHistory();
    }

    static async sendChatMessage(text) {
        //add self message first
        let body = Message.createNewMessage(text);
        this.addNewMessage(new Message(SENDER_PERSON,body));
        let response = await sendPostRequest(URLProvider.messageUrl,body);
        logv(response);

        if(response.isError){
            logv('Sending message failed');
            alert('Sending message failed');
        }else{
            logv('received a valid response. Counting messages');
            let messageCount = response.body.length;
            logv(messageCount);
            if(messageCount>0){
                for (let mess of response.body){
                    let message = new Message(SENDER_BOT,mess);
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

    static stopChat() {
        logv('stop chat called');
    }
}

const chatMessageThey = '<div class="chat-bubble-parent-they">' +
    '          <div class="chat-bubble-they chat-bubble-shape">' +
    '            %text%' +
    '          </div>' +
    '        </div>';

const chatMessageUser = '<div class="chat-bubble-parent-self">' +
    '          <div class="chat-bubble-self chat-bubble-shape">' +
    '            %text%' +
    '          </div>' +
    '        </div>';

const chatMessageLabel = '<div class="chat-label">' +
    '           %text%' +
    '        </div>';

const startChatButton = '      <div class="start-chat-btn" id="start-chat-btn" onclick="startChatButton()">' +
    '        START CHAT' +
    '      </div>';

//To start a chat session send a post request to 'http://localhost:5002/webhooks/rest/webhook

const SENDER_BOT=0, SENDER_PERSON=1, SENDER_UNKNOWN=-1;
class Message {
    messageType = SENDER_UNKNOWN;
    content = "";
    timestamp = "";
    senderLabel = "";
    message = "";
    static createNewMessage(message) {
        return {
            "sender":"Person",
            "message":message
        }
    }

    constructor(messageType, content) {
        this.messageType = messageType;
        this.content = content;

        this.timestamp = Date.now();

        // messageType = (content.sender == "Person")?SENDER_PERSON:SENDER_BOT;

        //todo: should we extract senderLabel from content?
        if(messageType === SENDER_BOT){
            logv('sender is the bot');
            this.senderLabel = "Robot";
            this.message = this.content.text;
            logv(this.message);
        }else if(messageType === SENDER_PERSON){
            logv('sender is the person');
            this.senderLabel = "Person";
            this.message = content.message;
        }else{
            this.message = content;
            logv('label message created');
        }
        logv('decoding content');
    }
}


const SPEAKER_SETTINGS_FILE = "settings/speech";
class Speaker {
    //settings
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

    static init() {
        Speaker.updateUI();
        Speaker.isMimicInstalled();
        Speaker.loadSettings();
        // Speaker.updateUI();
    }

    static initFromSettings() {
        Speaker.isMimicInstalled();
        Speaker.loadSettings();
    }

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

    static savePreferencesToFile() {
        try{
            fs.writeFileSync(SPEAKER_SETTINGS_FILE,JSON.stringify(Speaker.SETTINGS));
            logv('wrote speech preferences successfully');
        }catch(e){
            logv('failed writing speech settings to file'+SPEAKER_SETTINGS_FILE);
            alert('Could not write speech settings to '+SPEAKER_SETTINGS_FILE);
        }
    }

    static readPreferencesFromFile() {
        try{
            const data = fs.readFileSync(SPEAKER_SETTINGS_FILE);
            logv("Read speech settings file:");
            logv(data);
            if(data.length < 5){
                logv('data seems too small, overwriting with default settings');
                Speaker.SETTINGS = this.DEFAULT_SPEAKER_SETTINGS;
                Speaker.savePreferencesToFile();
            }else{
                logv('loading speaker data to memory');
                Speaker.SETTINGS = JSON.parse(data.toString());
                logv(Speaker.SETTINGS);
            }
        }catch(e){
            logv('failed reading file from memory');
            logv(e);
            Speaker.SETTINGS = this.DEFAULT_SPEAKER_SETTINGS;
            Speaker.savePreferencesToFile();
        }
    }

    static toggleSpeakerState() {
        Speaker.SPEAKER_ACTIVE = !Speaker.SPEAKER_ACTIVE;
        Speaker.updateUI();
        Speaker.saveSettings();

        //todo: remove
        Speaker.speak('Hello');
    }

    static updateUI() {
        //read speaker state
        let element = document.getElementById('tts-label');
        let elementIcon = document.getElementById('tts-icon');
        if(Speaker.SPEAKER_ACTIVE){
            if(!Speaker.mimicIsInstalled) {
                logv('mimic is not installed, so not turning on tts.');
                alert('Mimic is not installed. You can install it by going to settings');
                Speaker.SPEAKER_ACTIVE = false;
                //dangerous, but straight forward
                Speaker.updateUI();
                return;
            }
            //change class
            //speaker label
            element.classList.remove("info-label-disabled");
            element.classList.add("info-label-enabled");
            //speaker icon
            elementIcon.classList.add('chat-btn-selected');
            //replace text
            element.innerText = element.innerText.replace("disabled","enabled");
        }else{
            //change class
            //speaker label
            element.classList.remove("info-label-enabled");
            element.classList.add("info-label-disabled");
            //speaker icon
            elementIcon.classList.remove('chat-btn-selected');
            //replace text
            element.innerText = element.innerText.replace("enabled","disabled");
        }
    }

    static isMimicInstalled() {
        execute("which mimic",function(output){
            logv(output);
            logv(typeof output);
            if(output.includes('mimic')){
                logv('found mimic');
                Speaker.mimicIsInstalled = true;
                Speaker.populateVoices();
            }else{
                Speaker.mimicIsInstalled = false;
            }
        });
    }

    static populateVoices() {
        execute('mimic -lv',function(raw){
            let vArray = raw.split('available: ')[1].trim().split(' ');
            logv(vArray);
            Speaker.mimicVoices = vArray;
        });
    }

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
}

class ASR {
    static ASR_ACTIVE = false;

    static appState;
    static voskInstalled=false;

    static init() {
        ASR.isVoskInstalled();
        setTimeout(function(){
            ASR.voskInstalled = ASR.voskInstalled1 && ASR.voskInstalled2;
            ASR.loadSettings();
            ASR.startASR();
        }, 1000);
    }

    static saveSettings() {
        // logv(getAppState());
        ASR.appState = getAppState();
        AppState.getChatState();
        logv('fetched app state:');
        logv(ASR.appState);
        logv(typeof this.appState);
        ASR.appState.ASR = ASR.ASR_ACTIVE;
        setAppState(ASR.appState);
        //saving preferences
        logv('saved ASR settings to global state')
    }

    static loadSettings() {
        ASR.appState = getAppState();
        AppState.getChatState();
        logv('fetched app state:');
        logv(ASR.appState);
        logv(typeof this.appState);
        ASR.ASR_ACTIVE = ASR.appState.ASR;
        if(ASR.ASR_ACTIVE === undefined){
            ASR.ASR_ACTIVE = false;
        }
        //get settings from file
        ASR.updateUI();
    };

    static voskInstalled1 = false;
    static voskInstalled2 = false;
    static isVoskInstalled() {
        execute(bashCheckVoskModule,function(output){
           logv('checked vosk:');
           logv(output);
           if(output == 1){
               ASR.voskInstalled1 = true;
           }else{
               logv('vosk module check failed');
               ASR.voskInstalled1 = false;
           }
        });

        execute(bashCheckVoskPath,function(output){
            logv('checked vosk path:');
            logv(output);
            if(output.length>5){
                ASR.voskInstalled2 = true;
            }else{
                logv('vosk patch check failed');
                ASR.voskInstalled2 = false;
            }
        });
    }

    static updateUI() {
        //read ASR state
        let element = document.getElementById('asr-label');
        let elementIcon = document.getElementById('asr-icon');
        if(ASR.ASR_ACTIVE){
            if(!ASR.voskInstalled) {
                logv('vosk is not installed, so not turning on asr.');
                alert('Vosk is not installed. You can find installation instructions by going to the settings');
                ASR.ASR_ACTIVE = false;
                //dangerous, but straight forward
                ASR.updateUI();
                return;
            }
            //change class
            //asr label
            element.classList.remove("info-label-disabled");
            element.classList.add("info-label-enabled");
            //asr icon
            elementIcon.classList.add('chat-btn-selected');
            //replace text
            element.innerText = element.innerText.replace("disabled","enabled");

            //put asr txt in box
            let textBox = document.getElementById("chatInputBox");
            textBox.value = ASR.currentString;
        }else{
            //change class
            //asr label
            element.classList.remove("info-label-enabled");
            element.classList.add("info-label-disabled");
            //asr icon
            elementIcon.classList.remove('chat-btn-selected');
            //replace text
            element.innerText = element.innerText.replace("enabled","disabled");
        }
    }


    static toggleASRState() {
        ASR.ASR_ACTIVE = !ASR.ASR_ACTIVE;
        ASR.updateUI();
        ASR.saveSettings();
        ASR.startASR();
    }

    static currentString = "";

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
                // ASR.ASRProcess.stdin.write('');
                ASR.inputStream.push('SIGINT');
                ASR.inputStream.push(null);
                // ASR.inputStream.flush();
                ASR.inputStream.pipe(ASR.ASRProcess.stdin);
                /*ASR.ASRProcess.stdin.setEncoding('utf8');
                ASR.ASRProcess.stdin.write('SIGINT');
                ASR.ASRProcess.stdin.write('\n');
                ASR.ASRProcess.stdin.end();
                ASR.ASRProcess.kill("SIGINT");
                ASR.ASRProcess.kill("SIGTERM");
                process.kill(ASR.ASRProcess.pid, 'SIGINT');*/
                ASR.ASRProcess.kill("SIGTERM");
                ASR.ASRProcess.kill("SIGINT");
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
        //listen
        // ASR.ASRProcess = exec('cd $VOSK/python/example && python3 $VOSK/python/example/test_microphone.py');
        // ASR.ASRProcess = exec('. bash/asr/startasr.bash');
        ASR.ASRProcess = spawn('bash', ['bash/asr/startasr.bash'], {detached:false, shell:true});
        // ASR.ASRProcess = spawn('python3', ['bash/asr/pytestcom.py'], {detached:false, shell:true});
        // ASR.ASRProcess = spawn('which',['bash']);
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

    static stopASR() {

    }


}
const bashCheckVoskModule = "python3 bash/checkvosk.py";
const bashCheckVoskPath = "echo $VOSK";

module.exports = {
    ChatData,
    Message,
    ASR,
    SENDER_UNKNOWN,
    Speaker
}