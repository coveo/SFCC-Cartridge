'use strict';

/**
 * @namespace Coveo
 */
var guard = require('*/cartridge/scripts/guard');
var Site = require('dw/system/Site');
var Currency = require('dw/util/Currency');
var ISML = require('dw/template/ISML');

function Show() {
    var coveoSearchQuery = request.httpParameterMap.q.value;
    var currencyCode = Site.current.currencyCode;
    var SiteCurrency = Currency.getCurrency(currencyCode);
    var currencySymbol = SiteCurrency.symbol;
    ISML.renderTemplate('coveo/coveoSearch', {
        currencySymbol: currencySymbol,
        coveoSearchQuery: coveoSearchQuery
    });
}

exports.Show = guard.ensure(['https'], Show);
