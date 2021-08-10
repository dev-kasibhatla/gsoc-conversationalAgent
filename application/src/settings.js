const {Speaker} = require("./chatData");

function setNewVoice(voiceIndex){
}

function setPitch(pitch) {

}
const voiceDropDownId = "currentVoiceDisplay";
function setSpeakerSpeed() {

}

function initUI(){
    let dropDownButton = document.getElementById(voiceDropDownId);
    dropDownButton.innerText = Speaker.mimicVoices[Speaker.SETTINGS.VOICE];
    //generate options

}

function playAudioSample() {

}

Speaker.init()
initUI();