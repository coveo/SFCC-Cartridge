'use strict';

var ArrayList = require('dw/util/ArrayList');
var Logger = require('dw/system/Logger').getLogger('Coveo');
var Site = require('dw/system/Site');
var Transaction = require('dw/system/Transaction');

var coveoConstant = null;
var coveoHelper = null;
var isDelta = false;
var openStreamResponse = null;
var products = null;
var productFile = null;
var productRequestGenerator = null;
var productsToExport = [];
var sourceFolder = null;
var streamHelper = null;
var streamId = null;
var uploadUri = null;

/**
 * Initialize readers and writers for job processing
 * @param {Object} parameters job parameters
 * @param {JobStepExecution} stepExecution job step execution
 */
exports.beforeStep = function (parameters, stepExecution) {
    coveoConstant = require('*/cartridge/scripts/utils/coveoConstant');
    coveoHelper = require('*/cartridge/scripts/helper/coveoHelper');
    productRequestGenerator = require('*/cartridge/scripts/generators/productRequestGenerator');
    streamHelper = require('*/cartridge/scripts/helper/streamHelper');
    sourceFolder = parameters.get('srcFolder');
    openStreamResponse = streamHelper.openStreamService();
    streamId = openStreamResponse.object.streamId;
    uploadUri = openStreamResponse.object.uploadUri;

    products = coveoHelper.buildProductQuery(isDelta);
};

exports.read = function (parameters, stepExecution) { // eslint-disable-line
    if (products.hasNext()) {
        var productSearchHit = products.next();
        return productSearchHit.productID;
    }
};

exports.process = function (product, parameters, stepExecution) {
    return productRequestGenerator.processProducts(product, isDelta);
};

exports.write = function (lines, parameters, stepExecution) {
    var productsList = new ArrayList(lines).toArray();
    productsList.forEach(function (item) {
        var id = item;
        if (id && id.length >= 1) {
            Object.keys(id).forEach(function (key) {
                productsToExport.push(item[key]);
            });
        }
    });
};

exports.afterChunk = function (stepExecution, parameters) {
    if (coveoConstant.COVEO_CONSTANTS.CHUNK_MODE_ENABLED && !empty(productsToExport) && productsToExport.length > 0) {
        productFile = coveoHelper.writeProductFile(sourceFolder, productsToExport);
        Logger.info('exportProducts-write - Total products Exported: {0}', productsToExport.length);
        productsToExport = [];
        streamHelper.uploadStreamService(productFile, uploadUri);
        var chunkStreamResponse = streamHelper.chunkStreamService(streamId);
        if (!empty(chunkStreamResponse) && chunkStreamResponse.ok) {
            uploadUri = chunkStreamResponse.object.uploadUri;
            if (parameters.get('deleteFile')) {
                productFile.remove();
                Logger.info('File uploaded successfully and removed - ' + productFile.path + '');
            } else if (!empty(parameters.get('archivePath'))) {
                coveoHelper.archiveFeedFile(parameters, productFile);
            }
        }
    }
};

exports.afterStep = function (success, parameters) {
    if (!coveoConstant.COVEO_CONSTANTS.CHUNK_MODE_ENABLED) {
        productFile = coveoHelper.writeProductFile(sourceFolder, productsToExport);
        Logger.info('exportProducts-write - Total products Exported: {0}', productsToExport.length);
        var uploadStreamServiceResponse = streamHelper.uploadStreamService(productFile, uploadUri);
        if (!empty(uploadStreamServiceResponse) && uploadStreamServiceResponse.ok) {
            if (parameters.get('deleteFile')) {
                productFile.remove();
                Logger.info('File uploaded successfully and removed - ' + productFile.path + '');
            } else if (!empty(parameters.get('archivePath'))) {
                coveoHelper.archiveFeedFile(parameters, productFile);
            }
        }
    }
    Transaction.wrap(function () {
        var lastRunTime = new Date();
        Site.current.preferences.custom.coveoCatalogLastSync = lastRunTime;
    });
    streamHelper.closeStreamService(streamId);
};
