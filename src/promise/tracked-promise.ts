type PromiseState = 'pending' | 'fulfilled' | 'rejected';

export class TrackedPromise<T> {
  promise: Promise<T>;
  error: any;
  state: PromiseState;
  value?: T;

  constructor(executor: (resolve: (value: T) => void, reject: (reason?: any) => void) => void){
    this.state = 'pending';

    this.promise = new Promise<T>((resolve, reject) => {
      executor(
        (value) => {
          this.state = 'fulfilled';
          this.value = value;
          resolve(value);
        },
        (error) => {
          this.state = 'rejected';
          this.error = error;
          reject(error);
        }
      );
    });
  }

  getPromise(): Promise<T> {
    return this.promise;
  }

  getState(): PromiseState {
    return this.state;
  }

  isPending(): boolean {
    return this.state === 'pending';
  }

  isFulfilled(): boolean {
    return this.state === 'fulfilled';
  }

  isRejected(): boolean {
    return this.state === 'rejected';
  }

  getValue(): T | undefined {
    return this.value;
  }

  getError(): any {
    return this.error;
  }

  then<TResult1 = T, TResult2 = never>(
    onfulfilled?: ((value: T) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
  ): Promise<TResult1 | TResult2> {
    return this.promise.then(onfulfilled, onrejected);
  }

  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null
  ): Promise<T | TResult> {
    return this.promise.catch(onrejected);
  }

  finally(onfinally?: (() => void) | undefined | null): Promise<T> {
    return this.promise.finally(onfinally);
  }
}