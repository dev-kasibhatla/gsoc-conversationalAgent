const {URLProvider, execute} = require("./comm");
const {sendPostRequest} = require("./comm");
const {logv} = require("./common");
const {getAppState, setAppState, AppState} = require("./main");
const fs = require('fs')


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
                    Speaker.speak(message);
                }
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
                    Speaker.speak(message);
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

module.exports = {
    ChatData,
    Message,
    SENDER_UNKNOWN,
    Speaker
}