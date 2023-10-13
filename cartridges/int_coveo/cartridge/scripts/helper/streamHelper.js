'use strict';

var coveoStreamService = require('*/cartridge/scripts/services/streamService');
var coveoConstant = require('*/cartridge/scripts/utils/coveoConstant');
var coveoHelper = require('*/cartridge/scripts/helper/coveoHelper');

/**
 * Get Open Stream Service
 * @function openStreamService
 * @returns {Object}-openStreamResponse
 */
function openStreamService() {
    var endPoint = coveoConstant.COVEO_API_ENDPOINT.STREAM + coveoConstant.COVEO_API_ENDPOINT.OPEN;
    var httpHeaders = coveoHelper.getStreamAPIHeaders();
    var openStream = coveoStreamService.createStreamRequest(coveoConstant.COVEO_HTTP_METHOD.POST, endPoint, httpHeaders);
    var openStreamResponse = openStream.call();
    return openStreamResponse;
}

/**
 * Get Upload Stream Service
 * @function uploadStreamService
 * @param {string} productFile - productFile
 * @param {string} uploadUri - uploadUri
 * @returns {Object}-uploadStreamResponse
 */
function uploadStreamService(productFile, uploadUri) {
    var httpHeader = coveoHelper.getFileUploadHeaders();
    var uploadStream = coveoStreamService.createStreamRequest(coveoConstant.COVEO_HTTP_METHOD.PUT, '', httpHeader, uploadUri);
    var uploadStreamResponse = uploadStream.call(productFile);
    return uploadStreamResponse;
}

/**
 * Get Chunk Stream Service
 * @function chunkStreamService
 * @param {string} streamId - streamId
 * @returns {Object}-chunkStreamResponse
 */
function chunkStreamService(streamId) {
    var endPoint = coveoConstant.COVEO_API_ENDPOINT.STREAM + streamId + coveoConstant.COVEO_API_ENDPOINT.CHUNK;
    var chunkHeader = coveoHelper.getChunkHeaders();
    var chunkStream = coveoStreamService.createStreamRequest(coveoConstant.COVEO_HTTP_METHOD.POST, endPoint, chunkHeader);
    var chunkStreamResponse = chunkStream.call();
    return chunkStreamResponse;
}

/**
 * Get Close Stream Service
 * @function closeStreamService
 * @param {string} streamId - streamId
 */
function closeStreamService(streamId) {
    var endPoint = coveoConstant.COVEO_API_ENDPOINT.STREAM + streamId + coveoConstant.COVEO_API_ENDPOINT.CLOSE;
    var httpHeaders = coveoHelper.getStreamCloseHeaders();
    var closeStream = coveoStreamService.createStreamRequest(coveoConstant.COVEO_HTTP_METHOD.POST, endPoint, httpHeaders);
    closeStream.call();
}

/**
 * Get Open File Container
 * @function createFileContainer
 * @returns {Object}-fileContainer
 */
function createFileContainer() {
    var endPoint = coveoConstant.COVEO_API_ENDPOINT.FILECONTAINER;
    var httpHeaders = coveoHelper.getStreamAPIHeaders();
    var coveoOpenFileContainer = coveoStreamService.createStreamRequest(coveoConstant.COVEO_HTTP_METHOD.POST, endPoint, httpHeaders);
    var fileContainer = coveoOpenFileContainer.call();
    return fileContainer;
}

/**
 * Get Send File Container
 * @function sendFileContainer
 * @param {string} fileId - fileId
 * @returns {Object}-fileContainer
 */
function sendFileContainer(fileId) {
    var endPoint = coveoConstant.COVEO_API_ENDPOINT.UPDATEFILE;
    endPoint = endPoint.replace('<fileId>', fileId);
    var httpHeaders = coveoHelper.getStreamAPIHeaders();
    var coveSendFileContainer = coveoStreamService.createStreamRequest(coveoConstant.COVEO_HTTP_METHOD.PUT, endPoint, httpHeaders);
    var fileContainer = coveSendFileContainer.call();
    return fileContainer;
}

module.exports = {
    openStreamService: openStreamService,
    uploadStreamService: uploadStreamService,
    chunkStreamService: chunkStreamService,
    closeStreamService: closeStreamService,
    createFileContainer: createFileContainer,
    sendFileContainer: sendFileContainer
};
