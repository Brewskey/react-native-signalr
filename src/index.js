let signalRHubConnectionFunc;

const makeSureDocument = () => {
  const originalDocument = window.document;
  if (window.document) {
    return () => null;
  }

  window.document = { readyState: 'complete', env: 'react-native' };

  if (!window.document.readyState) {
    window.document.readyState = 'complete';
  }

  return () => (window.document = originalDocument);
};

if (!window.addEventListener) {
  window.addEventListener = window.addEventListener = () => {};
}

if (!window.navigator.userAgent) {
  window.navigator.userAgent = 'react-native';
}

window.jQuery = require('./signalr-jquery-polyfill.js').default;

export default {
  setLogger: logger => {
    if (window.console && window.console.debug) {
      window.console.debug('OVERWRITING CONSOLE.DEBUG in react-native-signalr');
    } else if (!window.console) {
      window.console = {};
    }
    const originalDebug = window.console.debug;
    window.console.debug = logger;
    return () => (window.console.debug = originalDebug);
  },
  hubConnection: (serverUrl, options) => {
    const revertDocument = makeSureDocument();
    if (!signalRHubConnectionFunc) {
      require('ms-signalr-client');
      signalRHubConnectionFunc = window.jQuery.hubConnection;
    }
    const [protocol, host] = serverUrl.split(/\/\/|\//);
    if (options && options.headers) {
      window.jQuery.defaultAjaxHeaders = options.headers;
    }
    const hubConnectionFunc = signalRHubConnectionFunc(serverUrl, options);
    const originalStart = hubConnectionFunc.start;
    revertDocument();

    hubConnectionFunc.start = (options, ...args) => {
      const revertDocument = makeSureDocument();

      if (window.document.env === 'react-native') {
        window.document.createElement = () => {
          return {
            protocol,
            host,
          };
        };
        window.location = {
          protocol,
          host,
        };
      }

      const returnValue = originalStart.call(
        hubConnectionFunc,
        options,
        ...args,
      );
      revertDocument();
      return returnValue;
    };

    return hubConnectionFunc;
  },
};
