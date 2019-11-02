import { BindingSignaler } from 'aurelia-templating-resources';
import { inject } from 'aurelia-framework';

@inject(BindingSignaler)
export class GridCustomElement {

    constructor(bindingSignaler) {
        this._bindingSignaler = bindingSignaler;
        this._possibles = [0, 1, 2, 3, 4, 5, 6, 7, 8];
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

    _sweepRow(row, value) {
        this.grid[row].forEach(cell => {
            cell.possibles[value] = -1;
        });
    }

    _sweepCol(col, value) {
        this._possibles.forEach(rowIndex => {
            this.grid[rowIndex][col].possibles[value] = -1;
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

    _processGrid() {
        this._processHandleId = setInterval(() => {
            if (this._doChecks > 0) {
                this._findSinglePossibilities();
                this._removeCheck();
            }
        }, 1000);
    }

    selectNumber(row, col, value) {

        this._applyGridvalue(row, col, value);

        // console.log(...arguments);

    }
}