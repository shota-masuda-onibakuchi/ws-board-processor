import { BoardInterface, ResponeBook, BoardManagment } from './update-orderbook';
import { on } from 'events'
import { createWriteStream } from 'fs'

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

// including private channels:
// const ftx = new FTXWs({
//   key: 'x',
//   secret: 'y',
//   subaccount: 'z'
// })

class Analyze {
    constructor() {

    }
    boardWidth = 100
    public calculateDepth(board: BoardInterface) {
        let bidDepth = 0
        let askDepth = 0
        for (const size of board.bids.values()) {
            bidDepth += size
        }
        for (const size of board.bids.values()) {
            askDepth += size
        }
    }
    public calculateMarketOrder(orders) {
        const timestamp = Date.now();
        let liquidation = { timestamp: timestamp, buy: 0, sell: 0 }
        let marketOrders = { timestamp: timestamp, buySize: 0, sellSize: 0 }
        for (const ord of orders) {
            if (ord.liquidation) {
                if (ord.side == "buy")
                    liquidation.buy += ord.size;
                else liquidation.sell += ord.size;
            }
            if (ord.side == "buy") {
                marketOrders.buySize += ord.size
            }
            if (ord.side == "sell") {
                marketOrders.sellSize += ord.size
            }
        }
    }
    public calculateDiffBoard(updatedBoard: ResponeBook, currentBoard: BoardInterface)
    public calculateDiffBoard(prevBoard: BoardInterface, currentBoard: BoardInterface)
    public calculateDiffBoard(board: any,currentBoard: BoardInterface) {
        // updatedBoard
        for (const key of Object.keys(board)) {
            if (!(key in ['bids', 'asks'])) continue;
            for (const [price, size] of board[key]) {
                if (currentBoard[key].has(price)) {
                    if (size == 0) {
                        currentBoard[key].delete(price);
                    }
                    else currentBoard[key].set(price, size);
                }
                else if (size > 0) {
                    currentBoard[key].set(price, size);
                }
            }
        }
    }
}
const path = './orderbook.csv'
const ftx = new BoardManagment() as any;
// const stream = createWriteStream(path)

const go = async () => {
    await ftx.ws.connect();
    ftx.ws.subscribe('orderbook', 'BTC-PERP');
    // ftx.ws.on('BTC-PERP::orderbook', console.log);
    // ftx.ws.on('BTC-PERP::orderbook', (res: ResponeBook) => ftx.realtime(res));
    for await (const event of on(ftx.ws, "BTC-PERP::orderbook")) {
        ftx.realtime(event[0])
    }

    ftx.ws.subscribe('trades', 'BTC-PERP');
    // ftx.ws.on('BTC-PERP::trades', console.log);
    for await (const event of on(ftx.ws, "BTC-PERP::trades")) {
        console.log('event :>> ', event)

    }

    // ftx.ws.subscribe('market', 'BTC-PERP');
    // ftx.ws.on('BTC-PERP::market', console.log);
    // if you passed api credentials:
    ftx.ws.subscribe('fills');
    ftx.ws.on('fills', console.log);
    // if you want to know when the status of underlying socket changes
    ftx.ws.on('statusChange', console.log);
}
go();
