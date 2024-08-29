"use strict";
/*
 * StateMachine.ts
 * TypeScript finite state machine class with async transformations using promises.
 */
var __classPrivateFieldGet = (this && this.__classPrivateFieldGet) || function (receiver, state, kind, f) {
    if (kind === "a" && !f) throw new TypeError("Private accessor was defined without a getter");
    if (typeof state === "function" ? receiver !== state || !f : !state.has(receiver)) throw new TypeError("Cannot read private member from an object whose class did not declare it");
    return kind === "m" ? f : kind === "a" ? f.call(receiver) : f ? f.value : state.get(receiver);
};
var _StateMachine_instances, _StateMachine_formatNoTransitionError;
Object.defineProperty(exports, "__esModule", { value: true });
exports.StateMachine = exports.t = void 0;
function t(fromState, event, toState, cb) {
    return { fromState, event, toState, cb };
}
exports.t = t;
class StateMachine {
    // initialize the state-machine
    constructor(_init, transitions = [], logger = console) {
        _StateMachine_instances.add(this);
        this.transitions = transitions;
        this.logger = logger;
        this._current = _init;
    }
    addTransitions(transitions) {
        // bind any unbound method
        transitions.forEach((_tran) => {
            const tran = Object.create(_tran);
            if (tran.cb && !tran.cb.name?.startsWith("bound ")) {
                tran.cb = tran.cb.bind(this);
            }
            this.transitions.push(tran);
        });
    }
    getState() { return this._current; }
    can(event) {
        return this.transitions.some((trans) => (trans.fromState === this._current && trans.event === event));
    }
    getNextState(event) {
        const transition = this.transitions.find((tran) => tran.fromState === this._current && tran.event === event);
        return transition?.toState;
    }
    isFinal() {
        // search for a transition that starts from current state.
        // if none is found it's a terminal state.
        return this.transitions.every((trans) => (trans.fromState !== this._current));
    }
    // post event async
    async dispatch(event, ...args) {
        return new Promise((resolve, reject) => {
            // delay execution to make it async
            setTimeout((me) => {
                // find transition
                const found = this.transitions.some((tran) => {
                    if (tran.fromState === me._current && tran.event === event) {
                        me._current = tran.toState;
                        if (tran.cb) {
                            try {
                                const p = tran.cb(...args);
                                if (p instanceof Promise) {
                                    p.then(resolve).catch((e) => reject(e));
                                }
                                else {
                                    resolve();
                                }
                            }
                            catch (e) {
                                this.logger.error("Exception caught in callback", e);
                                reject(e);
                            }
                        }
                        else {
                            resolve();
                        }
                        return true;
                    }
                    return false;
                });
                // no such transition
                if (!found) {
                    const errorMessage = __classPrivateFieldGet(this, _StateMachine_instances, "m", _StateMachine_formatNoTransitionError).call(this, me._current, event);
                    this.logger.error(errorMessage);
                    reject(new Error(errorMessage));
                }
            }, 0, this);
        });
    }
}
exports.StateMachine = StateMachine;
_StateMachine_instances = new WeakSet(), _StateMachine_formatNoTransitionError = function _StateMachine_formatNoTransitionError(fromState, event) {
    return `No transition: from ${String(fromState)} event ${String(event)}`;
};
//# sourceMappingURL=stateMachine.js.map