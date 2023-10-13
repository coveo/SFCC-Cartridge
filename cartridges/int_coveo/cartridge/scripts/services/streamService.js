'use strict';

var LocalServiceRegistry = require('dw/svc/LocalServiceRegistry');
var Logger = require('dw/system/Logger').getLogger('Coveo');
var FileReader = require('dw/io/FileReader');

/**
 * This function is used to create stream service request
 * @function createStreamRequest
 * @param {string} method - method
 * @param {string} endPoint - endPoint
 * @param {Object} httpHeaders - httpHeaders
 * @param {string} uploadURL - uploadURL
 * @returns {Object}-httpRequest
 */
function createStreamRequest(method, endPoint, httpHeaders, uploadURL) {
    var coveoConstant = require('*/cartridge/scripts/utils/coveoConstant');
    var httpRequest = LocalServiceRegistry.createService(coveoConstant.SERVICE_ID.COVEO_STREAM, {
        createRequest: function (svc, args) {
            if (empty(uploadURL)) {
                var url = svc.URL.replace('{coveoConstant.COVEO_CONSTANTS.ORGANIZATION_ID}');
                url.replace('{coveoConstant.COVEO_CONSTANTS.SOURCE_ID}');
                svc.URL = url + endPoint;
            } else {
                svc.URL = uploadURL;
            }
            var fileContent = null;
            var header = JSON.stringify(httpHeaders);
            var coveoHeader = JSON.parse(header);
            Object.keys(coveoHeader).forEach(function (key) {
                svc.addHeader(key, coveoHeader[key]);
            });
            svc.setRequestMethod(method);
            if (args) {
                var fileReaders = new FileReader(args);
                fileContent = fileReaders.getString();
                fileReaders.close();
            }
            return fileContent;
        },
        parseResponse: function (svc, client) {
            return JSON.parse(client.text);
        },
        getRequestLogMessage: function (serviceRequest) {
            return serviceRequest;
        },
        getResponseLogMessage: function (serviceResponse) {
            if (!empty(serviceResponse) && !empty(serviceResponse.errorText)) {
                Logger.error('(streamService - createStreamRequest) -> Error occurred while calling Stream API {0}: {1} ({2})', serviceResponse.statusCode, serviceResponse.statusMessage, serviceResponse.errorText);
                return serviceResponse.errorText;
            }
            return serviceResponse.text;
        },
        filterLogMessage: function (msg) {
            return msg;
        }
    });
    return httpRequest;
}

module.exports = {
    createStreamRequest: createStreamRequest
};
