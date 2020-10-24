const express = require('express');
const morgan = require('morgan');
const helmet = require('helmet');
const { createProxyMiddleware } = require('http-proxy-middleware');
const { join } = require('path');

const app = express();

const port = process.env.PORT || 3000;

app.use(morgan('dev'));
app.use(
    helmet.contentSecurityPolicy({
        directives: {
            defaultSrc: ["'self'", 'https://dev-8ihcso-1.auth0.com'],
            styleSrc: ["'self'", "'unsafe-inline'", 'fonts.googleapis.com'],
            scriptSrc: ["'self'", "'unsafe-inline'"],
            frameSrc: ["'self'", 'https://dev-8ihcso-1.auth0.com/'],
            fontSrc: ["'self'", 'fonts.googleapis.com', 'fonts.gstatic.com'],
        },
    })
);
app.use(express.static(join(__dirname, 'build')));

app.use('/probot', createProxyMiddleware({ target: 'http://localhost:1337/', changeOrigin: true }));

app.listen(port, () => console.log(`Server listening on port ${port}`));
