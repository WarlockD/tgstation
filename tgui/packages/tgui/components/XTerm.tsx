import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import {
  ITerminalAddon,
  ITerminalInitOnlyOptions,
  ITerminalOptions,
  Terminal,
} from 'xterm';

// import 'xterm/css/xterm.css';
import { createLogger } from '../logging';
const logger = createLogger('XTerm');

export interface IProps {
  /**
   * Class name to add to the terminal container.
   */
  className?: string;

  /**
   * Options to initialize the terminal with.
   */
  options?: ITerminalOptions & ITerminalInitOnlyOptions;

  /**
   * An array of XTerm addons to load along with the terminal.
   */
  addons?: Array<ITerminalAddon>;

  /**
   * Adds an event listener for when a binary event fires. This is used to
   * enable non UTF-8 conformant binary messages to be sent to the backend.
   * Currently this is only used for a certain type of mouse reports that
   * happen to be not UTF-8 compatible.
   * The event value is a JS string, pass it to the underlying pty as
   * binary data, e.g. `pty.write(Buffer.from(data, 'binary'))`.
   */
  onBinary?(data: string): void;

  /**
   * Adds an event listener for the cursor moves.
   */
  onCursorMove?(): void;

  /**
   * Adds an event listener for when a data event fires. This happens for
   * example when the user types or pastes into the terminal. The event value
   * is whatever `string` results, in a typical setup, this should be passed
   * on to the backing pty.
   */
  onData?(data: string): void;

  /**
   * Adds an event listener for when a key is pressed. The event value contains the
   * string that will be sent in the data event as well as the DOM event that
   * triggered it.
   */
  onKey?(event: { key: string; domEvent: KeyboardEvent }): void;

  /**
   * Adds an event listener for when a line feed is added.
   */
  onLineFeed?(): void;

  /**
   * Adds an event listener for when a scroll occurs. The event value is the
   * new position of the viewport.
   * @returns an `IDisposable` to stop listening.
   */
  onScroll?(newPosition: number): void;

  /**
   * Adds an event listener for when a selection change occurs.
   */
  onSelectionChange?(): void;

  /**
   * Adds an event listener for when rows are rendered. The event value
   * contains the start row and end rows of the rendered area (ranges from `0`
   * to `Terminal.rows - 1`).
   */
  onRender?(event: { start: number; end: number }): void;

  /**
   * Adds an event listener for when the terminal is resized. The event value
   * contains the new size.
   */
  onResize?(event: { cols: number; rows: number }): void;

  /**
   * Adds an event listener for when an OSC 0 or OSC 2 title change occurs.
   * The event value is the new title.
   */
  onTitleChange?(newTitle: string): void;

  /**
   * Attaches a custom key event handler which is run before keys are
   * processed, giving consumers of xterm.js ultimate control as to what keys
   * should be processed by the terminal and what keys should not.
   *
   * @param event The custom KeyboardEvent handler to attach.
   * This is a function that takes a KeyboardEvent, allowing consumers to stop
   * propagation and/or prevent the default action. The function returns
   * whether the event should be processed by xterm.js.
   */
  customKeyEventHandler?(event: KeyboardEvent): boolean;
}

export const XTerm = forwardRef((props: IProps, ref) => {
  // const { data } = useBackend<Data>();
  const terminal = useRef(new Terminal(props.options));
  const xtermRef = useRef(null); // <HTMLDivElement>();
  const [firstRun, setFirstRun] = useState(true);
  // const [terminal, setTerminal] = useState(new Terminal(props.options));

  // if (ref) ref.terminal = terminal;
  useImperativeHandle(ref, () => ({
    // Only expose focus and nothing else
    write(data: string) {
      terminal.current.write(data);
    },
  }));

  logger.log('Runcomponent');
  useEffect(() => {
    logger.log('useEffect');
    // not sure how else to handle this
    /*
      //	const terminal = ;
      // Creates the terminal within the container element.
      // Load addons if the prop exists.
      if (props.addons) {
        props.addons.forEach((addon) => {
          terminal.current.loadAddon(addon);
        });
      }(

      */
      // Create Listeners
      if (props.onBinary) {
        terminal.current.onBinary((data: string) => {
          props.onBinary!(data);
        });
      }
      if (props.onCursorMove) {
        terminal.current.onCursorMove(() => {
          props.onCursorMove!();
        });
      }
      if (props.onData) {
        terminal.current.onData((data: string) => {
          props.onData!(data);
        });
      }
      if (props.onKey) {
        terminal.current.onKey(
          (event: { key: string; domEvent: KeyboardEvent }) => {
            props.onKey!(event);
          },
        );
      }
      if (props.onLineFeed) {
        terminal.current.onLineFeed(() => {
          props.onLineFeed!();
        });
      }
      if (props.onScroll) {
        terminal.current.onScroll((newPosition: number) => {
          props.onScroll!(newPosition);
        });
      }
      if (props.onSelectionChange) {
        terminal.current.onSelectionChange(() => {
          props.onSelectionChange!();
        });
      }
      if (props.onRender) {
        terminal.current.onRender((event: { start: number; end: number }) => {
          props.onRender!(event);
        });
      }
      if (props.onResize) {
        terminal.current.onResize((event: { cols: number; rows: number }) => {
          props.onResize!(event);
        });
      }
      if (props.onTitleChange) {
        terminal.current.onTitleChange((newTitle: string) => {
          props.onTitleChange!(newTitle);
        });
      }

      // Add Custom Key Event Handler
      if (props.customKeyEventHandler) {
        terminal.current.attachCustomKeyEventHandler(
          props.customKeyEventHandler,
        );
      }
    }
  }, [xtermRef]);

  // useEffect(() => {
  logger.log('Runcomponent1');
  if (firstRun && terminal.current && xtermRef.current) {
      terminal.current.open(xtermRef.current);
   // logger.log('Runcomponent2' + xtermRef.current);
  }
  // }, [firstRun]);
  return (<div className={props.className} ref={xtermRef} />);
});
