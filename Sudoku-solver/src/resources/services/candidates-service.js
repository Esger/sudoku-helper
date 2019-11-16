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
    }

    _newGrid() {
        // create empty 9 x 9 array of empty objects
        let cellsSets = this._candidates.map(row => row = this._cells.slice());
        return cellsSets;
    }

    registerCell(cell) {
        let row = cell.props.row;
        let col = cell.props.col;
        let rowBlock = cell.props.rowBlock;
        let colBlock = cell.props.colBlock;
        let blockIndex = rowBlock * 3 + colBlock;
        let blockCellIndex = (row % 3) * 3 + (col % 3);
        this._blocks[blockIndex][blockCellIndex] = cell;
        this._rows[row][col] = cell;
        this._cols[col][row] = cell;
    }

    findUniqueCandidates(cells) {
        const theCells = [];
        this._candidates.forEach(candidate => {
            let theCell;
            let candidateCount = 0;
            cells.forEach(cell => {
                if (cell.candidates.indexOf(candidate) >= 0) {
                    candidateCount++;
                    theCell = cell;
                }
            });
            if (theCell && !theCell.props.newValue && candidateCount == 1) {
                theCell.props.newValue = candidate;
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