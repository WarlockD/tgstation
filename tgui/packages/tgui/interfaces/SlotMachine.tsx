import { useBackend } from '../backend';
import { Button, Icon, Section } from '../components';
import { Window } from '../layouts';
import { useRef, useEffect, ElementRef, useState, CSSProperties } from 'react';
import { BooleanLike } from 'common/react';
import { clamp } from 'common/math';

type IconInfo = {
  value: number;
  colour: string;
  //icon_name: string;
  icon: string; // icon name
};

type BackendData = {
  icons: IconInfo[];
  state: any[];
  balance: number;
  working: boolean;
  money: number;
  cost: number;
  plays: number;
  jackpots: number;
  jackpot: number;
  paymode: number;
};

type SlotsTileProps = {
  icon: string;
  speed:number;
  color?: string;
  background?: string;
  tileCount:number;
  debug?: boolean;
};

type TileAnimationType = {
  originTop: number;
  originHeight: number;
  resetTop: number;
  speed: number;

};

const pluralS = (amount: number) => {
  return amount === 1 ? '' : 's';
};

const SlotsTile = (props: SlotsTileProps) => {
  const debugRef = useRef<boolean>(false);
  const tileRef = useRef<HTMLDivElement>();
  const tileAnimationRef = useRef<TileAnimationType>();
  const { color, icon, speed, tileCount, debug } = props;

   // Use useRef for mutable variables that we want to persist
  // without triggering a re-render on their change
  const requestRef = useRef<number>();
  const previousTimeRef = useRef<number>(-1);

  const animate = time => {
    if(previousTimeRef.current < 0)
      previousTimeRef.current = time;

    const last = previousTimeRef.current ;
    if (last !== time && tileRef.current && tileAnimationRef.current) {
      const an = tileAnimationRef.current;
      const target = an.resetTop + an.originTop;
      const deltaTime = time - last;
     // if(deltaTime > 200) { // if more than 200ms something is fucking wrong
     //   console.log("Tile " + target +" " + deltaTime + " " +  top);
     // }
      let top = tileRef.current.offsetTop + (deltaTime * ( 0.1));
      if(top > target)
        top -= target*2;
     // if(debug)  console.log("Tile " + target +" " + deltaTime + " " +  top);
      tileRef.current.style.top = `${top}px`;
      previousTimeRef.current = time;


    }
    requestRef.current = requestAnimationFrame(animate);
  };
  useEffect(() => {
    if(tileRef.current && !tileAnimationRef.current){
      const top = tileRef.current.offsetTop;
      const height = tileRef.current.offsetHeight;
      tileAnimationRef.current = {
        originTop: top,
        originHeight: height,
        resetTop: (height * tileCount)/2, // If we are half way down move halfway up
        speed: 0,
      };

      console.log("We are setup " + tileAnimationRef.current.originTop + " " + tileAnimationRef.current.originHeight);
    }
  }, []);

  useEffect(() => {
    /*
    if(tileRef.current && !tileAnimationRef.current){
      const top = tileRef.current.offsetTop;
      const height = tileRef.current.offsetHeight;
      tileAnimationRef.current = {
        originTop: top,
        originHeight: height,
        resetTop: (height * tileCount)/2, // If we are half way down move halfway up
        speed: 0,
      };
      console.log("We are setup");
    }
    */
    if(speed == 0) {
      if(requestRef.current){
        cancelAnimationFrame(requestRef.current);
        console.log("Stop spinning");
        requestRef.current = undefined;
      }
    } else {
      if(!requestRef.current){
        console.log("Start spinning");
        previousTimeRef.current = -1;
        requestRef.current = requestAnimationFrame(animate);
      }

    }



    //return () => cancelAnimationFrame(requestRef.current ?? 0); // The ?? is to get rid of warnings
  }, [speed]); // Make sure the effect runs only once



  return (
    <div
      ref={tileRef}
      style={{
        position: 'relative',
        verticalAlign: 'top',
        textAlign: 'center',
        padding: '1rem',
        margin: '0.5rem',
        display: 'inline-block',
        width: '5rem',
        border: '1px solid white',
        left:0,
        background: props.background || 'rgba(62, 97, 137, 1)',
      }}
    >
      <Icon className={`color-${color}`} size={2.5} name={icon}/>
    </div>
  );
};

type SlotsReelProps = {
  spinning: number;
 // reel: IconInfo[];
  icons: Array<IconInfo>;
}

const spin_time = 100;
const spin_loops = 100;

type ReelStateType = {
  icon: string;
  pos: number;
  origin: number;
  color: string;
};

const createWheelState = (icons: Array<IconInfo>) => {
  const mid = Math.floor(icons.length /2);
  let array : Array<ReelStateType> = [];
  for(let i=0; i < icons.length; i++)
    array.push({ origin: 0, pos: i+mid, icon: icons[i].icon, color: icons[i].colour });
  return array;
}
const useAnimationFrame = callback => {
  // Use useRef for mutable variables that we want to persist
  // without triggering a re-render on their change
  const requestRef = useRef<number>();
  const previousTimeRef = useRef<number>();

  const animate = time => {
    if (previousTimeRef.current != undefined) {
      const deltaTime = time - previousTimeRef.current;
      callback(deltaTime)
    }
    previousTimeRef.current = time;
    requestRef.current = requestAnimationFrame(animate);
  }

  useEffect(() => {
    requestRef.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(requestRef.current ?? 0); // The ?? is to get rid of warnings
  }, []); // Make sure the effect runs only once
}

const Counter = () => {
  const [count, setCount] = useState(0)

  useAnimationFrame(deltaTime => {
    // Pass on a function to the setter of the state
    // to make sure we always have the latest state
    setCount(prevCount => (prevCount + deltaTime * 0.01) % 100)
  })

  return <div>{Math.round(count)}</div>
}

const SlotsReel = (props: SlotsReelProps) => {
  const { icons, spinning } = props;
  const animationRef = useRef(0);
  const previousTimer = useRef<number>();
  const [ animationState, setAnimationState ] = useState(0);


  const wheel_style : CSSProperties= {
    padding: 0,
    margin: 0,
    listStyle: 'none',
    position: 'absolute',
    float: 'left',

    display: 'inline-flex',
    flexDirection: 'column',
  };

  const tile_style : CSSProperties= {
    //overflow: 'hidden',
    position: 'relative',
    verticalAlign: 'top',
    textAlign: 'center',
    padding: '1rem',
    margin: '0.5rem',
    display: 'flex',
    flexDirection: 'column',
    width: '5rem',
    border: '1px solid #FFF',
   // top:0,
    // left:0,
    background: 'rgba(62, 97, 137, 1)',
  };

  return (
    <div style={wheel_style} >
      {icons.map((slot, i) => (
        <SlotsTile key={i} debug={i===0} icon={slot.icon} color={slot.colour} tileCount={icons.length} speed={spinning? 100 : 0} />
      ))}
    </div>
    );
};

export const SlotMachine = (props) => {
  const { act, data } = useBackend<BackendData>();

  // icons: The list of possible icons, including colour and name
  // backendState: the current state of the slots according to the backend
  const {
    plays,
    jackpots,
    money,
    cost,
    state,
    balance,
    jackpot,
    working: rolling,
    paymode,
    icons,
  } = data;

  return (
    <Window>
      <Section
        title="Slots!"
        style={{ justifyContent: 'center', textAlign: 'center' }}
      >
        <Section style={{ textAlign: 'left' }}>
        <Counter />
          <p>
            Only <b>{cost}</b> credit{pluralS(cost)} for a chance to win big!
          </p>
          <p>
            Available prize money:{' '}
            <b>
              {money} credit{pluralS(money)}
            </b>{' '}
          </p>
          {paymode === 1 && (
            <p>
              Current jackpot:{' '}
              <b>
                {money + jackpot} credit{pluralS(money + jackpot)}!
              </b>
            </p>
          )}
          <p>
            So far people have spun{' '}
            <b>
              {plays} time{pluralS(plays)},
            </b>{' '}
            and won{' '}
            <b>
              {jackpots} jackpot{pluralS(jackpots)}!
            </b>
          </p>
        </Section>
        <hr />
        <Section
          style={{
            flexDirection: 'row',
            display: 'flex',
           justifyContent: 'center',
          // overflow: 'hidden',
          // display: 'inline-block',
           border: '1px solid #000;',
           height: '200px',
          }}
        >
          {state.map((reel, i) => {  return <SlotsReel key={i} spinning={rolling ? 10 : 0} icons={icons}/>; })
          }
        </Section>
        <hr />
        <Button
          onClick={() => act('spin')}
          disabled={rolling || balance < cost}
        >
          Spin!
        </Button>
        <Section>
          <b>Balance: {balance}</b>
          <br />
          <Button onClick={() => act('payout')} disabled={!(balance > 0)}>
            Refund balance
          </Button>
        </Section>
      </Section>
    </Window>
  );
};
