var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
var _this = this;
var express = require('express');
var app = express();
var server = require('http').Server(app);
var io = require('socket.io')(server);
var lnSecret = require('./lnSecret.json');
var lnService = require('ln-service');
var createInvoice = require('ln-service/createInvoice');
var decodePaymentRequest = require('ln-service/decodePaymentRequest');
var getRoutes = require('ln-service/getRoutes');
var pay = require('ln-service/pay');
var lnd = lnService.lightningDaemon(lnSecret);
// maps invoice to socket id
var mapInvoiceToId = {};
io.on('connection', function (socket) {
    // listen to client
    socket.on('toServer', function (clientMsg) { return __awaiter(_this, void 0, void 0, function () {
        var clientInvoice, e_1, routes, serverInvoice;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, , 3]);
                    return [4 /*yield*/, decodePaymentRequest({
                            lnd: lnd,
                            request: clientMsg
                        })];
                case 1:
                    clientInvoice = _a.sent();
                    return [3 /*break*/, 3];
                case 2:
                    e_1 = _a.sent();
                    // send to client
                    return [2 /*return*/, io.emit('toClient', { status: false, message: "can't decode" }, socket.id)];
                case 3: return [4 /*yield*/, getRoutes({
                        lnd: lnd,
                        destination: clientInvoice.destination,
                        tokens: clientInvoice.tokens
                    }).then(function (res) { return res.routes; })
                    // error checking
                ];
                case 4:
                    routes = _a.sent();
                    // error checking
                    if (routes.length === 0) {
                        // send to client
                        return [2 /*return*/, io.emit('toClient', { status: false, message: "can't find routes" }, socket.id)];
                    }
                    if (clientInvoice.is_expired) {
                        // send to client
                        return [2 /*return*/, io.emit('toClient', { status: false, message: "invoice expired" }, socket.id)];
                    }
                    return [4 /*yield*/, createInvoice({
                            lnd: lnd,
                            tokens: clientInvoice.tokens,
                            expires_at: clientInvoice.expires_at,
                            description: clientMsg
                        })
                        // map
                    ];
                case 5:
                    serverInvoice = _a.sent();
                    // map
                    mapInvoiceToId[clientMsg] = socket.id;
                    // send to client
                    return [2 /*return*/, io.emit('toClient', { status: 'send', message: serverInvoice.request }, socket.id)];
            }
        });
    }); });
});
// load front end
app.use(express.static(__dirname + '/views'));
// display front-end
app.get("/", function (req, res) {
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
lnService.subscribeToInvoices({ lnd: lnd }).on('data', function (recievedInvoice) { return __awaiter(_this, void 0, void 0, function () {
    var payInvoice, paidInvoice;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0: return [4 /*yield*/, decodePaymentRequest({
                    lnd: lnd,
                    request: recievedInvoice.description
                })
                // confirm what we recieved matches what we'll pay 
            ];
            case 1:
                payInvoice = _a.sent();
                if (!(recievedInvoice.is_confirmed && recievedInvoice.tokens === payInvoice.tokens)) return [3 /*break*/, 3];
                return [4 /*yield*/, pay({
                        lnd: lnd,
                        request: recievedInvoice.description
                    })];
            case 2:
                paidInvoice = _a.sent();
                console.log({ paidInvoice: paidInvoice });
                // send message to client that payment is complete
                return [2 /*return*/, io.emit('toClient', { status: 'pay', message: 'payment complete' }, mapInvoiceToId[recievedInvoice.description])];
            case 3: return [2 /*return*/];
        }
    });
}); });
server.listen(80);
