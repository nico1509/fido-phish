const modal_device = document.getElementById('modal_device');
const btn_closedevice = document.getElementById('btn_closedevice');
const btn_clearlogs = document.getElementById('btn_clearlogs');
const logContainer = document.querySelector('.log_container');

// Modal
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

// Sleep
function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
async function sleep(fn, ...args) {
    await timeout(3000);
    return fn(...args);
}

// Hex, String etc.
function hex2ascii(hex) {
    return hex.match(/.{1,2}/g).map(function(v){
        return String.fromCharCode(parseInt(v, 16));
      }).join('');
}
function hex2uint8array(hex) {
    return new Uint8Array(hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
}
function uint8array2hex(bytes) {
    return bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '');
}
function removeSpaces(s) {
    return s.replace(/\s/g, '');
}

