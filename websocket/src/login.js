const axios = require('axios').default

const API_BASE = 'https://demo.yubico.com/api/v1/auth'
const API_LOGIN = '/login'
const API_AUTH_BEGIN = '/webauthn/authenticate-begin'
const API_AUTH_FINISH = '/webauthn/authenticate-finish'

const APP_NAMESPACE = 'playground'

/**
 * @param {string} url 
 * @param {Object} requestData
 * 
 * @returns {Promise<YubicoResponse>}
 */
const performApiRequest = async (url, requestData) => {
    const { status, data } = await axios.post(url, requestData, { validateStatus: null })
    if (status != 200) {
        return Promise.reject(data)
    }
    return data
}

module.exports = {}

/**
 * @param {string} user 
 * @param {string} password 
 * 
 * @returns {Promise<LoginResponse>}
 */
module.exports.login = async (user, password) => {
    /** @type {LoginRequest} */
    const loginData = {
        username: user,
        password: password,
        namespace: APP_NAMESPACE,
    }
    return await performApiRequest(API_BASE + API_LOGIN, loginData)
}

/**
 * @param {string} uuid 
 * 
 * @returns {Promise<AuthBeginResponse>}
 */
module.exports.authenticateBegin = async (uuid) => {
    /** @type {AuthBeginRequest} */
    const authBeginData = {
        namespace: APP_NAMESPACE,
        uuid: uuid,
    }
    return await performApiRequest(API_BASE + API_AUTH_BEGIN, authBeginData)
}

/**
 * @param {string} authenticatorData 
 * @param {string} clientDataJSON 
 * @param {string} credentialId 
 * @param {string} signature 
 * @param {string} requestId 
 * @param {string} uuid 
 * 
 * @returns {Promise<AuthFinishResponse>}
 */
module.exports.authenticateFinish = async (authenticatorData, clientDataJSON, credentialId, signature, requestId, uuid) => {
    /** @type {AuthFinishRequest} */
    const authFinishData = {
        assertion: {
            authenticatorData: authenticatorData,
            clientDataJSON: clientDataJSON,
            credentialId: credentialId,
            signature: signature,
        },
        namespace: APP_NAMESPACE,
        requestId: requestId,
        uuid: uuid,
    }
    return await performApiRequest(API_BASE + API_AUTH_FINISH, authFinishData)
}
