import { useEffect, useRef, useState } from 'react';

import { useBackend } from '../backend';
import { Box, Flex } from '../components';
import { Window } from '../layouts';
import { createLogger } from '../logging';
// import { Box, Button, Flex, Grid, Icon } from '../components';
const logger = createLogger('chip8');

const LEFT_CLICK = 0;

const makeTestGrid = () => {
  let test_array = new Array(128 * 64);

  for (let i = 0; i < 128 * 64; i++) {
    test_array[i] = i & 1;
  }
  return test_array;
};

const clamp = (val: number, min: number, max: number) =>
  Math.min(Math.max(val, min), max);

interface Props {
  screen: number[];
  pc: number;
}

const Screen = (props: Props) => {
  const { screen, pc } = props;
  const ref = useRef<HTMLCanvasElement>(null);
  const scale = 10;

  useEffect(() => {
    const context = ref.current?.getContext('2d');

    if (context) {
      context.clearRect(0, 0, 64 * scale, 32 * scale);

      for (let i = 0; i < 64 * 32; i++) {
        let x = (i % 64) * scale;

        // Grabs the y position of the pixel based off of `i`
        let y = Math.floor(i / 64) * scale;

        if (screen[i] === 1) {
          context.fillStyle = '#68D391';
          context.fillRect(x, y, scale, scale);
        }
      }
    }
  }, [screen, pc]);

  return (
    <Flex bg="black" w={600} h={300} border="2px solid green">
      <canvas ref={ref} width="640" height="320" style={{ padding: '4px' }} />
    </Flex>
  );
};

/*
static void
interpret_xdraw(machine_t *this, int x, int y)
{
    int             mx, my;
    int             pattern;
    int             draw_lins, draw_bits;
    int             x_hi, y_hi;
    int             mpos;

    if (this->pixel_mode)
    {
        x_hi = MAX_WIDTH;
        y_hi = MAX_HEIGHT;
    }
    else
    {
        x_hi = MAX_WIDTH / 2;
        y_hi = MAX_HEIGHT / 2;
    }
    x %= x_hi;
    y %= y_hi;

    // don't draw past right edge
    draw_bits = 16;
    if (x + draw_bits > x_hi)
        draw_bits = x_hi - x;

    // don't draw past bottom edge
    draw_lins = 16;
    if (y + draw_lins > y_hi)
        draw_lins = y_hi - y;


     //update the this->pixel
         check_i_ambiguous(this);
    this->v_reg[15] = 0;
    mpos = this->i_reg;
    for (my = y; my < y + draw_lins; ++my)
    {
        pattern =
            ((this->memory[mpos] & 0xFF) << 8) |
            (this->memory[mpos + 1] & 0xFF) ;
        mpos += 2;
        for (mx = x; mx < x + draw_bits; ++mx)
        {
            if (pattern & ((unsigned)0x8000 >> (mx - x)))
            {
                if (this->pixel[my][mx])
                    this->v_reg[15] = 1;
                this->pixel[my][mx] ^= 1;
            }
        }
    }
}

    xor_sprite8(bytes: Array<number>, x:number, y:number, index:number, count:number) {
      x = clamp(x, 0, this.width);
      y = clamp(y, 0, this.height);
      let collision = false;
      for(let yy=0; yy < count; yy++) {
        const bits = bytes[index + yy];
        const ypos = (y + yy) % this.height;

        for(let xx=0, mask=0x80; xx<8; x++,mask >>= 1) {
          const not_equal = (bits&mask) ? true : false !== (this.rawImageData[ypos+xx] === this.forground);
          // test for collision
          if(!collision) {
            collision = (bits&mask) ? true : false && (this.rawImageData[ypos+xx] === this.forground);
          }

          if(not_equal) { // xor it
            this.rawImageData[ypos+xx] = this.background;
          } else {
            this.rawImageData[ypos+xx] = this.forground;
          }
        }
      }
      this.updated = true;
      return collision;
    }
}
const DotMatrixCanvas = (props: DotMatrixProps) => {
  const { width, height, ...rest } = props;
  const reactCanvas = useRef<HTMLCanvasElement>(null);
  // set up basic engine and scene
  useEffect(() => {
    // if (!reactCanvas.current) return;
    const context = reactCanvas.current.getContext('2d');
    context.fillStyle = 'red';
    context.fillRect(0, 0, props.width, props.height);
    logger.debug('Chip8 ran canvas right?');
  }, []);

  return <canvas width={width} height={height} ref={reactCanvas} {...rest} />;
};

type PixelRowProp = {
  line: Array<{ color: string; index: number }>;
  pixel_size: number;
};

const PixelRow = (props: PixelRowProp) => {
  const { line, pixel_size } = props;
  return (
    <Flex>
      {line.map((p) => (
        <Flex.Item
          border={'1px solid #ddd;'}
          height={pixel_size + 'px'}
          width={pixel_size + 'px'}
          backgroundColor={p.color}
          key={p.index}
        >
          {p.color === 'transparent' ? '1' : '0'}
        </Flex.Item>
      ))}
    </Flex>
  );
};
type PixelDisplayProp = {
  width: number;
  height: number;
  pixel_space: number;
  pixel_size: number;
  color_palette: string[];
  pixels: Array<number>; // very wierd, having problems using Uint8
};

const PixelDisplay = (props: PixelDisplayProp) => {
  const { width, height, pixel_space, pixel_size, color_palette, pixels } =
    props;
  /*
  // let rows : Array<PixelRowProp> = [];
  let v: PixelRowProp = { line: [], pixel_size: 2 };

  let rows: Array<PixelRowProp> = [];
  for (let i = 0; i < test_array.length; i++) {
    if (i % 128) {
      const t = v;
      v = { line: [], pixel_size: 2 };
      rows.push(v);
    }
    v.line.push({ color: color_palette[test_array[i]], index: i });
  }

  logger.debug('Chip8 is up and there are ' + rows.length + 'rows');

  return (
    <Box>
      <DotMatrixCanvas width={128} height={64} />
    </Box>
  );
};
*/
const bgColors = {
  Default: '#81b71a',
  Blue: '#00B1E1',
  Cyan: '#37BC9B',
  Green: '#8CC152',
  Red: '#E9573F',
  Yellow: '#F6BB42',
};

const colors = ['#E9573F', 'transparent'];
const testScreen = () => {
  let num = Array<number>(64 * 32);
  for (let i = 0; i < 64 * 32; i++) {
    num[i] = i & 1 ? 1 : 0;
  }
  return num;
};

export const Chip8 = (props) => {
  const { act, data } = useBackend();
  const [activeCategory, setActiveCategory] = useState(testScreen());

  return (
    <Window width={800} height={600}>
      <Window.Content>
        <Box>OK This is the right window dfright?</Box>
        <Box>
          <Screen pc={1} screen={activeCategory} />
        </Box>
      </Window.Content>
    </Window>
  );
};
