export type Callback = ((...args: any[]) => Promise<void>) | ((...args: any[]) => void) | undefined;
export interface ITransition<STATE, EVENT, CALLBACK> {
    fromState: STATE;
    event: EVENT;
    toState: STATE;
    cb: CALLBACK;
}
export declare function t<STATE, EVENT, CALLBACK>(fromState: STATE, event: EVENT, toState: STATE, cb?: CALLBACK): ITransition<STATE, EVENT, CALLBACK>;
type ILogger = Partial<typeof console> & {
    error(...data: unknown[]): void;
};
export declare class StateMachine<STATE extends string | number | symbol, EVENT extends string | number | symbol, CALLBACK extends Record<EVENT, Callback> = Record<EVENT, Callback>> {
    #private;
    protected transitions: ITransition<STATE, EVENT, CALLBACK[EVENT]>[];
    protected readonly logger: ILogger;
    protected _current: STATE;
    constructor(_init: STATE, transitions?: ITransition<STATE, EVENT, CALLBACK[EVENT]>[], logger?: ILogger);
    addTransitions(transitions: ITransition<STATE, EVENT, CALLBACK[EVENT]>[]): void;
    getState(): STATE;
    can(event: EVENT): boolean;
    getNextState(event: EVENT): STATE | undefined;
    isFinal(): boolean;
    dispatch<E extends EVENT>(event: E, ...args: Parameters<CALLBACK[E]>): Promise<void>;
}
export {};
