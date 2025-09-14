const STATUS_NOT_LOADED = 'not-loaded';
const STATUS_LOADED = 'loaded';
const STATUS_FAILED = 'failed';

/**
 * Wrapper of an object that will be fetched from remote server.
 *
 * This class provides 3 static methods for creating remote object with different status:
 *
 * - `notLoaded()`: Returns a not-yet-loaded remote object.
 * - `loaded(data)`: Returns a loaded remote object with data fetched from the server.
 * - `failed(error)`: Returns a failed remote object with an error.
 */
class RemoteObject {
  constructor({ status, data, error }) {
    this.status = status || STATUS_NOT_LOADED;
    this.data = data || null;
    this.error = error || null;
  }

  isNotLoaded() {
    return this.status === STATUS_NOT_LOADED;
  }

  isLoaded() {
    return this.status === STATUS_LOADED;
  }

  isFailed() {
    return this.status === STATUS_FAILED;
  }

  static notLoaded() {
    return new RemoteObject({
      status: STATUS_NOT_LOADED,
    });
  }

  static loaded(data) {
    return new RemoteObject({
      status: STATUS_LOADED,
      data: data,
    });
  }

  static failed(error) {
    const errorString = error ? String(error) : 'Object failed to load: no details provided.';
    return new RemoteObject({
      status: STATUS_FAILED,
      error: errorString,
    });
  }
}

export default RemoteObject;
