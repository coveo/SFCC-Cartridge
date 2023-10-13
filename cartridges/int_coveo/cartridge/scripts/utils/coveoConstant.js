'use strict';

var Site = require('dw/system/Site');
var sitePrefs = Site.current.preferences.custom;

exports.SERVICE_ID = {
    COVEO_STREAM: 'int.coveo.http.api'
};

exports.COVEO_API_ENDPOINT = {
    STREAM: sitePrefs.coveoOrganizationId + '/sources/' + sitePrefs.coveoSourceId + '/stream/',
    FILECONTAINER: sitePrefs.coveoOrganizationId + '/files?useVirtualHostedStyleUrl=true',
    UPDATEFILE: sitePrefs.coveoOrganizationId + '/sources/' + sitePrefs.coveoSourceId + '/stream/update?fileId=<fileId>',
    CHUNK: '/chunk',
    CLOSE: '/close',
    OPEN: 'open'
};

exports.COVEO_HTTP_METHOD = {
    POST: 'POST',
    PUT: 'PUT'
};

exports.COVEO_CONSTANTS = {
    CHUNK_MODE_ENABLED: sitePrefs.coveoChunkModeEnabled,
    API_KEY: sitePrefs.coveoApiKey,
    ORGANIZATION_ID: sitePrefs.coveoOrganizationId,
    SOURCE_ID: sitePrefs.coveoSourceId,
    CATALOG_LAST_SYNC: sitePrefs.coveoCatalogLastSync,
    COVEO_FILE_FORMAT: '.json',
    PRODUCT: 'product://',
    EXTENSION: '.html',
    MODEL: 'Authentic',
    OBJECT_TYPE_PRODUCT: 'Product',
    VARIANT: 'variant://',
    OBJECT_TYPE_VARIANT: 'Variant'
};

exports.CoveoFeedType = {
    PRODUCT_FEED: 'PRODUCT_FEED'
};

exports.COVEO_FIELD_MAPPER = {
    primaryCategory: {
        custom: {
            sizeChartID: {
                fieldName: 'gender',
                fieldType: 'string'
            }
        }
    },
    name: {
        fieldName: 'ec_name',
        fieldType: 'string'
    },
    custom: {
        color: {
            fieldName: 'ec_color',
            fieldType: 'string'
        }
    }
};
