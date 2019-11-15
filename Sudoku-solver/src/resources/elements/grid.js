import { BindingSignaler } from 'aurelia-templating-resources';
import { inject } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
import { CandidatesService } from 'resources/services/candidates-service';

@inject(BindingSignaler, EventAggregator, CandidatesService)
export class GridCustomElement {

    constructor(bindingSignaler, eventAggregator, candidatesService) {
        this._bindingSignaler = bindingSignaler;
        this._eventAggregator = eventAggregator;
        this._candidatesService = candidatesService;
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
        this._candidateRemovedSubscriber.dispose();
        clearInterval(this._resetGridListener);
    }

    _addListeners() {
        this._cellValueSetSubscriber = this._eventAggregator.subscribe('cellValueSet', _ => {
            this._addCheck();
        });
        this._candidateRemovedSubscriber = this._eventAggregator.subscribe('candidateRemoved', _ => {
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
        this._doChecks++;
    }

    _removeCheck() {
        this._doChecks--;
    }

    _applyGridvalue(row, col, value) {
        this._signalCellValueFound(row, col, value);
        // this._sweepRow(row, value);
        // this._sweepCol(col, value);
        // this._sweepBlock(row, col, value);
    }

    _signalCellValueFound(row, col, value) {
        this._eventAggregator.publish('setCellValue', {
            row: row,
            col: col,
            value: value
        });
    }

    _arrayContainsArray(searchArray, findArray) {
        let result = searchArray.some(element => {
            return element.every((value, index) => {
                return findArray[index] == value;
            });
        });
        return result;
    }

    _pollCandidates() {
        this._eventAggregator.publish('pollCandidates');
    }

    _findUniqueRowCandidates() {
        let cells = this._candidatesService.findUniqueRowCandidates();
        cells.forEach(cell => {
            this._signalCellValueFound(cell.row, cell.col, cell.value);
        });
    }

    _findUniqueColCandidates() {
        // this._candidates.forEach(col => {
        //     this._candidates.forEach(value => {
        //         let candidateCount = 0;
        //         let theRow;
        //         this._candidates.forEach(row => {
        //             if (this.grid[row][col].candidates[value] >= 0) {
        //                 candidateCount++;
        //                 theRow = row;
        //             }
        //         });
        //         if (candidateCount == 1) {
        //             this._applyGridvalue(theRow, col, value);
        //         }
        //     });
        // });
    }

    _findUniqueBlockCandidates() {
        // this._blocks.forEach(yBlock => {
        //     this._blocks.forEach(xBlock => {
        //         this._candidates.forEach(value => {
        //             let candidateCount = 0;
        //             let theRow, theCol;
        //             this._blocks.forEach(row => {
        //                 this._blocks.forEach(col => {
        //                     let thisRow = yBlock * 3 + row;
        //                     let thisCol = xBlock * 3 + col;
        //                     if (this.grid[thisRow][thisCol].candidates[value] >= 0) {
        //                         candidateCount++;
        //                         theRow = thisRow;
        //                         theCol = thisCol;
        //                     }
        //                 });
        //             });
        //             if (candidateCount == 1) {
        //                 this._applyGridvalue(theRow, theCol, value);
        //             }
        //         });
        //     });
        // });
    }

    _findUniques() {
        this._findUniqueRowCandidates();
        // this._findUniqueColCandidates();
        // this._findUniqueBlockCandidates();
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
                // this._findUniques();
                // this._findPairs();
                this._removeCheck();
                this._eventAggregator.publish('thinkingProgress', { progress: this._doChecks });
            }
        }, 100);
    }

}