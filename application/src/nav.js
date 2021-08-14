const {logv} = require("./common");
console.log('nav js called');

makeNamesTransparent(true);
function openNav(navIndex) {
    makeNamesTransparent(false);
    logv('nav opened with index '+navIndex);
    document.getElementById("sidenav").style.zIndex = 15;
    document.getElementById("sidenav").style.width = "300px";
}

function closeNav(navIndex) {
    makeNamesTransparent(true);
    logv('nav closed with index '+navIndex);
    document.getElementById("sidenav").style.zIndex = -15;
    document.getElementById("sidenav").style.width = "0px";
    document.getElementById("sidenav").style.color = "transparent";
}

function makeNamesTransparent(should) {
    if(should) {
        document.getElementsByName("nav-text").forEach(function(text){
            text.style.color = "transparent";
        });
    }else{
        document.getElementsByName("nav-text").forEach(function(text){
            text.style.color = "var(--light-text-color)";
        });
    }
}

const NAV_CHAT = 0, NAV_SETTINGS=1, NAV_DIAGNOSTICS=2, NAV_HELP=3, NAV_RASA=4;

function navigatoTo(navIndex) {
    closeNav(navIndex);
    switch (navIndex) {
        case NAV_CHAT:
            logv('navigating to chat page');
            location.replace("index.html");
            break; 
        case NAV_SETTINGS:
            logv('navigating to settings page');
            location.replace("settings.html");
            break;
        case NAV_DIAGNOSTICS:
            logv('navigating to diagnostics page');
            location.replace("diagnostics.html");
            break;
        case NAV_RASA:
            logv('navigating to rasa page');
            location.replace("rasainteractive.html");
            break;
        default:
            logv('unknown navigation index '+navIndex);
            break;
    }
}