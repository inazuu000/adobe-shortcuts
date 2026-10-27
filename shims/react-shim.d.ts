// Minimal React typings so the project type-checks in environments where @types/react
// cannot be installed. Once `npm install` has fetched @types/react you can delete this file.
declare module 'react' {
  export type ReactNode = any;
  export type Dispatch<A> = (value: A) => void;
  export type SetStateAction<S> = S | ((prev: S) => S);
  export function useState<S>(initial: S | (() => S)): [S, Dispatch<SetStateAction<S>>];
  export function useEffect(effect: () => void | (() => void), deps?: readonly unknown[]): void;
  export function useLayoutEffect(effect: () => void | (() => void), deps?: readonly unknown[]): void;
  export function useMemo<T>(factory: () => T, deps: readonly unknown[]): T;
  export function useCallback<T extends (...args: any[]) => any>(cb: T, deps: readonly unknown[]): T;
  export function useRef<T>(initial: T): { current: T };
  export function useId(): string;
  export function useSyncExternalStore<T>(subscribe: (cb: () => void) => () => void, getSnapshot: () => T, getServerSnapshot?: () => T): T;
  export const Fragment: any;
  export const StrictMode: any;
}
declare module 'react/jsx-runtime' {
  export const jsx: any;
  export const jsxs: any;
  export const Fragment: any;
  export namespace JSX {
    type Element = any;
    interface ElementChildrenAttribute { children: {} }
    interface IntrinsicAttributes { key?: string | number }
    interface IntrinsicElements {
      [tag: string]: {
        [prop: string]: any;
        onChange?: (e: any) => void; onClick?: (e: any) => void; onKeyDown?: (e: any) => void;
        onSubmit?: (e: any) => void; onInput?: (e: any) => void; onError?: (e: any) => void;
        onFocus?: (e: any) => void; onBlur?: (e: any) => void; onMouseDown?: (e: any) => void;
      };
    }
  }
}
declare module 'react-dom/client' {
  export function createRoot(el: Element | DocumentFragment): { render(node: any): void; unmount(): void };
}
