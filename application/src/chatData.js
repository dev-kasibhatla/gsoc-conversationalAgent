const {URLProvider} = require("./comm");
const {sendPostRequest} = require("./comm");
const {logv} = require("./common");

const CHAT_BOX_ID = "chat-box";

class ChatData {
    static waitingForResponse = false;
    static chatBegun = false;

    static writeChatMessageToWindow(message, they) {
        //todo: highly redundant. Remove this function if it doesn't server any other
        //purpose in the future
        document.getElementById(CHAT_BOX_ID).appendChild(this.getMessageNode(message,they));
    }

    static getMessageNode (message,they) {
        let node = document.createElement("div");
        if(they) {
            node.innerHTML = chatMessageThey.replace("%text%",message);
        }else{
            node.innerHTML = chatMessageUser.replace("%text%",message);
        }
        return node;
    }

    static clearChat() {
        document.getElementById(CHAT_BOX_ID).innerHTML = "";
    }

    static async startChat() {
        logv('start chat called');
        this.clearChat();
        let body = Message.createNewMessage("start");
        let response = await sendPostRequest(URLProvider.messageUrl,);
        if(response.isError){
            logv('starting a chat with conversational agent failed.');
            alert('starting a chat with conversational agent failed.');
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
        this.timestamp = timestamp;

        this.timestamp = Date.now();

        // messageType = (content.sender == "Person")?SENDER_PERSON:SENDER_BOT;

        //todo: should we extract senderLabel from content?
        if(messageType === SENDER_BOT){
            this.senderLabel = "Robot";
        }else if(messageType === SENDER_BOT){
            this.senderLabel = "Person";
        }

        logv('decoding content');
        this.message = content.message;
    }
}

module.exports = {
    ChatData,
}