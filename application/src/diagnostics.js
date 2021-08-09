const {RasaHandler} = require("./rasaHandler");

RasaHandler.init();

function refreshStatus() {
    RasaHandler.init();
}

function rasaClick() {
    logv("rasa node clicked");
    RasaHandler.rasaNodeClicked();
}

function actionClick() {
    logv("action node clicked");
    RasaHandler.actionNodeClicked();
}

function rasaTrain() {
    RasaHandler.rasaTrainButton();
}

function rasaInteractive() {
    RasaHandler.rasaInteractiveButton();
}

function rasaShell() {
    RasaHandler.rasaShellButton();
}

function rasaVisualise(){
    RasaHandler.rasaVisualiseButton();
}