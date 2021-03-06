import FTXWs from 'ftx-api-ws';

export interface BoardInterface { asks: Map<number, number>, bids: Map<number, number> };
export interface ResponeBook { asks: number[][], bids: number[][], action: 'partial' | 'update', timestamp: number };
export interface ResponceMarkerOrder { id: number, price: number, size: number, side: 'sell' | 'buy', liquidation: boolean, time: string }
export interface ResponceFutureStats { nextFundingRate: number, volume: number, openInterest: number };

export class BoardUpdater {
    board: BoardInterface;
    prevBoard: BoardInterface;
    ws: FTXWs;
    constructor(config = {}) {
        // this.ws = new FTXWs(config);
    }
    public realtime = (responce: ResponeBook) => {
        if (responce['action'] == 'partial') {
            this.board = this.reformatBoard(responce);
        }
        if (responce['action'] == 'update') {
            this.updateBoard(responce);
        }
        // this.prevBoard = { bids: new Map([...this.board.bids]), asks: new Map([...this.board.asks]) };
    }
    protected reformatBoard = (data: ResponeBook): BoardInterface => {
        const board: BoardInterface = { asks: new Map(), bids: new Map() };
        for (const key of Object.keys(data)) {
            if (key == 'bids' || key == 'asks') {
                data[key].forEach(quate => {
                    board[key].set(quate[0], quate[1]);
                })
            }
        }
        return board;
    }
    protected updateBoard = (data: ResponeBook): BoardInterface => {
        for (const key of Object.keys(data)) {
            if (!(key == 'bids' || key == 'asks')) continue;
            for (const [price, size] of data[key]) {
                if (this.board[key].has(price)) {
                    if (size == 0) {
                        this.board[key].delete(price);
                    }
                    else this.board[key].set(price, size);
                }
                else if (size > 0) {
                    this.board[key].set(price, size);
                }
            }
        }
        return this.board
    }

}
