import { EventAggregator } from 'aurelia-event-aggregator';
import { inject } from 'aurelia-framework';

@inject(EventAggregator)
export class CandidatesService {

    constructor(eventAggregator) {
        this._eventAggregator = eventAggregator;
        this._candidates = [0, 1, 2, 3, 4, 5, 6, 7, 8];
        this._eventAggregator.subscribe('reset', _ => {
            this.reset();
        });
        this.reset();
    }

    reset() {
        this._cells = this._candidates.map(cell => cell = {});
        this._grid = this._candidates.map(row => row = this._cells.slice());
        this._cols = this._newGrid();
        this._rows = this._newGrid();
        this._blocks = this._newGrid();
        setTimeout(() => {
            console.table(this._cols[0]);
        }, 5000);
    }

    _newGrid() {
        // create empty 9 x 9 array of empty objects
        let cellsSets = this._candidates.map(row => row = this._cells.slice());
        return cellsSets;
    }

    registerCell(cell) {
        let blockIndex = cell.rowBlock * 3 + cell.colBlock;
        let blockCellIndex = (cell.row % 3) * 3 + (cell.col % 3);
        this._blocks[blockIndex][blockCellIndex] = cell;
        this._rows[cell.row][cell.col] = cell;
        this._cols[cell.col][cell.row] = cell;
    }

    findUniqueCandidates(cells) {
        const theCells = [];
        this._candidates.forEach(value => {
            let theCell;
            let candidateCount = 0;
            cells.forEach(cell => {
                if (cell.candidates.indexOf(value) >= 0) {
                    candidateCount++;
                    theCell = cell;
                }
            });
            if (candidateCount == 1) {
                theCells.push(theCell);
            }
        });
        return theCells;
    }

    findUniqueRowCandidates() {
        let cells = [];
        this._rows.forEach(row => {
            cells = cells.concat(this.findUniqueCandidates(row));
        });
        return cells;
    }
}