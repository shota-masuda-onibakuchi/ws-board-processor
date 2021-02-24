import { BoardInterface, ResponeBook, BoardUpdater, ResponceMarkerOrder } from './update-orderbook';
import { StreamRecord } from './stream-record';
import { PathLike } from 'fs';

export class BoardProcessor extends BoardUpdater {
    boardWidth = 100
    maxLength
    interval;
    nextUpdate = Date.now();
    depths = [{ timestamp: this.nextUpdate, bids: 0, asks: 0 }]
    marketOrders = [{ timestamp: this.nextUpdate, buy: 0, sell: 0, liqBuy: 0, liqSell: 0 }]
    // liquidations = [{ timestamp: this.nextUpdate, buy: 0, sell: 0 }];
    diffBoard = [{ timestamp: this.nextUpdate, asks: 0, bids: 0 }];
    timer;
    streamRecord: StreamRecord;
    constructor(fileName: PathLike, interval = 10000, maxLength = 10, vervose = false) {
        super(null, vervose);
        this.interval = interval;
        this.maxLength = maxLength;
        this.nextUpdate = Date.now() + interval;
        this.timer = setInterval(() => this.update(), 2000);
        this.streamRecord = new StreamRecord(fileName)
    }
    public boardAnalysis = (responce: ResponeBook) => {
        if (!responce) return console.log('[WARN] at boardAnaysis:RESPONCE_IS_INVALID', responce);
        this.board && this.calculateDiffBoard(this.board, null, responce);
        setImmediate(() => this.realtime(responce));
        setImmediate(() => this.calculateDepth(this.board));
    }
    public marketOrderAnalysis = (responce: ResponceMarkerOrder[]) => {
        if (!responce) return console.log('[WARN] at marketOrderAnalysis:RESPONCE_IS_INVALID', responce);
        setImmediate(() => this.calculateMarketOrder(responce));
    }
    public update() {
        if (this.nextUpdate > Date.now()) return
        console.log("-------------------------");
        const lasttime = this.nextUpdate;
        this.nextUpdate += this.interval;
        this.depths.push({ timestamp: lasttime, bids: 0, asks: 0 });
        this.marketOrders.push({ timestamp: lasttime, buy: 0, sell: 0, liqBuy: 0, liqSell: 0 })
        // this.liquidations.push({ timestamp: lasttime, buy: 0, sell: 0 })
        this.diffBoard.push({ timestamp: lasttime, asks: 0, bids: 0 })

        const length = this.depths.length;
        if (length > 3) {
            console.log('[Info]:  Writing result...');
            const chunk = new Date(this.nextUpdate).toISOString() + ',' +
                this.depths[length - 2].asks + ',' +
                this.depths[length - 2].bids + ',' +
                this.diffBoard[length - 2].asks + ',' +
                this.diffBoard[length - 2].bids + ',' +
                this.marketOrders[length - 2].buy + ',' +
                this.marketOrders[length - 2].sell + ',' +
                this.marketOrders[length - 2].liqBuy + ',' +
                this.marketOrders[length - 2].liqSell + '\n';
            this.streamRecord.write(chunk);
        }
        /** slice data to  the max length */
        if (length > this.maxLength) {
            this.depths.splice(0, this.maxLength - length)
            this.marketOrders.splice(0, this.maxLength - this.marketOrders.length)
            // this.liquidations.splice(0, this.maxLength - this.liquidations.length)
            this.diffBoard.splice(0, this.maxLength - this.diffBoard.length)
        }
        console.log('this.diffBoard :>> ', this.diffBoard);
        console.log('this.depths :>> ', this.depths);
        console.log('this.marketOrders :>> ', this.marketOrders);
        // console.log('this.liquidations :>> ', this.liquidations);
    }
    public calculateDepth(board: BoardInterface) {
        if (!board) return console.log('[WARN]: BOARD_IS_NOT_FOUND', board);
        const depth = { timestamp: 0, bids: 0, asks: 0 }
        for (const key of Object.keys(depth)) {
            if (!(key == 'bids' || key == 'asks')) continue;
            for (const size of board[key].values()) {
                depth[key] += size
            }
        }
        this.depths[this.depths.length - 1]['bids'] += depth['bids']
        this.depths[this.depths.length - 1]['asks'] += depth['asks']
    }
    public calculateMarketOrder(orders: ResponceMarkerOrder[]) {
        // const liq = this.liquidations[this.liquidations.length - 1]
        const morders = this.marketOrders[this.marketOrders.length - 1]
        for (const ord of orders) {
            if (ord.liquidation) {
                if (ord.side == "buy")
                    morders.liqBuy += ord.size;
                else morders.liqSell += ord.size;
            }
            if (ord.side == "buy") {
                morders.buy += ord.size
            }
            if (ord.side == "sell") {
                morders.sell += ord.size
            }
        }
        // this.liquidations[this.liquidations.length - 1] = liq
        this.marketOrders[this.marketOrders.length - 1] = morders
    }
    public calculateDiffBoard(prevBoard: BoardInterface, currentBoard?: BoardInterface, updateData?: ResponeBook) {
        // const diff = this.diffBoard[this.diffBoard.length - 1]
        const diff = { timestamp: 0, asks: 0, bids: 0 };
        let board: { bids: IterableIterator<[number, number]> | number[][], asks: IterableIterator<[number, number]> | number[][], [extra: string]: any };
        if (currentBoard?.asks instanceof Map) {
            board = { bids: currentBoard.bids.entries(), asks: currentBoard.asks.entries() };
        }
        else if (updateData) {
            board = updateData;
        }
        if (!board || !prevBoard) return console.log("[WARN]: CAN_NOT_CALCULATE_DIFF_BOARD", board)
        for (const key of Object.keys(board)) {
            if (!(key == 'bids' || key == 'asks')) continue;
            for (const [price, size] of board[key]) {
                if (prevBoard[key].has(price)) {
                    diff[key] += size - prevBoard[key].get(price);
                }
                else if (size > 0) {
                    diff[key] += size
                }
            }
        }
        this.diffBoard[this.diffBoard.length - 1].asks += diff.asks;
        this.diffBoard[this.diffBoard.length - 1].bids += diff.bids;
        // for (const key of Object.keys(board)) {
        //     if (!(key in ['bids', 'asks'])) continue;
        //     board[key].forEach((size: number, price: number) => {
        //         if (prevBoard[key].has(price)) {
        //             diff[key] += size - prevBoard[key].get(price)
        //         }
        //         else if (size > 0) {
        //             diff[key] += size
        //         }
        //     });
        // }
    }
}