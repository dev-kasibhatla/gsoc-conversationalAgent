module.exports = {
    logv,
    openNav
};

let printLogs = true;
function logv(message) {
    if(printLogs) {
        console.log(message);
    }
}