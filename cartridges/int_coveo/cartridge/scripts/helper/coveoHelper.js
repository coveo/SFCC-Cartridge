'use strict';

var Calendar = require('dw/util/Calendar');
var File = require('dw/io/File');
var FileWriter = require('dw/io/FileWriter');
var Logger = require('dw/system/Logger').getLogger('Coveo');
var StringUtils = require('dw/util/StringUtils');
var ProductSearchModel = require('dw/catalog/ProductSearchModel');

var coveoConstant = require('*/cartridge/scripts/utils/coveoConstant');

/**
 * Get Stream api headers
 * @function getStreamAPIHeaders
 * @param {string} accessToken - coveo api access token
 * @returns {string}-headers
 */
function getStreamAPIHeaders() {
    var accessToken = coveoConstant.COVEO_CONSTANTS.API_KEY;
    var headers = {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: 'Bearer ' + accessToken
    };
    return headers;
}

/**
 * Get File Upload headers
 * @function getFileUploadHeaders
 * @returns {string}-headers
 */
function getFileUploadHeaders() {
    var headers = {
        'x-amz-server-side-encryption': 'AES256',
        'Content-Type': 'application/octet-stream'
    };
    return headers;
}

/**
 * Get Chunk headers
 * @function getChunkHeaders
 * @returns {string}-headers
 */
function getChunkHeaders() {
    var accessToken = coveoConstant.COVEO_CONSTANTS.API_KEY;
    var headers = {
        'Authorization': 'Bearer ' + accessToken
    };
    return headers;
}

/**
 * Get Close headers
 * @function getChunkHeaders
 * @param {string} accessToken - coveo api access token
 * @returns {string}-headers
 */
function getStreamCloseHeaders() {
    var accessToken = coveoConstant.COVEO_CONSTANTS.API_KEY;
    var headers = {
        'Authorization': 'Bearer ' + accessToken
    };
    return headers;
}

/**
 * This function is used for delta products
 * @param {boolean} isDelta - isDelta
 * @returns {Object} productSearch - productSearch
 */
function buildProductQuery(isDelta) {
    var productSearchHitsItr;
    try {
        Logger.info('Starting product search...');

        var productSearchModel = new ProductSearchModel();
        productSearchModel.setCategoryID('root');
        productSearchModel.setRecursiveCategorySearch(true);
        productSearchModel.search();
        productSearchHitsItr = productSearchModel.getProductSearchHits();
    } catch (ex) {
        Logger.error('(coveoHelper-buildProductQuery) -> Error occured while bulding the product query and exception is: {0} in {1} : {2}', ex.toString(), ex.fileName, ex.lineNumber);
    }
    return productSearchHitsItr;
}

/**
 * For getting current date for filename
 *
 * @returns {string} current date - current date
 */
function getFormattedDate() {
    var calendar = new Calendar();
    var currentDate = StringUtils.formatCalendar(calendar, "yyyy-MM-dd't'HHmmss.SSS");
    return currentDate;
}

/**
 * Computes Shopping gives feedfile name
 *
 * @param {string} feedType - feedType
 * @returns {string} filename - feed file name
 */
function getFeedFileName(feedType) {
    return 'coveo_catalog_export_' + getFormattedDate() + coveoConstant.COVEO_CONSTANTS.COVEO_FILE_FORMAT;
}

/**
 * Creates Feed File in a IMPEX directory and returns a FileWriter.
 * @param {string} feedType - feedType
 * @param {string} sourcePath - sourcePath
 * @returns {FileWriter} filewriter - filewriter
 */
function createFeedFile(feedType, sourcePath) {
    var workingPath = File.IMPEX + sourcePath;
    var fileName = getFeedFileName(feedType);
    var fileDirectory = new File(workingPath);
    var file = new File(workingPath + fileName);
    if (!file.exists()) {
        fileDirectory.mkdirs();
        return new File(workingPath + fileName);
    }
    return file;
}

/**
 * Creates Feed File in a IMPEX directory.
 * @param {string} sourcePath - sourcePath
 * @returns {FileWriter} filewriter - filewriter
 */
function createProductFeedFile(sourcePath) {
    return createFeedFile(coveoConstant.CoveoFeedType.PRODUCT_FEED, sourcePath);
}

/**
 * Writes Product File in impex
 * @function writeProductFile
 * @param {string} source - source
 * @param {Object} products - products
 * @returns {file} - productFile
 */
function writeProductFile(source, products) {
    var productFile = createProductFeedFile(source);
    var productFileWriter = new FileWriter(productFile);
    productFileWriter.writeLine(JSON.stringify({ AddOrUpdate: products }));
    productFileWriter.flush();
    productFileWriter.close();
    return productFile;
}

/**
 * Archives Feed File in impex
 * @function archiveFeedFile
 * @param {string} parameters - source
 * @param {Object} productFile - products
 */
function archiveFeedFile(parameters, productFile) {
    new File([File.IMPEX, parameters.get('archivePath')].join(File.SEPARATOR)).mkdirs();
    var fileToMoveTo = new File([File.IMPEX, parameters.get('archivePath'), productFile.name].join(File.SEPARATOR));
    productFile.renameTo(fileToMoveTo);
    Logger.info('File uploaded successfully and archived - ' + fileToMoveTo.getName() + '');
}

module.exports = {
    getStreamAPIHeaders: getStreamAPIHeaders,
    getFileUploadHeaders: getFileUploadHeaders,
    getChunkHeaders: getChunkHeaders,
    getStreamCloseHeaders: getStreamCloseHeaders,
    createProductFeedFile: createProductFeedFile,
    buildProductQuery: buildProductQuery,
    writeProductFile: writeProductFile,
    archiveFeedFile: archiveFeedFile
};
