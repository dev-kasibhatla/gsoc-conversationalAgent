const {Speaker} = require("./chatData");
const {execute} = require("./comm");

function setNewVoice(voiceIndex){
    logv('setting voice index to '+voiceIndex.toString());
    Speaker.SETTINGS.VOICE = voiceIndex;
    Speaker.saveSettings();
    setUI();
}
const pitchLabelId = "pitchLabel";
const pitchSliderID = "settingsPitchRange";
function setPitch(pitch) {
    logv('pitch is');
    logv(pitch.value);
    Speaker.SETTINGS.PITCH = pitch.value;
    Speaker.saveSettings();
    setUI();
}

const voiceDropDownId = "currentVoiceDisplay";
const voiceOptionId = "voiceOptionDiv";
const speedLabelId = "speedLabel";
const speedSliderId = "settingsSpeedRange";
function setSpeakerSpeed(speed) {
    logv('speed is');
    logv(speed.value);
    //range is from 0.25 to 2.5
    //at 1 -> speed is normal
    Speaker.SETTINGS.SPEED = 1/speed.value;
    Speaker.saveSettings();
    setUI();
}

function resetSpeaker() {
    logv('resetting speaker settings to default');
    Speaker.SETTINGS = Speaker.DEFAULT_SPEAKER_SETTINGS;
    Speaker.saveSettings();
    setUI();
}

function initUI(){
   setUI();
}

const voiceDropDownOption = '<div class="dropdown-item" onclick="setNewVoice(vid)">' +
    '                    %option' +
    '                  </div>';

const installMimicSectionId = "installMimicSection";

function setUI() {
    let dropDownButton = document.getElementById(voiceDropDownId);
    dropDownButton.innerText = Speaker.mimicVoices[Speaker.SETTINGS.VOICE];
    //generate options
    let options = Speaker.mimicVoices;
    if(options.length===0){
        logv('no options found');
    }else{
        let optionBody = document.getElementById(voiceOptionId);
        logv('setting options');
        optionBody.innerHTML="";
        for (let option in options) {
            optionBody.innerHTML += voiceDropDownOption.replace('%option',Speaker.mimicVoices[option]).replace('vid',option);
        }
        logv('options were set');
    }
    let pitchLabel = document.getElementById(pitchLabelId);
    pitchLabel.innerText = Speaker.SETTINGS.PITCH/100 + 'x';
    let pitchSlider = document.getElementById(pitchSliderID);
    pitchSlider.value = Speaker.SETTINGS.PITCH;

    let speedLabel = document.getElementById(speedLabelId);
    speedLabel.innerText = (1/Speaker.SETTINGS.SPEED) + 'x';
    let speedSlider = document.getElementById(speedSliderId);
    speedSlider.value = 1/(Speaker.SETTINGS.SPEED);

    if(Speaker.mimicIsInstalled) {
        let installMimicSection = document.getElementById(installMimicSectionId);
        installMimicSection.remove();
    }

}

function installMimic() {
    logv('installing mimic');
    if(Speaker.mimicIsInstalled){
       alert('mimic is already installed');
       return;
    }
    execute('gnome-terminal -e "sh ../install-mimic.sh"',function(output){
        logv(output);
    });
}

function playAudioSample() {
    if(Speaker.SPEAKER_ACTIVE) {
        Speaker.speak("Hello robocomp! I am mimic.");
    }else{
        Speaker.SPEAKER_ACTIVE = true;
        Speaker.speak("Hello robocomp! I am mimic.");
        Speaker.SPEAKER_ACTIVE = false;
    }
}

Speaker.initFromSettings();
setTimeout(function(){initUI(); }, 1000);