const WebSocket = require('ws')
const login = require('./src/login')

const wss = new WebSocket.Server({ port: 8081 })

const parseData = (data) => {
  try {
    return JSON.parse(data)
  } catch (error) {
    return data.toString()
  }
}

const doAction = async (data = {}) => {
  switch (data._action) {
    case 'login':
      return login.login(data.user || '', data.password || '')

    case 'auth-begin':
      return login.authenticateBegin(data.uuid || '')


    case 'auth-finish':
      return login.authenticateFinish(
        data.authenticatorData || '',
        data.clientDataJSON || '',
        data.credentialId || '',
        data.signature || '',
        data.requestId || '',
        data.uuid || ''
      )

    default:
      return Promise.reject('no or wrong _action given')
  }
}

wss.on('connection', function connection(ws) {

  const respond = (data = {}, success = true, message = {message: 'ok'}) => {
    const response = JSON.stringify({
      status: success ? 'success' : 'error',
      message: message,
      data: data,
    }, null, 1)
    console.log('> "%s"', response)
    ws.send(response)
  }

  ws.on('message', function incoming(message) {
    const data = parseData(message)
    if (typeof data === 'string') {
      respond(data, false, { message: 'received string or malformed JSON'})
      return
    }
    console.log('< "%s"', JSON.stringify(data))

    doAction(data).then(response => {
      respond(response)
    }).catch(error => {
      respond({}, false, error)
    })
  })

})
