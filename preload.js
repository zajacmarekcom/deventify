const { ipcRenderer } = require("electron");

let classMap = new Map([
    ['task', 'bg-primary'],
    ['update', 'bg-warning'],
    ['docs', 'bg-secondary'],
    ['finished', 'bg-success'],
    ['meeting', 'bg-info']
]);

ipcRenderer.on('pass', (event, evt) => {
    const item = document.createElement('tr');
    const dateCell = document.createElement('td');
    dateCell.innerHTML = `[${evt.date.toLocaleString('pl-PL')}]`;
    dateCell.className = 'col-2';

    item.appendChild(dateCell);

    const tagsCell = document.createElement('td');
    tagsCell.className = 'col-2';

    if (evt.tags) {
        const tags = evt.tags.sort();
        tags.forEach((a) => {
            a = a.slice(1);
            let tag = document.createElement('button');
            tag.className = `badge ${classMap.get(a)}`;
            tag.innerHTML = `${a} `;
            tagsCell.appendChild(tag);
        });
    }

    item.appendChild(tagsCell);

    const text = document.createElement('td');
    text.innerHTML = evt.message;

    item.appendChild(text);

    const list = document.getElementById('messages');
    list.appendChild(item);
});

// ipcRenderer.on('sub', (event, channels) => {
//     const subscriptions = document.getElementById('subscribed');
//     subscriptions.innerHTML = '';

//     if (channels) {
//         channels = channels.sort();
//         channels.forEach((channel) => {
//             let tag = document.createElement('span');
//             tag.className = `badge ${classMap.get(channel)} me-2`;
//             tag.innerHTML = `${channel} `;
//             subscriptions.appendChild(tag);
//         });
//     }
// })