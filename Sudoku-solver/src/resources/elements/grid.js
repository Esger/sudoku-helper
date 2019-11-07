import { BindingSignaler } from 'aurelia-templating-resources';
import { inject } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';

@inject(BindingSignaler, EventAggregator)
export class GridCustomElement {

    constructor(bindingSignaler, eventAggregator) {
        this._bindingSignaler = bindingSignaler;
        this._eventAggregator = eventAggregator;
        this._candidates = [0, 1, 2, 3, 4, 5, 6, 7, 8];
        this._blocks = [0, 1, 2];
        this._doChecks = 0;
        this._processHandleId = undefined;
        this._tuples = [[], [], [], [], []];
        this._setupMode = true;
    }

    attached() {
        this._resetGrid();
        this._fillTuples();
        this._processGrid();
        this._addListeners();
    }

    detached() {
        this._resetGridListener.dispose();
        this._toggleSetupModeListener.dispose();
        clearInterval(this._resetGridListener);
    }

    _addListeners() {
        this._resetGridListener = this._eventAggregator.subscribe('resetGrid', _ => {
            this._resetGrid();
        });
        this._toggleSetupModeListener = this._eventAggregator.subscribe('toggleSetupMode', data => {
            this._setupMode = data.setupMode;
        });
    }

    _resetGrid() {
        clearInterval(this._resetGridListener);
        this.grid = [];
        for (let y = 0; y < 9; y++) {
            const row = [];
            for (let x = 0; x < 9; x++) {
                row.push({
                    candidates: this._candidates.slice(),
                    value: -1
                });
            }
            this.grid.push(row);
        }
        this._processGrid();
    }

    _fillTuples() {
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
                    }
                }
            }
        });
        console.table(this._tuples[3]);
        console.table(this._tuples[4]);
    }

    _addCheck() {
        this._doChecks++;
    }

    _removeCheck() {
        this._doChecks--;
    }

    _applyGridvalue(row, col, value) {
        if (value >= 0) {
            this.grid[row][col].value = value;
        }
        this._sweepSelf(row, col);
        this._sweepRow(row, value);
        this._sweepCol(col, value);
        this._sweepBlock(row, col, value);
        this._signalBindings();
    }

    _signalBindings() {
        this._bindingSignaler.signal('updateCandidates');
    }

    _removeCandidate(cell, value) {
        if (cell.candidates[value] >= 0) {
            cell.candidates[value] = -1;
            this._signalBindings();
            this._addCheck();
        }
    }

    _sweepSelf(row, col) {
        this.grid[row][col].candidates.forEach((p, i, candidates) => {
            candidates[i] = -1;
        });
    }

    _sweepRow(row, value, omitCols) {
        this.grid[row].forEach((cell, index) => {
            if (omitCols) {
                if (omitCols.indexOf(index) == -1) {
                    this._removeCandidate(cell, value);
                }
            } else {
                this._removeCandidate(cell, value);
            }
        });
    }

    _sweepCol(col, value, omitRows) {
        this.grid.forEach((row, rowIndex) => {
            const cell = row[col];
            if (omitRows) {
                if (omitRows.indexOf(rowIndex) == -1) {
                    this._removeCandidate(cell, value);
                }
            } else {
                this._removeCandidate(cell, value);
            }
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

    _sweepBlock(row, col, value, omit) {
        let blockY = Math.floor(row / 3);
        let blockX = Math.floor(col / 3);
        let startY = blockY * 3;
        let endY = startY + 2;
        let startX = blockX * 3;
        let endX = startX + 2;
        for (let rowIndex = startY; rowIndex <= endY; rowIndex++) {
            for (let colIndex = startX; colIndex <= endX; colIndex++) {
                if (omit) {
                    if (!this._arrayContainsArray(omit, [rowIndex, colIndex])) {
                        this._removeCandidate(this.grid[rowIndex][colIndex], value);
                    }
                } else {
                    this._removeCandidate(this.grid[rowIndex][colIndex], value);
                }
            }
        }
    }

    _findSingleCandidates() {
        this._candidates.forEach(row => {
            this._candidates.forEach(col => {
                let candidatesCount = 0;
                let candidates = this.grid[row][col].candidates;
                let singlePossibility;
                candidates.forEach(candidate => {
                    if (candidate >= 0) {
                        singlePossibility = candidate;
                        candidatesCount++;
                    }
                });
                if (candidatesCount == 1) {
                    this._applyGridvalue(row, col, singlePossibility);
                }
            });
        });
    }

    _findUniqueRowCandidates() {
        this._candidates.forEach(row => {
            this._candidates.forEach(value => {
                let candidateCount = 0;
                let theCol;
                this._candidates.forEach(col => {
                    if (this.grid[row][col].candidates[value] >= 0) {
                        candidateCount++;
                        theCol = col;
                    }
                });
                if (candidateCount == 1) {
                    this._applyGridvalue(row, theCol, value);
                }
            });
        });
    }

    _findUniqueColCandidates() {
        this._candidates.forEach(col => {
            this._candidates.forEach(value => {
                let candidateCount = 0;
                let theRow;
                this._candidates.forEach(row => {
                    if (this.grid[row][col].candidates[value] >= 0) {
                        candidateCount++;
                        theRow = row;
                    }
                });
                if (candidateCount == 1) {
                    this._applyGridvalue(theRow, col, value);
                }
            });
        });
    }

    _findUniqueBlockCandidates() {
        this._blocks.forEach(yBlock => {
            this._blocks.forEach(xBlock => {
                this._candidates.forEach(value => {
                    let candidateCount = 0;
                    let theRow, theCol;
                    this._blocks.forEach(row => {
                        this._blocks.forEach(col => {
                            let thisRow = yBlock * 3 + row;
                            let thisCol = xBlock * 3 + col;
                            if (this.grid[thisRow][thisCol].candidates[value] >= 0) {
                                candidateCount++;
                                theRow = thisRow;
                                theCol = thisCol;
                            }
                        });
                    });
                    if (candidateCount == 1) {
                        this._applyGridvalue(theRow, theCol, value);
                    }
                });
            });
        });
    }

    _findUniques() {
        this._findSingleCandidates();
        this._findUniqueRowCandidates();
        this._findUniqueColCandidates();
        this._findUniqueBlockCandidates();
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
        [2, 3, 4].forEach(value => {
            this.findRowTuples(value);
            this.findColTuples(value);
            this.findBlockTuples(value);
        });
    }

    _processGrid() {
        this._processHandleId = setInterval(() => {
            while (this._doChecks > 0) {
                console.log(this._doChecks);
                this._findUniques();
                this._findPairs();
                this._removeCheck();
            }
        }, 500);
    }

    selectCandidate(row, col, value) {
        if (this._setupMode) {
            this._applyGridvalue(row, col, value);
        } else {
            this._removeCandidate(this.grid[row][col], value);
            this._signalBindings();
        }
    }

}