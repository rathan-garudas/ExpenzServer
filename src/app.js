const express = require('express');
const { httpLogger } = require('./middlewares');
const { logger, enableCORS } = require('./utils');
const path = require('path');
const userRoute = require('./routes/User');
const groupRoute = require('./routes/Group');
const activityRoute = require('./routes/Activity');
var cors = require('cors');

const filepath = `${path.dirname(__filename)}\ ${path.basename(__filename)}`;

const PORT = 8080;
const app = express();

app.use(httpLogger);
app.use(cors());
app.use(express.json());

app.use('/user', userRoute);

app.use('/group', groupRoute);

app.use('/activity', activityRoute);

app.get('/', (req, res) => {
  res.send('Hello World!');
});

app.get('/home', (req, res) => {
  res.send('Hello from home endpoint!');
});



app.listen(PORT, () => {
  logger.info(`${filepath} Server listening on port ${PORT}`);
});