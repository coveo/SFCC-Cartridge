'use strict';

var ArrayList = require('dw/util/ArrayList');
var Logger = require('dw/system/Logger').getLogger('Coveo');
var Site = require('dw/system/Site');
var Transaction = require('dw/system/Transaction');

var coveoHelper = null;
var isDelta = true;
var products = null;
var productFile = null;
var productRequestGenerator = null;
var productsToExport = [];
var sourceFolder = null;
var streamHelper = null;

/**
 * Initialize readers and writers for job processing
 * @param {Object} parameters job parameters
 * @param {JobStepExecution} stepExecution job step execution
 */
exports.beforeStep = function (parameters, stepExecution) {
    coveoHelper = require('*/cartridge/scripts/helper/coveoHelper');
    productRequestGenerator = require('*/cartridge/scripts/generators/productRequestGenerator');
    streamHelper = require('*/cartridge/scripts/helper/streamHelper');
    products = coveoHelper.buildProductQuery(isDelta);
};

exports.read = function (parameters, stepExecution) { // eslint-disable-line
    if (products.hasNext()) {
        return products.next();
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

exports.afterStep = function (success, parameters) {
    var uploadUri = null;
    sourceFolder = parameters.get('srcFolder');
    productFile = coveoHelper.writeProductFile(sourceFolder, productsToExport);
    Logger.info('exportProducts-write - Total products Exported: {0}', productsToExport.length);
    var fileContainer = streamHelper.createFileContainer(productFile, uploadUri);
    uploadUri = fileContainer.object.uploadUri;
    streamHelper.uploadStreamService(productFile, uploadUri);
    var fileContainerResponse = streamHelper.sendFileContainer(fileContainer.object.fileId);
    if (!empty(fileContainerResponse) && fileContainerResponse.ok) {
        if (parameters.get('deleteFile')) {
            productFile.remove();
            Logger.info('File uploaded successfully and removed - ' + productFile.path + '');
        } else if (!empty(parameters.get('archivePath'))) {
            coveoHelper.archiveFeedFile(parameters, productFile);
        }
    }
    Transaction.wrap(function () {
        var lastRunTime = new Date();
        Site.current.preferences.custom.coveoCatalogLastSync = lastRunTime;
    });
};
