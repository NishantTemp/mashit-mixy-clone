import express from 'express';
import { createServer } from 'http';
import app from '../server.js';

const server = express();
server.all('*', app);

export default createServer(server);