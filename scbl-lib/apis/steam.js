import axios from 'axios';
import Bottleneck from 'bottleneck';

import { STEAM_API_KEY } from '../config.js';

if (!STEAM_API_KEY) throw new Error('Environmental variable STEAM_API_KEY must be provided.');
const STEAM_API_RESERVIOR = 200;
const STEAM_API_RETRIES = 3;

const CancelToken = axios.CancelToken;
const source = CancelToken.source();

const makeRequest = new Bottleneck({
  reservoir: STEAM_API_RESERVIOR,
  reservoirRefreshAmount: STEAM_API_RESERVIOR,
  reservoirRefreshInterval: 300000,
  minTime: 1500 //300s per 200 requests as a rule of thumb to stop hitting burst rate limit on Steam
}).wrap(async (method, url, params, data = {}) => {
  console.log('starting steam axios request');
  const retVar = await axios({
    method: method,
    timeout: 4000,
    cancelToken: source.token,
    url: 'http://api.steampowered.com/' + url,
    params: { ...params, key: STEAM_API_KEY },
    data
  }).catch(function (thrown) {
    if (axios.isCancel(thrown)) {
      console.log('Request canceled', thrown.message);
    } else {
      // handle error
    }
  });
  console.log('done with steam axios request');
  return retVar;
});

export default async function (method, url, params, data = {}, priority = 5) {
  return await makeRequest.withOptions({ priority }, method, url, params, data);
}
