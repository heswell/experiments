import { EventEmitter } from "./event-emitter.js";
import { DataTypes } from "./types.js";
class UpdateQueue extends EventEmitter {
  constructor() {
    super();
    this._queue = null;
    this.length = 0;
  }
  update(update, dataType = DataTypes.ROW_DATA) {
    this.emit(dataType, update);
  }
  getCurrentBatch() {
  }
  resize(size) {
    console.log(`localUpdateQueue resize ${JSON.stringify(size)}`);
  }
  append(row, offset) {
    console.log(
      `localUpdateQueue append ${JSON.stringify(row)} offset ${offset}`
    );
  }
  replace(message) {
    this.emit(DataTypes.ROW_DATA, message);
  }
  popAll() {
    console.log(`localUpdateQueue popAll`);
    return void 0;
  }
}
export {
  UpdateQueue as default
};
//# sourceMappingURL=local-update-queue.js.map
