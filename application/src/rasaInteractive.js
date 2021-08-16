const {TNAV_INTERACT, TNAV_SHELL, TNAV_OPTIONS, RasaInteractiveHandler} = require("./interactiveHandler");


currentIndex = TNAV_INTERACT;

RasaInteractiveHandler.init();

function topNavTo(navIndex) {
    switch (navIndex) {
        case TNAV_INTERACT:
            logv('navigating to interact section');
            RasaInteractiveHandler.CURRENT_TAB = navIndex;
            break;
        case TNAV_SHELL:
            logv('navigating to shell section');
            RasaInteractiveHandler.CURRENT_TAB = navIndex;
            break;
        case TNAV_OPTIONS:
            logv('navigating to options section');
            RasaInteractiveHandler.CURRENT_TAB = navIndex;
            break;
        default:
            logv('unknown top navigation index '+navIndex);
            RasaInteractiveHandler.CURRENT_TAB = TNAV_INTERACT;
            break;
    }
    RasaInteractiveHandler.updateUI();
}
function startInteraction() {
    RasaInteractiveHandler.startInteraction();
}

function stopInteraction() {
    RasaInteractiveHandler.stopProcess();
}