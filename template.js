const encodeUriComponent = require('encodeUriComponent');
const getAllEventData = require('getAllEventData');
const getRequestHeader = require('getRequestHeader');
const getTimestampMillis = require('getTimestampMillis');
const getType = require('getType');
const JSON = require('JSON');
const makeInteger = require('makeInteger');
const makeString = require('makeString');
const Math = require('Math');
const sendHttpRequest = require('sendHttpRequest');

/*==============================================================================
==============================================================================*/

const eventData = getAllEventData();
const API_VERSION = '26.0';

if (shouldExitEarly(data, eventData)) {
  return data.gtmOnSuccess();
}

const postBody = mapEvent(data, eventData);
sendRequest(data, postBody);

if (isUIFieldTrue(data.useOptimisticScenario)) {
  return data.gtmOnSuccess();
}

/*==============================================================================
  Vendor related functions
==============================================================================*/

function getEventName(data, eventData) {
  return data.eventName || eventData.event_name || eventData.eventName || eventData.event;
}

function getEventTime(data) {
  if (isValidValue(data.eventTime)) return makeInteger(data.eventTime);
  return Math.round(getTimestampMillis() / 1000);
}

function mapEvent(data, eventData) {
  const mappedEventData = {
    event_name: getEventName(data, eventData),
    action_source: 'system_generated',
    event_time: getEventTime(data),
    custom_data: {
      lead_event_source: data.leadEventSource,
      event_source: 'crm'
    },
    user_data: {
      lead_id: data.leadId
    }
  };

  const postBody = {
    data: [mappedEventData]
  };

  if (isValidValue(data.testId)) postBody.test_event_code = data.testId;

  return postBody;
}

function sendRequest(data, postBody) {
  const postUrl =
    'https://graph.facebook.com/v' + API_VERSION + '/' + enc(data.pixelId) + '/events';

  return sendHttpRequest(
    postUrl,
    {
      headers: {
        'content-type': 'application/json',
        authorization: 'Bearer ' + data.accessToken
      },
      method: 'POST'
    },
    JSON.stringify(postBody)
  )
    .then((result) => {
      if (isUIFieldTrue(data.useOptimisticScenario)) return;
      if (result.statusCode >= 200 && result.statusCode < 300) return data.gtmOnSuccess();
      return data.gtmOnFailure();
    })
    .catch(() => {
      if (isUIFieldTrue(data.useOptimisticScenario)) return;
      return data.gtmOnFailure();
    });
}

/*==============================================================================
  Helpers
==============================================================================*/

function getUrl(eventData) {
  return eventData.page_location || getRequestHeader('referer') || eventData.page_referrer;
}

function shouldExitEarly(data, eventData) {
  if (!isConsentGivenOrNotRequired(data, eventData)) return true;

  const url = getUrl(eventData);
  if (url && url.lastIndexOf('https://gtm-msr.appspot.com/', 0) === 0) return true;

  return false;
}

function enc(data) {
  if (['null', 'undefined'].indexOf(getType(data)) !== -1) data = '';
  return encodeUriComponent(makeString(data));
}

function isValidValue(value) {
  const valueType = getType(value);
  if (valueType === 'null' || valueType === 'undefined' || value !== value) return false;
  return value !== '' && value !== 'undefined' && value !== 'null';
}

function isUIFieldTrue(field) {
  return [true, 'true'].indexOf(field) !== -1;
}

function isConsentGivenOrNotRequired(data, eventData) {
  if (data.adStorageConsent !== 'required') return true;
  if (eventData.consent_state) return !!eventData.consent_state.ad_storage;
  const xGaGcs = eventData['x-ga-gcs'] || ''; // x-ga-gcs is a string like "G110"
  return xGaGcs[2] === '1';
}
