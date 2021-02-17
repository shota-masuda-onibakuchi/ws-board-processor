import { BoardInterface, ResponeBook, BoardManagment } from './update-orderbook';
import { on } from 'events'
import { createWriteStream } from 'fs'
import { Logic } from './analysis';

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// including private channels:
// const ftx = new FTXWs({
//   key: 'x',
//   secret: 'y',
//   subaccount: 'z'
// })

const path = './orderbook.csv'
// const ftx = new BoardManagment() as any
const ftx = new Logic() as any;
// const stream = createWriteStream(path)

const go = async () => {
    await ftx.ws.connect();
    ftx.ws.subscribe('orderbook', 'BTC-PERP');
    // ftx.ws.on('BTC-PERP::orderbook', console.log);
    // ftx.ws.on('BTC-PERP::orderbook', (res: ResponeBook) => ftx.realtime(res));
    for await (const event of on(ftx.ws, "BTC-PERP::orderbook")) {
        ftx.boardAnalysis(event[0]);
        // console.log('events[0].bids :>> ', event[0].bids, 'events[0].asks :>> ',event[0].asks);
        // ftx.realtime(event[0])
    }

    // ftx.ws.subscribe('trades', 'BTC-PERP');
    // // ftx.ws.on('BTC-PERP::trades', console.log);
    // for await (const event of on(ftx.ws, "BTC-PERP::trades")) {
    //     console.log('event :>> ', event)

    // }

    // ftx.ws.subscribe('market', 'BTC-PERP');
    // ftx.ws.on('BTC-PERP::market', console.log);
    // if you passed api credentials:
    ftx.ws.subscribe('fills');
    ftx.ws.on('fills', console.log);
    // if you want to know when the status of underlying socket changes
    ftx.ws.on('statusChange', console.log);
};
go();
