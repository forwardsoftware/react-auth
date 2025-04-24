export class Deferred<T> {
  private promise: Promise<T>;

  public resolve!: (value: T | PromiseLike<T>) => void;

  public reject!: (reason?: any) => void;

  constructor() {
    this.promise = new Promise<T>((resolve, reject) => {
      this.reject = reject;
      this.resolve = resolve;
    });
  }

  public getPromise(): Promise<T> {
    return this.promise;
  }
}
