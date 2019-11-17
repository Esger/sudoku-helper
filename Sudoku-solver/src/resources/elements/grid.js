import { BindingSignaler } from 'aurelia-templating-resources';
import { inject } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
import { GridService } from 'resources/services/grid-service';

@inject(BindingSignaler, EventAggregator, GridService)
export class GridCustomElement {

    constructor(bindingSignaler, eventAggregator, gridService) {
        this._bindingSignaler = bindingSignaler;
        this._eventAggregator = eventAggregator;
        this._gridService = gridService;
        this._candidates = [0, 1, 2, 3, 4, 5, 6, 7, 8];
        this._blocks = [0, 1, 2];
        this._doChecks = 0;
        this._processHandleId = undefined;
        this._tuples = [[], [], [], [], [], []];
        this.grid = this._candidates.map(row => this._candidates);
    }

    attached() {
        this._fillTuples();
        this._addListeners();
        this._processGrid();
    }

    detached() {
        this._cellValueSetSubscriber.dispose();
        clearInterval(this._resetGridListener);
    }

    _addListeners() {
        this._cellValueSetSubscriber = this._eventAggregator.subscribe('addCheck', _ => {
            this._addCheck();
        });
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

    _addCheck() {
        this._doChecks = 1;
    }

    _removeCheck() {
        this._doChecks--;
    }

    _arrayContainsArray(searchArray, findArray) {
        let result = searchArray.some(element => {
            return element.every((value, index) => {
                return findArray[index] == value;
            });
        });
        return result;
    }

    _signalCellValuesFound(cells) {
        cells.forEach(cell => {
            this._eventAggregator.publish('setCellValue', cell);
        });
    }

    _findUniques() {
        let cells = this._gridService.findUniqueRowColBlockCandidates();
        this._signalCellValuesFound(cells);
    }

    _candidatesAreSubsetOfTuple(row, col, set) {
        const cell = this.grid[row][col];
        let result;
        if (cell.value < 0) {
            result = cell.candidates.every(candidate => {
                return set.indexOf(candidate) >= 0 || candidate < 0;
            });
        } else {
            result = false;
        }
        return result;
    }

    findRowTuples(n) {
        this._tuples[n].forEach(tuple => {
            this._candidates.forEach(row => {
                let subsetCount = 0;
                let colsWithTuples = [];
                this._candidates.forEach(col => {
                    if (this._candidatesAreSubsetOfTuple(row, col, tuple)) {
                        subsetCount++;
                        colsWithTuples.push(col);
                    }
                });
                if (subsetCount == n) {
                    tuple.forEach(value => {
                        this._sweepRow(row, value, colsWithTuples);
                    });
                }
            });
        });
    }

    findColTuples(n) {
        this._tuples[n].forEach(tuple => {
            this._candidates.forEach(col => {
                let subsetCount = 0;
                let rowsWithTuples = [];
                this._candidates.forEach(row => {
                    if (this._candidatesAreSubsetOfTuple(row, col, tuple)) {
                        subsetCount++;
                        rowsWithTuples.push(row);
                    }
                });
                if (subsetCount == n) {
                    tuple.forEach(value => {
                        this._sweepCol(col, value, rowsWithTuples);
                    });
                }
            });
        });
    }

    findBlockTuples(n) {
        this._tuples[n].forEach(tuple => {
            this._blocks.forEach(blockY => {
                this._blocks.forEach(blockX => {
                    let tupleCount = 0;
                    let cellsWithTuples = [];
                    let theRow, theCol;
                    this._blocks.forEach(row => {
                        theRow = blockY * 3 + row;
                        this._blocks.forEach(col => {
                            theCol = blockX * 3 + col;
                            if (this._candidatesAreSubsetOfTuple(theRow, theCol, tuple)) {
                                tupleCount++;
                                cellsWithTuples.push([theRow, theCol]);
                            }
                        });
                    });
                    if (tupleCount == n) {
                        tuple.forEach(value => {
                            this._sweepBlock(theRow, theCol, value, cellsWithTuples);
                        });
                    }
                });
            });
        });
    }

    _findPairs() {
        [2, 3, 4, 5].forEach(value => {
            this.findRowTuples(value);
            this.findColTuples(value);
            this.findBlockTuples(value);
        });
    }

    _processGrid() {
        this._processHandleId = setInterval(() => {
            if (this._doChecks > 0) {
                this._findUniques();
                // this._findPairs();
                this._removeCheck();
                this._eventAggregator.publish('thinkingProgress', { progress: this._doChecks });
                this._gridService.getStatus();
            }
        }, 200);
    }

}