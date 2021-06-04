const { app, BrowserWindow, globalShortcut, Menu, Tray, Notification, ipcMain } = require('electron');
const { join } = require('path');
const StormDB = require("stormdb");

// Use JSON file for storage
const file = join(app.getAppPath('appData'), '/Deventify/db.json');
const engine = new StormDB.localFileEngine(file);
const db = new StormDB(engine);

db.default({ events: [] });

//Hack for development
app.setAppUserModelId(process.execPath);

let mainWindow = null;
let eventWindow = null;
let channelWindow = null;
let tray = null;

const channels = [
    'feature',
    'task',
    'meeting',
    'finished'
];
let subscribed = channels;

function createTray() {
    let appIcon = new Tray(join(__dirname, "img/icon.ico"));
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Show', click: function () {
                mainWindow.show();
            }
        },
        {
            label: 'Exit', click: function () {
                app.isQuiting = true;
                app.quit();
            }
        }
    ]);

    appIcon.on('double-click', function (event) {
        mainWindow.show();
    });
    appIcon.setToolTip('Dev Events');
    appIcon.setContextMenu(contextMenu);
    return appIcon;
}

function createMainWindow() {
    mainWindow = new BrowserWindow({
        width: 800,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    mainWindow.loadFile('index.html');

    mainWindow.on('minimize', (event) => {
        event.preventDefault();
        mainWindow.hide();  
        tray = createTray();
        return false;
    });

    mainWindow.on('restore', function (event) {
        mainWindow.show();
        tray.destroy();
    });

    mainWindow.toggleDevTools();
}

function createEventWindow() {
    eventWindow = new BrowserWindow({
        parent: mainWindow,
        width: 500,
        height: 140,
        alwaysOnTop: true,
        frame: false,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    eventWindow.loadFile('eventWindow.html');
}

app.whenReady().then(() => {
    subscribeEvents();
    createMainWindow();
    mainWindow.webContents.on('did-finish-load', () => {
        mainWindow.webContents.send('sub', subscribed);
        loadEvents();
    })
    buildMenu();

    const ret = globalShortcut.register('CommandOrControl+Shift+E', () => {
        createEventWindow();
    })
});

function commands(command) {
    const splited = command.split(' ');

    switch(splited[0]) {
        case 'sub':
            subscribe(splited);
            break;
        case 'unsub':
            unsubscribe(splited);
            break;
    }
}

function subscribe(command) {
    if (command.length == 1){
        subscribed = channels;
    } else {
        command.slice(1).forEach(item => {
            if (item[0] === '#') {
                item = item.slice(1);
            }

            if (channels.includes(item) && !subscribed.includes(item)) {
                subscribed.push(item);
            }
        })
    }
    mainWindow.webContents.send('sub', subscribed);
}

function unsubscribe(command) {
    if (command.length == 1){
        subscribed = [];
    } else {
        command.slice(1).forEach(item => {
            if (item[0] === '#'){
                item = item.slice(1);
            }

            if (channels.includes(item) && subscribed.includes(item)) {
                const index = subscribed.indexOf(item);
                subscribed.splice(index,1);
            }
        })
    }
    
    mainWindow.webContents.send('sub', subscribed);
}

function subscribeEvents() {
    ipcMain.on('message', (event, message) => {
        if (message[0] === '!') {
            commands(message.slice(1));
        } else {
            const tags = message.match(/#(\S*)/g);
            message = message.replace(/#(\S*)/g, '');
            const event = {
                date: new Date(),
                author: null,
                message: message,
                tags: tags
            };
            db.get('events').push(event);
            db.save();
            //showNotification(event);
            mainWindow.webContents.send('pass', event);
        }       
    });
}

function showNotification(event) {
    const tagsToText = (tags) => {
        if (!tags) return '';

        let text = '';
        tags.forEach(tag => text += `#${tag} `);

        return text;
    }

    let notification = new Notification({
        title: event.author,
        body: `${tagsToText(event.tags)}\n${event.message}`
    });
    notification.on('click', () => {
        mainWindow.show();
    })
    notification.show();
}

function loadEvents() {
    const events = db.get('events').value();
    
    events.forEach(e => {
        const message = {
            author: e.author,
            date: new Date(e.date),
            message: e.message,
            tags: e.tags
        }
        mainWindow.webContents.send('pass', message);
    })
}

function openChannelsSettings() {
    channelWindow = new BrowserWindow({
        width: 600,
        height: 600,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    channelWindow.loadFile('channelsWindow.html');
}

function buildMenu() {
    const menu = Menu.buildFromTemplate([
        {
            label: 'File',
            submenu: [
                {
                    label: 'Exit',
                    click: () => mainWindow.close()
                }
            ],
        },
        // {
        //     label: 'Edit',
        //     submenu: [
        //         {
        //             label: 'Channels',
        //             click: () => openChannelsSettings()
        //         }
        //     ]
        // }
    ]);

    Menu.setApplicationMenu(menu);
}