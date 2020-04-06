export declare class EventEmitter<Events> {
  on: <E extends keyof Events>(event: E, callback: (E, arg: Events[E]) => void) => void; 
  emit: <E extends keyof Events>(event: E, arg?: Events[E], ...args: any[]) => void;
}

export declare const createLogger: any;
export declare const logColor: any;