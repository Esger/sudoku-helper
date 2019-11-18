import { EventAggregator } from 'aurelia-event-aggregator';
import { inject } from 'aurelia-framework';

@inject(EventAggregator)
export class GridService {

    constructor(eventAggregator) {
        this._eventAggregator = eventAggregator;
        this._candidates = [0, 1, 2, 3, 4, 5, 6, 7, 8];
        this._tuples = [[], [], [], [], [], []];
        this._fillTuples();
        this.reset();
    }

    reset() {
        this._cellsReadyCount = 0;
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

    _fillTuples() {
        // .map() gebruiken?
        this._candidates.forEach(val1 => {
            for (let i = val1 + 1; i < this._candidates.length; i++) {
                const val2 = this._candidates[i];
                this._tuples[2].push([val1, val2]);
                for (let j = i + 1; j < this._candidates.length; j++) {
                    const val3 = this._candidates[j];
                    this._tuples[3].push([val1, val2, val3]);
                    for (let k = j + 1; k < this._candidates.length; k++) {
                        const val4 = this._candidates[k];
                        this._tuples[4].push([val1, val2, val3, val4]);
                        for (let j = k + 1; j < this._candidates.length; j++) {
                            const val5 = this._candidates[j];
                            this._tuples[5].push([val1, val2, val3, val4, val5]);
                        }
                    }
                }
            }
        });
    }

    registerCell(cell) {
        this._cellsReadyCount++;
        let row = cell.props.row;
        let col = cell.props.col;
        let rowBlock = cell.props.rowBlock;
        let colBlock = cell.props.colBlock;
        let blockIndex = rowBlock * 3 + colBlock;
        let blockCellIndex = (row % 3) * 3 + (col % 3);
        this._blocks[blockIndex][blockCellIndex] = cell;
        this._rows[row][col] = cell;
        this._cols[col][row] = cell;
        if (this._cellsReadyCount % 81 == 0) {
            setTimeout(() => {
                this.getStatus();
            });
        }
    }

    _isSet(cell) {
        if (cell && cell.props && cell.props.value >= 0) {
            return true;
        } else {
            return false;
        }
    }

    _hasNoCandidates(cell) {
        return cell && cell.candidates && !candidates.some(candidate => candidate >= 0);
    }

    getStatus() {
        let flatRows = this._rows.flat();
        let cellsSetCount = flatRows.flat().filter(cell => {
            return this._isSet(cell);
        }).length;
        let newStatus;
        switch (cellsSetCount) {
            case 0: newStatus = 'empty'; break;
            case 1: newStatus = 'initial'; break;
            case 81: newStatus = 'solved'; break;
            default: if (this._rows.some(cell => this._hasNoCandidates(cell))) {
                newStatus = 'error';
            } else {
                newStatus = 'initial';
            }
        }
        this.status = newStatus;
        this._eventAggregator.publish('statusChanged', newStatus);
    }

    findUniqueCandidates(cells) {
        const theCells = [];
        this._candidates.forEach(candidate => {
            let theCell;
            let candidateCount = 0;
            cells.forEach(cell => {
                if (cell && cell.candidates && cell.candidates.indexOf(candidate) >= 0) {
                    candidateCount++;
                    theCell = cell;
                }
            });
            // hier ook !isset(theCell.props.value) => newValue weg?
            if (theCell && !theCell.props.newValue && candidateCount == 1) {
                theCell.props.newValue = candidate;
                theCells.push(theCell);
            }
        });
        return theCells;
    }

    findUniqueRowColBlockCandidates() {
        let cells = [];
        this._rows.forEach(row => {
            cells = cells.concat(this.findUniqueCandidates(row));
        });
        this._cols.forEach(col => {
            cells = cells.concat(this.findUniqueCandidates(col));
        });
        this._blocks.forEach(block => {
            cells = cells.concat(this.findUniqueCandidates(block));
        });
        return cells;
    }

    _candidatesContainTuple(cell, tuple) {
        let result;
        if (cell.props.value < 0) {
            // use .some for subset
            result = tuple.every(value => {
                let result = (cell.candidates.indexOf(value) >= 0);
                return result;
            });
        } else {
            result = false;
        }
        return result;
    }

    _candidatesCount(cell) {
        let candidateCount = cell.candidates.filter(candidate => candidate >= 0).length;
        return candidateCount;
    }

    findTuples(dimension, nTuple) {
        let cells, tuples = [];
        switch (dimension) {
            case 'rows': cells = this._rows; break;
            case 'cols': cells = this._cols; break;
            case 'blocks': cells = this._blocks; break;
        }

        this._tuples[nTuple].forEach(tuple => {
            cells.forEach(area => {
                let cellsSetsWithTuples = [];
                area.forEach(cell => {
                    if (this._candidatesContainTuple(cell, tuple) &&
                        this._candidatesCount(cell) == nTuple) {
                        cellsSetsWithTuples.push({ cell: cell, members: tuple });
                    }
                });
                if (cellsSetsWithTuples.length == nTuple) {
                    tuples.push(cellsSetsWithTuples);
                }
            });
        });

        return tuples;
    }

}