import * as express from 'express';
import * as bodyParser from 'body-parser';
//import * as Promise from 'promise';
//import auth from './auth';

import {TimeKeeper} from './utils/timeKeeper';

const port = process.env.PORT || 3000;
const debug: boolean = false; //!process.env.DEBUG || process.env.DEBUG.toLowerCase() == 'true';

const timekeeper: TimeKeeper = new TimeKeeper(debug);

const app = express();
const authRouter = express.Router();

app.use(bodyParser.json({type: 'application/json'}));

//app.use(auth);

let corsConfig = require('./corsConfig');
app.use(corsConfig);

let v1BitVote = require('./routes/v1BitVote');
authRouter.use('/v1/BitVote', v1BitVote(timekeeper));


let v0BitCalc = require('./routes/v0BitCalc');
authRouter.use('/v0/BitCalc', v0BitCalc(timekeeper));

let v1Categories = require('./routes/v1Categories');
authRouter.use('/v1/Category', v1Categories(timekeeper));

app.use('/api', authRouter);

app.listen(port);
console.log('Magic happens on port ' + port);

export default app;
