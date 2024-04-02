const encodeUriComponent = require('encodeUriComponent');
const JSON = require('JSON');
const Math = require('Math');
const sendHttpRequest = require('sendHttpRequest');
const getTimestampMillis = require('getTimestampMillis');
const getContainerVersion = require('getContainerVersion');
const logToConsole = require('logToConsole');
const getRequestHeader = require('getRequestHeader');

const isLoggingEnabled = determinateIsLoggingEnabled();
const traceId = isLoggingEnabled ? getRequestHeader('trace-id') : undefined;

const apiVersion = '18.0';
const postUrl =
  'https://graph.facebook.com/v' +
  apiVersion +
  '/' +
  enc(data.pixelId) +
  '/events?access_token=' +
  enc(data.accessToken);

const mappedEventData = getMappedEventData();
const postBody = {
  data: [mappedEventData]
};

if (data.testId) postBody.test_event_code = data.testId;

if (isLoggingEnabled) {
  logToConsole(
    JSON.stringify({
      Name: 'Facebook',
      Type: 'Request',
      TraceId: traceId,
      EventName: mappedEventData.event_name,
      RequestMethod: 'POST',
      RequestUrl: postUrl,
      RequestBody: postBody
    })
  );
}

sendHttpRequest(
  postUrl,
  (statusCode, headers, body) => {
    if (isLoggingEnabled) {
      logToConsole(
        JSON.stringify({
          Name: 'Facebook',
          Type: 'Response',
          TraceId: traceId,
          EventName: mappedEventData.event_name,
          ResponseStatusCode: statusCode,
          ResponseHeaders: headers,
          ResponseBody: body
        })
      );
    }
    if (statusCode >= 200 && statusCode < 300) {
      data.gtmOnSuccess();
    } else {
      data.gtmOnFailure();
    }
  },
  { headers: { 'content-type': 'application/json' }, method: 'POST' },
  JSON.stringify(postBody)
);

function getMappedEventData() {
  return {
    event_name: data.eventName,
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

function enc(data) {
  data = data || '';
  return encodeUriComponent(data);
}

function determinateIsLoggingEnabled() {
  const containerVersion = getContainerVersion();
  const isDebug = !!(
    containerVersion &&
    (containerVersion.debugMode || containerVersion.previewMode)
  );

  if (!data.logType) {
    return isDebug;
  }

  if (data.logType === 'no') {
    return false;
  }

  if (data.logType === 'debug') {
    return isDebug;
  }

  return data.logType === 'always';
}
