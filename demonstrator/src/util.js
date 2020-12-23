const modal_device = document.getElementById('modal_device');
const btn_closedevice = document.getElementById('btn_closedevice');
const btn_clearlogs = document.getElementById('btn_clearlogs');
const logContainer = document.querySelector('.log_container');

/*
    UI STUFF
    just plain UI code without relevant device logic
*/
function addDeviceModalBehaviour() {
    [ btn_closedevice, modal_device ].forEach(element => {
        element.addEventListener('click', async (event) => {
            modal_device.style.display = 'none';
        });
        element.childNodes.forEach(child => {
            child.addEventListener('click', (childEvent) => {
                childEvent.stopPropagation();
            });
        });
    });
}
addDeviceModalBehaviour();

// Log
function clearLogs() {
    logContainer.innerHTML = '';
}
function writeToLogSection(message = '', error = '') {
    const classes = `log ${error}`;
    logContainer.innerHTML += `<div class="${classes}">${new Date()} <br> &rightarrow; ${message}</div>`;
}
btn_clearlogs.addEventListener('click', async () => {
    clearLogs();
})
