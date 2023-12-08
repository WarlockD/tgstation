import { useBackend, useLocalState } from '../backend';
import { NoticeBox, Section, TextArea, Divider, Box } from '../components';
import { Window } from '../layouts';

import { Component, createRef, RefObject } from 'inferno';
import { createLogger } from '../logging';
//  import { Dialog, UnsavedChangesDialog } from '../components/Dialog';

type Data = {
  uppertext: string;
  messages: { key: string }[];
  tguitheme: string;
};

const logger = createLogger('ConsoleLog');

const TEXTAREA_UPDATE_TRIGGERS = [
  'click',
  'input',
  'paste',
  'cut',
  'mousemove',
  'select',
  'selectstart',
  'keydown',
];

interface ConoleTextAreaProps {
  maintainFocus: boolean;
  text: string;
  wordWrap: boolean;
  sendKey: (string) => void;
 // setText: (string) => void;
 // setStatuses: (statuses: Statuses) => void;
}

class ConoleTextArea extends Component<ConoleTextAreaProps> {
  innerRef: RefObject<HTMLTextAreaElement>;

  constructor(props: ConoleTextAreaProps) {
    super(props);
    this.innerRef = createRef();
  }

  handleEvent(event: Event) {
    const area = event.target as HTMLTextAreaElement;
  //  this.props.setStatuses(getStatusCounts(area.value, area.selectionStart));
  }

  onblur() {
    if (!this.innerRef.current) {
      return;
    }

    if (this.props.maintainFocus) {
      this.innerRef.current.focus();
      return false;
    }

    return true;
  }

  // eslint-disable-next-line react/no-deprecated
  componentDidMount() {
    const textarea = this.innerRef?.current;
    if (!textarea) {
      logger.error(
        'ConoleTextArea.render(): Textarea RefObject should not be null'
      );
      return;
    }

    // Javascript – execute when textarea caret is moved
    // https://stackoverflow.com/a/53999418/5613731
    TEXTAREA_UPDATE_TRIGGERS.forEach((trigger) =>
      textarea.addEventListener(trigger, this)
    );
    // Slight hack: Keep selection when textarea loses focus so menubar actions can be used (i.e. cut, delete)
    textarea.onblur = this.onblur.bind(this);
  }
  onKey(e: Event, v: string) {

  }
  componentWillUnmount() {
    const textarea = this.innerRef?.current;
    if (!textarea) {
      logger.error(
        'ConoleTextArea.componentWillUnmount(): Textarea RefObject should not be null'
      );
      return;
    }
    TEXTAREA_UPDATE_TRIGGERS.forEach((trigger) =>
      textarea.removeEventListener(trigger, this)
    );
  }

  render() {
    const { text, sendKey, wordWrap } = this.props;

    return (
      <TextArea
        innerRef={this.innerRef}
        onInput={(_, value) => sendKey(value)}
        className={'NtosNotepad__textarea'}
        scroll
        nowrap={!wordWrap}
        value={text}
      />
    );
  }
}

type ConsoleData = {
  note: string;
};
type RetryActionType = (retrying?: boolean) => void;

export const NtosNotepad = (props) => {
  const { act, data, config } = useBackend<ConsoleData>();
  const { term } = data;

  //console.log(note);
  const [text, setText] = useLocalState<string>('text', note);

export const CpuConsole = (props) => {
  const { data } = useBackend<Data>();
  const { messages = [], uppertext } = data;

  return (
    <Window theme={data.tguitheme} title="Terminal" width={480} height={520}>
      <Window.Content scrollable>
        <NoticeBox textAlign="left">{uppertext}</NoticeBox>
        <Section fill>
            <ConoleTextArea
             // maintainFocus={activeDialog === Dialogs.NONE}
              text={messages.concat()}
              wordWrap={wordWrap}
              setText={setText}
              setStatuses={setStatuses}
            />
        </Section>
      {/*
        {messages.map((message) => {
          return (
            <Section
              key={message.key}
              dangerouslySetInnerHTML={{ __html: message }}
            />
          );

        })}
      */}
      </Window.Content>
    </Window>
  );
};
