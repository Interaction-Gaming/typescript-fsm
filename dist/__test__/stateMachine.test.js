"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const stateMachine_1 = require("../stateMachine");
var States;
(function (States) {
    States[States["closing"] = 0] = "closing";
    States[States["closed"] = 1] = "closed";
    States[States["opening"] = 2] = "opening";
    States[States["opened"] = 3] = "opened";
    States[States["breaking"] = 4] = "breaking";
    States[States["broken"] = 5] = "broken";
    States[States["locking"] = 6] = "locking";
    States[States["locked"] = 7] = "locked";
    States[States["unlocking"] = 8] = "unlocking";
})(States || (States = {}));
var Events;
(function (Events) {
    Events[Events["open"] = 100] = "open";
    Events[Events["openComplete"] = 101] = "openComplete";
    Events[Events["close"] = 102] = "close";
    Events[Events["closeComplete"] = 103] = "closeComplete";
    Events[Events["break"] = 104] = "break";
    Events[Events["breakComplete"] = 105] = "breakComplete";
    Events[Events["lock"] = 106] = "lock";
    Events[Events["lockComplete"] = 107] = "lockComplete";
    Events[Events["unlock"] = 108] = "unlock";
    Events[Events["unlockComplete"] = 109] = "unlockComplete";
    Events[Events["unlockFailed"] = 110] = "unlockFailed";
})(Events || (Events = {}));
class Door extends stateMachine_1.StateMachine {
    // ctor
    constructor(key = 0, init = States.closed) {
        super(init);
        this._id = `Door${(Math.floor(Math.random() * 10000))}`;
        this._key = key;
        const s = States;
        const e = Events;
        /* eslint-disable no-multi-spaces */
        this.addTransitions([
            //    fromState     event              toState      callback
            (0, stateMachine_1.t)(s.closed, e.open, s.opening, this._onOpen),
            (0, stateMachine_1.t)(s.opening, e.openComplete, s.opened, this._justLog),
            (0, stateMachine_1.t)(s.opened, e.close, s.closing, this._onClose),
            (0, stateMachine_1.t)(s.closing, e.closeComplete, s.closed, this._justLog),
            (0, stateMachine_1.t)(s.opened, e.break, s.breaking, this._onBreak),
            (0, stateMachine_1.t)(s.breaking, e.breakComplete, s.broken),
            (0, stateMachine_1.t)(s.closed, e.break, s.breaking, this._onBreak),
            (0, stateMachine_1.t)(s.breaking, e.breakComplete, s.broken),
            (0, stateMachine_1.t)(s.closed, e.lock, s.locking, this._onLock),
            (0, stateMachine_1.t)(s.locking, e.lockComplete, s.locked, this._justLog),
            (0, stateMachine_1.t)(s.locked, e.unlock, s.unlocking, this._onUnlock),
            (0, stateMachine_1.t)(s.unlocking, e.unlockComplete, s.closed, this._justLog),
            (0, stateMachine_1.t)(s.unlocking, e.unlockFailed, s.locked, this._justLog),
        ]);
        /* eslint-enable no-multi-spaces */
    }
    // public methods
    async open() { return this.dispatch(Events.open); }
    async close() { return this.dispatch(Events.close); }
    async break() { return this.dispatch(Events.break); }
    async lock() { return this.dispatch(Events.lock); }
    async unlock(key) { return this.dispatch(Events.unlock, key); }
    isBroken() { return this.isFinal(); }
    isOpen() { return this.getState() === States.opened; }
    isLocked() { return this.getState() === States.locked; }
    // transition callbacks
    async _onOpen() {
        this.logger.log(`${this._id} onOpen...`);
        return this.dispatch(Events.openComplete);
    }
    async _onClose() {
        this.logger.log(`${this._id} onClose...`);
        return this.dispatch(Events.closeComplete);
    }
    async _onBreak() {
        this.logger.log(`${this._id} onBreak...`);
        return this.dispatch(Events.breakComplete);
    }
    async _onLock() {
        this.logger.log(`${this._id} onLock...`);
        return this.dispatch(Events.lockComplete);
    }
    async _onUnlock(key) {
        this.logger.log(`${this._id} onUnlock with key=${key}...`);
        if (key === this._key) {
            return this.dispatch(Events.unlockComplete);
        }
        await this.dispatch(Events.unlockFailed);
        throw new Error(`${key} failed to unlock ${this._id}`);
    }
    // sync callback
    _justLog() {
        console.log(`${this._id} ${States[this.getState()]}`);
    }
}
describe("stateMachine tests", () => {
    test("test opening a closed door", async () => {
        const door = new Door();
        expect(door.isOpen()).toBeFalsy();
        expect(door.isBroken()).toBeFalsy();
        expect(door.can(Events.open)).toBeTruthy();
        expect(door.getNextState(Events.open)).toEqual(States.opening);
        await door.open();
        expect(door.isOpen()).toBeTruthy();
    });
    test("test a failed event", (done) => {
        const door = new Door(undefined, States.opened);
        expect(door.can(Events.open)).toBeFalsy();
        expect(door.getNextState(Events.open)).toBeUndefined();
        door.open().then(() => {
            expect("should never get here 1").toBeFalsy();
        }).catch(() => {
            // we are good.
            done();
        });
    });
    test("test closing an open door", async () => {
        const door = new Door(undefined, States.opened);
        expect(door.isOpen()).toBeTruthy();
        await door.close();
        expect(door.isOpen()).toBeFalsy();
    });
    test("test breaking a door", async () => {
        const door = new Door();
        expect(door.isBroken()).toBeFalsy();
        await door.break();
        expect(door.isBroken()).toBeTruthy();
        expect(door.isOpen()).toBeFalsy();
    });
    test("broken door cannot be opened or closed", async () => {
        const door = new Door(undefined, States.broken);
        expect(door.isBroken()).toBeTruthy();
        await expect(door.open()).rejects.toThrowError(`No transition: from ${States.broken} event ${Events.open}`);
    });
    test("should throw on intermediate state", async () => {
        const door = new Door(undefined, States.opened);
        expect(door.isOpen()).toBeTruthy();
        const prms = /* don't await */ door.close();
        expect(door.isOpen()).toBeTruthy();
        await expect(door.break()).rejects.toThrowError(`No transition: from ${States.closing} event ${Events.break}`);
        await prms;
    });
    test("should throw if callback throws", async () => {
        const door = new Door(undefined, States.opened);
        let called = false;
        door.addTransitions([
            (0, stateMachine_1.t)(States.opened, Events.open, States.opening, () => { called = true; throw new Error("bad"); }),
        ]);
        expect(door.isOpen()).toBeTruthy();
        await expect(door.open()).rejects.toBeInstanceOf(Error);
        expect(called).toBeTruthy();
    });
    test("should unlock with correct key", async () => {
        const key = 12345;
        const door = new Door(key, States.locked);
        await door.unlock(key);
        expect(door.isLocked()).toBeFalsy();
    });
    test("should not unlock with incorrect key", async () => {
        const key = 12345;
        const door = new Door(key, States.locked);
        try {
            await door.unlock(key + 3);
            expect("should never get here 1").toBeFalsy();
        }
        catch {
            expect(door.isLocked()).toBeTruthy();
        }
    });
});
//# sourceMappingURL=stateMachine.test.js.map