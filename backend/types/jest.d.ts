// Type definitions for Jest
// This file adds missing TypeScript type definitions for Jest

declare namespace jest {
  interface Mock<T = any, Y extends any[] = any[]> extends Function {
    new (...args: Y): T;
    (...args: Y): T;
    mockImplementation(fn: (...args: Y) => T): this;
    mockImplementationOnce(fn: (...args: Y) => T): this;
    mockReturnValue(value: T): this;
    mockReturnValueOnce(value: T): this;
    mockResolvedValue(value: T): this;
    mockResolvedValueOnce(value: T): this;
    mockRejectedValue(value: any): this;
    mockRejectedValueOnce(value: any): this;
    mockClear(): this;
    mockReset(): this;
    mockRestore(): this;
    mockName(name: string): this;
    getMockName(): string;
    mock: {
      calls: Y[];
      instances: T[];
      invocationCallOrder: number[];
      results: Array<{ type: string; value: any }>;
      lastCall: Y;
    };
  }

  // Add any missing Jest types here
  function fn<T = any, Y extends any[] = any[]>(): Mock<T, Y>;
  function fn<T = any, Y extends any[] = any[]>(implementation: (...args: Y) => T): Mock<T, Y>;
  
  function spyOn<T extends {}, M extends keyof T>(
    object: T,
    method: M
  ): Mock<Required<T>[M], T[M] extends (...args: infer A) => any ? A : any[]>;
}

// Extend global Jest types
declare global {
  namespace jest {
    interface Matchers<R> {
      toHaveBeenCalledWith(...args: any[]): R;
      toBeCalledWith(...args: any[]): R;
      lastCalledWith(...args: any[]): R;
      toHaveBeenLastCalledWith(...args: any[]): R;
      toHaveBeenNthCalledWith(nth: number, ...args: any[]): R;
      nthCalledWith(nth: number, ...args: any[]): R;
    }
  }
}
