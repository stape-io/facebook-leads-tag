const encodeUriComponent = require('encodeUriComponent');
const encodeUri = require('encodeUri');
const JSON = require('JSON');
const Math = require('Math');
const sendHttpRequest = require('sendHttpRequest');
const getTimestampMillis = require('getTimestampMillis');
const getAllEventData = require('getAllEventData');

/**********************************************************************************************/

const eventData = getAllEventData();

const API_VERSION = '25.0';
const postUrl =
  'https://graph.facebook.com/v' +
  API_VERSION +
  '/' +
  encPath(data.pixelId) +
  '/events?access_token=' +
  enc(data.accessToken);

const mappedEventData = getMappedEventData();
const postBody = {
  data: [mappedEventData]
};

if (data.testId) postBody.test_event_code = data.testId;

sendHttpRequest(
  postUrl,
  (statusCode, headers, body) => {
    if (statusCode >= 200 && statusCode < 300) {
      data.gtmOnSuccess();
    } else {
      data.gtmOnFailure();
    }
  },
  { headers: { 'content-type': 'application/json' }, method: 'POST' },
  JSON.stringify(postBody)
);

/**********************************************************************************************/
// Vendor related functions

function getMappedEventData() {
  return {
    event_name: data.eventName || eventData.event_name || eventData.eventName || eventData.event,
    action_source: 'system_generated',
    event_time: data.eventTime || Math.round(getTimestampMillis() / 1000),
    custom_data: {
      lead_event_source: data.leadEventSource,
      event_source: 'crm'
    },
    user_data: {
      lead_id: data.leadId
    }
  };
}

/**********************************************************************************************/
// Helpers

function enc(data) {
  return encodeUriComponent(data || '');
}

function encPath(data) {
  return encodeUri(data || '');
}
