import { BindingSignaler } from 'aurelia-templating-resources';
import { inject } from 'aurelia-framework';

@inject(BindingSignaler)
export class GridCustomElement {

    constructor(bindingSignaler) {
        this._bindingSignaler = bindingSignaler;
        this._candidates = [0, 1, 2, 3, 4, 5, 6, 7, 8];
        this._blocks = [0, 1, 2];
        this._tuples = [[], [], [], [], []];
        this._doChecks = 0;
        this._processHandleId = undefined;
        this.grid = [];
    }

    attached() {
        for (let y = 0; y < 9; y++) {
            const row = [];
            for (let x = 0; x < 9; x++) {
                row.push({
                    candidates: this._candidates.slice(),
                    tuplesFound: {
                        2: false,
                        3: false
                    },
                    value: -1
                });
            }
            this.grid.push(row);
        }
        this._candidates.forEach(val1 => {
            for (let i = val1 + 1; i < this._candidates.length; i++) {
                let val2 = this._candidates[i];
                this._tuples[2].push([val1, val2]);
            }
        });
        this._processGrid();
    }

    _addCheck() {
        this._doChecks++;
    }

    _removeCheck() {
        this._doChecks--;
    }

    _resetTuplesFound() {
        this.grid.forEach(row => {
            row.forEach(cell => {
                cell.tuplesFound[2] = false;
            });
        });
    }

    _applyGridvalue(row, col, value) {
        if (value >= 0) {
            this.grid[row][col].value = value;
        }
        this._sweepSelf(row, col);
        this._sweepRow(row, value);
        this._sweepCol(col, value);
        this._sweepBlock(row, col, value);
        this._bindingSignaler.signal('updateCandidates');
        this._resetTuplesFound();
    }

    _removeCandidate(cell, value) {
        if (cell.candidates[value] >= 0) {
            cell.candidates[value] = -1;
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
                    if (this._arrayContainsArray(omit, [rowIndex, colIndex])) {
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

    _cellHasOnlyCandidates(row, col, set) {
        const cell = this.grid[row][col];
        const tuplesFoundIndex = set.length;
        let result;
        if (cell.value < 0 && !cell.tuplesFound[tuplesFoundIndex]) {
            result = cell.candidates.every(candidate => {
                return set.indexOf(candidate) >= 0 || candidate < 0;
            });
        } else {
            result = false;
        }
        return result;
    }

    findRowTuples(n) {
        let foundSome = false;
        this._candidates.forEach(row => {
            this._tuples[n].forEach(tuple => {
                let pairCount = 0;
                let colsWithPairs = [];
                this._candidates.forEach(col => {
                    if (this._cellHasOnlyCandidates(row, col, tuple)) {
                        pairCount++;
                        colsWithPairs.push(col);
                    }
                });
                if (pairCount == 2) {
                    foundSome = true;
                    colsWithPairs.forEach(col => {
                        this.grid[row][col].tuplesFound[2] = true;
                    });
                    tuple.forEach(value => {
                        this._sweepRow(row, value, colsWithPairs);
                    });
                }
            });
        });
        return foundSome;
    }

    findColTuples(n) {
        let foundSome = false;
        this._candidates.forEach(col => {
            this._tuples[n].forEach(tuple => {
                let pairCount = 0;
                let rowsWithPairs = [];
                this._candidates.forEach(row => {
                    if (this._cellHasOnlyCandidates(row, col, tuple)) {
                        pairCount++;
                        rowsWithPairs.push(row);
                    }
                });
                if (pairCount == 2) {
                    foundSome = true;
                    rowsWithPairs.forEach(row => {
                        this.grid[row][col].tuplesFound[2] = true;
                    });
                    tuple.forEach(value => {
                        this._sweepCol(col, value, rowsWithPairs);
                    });
                }
            });
        });
        return foundSome;
    }

    findBlockTuples(n) {
        let foundSome = false;
        this._blocks.forEach(blockY => {
            this._blocks.forEach(blockX => {
                this._tuples[n].forEach(tuple => {
                    let pairCount = 0;
                    let cellsWithPairs = [];
                    let theRow, theCol;
                    this._blocks.forEach(row => {
                        theRow = blockY * 3 + row;
                        this._blocks.forEach(col => {
                            theCol = blockX * 3 + col;
                            if (this._cellHasOnlyCandidates(theRow, theCol, tuple)) {
                                pairCount++;
                                cellsWithPairs.push([theRow, theCol]);
                            }
                        });
                    });
                    if (pairCount == 2) {
                        foundSome = true;
                        cellsWithPairs.forEach(cell => {
                            this.grid[cell[0]][cell[1]].tuplesFound[2] = true;
                        });
                        tuple.forEach(value => {
                            this._sweepBlock(theRow, theCol, value, cellsWithPairs);
                        });
                    }
                });
            });
        });
        return foundSome;
    }

    _findPairs() {
        let foundSome =
            this.findRowTuples(2) ||
            this.findColTuples(2) ||
            this.findBlockTuples(2);
        if (foundSome) this._addCheck();
    }

    _processGrid() {
        this._processHandleId = setInterval(() => {
            while (this._doChecks > 0) {
                this._findUniques();
                this._findPairs();
                this._removeCheck();
            }
        }, 500);
    }

    selectNumber(row, col, value) {
        this._applyGridvalue(row, col, value);
    }
}