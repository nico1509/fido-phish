const modal_device = document.getElementById('modal_device')
const logContainer = document.querySelector('.log_container')
const device_response_container = document.getElementById('device_response_container')
const websocket_response_container = document.getElementById('websocket_response_container')

function timeout(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
}

export default {
    clearLogs() {
        logContainer.innerHTML = ''
    },
    
    /**
     * @param {string} message - Write this message to log
     * @param {string} error - Add this class/es to the log message
     */
    writeToLogSection(message = '', error = '') {
        const classes = `log ${error}`
        logContainer.innerHTML += `<div class="${classes}">${new Date()} <br> &rightarrow; <b>${message}</b></div>`
    },

    clearDeviceSection() {
        device_response_container.innerHTML = ''
    },

    /**
     * @param {string} message - Write this message to device log
     * @param {string} error - Add this class/es to the message
     */
    writeToDeviceSection(message = '', error = '') {
        const classes = `device_response ${error}`
        device_response_container.innerHTML += `<p class="${classes}">${message}</p>`
    },

    hideDeviceModal() {
        modal_device.style.display = 'none'
    },

    clearWebsocketSection() {
        websocket_response_container.innerHTML = ''
    },

    /**
     * @param {string} message - Write this message to log
     * @param {string} error - Add this class/es to the log message
     */
    writeToWebsocketSection(message = '', error = '') {
        const classes = `log ${error}`
        websocket_response_container.innerHTML += `<pre class="${classes}">${new Date()}<br><b>${message}</b></pre>`
    },

    /**
     * @param {Function} fn 
     * @param  {...any} args 
     */
    async sleep(fn, ...args) {
        await timeout(3000)
        return fn(...args)
    },

    /**
     * @param {string} hex 
     */
    hex2ascii(hex) {
        return hex.match(/.{1,2}/g).map(function (v) {
            return String.fromCharCode(parseInt(v, 16))
        }).join('')
    },

    /**
     * @param {string} hex 
     */
    hex2uint8array(hex) {
        return new Uint8Array(hex.match(/.{1,2}/g).map(byte => parseInt(byte, 16)))
    },

    /**
     * @param {Uint8Array} bytes 
     */
    uint8array2hex(bytes) {
        return bytes.reduce((str, byte) => str + byte.toString(16).padStart(2, '0'), '')
    },

    /**
     * @param {string} s 
     */
    removeSpaces(s) {
        return s.replace(/\s/g, '')
    },

    /**
     * @param {string} s 
     */
    async string2SHA_256(s) {
        // from https://stackoverflow.com/a/48161723
        // encode as UTF-8
        const msgBuffer = new TextEncoder().encode(s)

        // hash the message
        const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer)

        // convert ArrayBuffer to Array
        const hashArray = Array.from(new Uint8Array(hashBuffer))

        // convert bytes to hex string                  
        const hashHex = hashArray.map(b => ('00' + b.toString(16)).slice(-2)).join('')
        return hashHex
    },
}
