import { BindingSignaler } from 'aurelia-templating-resources';
import { inject } from 'aurelia-framework';

@inject(BindingSignaler)
export class GridCustomElement {

    constructor(bindingSignaler) {
        this._bindingSignaler = bindingSignaler;
        this._possibles = [0, 1, 2, 3, 4, 5, 6, 7, 8];
        this._pairs = [];
        this._doChecks = 0;
        this._processHandleId = undefined;
        this.grid = [];
    }

    attached() {
        for (let y = 0; y < 9; y++) {
            const row = [];
            for (let x = 0; x < 9; x++) {
                row.push({ possibles: this._possibles.slice(), value: -1 });
            }
            this.grid.push(row);
        }
        this._possibles.forEach(val1 => {
            for (let i = val1 + 1; i < this._possibles.length; i++) {
                let val2 = this._possibles[i];
                this._pairs.push([val1, val2]);
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

    _applyGridvalue(row, col, value) {
        if (value >= 0) {
            this.grid[row][col].value = value;
        }
        this._sweepGrid(row, col, value);
        this._addCheck();
        this._bindingSignaler.signal('updatePossibles');
    }

    _sweepSelf(row, col) {
        this.grid[row][col].possibles.forEach((p, i, possibles) => {
            possibles[i] = -1;
        });
    }

    _sweepRow(row, value, omitCols) {
        this.grid[row].forEach((cell, index) => {
            if (omitCols) {
                if (omitCols.indexOf(index) == -1) {
                    cell.possibles[value] = -1;
                }
            } else {
                cell.possibles[value] = -1;
            }
        });
    }

    _sweepCol(col, value, omitRows) {
        this.grid.forEach((row, rowIndex) => {
            const cell = row[col];
            if (omitRows) {
                if (omitRows.indexOf(rowIndex) == -1) {
                    cell.possibles[value] = -1;
                }
            } else {
                cell.possibles[value] = -1;
            }
        });
    }

    _sweepBlock(row, col, value) {
        let blockY = Math.floor(row / 3);
        let blockX = Math.floor(col / 3);
        let startY = blockY * 3;
        let endY = startY + 2;
        let startX = blockX * 3;
        let endX = startX + 2;
        for (let row = startY; row <= endY; row++) {
            for (let col = startX; col <= endX; col++) {
                this.grid[row][col].possibles[value] = -1;
            }
        }
    }

    _sweepGrid(row, col, value) {
        this._sweepSelf(row, col);
        this._sweepRow(row, value);
        this._sweepCol(col, value);
        this._sweepBlock(row, col, value);
    }

    _findSinglePossibilities() {
        this._possibles.forEach(row => {
            this._possibles.forEach(col => {
                let possiblesCount = 0;
                let possibles = this.grid[row][col].possibles;
                let singlePossibility;
                possibles.forEach(possible => {
                    if (possible >= 0) {
                        singlePossibility = possible;
                        possiblesCount++;
                    }
                });
                if (possiblesCount == 1) {
                    this._applyGridvalue(row, col, singlePossibility);
                }
            });
        });
    }

    _findUniqueRowPossibilities() {
        this._possibles.forEach(row => {
            this._possibles.forEach(value => {
                let possibleCount = 0;
                let theCol;
                this._possibles.forEach(col => {
                    if (this.grid[row][col].possibles[value] >= 0) {
                        possibleCount++;
                        theCol = col;
                    }
                });
                if (possibleCount == 1) {
                    this._applyGridvalue(row, theCol, value);
                }
            });
        });
    }

    _findUniqueColPossibilities() {
        this._possibles.forEach(col => {
            this._possibles.forEach(value => {
                let possibleCount = 0;
                let theRow;
                this._possibles.forEach(row => {
                    if (this.grid[row][col].possibles[value] >= 0) {
                        possibleCount++;
                        theRow = row;
                    }
                });
                if (possibleCount == 1) {
                    this._applyGridvalue(theRow, col, value);
                }
            });
        });
    }

    _findUniqueBlockPossibilities() {
        let blocks = [0, 1, 2];
        blocks.forEach(yBlock => {
            blocks.forEach(xBlock => {
                this._possibles.forEach(value => {
                    let possibleCount = 0;
                    let theRow, theCol;
                    blocks.forEach(row => {
                        blocks.forEach(col => {
                            let thisRow = yBlock * 3 + row;
                            let thisCol = xBlock * 3 + col;
                            if (this.grid[thisRow][thisCol].possibles[value] >= 0) {
                                possibleCount++;
                                theRow = thisRow;
                                theCol = thisCol;
                            }
                        });
                    });
                    if (possibleCount == 1) {
                        this._applyGridvalue(theRow, theCol, value);
                    }
                });
            });
        });
    }

    _findUniquePossibilities() {
        this._findUniqueRowPossibilities();
        this._findUniqueColPossibilities();
        this._findUniqueBlockPossibilities();
    }

    _cellHasOnlyPosibilities(row, col, set) {
        const cell = this.grid[row][col];
        let result;
        if (cell.value < 0) {
            result = cell.possibles.every(possible => {
                return set.indexOf(possible) >= 0 || possible < 0;
            });
        } else {
            result = false;
        }
        return result;
    }

    findRowPairs() {
        this._possibles.forEach(row => {
            this._pairs.forEach(pair => {
                let pairCount = 0;
                let colsWithPairs = [];
                this._possibles.forEach(col => {
                    if (this._cellHasOnlyPosibilities(row, col, pair)) {
                        pairCount++;
                        colsWithPairs.push(col);
                    }
                });
                if (pairCount == 2) {
                    pair.forEach(value => {
                        this._sweepRow(row, value, colsWithPairs);
                        this._doBasicChecks();
                    });
                }
            });
        });
    }

    findColPairs() {
        this._possibles.forEach(col => {
            this._pairs.forEach(pair => {
                let pairCount = 0;
                let rowsWithPairs = [];
                this._possibles.forEach(row => {
                    if (this._cellHasOnlyPosibilities(row, col, pair)) {
                        pairCount++;
                        rowsWithPairs.push(row);
                    }
                });
                if (pairCount == 2) {
                    pair.forEach(value => {
                        this._sweepCol(col, value, rowsWithPairs);
                        this._doBasicChecks();
                    });
                }
            });
        });
    }

    findBlockPairs() { }

    _findPairs() {
        this.findRowPairs();
        this.findColPairs();
        this.findBlockPairs();
    }

    _doBasicChecks() {
        this._findSinglePossibilities();
        this._findUniquePossibilities();
    }

    _processGrid() {
        this._processHandleId = setInterval(() => {
            while (this._doChecks > 0) {
                this._doBasicChecks();
                this._findPairs();
                this._removeCheck();
            }
        }, 500);
    }

    selectNumber(row, col, value) {
        this._applyGridvalue(row, col, value);
    }
}