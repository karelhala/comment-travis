import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { Route, withRouter } from 'react-router-dom';
import { useAuth0 } from '@auth0/auth0-react';

const PrivateRoute = ({ component: Component, path, location, ...rest }) => {
    const { isAuthenticated, loginWithRedirect, ...data } = useAuth0();

    console.log(isAuthenticated, rest, data, 'ffff');

    useEffect(() => {
        const fn = async () => {
            if (!isAuthenticated) {
                await loginWithRedirect({
                    appState: { targetUrl: location.pathname },
                });
            }
        };
        fn();
    }, [isAuthenticated, loginWithRedirect, path, location]);

    const render = (props) => (isAuthenticated === true ? <Component {...props} /> : null);

    return <Route path={path} render={render} {...rest} />;
};

PrivateRoute.propTypes = {
    component: PropTypes.oneOfType([PropTypes.element, PropTypes.func]),
    location: PropTypes.shape({
        pathName: PropTypes.string,
    }),
    path: PropTypes.oneOfType([PropTypes.string, PropTypes.arrayOf(PropTypes.string)]),
};

export default withRouter(PrivateRoute);
