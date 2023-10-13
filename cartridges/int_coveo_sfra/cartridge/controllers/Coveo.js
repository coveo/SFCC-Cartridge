'use strict';

/**
 * @namespace Coveo
 */

var server = require('server');
var Currency = require('dw/util/Currency');
var Site = require('dw/system/Site');

server.get(
    'Show',
    server.middleware.https,
    function (req, res, next) {
        var coveoSearchQuery = req.querystring.q;
        var currencyCode = Site.current.currencyCode;
        var SiteCurrency = Currency.getCurrency(currencyCode);
        var currencySymbol = SiteCurrency.symbol;
        res.render('coveo/coveoSearch', {
            currencySymbol: currencySymbol,
            coveoSearchQuery: coveoSearchQuery
        });
        next();
    }
);

module.exports = server.exports();
