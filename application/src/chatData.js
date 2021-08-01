const {URLProvider} = require("./comm");
const {sendPostRequest} = require("./comm");
const {logv} = require("./common");
const {getAppState, setAppState} = require("./main");

const CHAT_BOX_ID = "chat-box", START_BUTTON_SPACE = "start-chat-space";

class ChatData {
    static waitingForResponse = false;
    static chatBegun = false;
    static appState;
    //type: Message
    static chatMessages = [];

    static init() {
        this.loadAllChatMessages();
        this.insertStartChatButton();
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
        setAppState(this.appState);
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
            this.chatBegun = false;
        }else{
            logv(`${this.chatMessages.length} messages found`);
            for (let message of this.chatMessages) {
                logv(message);
                this.writeChatMessageToWindow(message);
            }
        }
    }
//line 510 - stop chat
    //
    static async startChat() {
        logv('start chat called');
        this.clearChat();
        let response = await sendPostRequest(URLProvider.messageUrl,Message.createNewMessage("start"));
        if(response.isError){
            logv('starting a chat with conversational agent failed.');
            alert('starting a chat with conversational agent failed.');
            this.chatBegun = false;
        }else{
            this.chatBegun = true;
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

module.exports = {
    ChatData,
    Message,
    SENDER_UNKNOWN
}