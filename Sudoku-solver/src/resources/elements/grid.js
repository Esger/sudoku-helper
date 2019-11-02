import { BindingSignaler } from 'aurelia-templating-resources';
import { inject } from 'aurelia-framework';

@inject(BindingSignaler)
export class GridCustomElement {

    constructor(bindingSignaler) {
        this._bindingSignaler = bindingSignaler;
        this.grid = [];
        this._possibles = [0, 1, 2, 3, 4, 5, 6, 7, 8];
    }

    attached() {
        for (let y = 0; y < 9; y++) {
            const row = [];
            for (let x = 0; x < 9; x++) {
                row.push({ possibles: this._possibles.slice(), value: -1 });
            }
            this.grid.push(row);
        }
    }

    _applyGridvalue(row, cell, value) {
        if (value >= 0) {
            this.grid[row][cell].value = value;
        }
    }

    _sweepRow(row, value) {
        this.grid[row].forEach(cell => {
            cell.possibles[value] = -1;
        });
    }

    _sweepCol(col, value) {
        for (let row = 0; row < this.grid.length; row++) {
            this.grid[row][col].possibles[value] = -1;
        }
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

    selectNumber(row, cell, value) {

        this._applyGridvalue(row, cell, value);

        this._sweepRow(row, value);
        this._sweepCol(cell, value);
        this._sweepBlock(row, cell, value);

        this._bindingSignaler.signal('updatePossibles');
        // console.log(...arguments);

    }
}