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
      return login.login(data.username || '', data.password || '')

    case 'auth-begin':
      return login.authenticateBegin(data.uuid || '', data._cookie || '')


    case 'auth-finish':
      return login.authenticateFinish(
        data.authenticatorData || '',
        data.clientDataJSON || '',
        data.credentialId || '',
        data.signature || '',
        data.requestId || '',
        data.uuid || '',
        data._cookie || ''
      )

    default:
      return Promise.reject('no or wrong _action given')
  }
}

let connectionNumber = 0;

wss.on('connection', (ws, req) => {

  const thisConnectionNumber = ++connectionNumber

  console.log('<(%i) New Connection from "%s"', thisConnectionNumber, req.headers.forwarded || req.connection.remoteAddress)

  const respond = (data = {}, success = true, message = {message: 'ok'}) => {
    const response = JSON.stringify({
      status: success ? 'success' : 'error',
      message: message,
      data: data,
    }, null, 1)
    console.log('(%i)> "%s"', thisConnectionNumber, response)
    ws.send(response)
  }

  ws.on('message', function incoming(message) {
    const data = parseData(message)
    if (typeof data === 'string') {
      respond(data, false, { message: 'received string or malformed JSON'})
      return
    }
    console.log('<(%i) "%s"', thisConnectionNumber, JSON.stringify(data))

    doAction(data).then(response => {
      respond(response)
    }).catch(error => {
      respond({}, false, error)
    })
  })

  ws.on('pong', (data) => {
    //console.log('<(%i) pong', thisConnectionNumber)
    setTimeout(() => {
      ws.ping()
      //console.log('(%i)> ping', thisConnectionNumber)
    }, 5000);
  })
  ws.ping()

  ws.on('close', () => {
    console.log('<(%i) Connection closed', thisConnectionNumber)
  })
  
})
