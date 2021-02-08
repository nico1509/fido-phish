const WebSocket = require('ws')
const login = require('./src/login')
const fido = require('./src/fido')

const wss = new WebSocket.Server({ port: 8081 })

let uuid = ''
let requestId = ''
let clientData = { type: 'webauthn.get', challenge: '', origin: 'https://demo.yubico.com', crossOrigin: false }
let _cookies = ''

const doAction = async (data = {}) => {
  switch (data._action) {
    case 'login':
      const loginResponse = await login.login(data.username, data.password)
      uuid = loginResponse.data.user.uuid
      _cookies = loginResponse._cookies
      return loginResponse

    case 'auth-begin':
      const authBeginResponse = await login.authenticateBegin(uuid, _cookies)
      requestId = authBeginResponse.data.requestId
      clientData.challenge = authBeginResponse.data.publicKey.challenge
      return fido.buildAuthRequest(data._channel, clientData, authBeginResponse.data.publicKey.allowCredentials[0].id)


    case 'auth-finish':
      const fidoResponse = fido.readAuthResponse(data._authResponse)
      const clientDataJSON = Buffer.from(JSON.stringify(clientData), 'ascii').toString('base64')
      return login.authenticateFinish(
        fidoResponse.authenticatorData,
        clientDataJSON,
        fidoResponse.credentialId,
        fidoResponse.signature,
        requestId,
        uuid,
        _cookies
      )

    default:
      return Promise.reject('no or wrong _action given')
  }
}

const parseData = (data) => {
  try {
    return JSON.parse(data)
  } catch (error) {
    return data.toString()
  }
}

let connectionNumber = 0;

wss.on('connection', (ws, req) => {

  const thisConnectionNumber = ++connectionNumber

  console.log('<(%i) New Connection from "%s"', thisConnectionNumber, req.headers.forwarded || req.connection.remoteAddress)

  const respond = (data = {}, action = '_none', success = true, message = {message: 'ok'}) => {
    const response = JSON.stringify({
      _action: action,
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
      respond(data, '_none', false, { message: 'received string or malformed JSON'})
      return
    }
    console.log('<(%i) "%s"', thisConnectionNumber, JSON.stringify(data))

    doAction(data).then(response => {
      respond(response, data._action)
    }).catch(error => {
      respond({}, data._action || '_none', false, error)
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
