// Copyright 2007 Google Inc.
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

Ext.ns("SymPy");

SymPy.Keys = {
    BACKSPACE: 8,  DEL:       49,
    TAB:       9,  SPACE:     32,
    ENTER:     13, ESC:       27,
    PAGE_UP:   33, PAGE_DOWN: 34,
    END:       35, HOME:      36,
    LEFT:      37, UP:        38,
    RIGHT:     39, DOWN:      40,
    A: 65, B: 66, C: 67, D: 68,
    E: 69, F: 70, G: 71, H: 72,
    I: 73, J: 74, K: 75, L: 76,
    M: 77, N: 78, O: 79, P: 80,
    Q: 81, R: 82, S: 83, T: 84,
    U: 85, V: 86, W: 87, X: 88,
    Y: 89, Z: 90,
    ZERO:  48, ONE:   49,
    TWO:   50, THREE: 51,
    FOUR:  52, FIVE:  53,
    SIX:   54, SEVEN: 55,
    EIGHT: 56, NINE:  57,
    ';':  59, ':':  59,
    '=':  61, '+':  61,
    '-': 109, '_': 109,
    ',': 188, '<': 188,
    '.': 190, '>': 190,
    '/': 191, '?': 191,
    '`': 192, '~': 192,
    '[': 219, '{': 219,
    ']': 221, '}': 221,
    "'": 222, '"': 222
};

SymPy.escapeHTML = function(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
};

SymPy.unescapeHTML = function(str) {
    return str.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>');
};

SymPy.Shell = Ext.extend(Ext.util.Observable, {
    history: [''],
    historyCursor: 0,
    previousValue: "",

    constructor: function(config) {
        config = config || {};
        SymPy.Shell.superclass.constructor.call(this, config);
    },

    render: function(el) {
        el = Ext.get(el) || Ext.getBody();

        this.outputEl = Ext.DomHelper.append(el, {
            tag: 'div',
            cls: 'output',
            children: {
                tag: 'div',
                html: Ext.get('banner').dom.innerHTML
            }
        }, true);

        this.caretEl = Ext.DomHelper.append(el, {
            tag: 'textarea',
            cls: 'caret',
            rows: '4',
            readonly: 'readonly',
            html: '&gt;&gt;&gt;'
        }, true);

        this.promptEl = Ext.DomHelper.append(el, {
            tag: 'textarea',
            cls: 'prompt',
            rows: '4'
        }, true);

        this.toolbarEl = Ext.DomHelper.append(el, {
            tag: 'p',
            cls: 'toolbar',
            children: [{
                tag: 'button',
                html: 'Evaluate'
            }, {
                tag: 'button',
                html: 'Clear'
            }, {
                tag: 'span',
                cls: 'separator',
                html: '|'
            }, {
                tag: 'select',
                children: [{
                    tag: 'option',
                    value: 'srepr',
                    html: 'Repr'
                }, {
                    tag: 'option',
                    value: 'sstr',
                    html: 'Str'
                }, {
                    tag: 'option',
                    value: 'pretty',
                    selected: 'selected',
                    html: 'ASCII'
                }, {
                    tag: 'option',
                    value: 'upretty',
                    html: 'Unicode'
                }, {
                    tag: 'option',
                    value: 'latex',
                    html: 'LaTeX'
                }]
            }, {
                tag: 'span',
                cls: 'separator',
                html: '|'
            }, {
                tag: 'select',
                children: [{
                    tag: 'option',
                    value: 'enter',
                    html: 'Enter'
                }, {
                    tag: 'option',
                    value: 'shift-enter',
                    selected: 'selected',
                    html: 'Shift-Enter'
                }]
            }, {
                tag: 'span',
                html: 'submits'
            }, {
                tag: 'span',
                cls: 'separator',
                html: '|'
            }, {
                tag: 'span',
                html: 'Ctrl-Up/Down for history'
            }]
        }, true);

        this.evaluateEl = this.toolbarEl.down('button:nth(1)');
        this.clearEl = this.toolbarEl.down('button:nth(2)');

        this.printerEl = this.toolbarEl.down('select:nth(1)');
        this.submitEl = this.toolbarEl.down('select:nth(2)');

        this.caretEl.on("focus", function(event) {
            this.promptEl.focus();
        }, this);

        var keyEvent = Ext.isOpera ? "keypress" : "keydown";

        this.promptEl.on(keyEvent, function(event) {
            this.handleKey(event);
        }, this);

        this.evaluateEl.on("click", function(event) {
            this.evaluate();
        }, this);

        this.clearEl.on("click", function(event) {
            this.clear();
        }, this);

        this.promptEl.focus();

        var task = {
            run: this.updatePrompt,
            scope: this,
            interval: 100
        }

        var runner = new Ext.util.TaskRunner();
        runner.start(task);
    },

    setValue: function(value) {
        this.promptEl.dom.value = value;
    },

    clearValue: function() {
        this.setValue("");
    },

    getValue: function() {
        return this.promptEl.dom.value;
    },

    isEmpty: function() {
        return this.getValue().length == 0;
    },

    handleKey: function(event) {
        if (this.historyCursor == this.history.length-1) {
            this.history[this.historyCursor] = this.getValue();
        }

        function prevInHistory(event) {
            event.stopEvent();

            if (this.historyCursor > 0) {
                this.setValue(this.history[--this.historyCursor]);
            }

            return false;
        }

        function nextInHistory(event) {
            event.stopEvent();

            if (this.historyCursor < this.history.length - 1) {
                this.setValue(this.history[++this.historyCursor]);
            }

            return false;
        }

        switch (event.getKey()) {
        case SymPy.Keys.UP:
            if (event.ctrlKey && !event.altKey) {
                return prevInHistory.call(this, event);
            }
            break;
        case SymPy.Keys.DOWN:
            if (event.ctrlKey && !event.altKey) {
                return nextInHistory.call(this, event);
            }
            break;
        case SymPy.Keys.K:
            if (event.altKey && !event.ctrlKey) {
                return prevInHistory.call(this, event);
            }
            break;
        case SymPy.Keys.J:
            if (event.altKey && !event.ctrlKey) {
                return nextInHistory.call(this, event);
            }
            break;
        case SymPy.Keys.ENTER:
            var shiftEnter = (this.submitEl.getValue() == "shift-enter");

            if (event.shiftKey == shiftEnter) {
                event.stopEvent();
                this.evaluate();
                return false;
            }

            break;
        case SymPy.Keys.E:
            if (event.altKey && (!event.ctrlKey || event.shiftKey)) {
                event.stopEvent();
                this.evaluate();
                return false;
            }

            break;
        }

        this.historyCursor = this.history.length - 1;
        this.history[this.historyCursor] = this.getValue();

        return true;
    },

    updatePrompt: function() {
        var value = this.getValue();

        if (this.previousValue != value) {
            var prompt = ">>>",
                lines = value.split('\n');

            var i = 1,
                n = lines.length;

            for (; i < n; i++) {
                prompt += "\n...";
            }

            this.caretEl.dom.value = prompt;

            var rows = Math.max(4, n);

            this.caretEl.dom.setAttribute('rows', rows);
            this.promptEl.dom.setAttribute('rows', rows);

            this.previousValue = value;
        }
    },

    prefixStatement: function() {
        var lines = this.getValue().split('\n');

        lines[0] = ">>> " + lines[0];

        var i = 1,
            n = lines.length;

        for (; i < n; i++) {
            lines[i] = "... " + lines[i];
        }

        return lines.join("\n");
    },

    scrollToBottom: function() {
        this.outputEl.dom.scrollTop = this.outputEl.dom.scrollHeight;
    },

    evaluate: function() {
        this.promptEl.addClass('processing');

        var data = {
            statement: this.promptEl.getValue(),
            printer: this.printerEl.getValue(),
            session: this.session || null
        };

        Ext.Ajax.request({
            method: 'POST',
            url: '/evaluate',
            jsonData: Ext.encode(data),
            success: function(response) {
                this.done(response);
            },
            scope: this
        });

        return false;
    },

    done: function(response) {
        var value = '\n' + this.prefixStatement();

        this.clearValue();
        this.updatePrompt();

        this.history.push('');
        this.historyCursor = this.history.length - 1;

        Ext.DomHelper.append(this.outputEl, {
            tag: 'div',
            cls: 'item',
            html: SymPy.escapeHTML(value)
        });

        this.scrollToBottom();

        var response = Ext.decode(response.responseText);
        this.session = response.session;

        var result = response.output.replace(/^(\s*\n)+/, '');

        if (result.length) {
            var element = Ext.DomHelper.append(this.outputEl, {
                tag: 'div',
                cls: 'item',
                html: SymPy.escapeHTML(result)
            }, false);

            this.scrollToBottom();

            if (this.printerEl.getValue() == 'latex') {
                MathJax.Hub.Queue(['Typeset', MathJax.Hub, element],
                                  [this.scrollToBottom.createDelegate(this)]);
            }
        }

        this.promptEl.removeClass('processing');
    },

    clear: function() {
        var elements = this.outputEl.query('div.item');

        Ext.each(elements, function(elem) {
            Ext.get(elem).remove();
        });

        this.clearValue();
        this.historyCursor = this.history.length-1;
    }
});
