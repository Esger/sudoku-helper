import { BindingSignaler } from 'aurelia-templating-resources';
import { EventAggregator } from 'aurelia-event-aggregator';
import { inject, bindable } from 'aurelia-framework';
import { GridService } from 'resources/services/grid-service';

@inject(BindingSignaler, EventAggregator, GridService)
export class CellCustomElement {

    @bindable row
    @bindable col
    constructor(bindingSignaler, eventAggregator, gridService) {
        this._bindingSignaler = bindingSignaler;
        this._eventAggregator = eventAggregator;
        this._candidatesService = gridService;
        this._setupMode = true;
        this._reset();
    }

    attached() {

        this.props = {
            value: this.value,
            row: this.row,
            col: this.col,
            rowBlock: this._index2Block(this.row),
            colBlock: this._index2Block(this.col)
        };

        this._registerCell();

        this._resetListener = this._eventAggregator.subscribe('resetGrid', _ => {
            this._reset();
        });

        this._toggleSetupModeSubscriber = this._eventAggregator.subscribe('toggleSetupMode', data => {
            this._setupMode = data.setupMode;
        });

        this._sweepselfSubscriber = this._eventAggregator.subscribe('setCellValue', cell => {
            if (cell.props.row == this.row && cell.props.col == this.col) {
                this._applyGridvalue(cell.props.newValue);
            }
        });

        this._cellValueSetSubscriber = this._eventAggregator.subscribe('wipeRowColBlock', cell => {
            if (cell.props.row == this.row ||
                cell.props.col == this.col ||
                this._inThisBlock(cell.props.row, cell.props.col)) {
                this._removeCandidate(cell.props.value);
            }
        });
    }

    detached() {
        this._resetListener.dispose();
        this._toggleSetupModeSubscriber.dispose();
        this._sweepselfSubscriber.dispose();
        this._cellValueSetSubscriber.dispose();
    }

    selectCandidate(value) {
        if (this._setupMode) {
            this._applyGridvalue(value);
        } else {
            this._removeCandidate(value);
        }
    }

    _reset() {
        this.candidates = [0, 1, 2, 3, 4, 5, 6, 7, 8];
        this.value = -1;
        this._signalBindings();
    }

    _getCell() {
        return {
            props: this.props,
            candidates: this.candidates
        };
    }

    _registerCell() {
        this._candidatesService.registerCell(this._getCell());
    }

    _signalBindings() {
        this._bindingSignaler.signal('updateCandidates');
    }

    _addCheck() {
        this._eventAggregator.publish('addCheck');
    }

    _index2Block(index) {
        return Math.floor(index / 3);
    }

    _inThisBlock(row, col) {
        return this._index2Block(row) == this.props.rowBlock &&
            this._index2Block(col) == this.props.colBlock;
    }

    _removeCandidate(value) {
        if (this.candidates[value] >= 0) {
            this.candidates[value] = -1;
            this._eventAggregator.publish('candidateRemoved');
            this._addCheck();
            this._signalBindings();
            this._singleCandidateCheck();
        }
    }

    _applyGridvalue(value) {
        if (this.value < 0) {
            this.candidates.forEach((candidate, i, candidates) => {
                candidates[i] = -1;
            });
            this.value = value;
            this.props.value = value;
            this._addCheck();
            this._eventAggregator.publish('wipeRowColBlock', this._getCell());
        }
    }

    _singleCandidateCheck() {
        let candidates = this.candidates.filter(candidate => {
            return candidate >= 0;
        });
        if (candidates.length == 1) {
            this._applyGridvalue(candidates[0]);
        }
    }

}