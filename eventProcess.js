const { ipcRenderer } = require('electron');

window.addEventListener('DOMContentLoaded', () => {
    
    const textarea = document.getElementById('event-content');
    textarea.addEventListener('input',(event) => {
        toggleInputClass(event.target)
    });

    attachAutocomlete(textarea);
    textarea.focus();
});

window.addEventListener('keyup', (event) => {
    if (event.ctrlKey && event.key === 'Enter') {
        const message = document.getElementById('event-content').value;
        if (message) {
            ipcRenderer.send('message', message);
        }
        window.close();
    } else if (event.key === 'Escape') {
        window.close();
    }
}, true);

function toggleInputClass(target) {
    if (target.value.length > 0 && target.value[0] === '!') {
        target.classList.add('text-danger');
        target.classList.add('bold');
    } else {
        target.classList.remove('text-danger');
        target.classList.remove('bold');
    }
}

function attachAutocomlete(target) {
    const tr = new Tribute({
        trigger: '#',
        values: [
            { key: 'docs', value: 'docs' },
            { key: 'meeting', value: 'meeting' },
            { key: 'task', value: 'task' },
            { key: 'finished', value: 'finished' },
            { key: 'update', value: 'update' }
        ]
    });
    
    tr.attach(target);
}