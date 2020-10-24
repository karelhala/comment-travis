import React from 'react';
import { Router, Switch } from 'react-router-dom';

import PrivateRoute from './components/PrivateRoute';
import history from './utils/history';
import Dashboard from './views/Dashboard';
import { useAuth0 } from '@auth0/auth0-react';
import Loading from './components/Loading';

const App = () => {
    const { isLoading } = useAuth0();
    return isLoading ? (
        <Loading />
    ) : (
        <Router history={history}>
            <Switch>
                <PrivateRoute path="/" component={Dashboard} />
            </Switch>
        </Router>
    );
};

export default App;
