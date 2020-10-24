import React from 'react';
import ReactDOM from 'react-dom';
import App from './App';
import { Auth0Provider } from '@auth0/auth0-react';
import history from './utils/history';

const onRedirectCallback = (appState) => {
    history.push(appState && appState.targetUrl ? appState.targetUrl : window.location.pathname);
};

console.log(process.env.REACT_APP_AUTH_CLIENT_ID, 'ffffbbb');

ReactDOM.render(
    <Auth0Provider
        domain={process.env.REACT_APP_AUTH_DOMAIN}
        clientId={process.env.REACT_APP_AUTH_CLIENT_ID}
        redirectUri={window.location.origin}
        onRedirectCallback={onRedirectCallback}
    >
        <App />
    </Auth0Provider>,
    document.getElementById('root')
);
