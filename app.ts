const express = require('express')
const app = express() 
const server = require('http').Server(app)
const io = require('socket.io')(server)
const lnSecret = require('./lnSecret.json')
const lnService = require('ln-service')
const createInvoice = require('ln-service/createInvoice')
const decodePaymentRequest = require('ln-service/decodePaymentRequest')
const getRoutes = require('ln-service/getRoutes')
const pay = require('ln-service/pay')
const lnd = lnService.lightningDaemon(lnSecret)

// maps invoice to socket id
const mapInvoiceToId = {}

io.on('connection', (socket) => {
  // listen to client
  socket.on('toServer', async (clientMsg) => {
    // decode payment request
    let clientInvoice
    try{
      clientInvoice = await decodePaymentRequest({
        lnd,
        request: clientMsg 
      })
    } catch (e) {
      // send to client
      return io.emit('toClient', {status:false, message: `can't decode`}, socket.id)
    }

    // check if there's enough ₿ to route to destination
    const routes = await getRoutes({
      lnd,
      destination: clientInvoice.destination,
      tokens: clientInvoice.tokens
    }).then(res => res.routes)

    // error checking
    if (routes.length === 0) {
      // send to client
      return io.emit('toClient', {status:false, message: `can't find routes`}, socket.id)
    }
    if (clientInvoice.is_expired) {
      // send to client
      return io.emit('toClient', {status:false, message: `invoice expired`}, socket.id)   
    }

    // else create invoice
    const serverInvoice = await createInvoice({
      lnd,
      tokens: clientInvoice.tokens,
      expires_at: clientInvoice.expires_at,
      description: clientMsg
    }) 

    // map
    mapInvoiceToId[clientMsg] = socket.id 

    // send to client
    return io.emit('toClient', {status:'send', message: serverInvoice.request}, socket.id)   
  })

})



// load front end
app.use(express.static(__dirname + '/views'));

// display front-end
app.get("/", (req,res) => {
  res.sendFile(__dirname + '/views/index.html');
});



/*
{ confirmed_at: '2019-02-10T01:43:52.000Z',
  created_at: '2019-02-10T01:43:00.000Z',
  description:
   'lntb1230n1pw9lq2ypp5j4mkpj8w6qn87qcwjey2h4g2zux9yc95u7see335mzhshpgaszqqdq2venxvenxvccqzysxqzjcrzjqwgmk9xny0mlukfnjn4xp6twzzqdjjkdfnk88kcwpuyrwqcy6vm4w93h4sqqqrcqqqqqqqlgqqqqqqgqjqweyaqhjpqwk78q36ze8jk8dc6kxtpdamstqpq657v8hwcyye6sj8xv7ur0tyyk2undyspcft9qeemdml473xlkuvj3nuymkag5s42fsqv5rw2y',
  expires_at: '2019-02-10T01:51:24.000Z',
  id:
   '47177b307c0129ed77e14ad800995fc4d998421db74313b4b401372a0ce9ad30',
  is_confirmed: true,
  is_outgoing: false,
  secret:
   'a6f66d395c0bdf4e265a7e08ee6aec134393859a2c589f95b12dab4e5f461dd5',
  tokens: 123,
  received: 123,
  received_mtokens: '123000',
  type: 'channel_transaction' }
*/
lnService.subscribeToInvoices({lnd}).on('data', async (recievedInvoice) => {
  // decode invoice we will pay to client (taken from the description)
  const payInvoice = await decodePaymentRequest({
    lnd,
    request: recievedInvoice.description
  })

  // confirm what we recieved matches what we'll pay 
  if (recievedInvoice.is_confirmed && recievedInvoice.tokens === payInvoice.tokens) {
    // pay the invoice
    const paidInvoice = await pay({
      lnd,
      request: recievedInvoice.description,
    })
    console.log({paidInvoice})

    // send message to client that payment is complete
    return io.emit('toClient', {status:'pay', message: 'payment complete'},  mapInvoiceToId[recievedInvoice.description])   
  }
})

server.listen(80)