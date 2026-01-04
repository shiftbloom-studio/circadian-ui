declare module "react" {
  export type ReactNode =
    | string
    | number
    | boolean
    | null
    | undefined
    | ReactElement
    | ReactNode[];

  export interface ReactElement {
    type: unknown;
    props: Record<string, unknown>;
    key: string | number | null;
  }

  export interface Context<T> {
    Provider: (props: { value: T; children?: ReactNode }) => ReactElement | null;
    Consumer: (props: { children: (value: T) => ReactNode }) => ReactElement | null;
  }

  export interface MutableRefObject<T> {
    current: T;
  }

  export function createContext<T>(defaultValue: T): Context<T>;
  export function useContext<T>(context: Context<T>): T;
  export function useState<T>(initial: T | (() => T)): [T, (value: T) => void];
  export function useEffect(effect: () => void | (() => void), deps?: unknown[]): void;
  export function useMemo<T>(factory: () => T, deps: unknown[]): T;
  export function useCallback<T extends (...args: unknown[]) => unknown>(
    callback: T,
    deps: unknown[]
  ): T;
  export function useRef<T>(initialValue: T): MutableRefObject<T>;

  export const Fragment: unique symbol;
}

declare module "react/jsx-runtime" {
  export function jsx(
    type: unknown,
    props: Record<string, unknown>,
    key?: string
  ): unknown;
  export function jsxs(
    type: unknown,
    props: Record<string, unknown>,
    key?: string
  ): unknown;
  export const Fragment: unique symbol;
}

declare module "react-dom/client" {
  export interface Root {
    render(children: unknown): void;
    unmount(): void;
  }

  export function createRoot(container: Element | DocumentFragment): Root;
}

declare namespace JSX {
  interface IntrinsicElements {
    [elemName: string]: unknown;
  }
}
