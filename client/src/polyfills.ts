(window as any).global = window;


import 'zone.js';
import { Buffer } from 'buffer';
import process from 'process';
// @ts-ignore
import * as Stream from 'stream-browserify';

(window as any).Buffer = (window as any).Buffer ?? Buffer;
(window as any).process = (window as any).process ?? process;
(window as any).Stream = (window as any).Stream ?? Stream;
