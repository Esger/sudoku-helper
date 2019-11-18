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
        this.grid = this._candidates.map(row => this._candidates);
    }

    attached() {
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

    _findTuples() {
        [2, 3, 4, 5].forEach(size => {
            let tuples = this._gridService.findTuples('rows', size);
            tuples.forEach(area => {
                let omitIndices = area.map(tuple => tuple.cell.props.col);
                // area.forEach(tuple => {
                let tuple = area[0];
                tuple.members.forEach(member => {
                    let data = {
                        col: tuple.cell.props.col,
                        row: tuple.cell.props.row,
                        omit: omitIndices,
                        value: member
                    };
                    this._eventAggregator.publish('sweepRow', data);
                });
                // });
            });

            // this.findColTuples(value);
            // this.findBlockTuples(value);
        });
    }

    _processGrid() {
        this._processHandlgsrtyregcfgrceId = setInterval(() => {
            if (this._doChecks > 0) {
                this._findUniques();
                this._findTuples();
                this._removeCheck();
                this._eventAggregator.publish('thinkingProgress', { progress: this._doChecks });
                this._gridService.getStatus();
            }
        }, 200);
    }

}