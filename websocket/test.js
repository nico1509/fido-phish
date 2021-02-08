const fido = require('./src/fido')

// console.log(
//     fido.buildAuthRequest('ffffffff', {
//         "type":"webauthn.get",
//         "challenge":"TeZl5lLS4-iouepqSn5uhn9IMG6x15Npn4Lj7gX3brQ",
//         "origin":"https://demo.yubico.com","crossOrigin":false
//     }, 'vhEAw1/w1cGWnfdY142E5b0YUuer+0Nt7ziVsPD09DZrtFiw73Zg5mHNfJnR21OhTCb+TpU+9ZOj4vBnegJN1Q==')
// )

console.log(
    fido.readAuthResponse('001c00039000cb00a301a26269645840be1100c35ff0d5c1969df758d78d84e5bd1852e7abfb436def3895b0f0f4f4366bb458b0ef7660e661cd7c99d1db53a14c26fe4e953ef593a3e2f0677a024dd564747970656a7075626c69632d6b6579025825c46cef82ad1b546477591d008b08759ec3e6d2ecb4f39474bfea6969925d03b700000000520358473045022100d1ab1d9eaafa36252e3ea3e574f1c314396c1c6f9536dbffd21656c559b818bf02203746f2d18b5b76130057d0f4ed852d888e928e379aeafde2555dd9baff8a0f7000000000000000000000000000000000000000000000000000000000000000')
)
