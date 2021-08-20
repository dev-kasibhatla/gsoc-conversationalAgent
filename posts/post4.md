# Building the MVP



The most important modules of the project can be broken down as:

- Building the app and navigation.
- Passing data and persisting it across screens.
- Communicating with the linux shell and managing child processes.
- Sending messages to and receiving messages from RASA server.



## The initial app



#### Navigation

The app opens up in a 600x800 window but is completely responsive. A single file controls all the navigation:

`src/nav.js`

I have declared some constants that all pages use to identify the sections:

`const NAV_CHAT = 0, NAV_SETTINGS=1, NAV_DIAGNOSTICS=2, NAV_HELP=3, NAV_RASA=4;`

Whenever any icon on the navigaion menu is clicked, the function `navigateTo` is called with the appropriate navigation constant. The function replaces the current page with the target page. 

In `src/nav.js`:

```javascript
function navigatoTo(navIndex) {
    closeNav(navIndex);
    switch (navIndex) {
        case NAV_CHAT:
            location.replace("index.html");
            break; 
        case NAV_SETTINGS:
            location.replace("settings.html");
            break;
        case NAV_DIAGNOSTICS:
            location.replace("diagnostics.html");
            break;
        case NAV_RASA:
            location.replace("rasainteractive.html");
            break;
    }
}
```



The `nav.js` file does one more thing. Whenever it initialised, it sets the navigation labels to transparent, since the labels were visible even after the menu closed.

The app employs a single CSS file: `main.css`.

It defines how labels and buttons in the navigation menu look and behave. Since all navigation menu items on all pages use the same JS and CSS, changing navigation style everywhere is extremely easy. 

Adding and removing navigation options is also breeze.



#### Communication between screens

One mistake I probably made early on might be to choose a design that replaces the entire screen. This means that every screen opens like a web page would open from scratch. Although it may appear that the navigation menu opens new screens on the right, this is only partially true. Navigation menu replaces the entire screen including itself. The new screen screen re-instantiates the navigation menu.

While this didn't seem like much of a problem first few weeks into the project, I eventually realised there is a lot of data the app needs to persist. Every screen cannot start from scratch. One easy way would have been writing to a file. But persisting every small change in state to a file definitely sounds like a waste. So much of I/O is simply inefficient. So I started looking for how I could use some of the RAM node uses i.e use variables that could persist for the app's lifetime.

That's when I came across global variables. Using global variables comes with a lot of do's and don't's. The *don't* that seemed fairly significant was *don't use global variables!*

But global variables were my best bet. So I read through, and started implementing them in the app.

I tested the `getGlobal` method first. I could read variables but couldn't set variables using `getglobal`. Everyone on the internet suggested the `IPC` method to the people using `getGlobal`. 

The IPC method worked just fine.

In the root level `main.js`file:

```javascript
const { ipcMain } = require('electron')

ipcMain.on( "AppState", ( event, globalVarValue ) => {
  global.AppState = globalVarValue;
} );
```

In above snippet, AppState is the class I created to store all my global variables.

AppState class during initialisation looks like this:

In  `src/main.js`

```javascript
const { ipcRenderer, remote } = require( "electron" );

class AppState {
    appInitialised = false;
    chatHistory = [];
    servers = {
        rasa: false,
        action: false
    }
    static chatState = false;
    constructor(appInitialised, chatHistory, servers) {
        this.appInitialised = appInitialised;
        this.chatHistory = chatHistory;
        this.servers = servers;
        AppState.getChatState();
    }
}
```

I also made 2 methods that get and set the AppState. AppState is always written though these 2 functions.

In  `src/main.js`

```javascript
function getAppState() {
    let gv = remote.getGlobal( "AppState" );
    logv(`App state: ${gv}`);
    if(gv === undefined){
        logv('app state was never set. setting it now');
        setAppState(new AppState(
            false,
            [],
            {
                rasa: false,
                action: false
            },
            ));
        //todo: super dangerous
        gv = getAppState();
    }
    return gv;
}

function setAppState(state) {
    // remote.getGlobal('AppState').appInitialised= state
    logv("setting app state to");
    logv(state);
    ipcRenderer.send( "AppState", state);
}
```



Next, we have a function that sets the app state for the first time. Even with this happening, I check for `undefined` variables whenever I query those.

In `src/main.js`:

```javascript
function initialiseApp() {
    if(getAppState().appInitialised === false) {
        initBasics();
        setAppState(new AppState(true));
    }
}
```



Finally, we export the required modules for all other files to use:

In `src/main.js` :

```javascript
module.exports = {
    initialiseApp,
    AppState,
    setAppState,
    getAppState
}
```



All other screens user `setAppState()`, `getAppState()`, `AppState` to communicate between screens.



#### Communicating with the linux shell

Most of the programs I need to interact with are written in python. It was critical to write a node wrapper for these programs so that they can be triggered and interacted with, from within the app.

I created a file that will handle all communications: `src/comm.js`.

I started by using the node `child_process`module.

In `src/comm.js`:

```javascript
const {exec, execFile, spawn} = require('child_process');
```



Next, I created a function that would execute shell commands, and take a function as callback, that would receive stdout output. 

In `src/comm.js`:

```javascript
function execute(command, callback) {
    let proc = exec(command, );
    proc.stdout.on('data', (data) => {
        callback(data);
    });
    proc.stderr.on('data',function(data){
        logv(`${command} error:`);
        logv(data.toString());
    });
    proc.on('exit',function(code){
        logv(`${command} exited with ${code}`);
    });
}
```

This was enough for running most shell commands, but this wasn't interactive. I also created interactive processes for some specific modules later in the development of the application.



#### Network communication

RASA server runs locally, and communication is done sending requests to the server when running.

And that is never a problem when you're dealing with JS!

In `src/comm.js`:

```javascript
async function sendPostRequest(urlPack,body) {
    //expecting a URLProvider object for url
    let completeUrl = `${urlPack.url}`;
    let options = {
        method: 'post',
        url: completeUrl,
        headers: {
            'Content-Type': 'application/json'
        },
        data : JSON.stringify(body)
    };

    try {
        let response = await axios(options);
        return new Response(response,false);
    }catch(e) {
        logv('post request failed');
        logv(e);
        return new Response(e,true);
    }
}
```



I created a standard response format specific to this application's needs.

In `src/comm.js`:

```javascript
class Response {
    body="";
    statusCode=0;
    isError;
    error;
    response;
    constructor(response, error) {
        this.statusCode = response.status;
        if(error === false) {
            if(response.status !== 200){
                logv('response is an error, couldnt find data');
                error=true;
            }else {
                this.response = response;
                this.body = response.data;
                this.isError = false;
            }
        }
        if(error === true){
            this.error = response;
            this.isError=true;
        }
    }
}
```

The error handling is tested and useful for when RASA server is not running and we try to communicate with it.



Next, I also created some classes to house and control URLs from a single location.

In `src/comm.js`:

```javascript
class URLPack {
    static baseUrl = 'http://localhost:5002/webhooks/rest/webhook/';
    //specificworker.py line 150
    static rasaBase = "http://localhost:5002/";
    static actionsBase = "http://localhost:5055/";
    port = '0';
    url = "";

    constructor(url, port) {
        this.port = port;
        this.url = url;
    }
}

class URLProvider {
    static messageUrl = new URLPack(URLPack.baseUrl,'5002',);
    static rasaUrl = new URLPack(URLPack.rasaBase,'5002',);
    static actionUrl = new URLPack(URLPack.actionsBase,'5055',);
}
```



All functions use `URLProvider` class to specify URLs for sending requests.

Finally, we export all the required modules in `src/comm.js`:

```java
module.exports = {
    execute,
    initBasics,
    sendPostRequest,
    URLProvider,
    URLPack,
    Response
}
```

