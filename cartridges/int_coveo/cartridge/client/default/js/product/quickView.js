'use strict';
var quickView = require('base/product/quickView');
/**
 * Generates the modal window on the first call.
 *
 */
function getModalHtmlElement() {
    if ($('#quickViewModal').length !== 0) {
        $('#quickViewModal').remove();
    }
    var htmlString = '<!-- Modal -->'
        + '<div class="modal fade" id="quickViewModal" role="dialog">'
        + '<span class="enter-message sr-only" ></span>'
        + '<div class="modal-dialog quick-view-dialog">'
        + '<!-- Modal content-->'
        + '<div class="modal-content">'
        + '<div class="modal-header">'
        + '    <a class="full-pdp-link" href=""></a>'
        + '    <button type="button" class="close pull-right" data-dismiss="modal">'
        + '        <span aria-hidden="true">&times;</span>'
        + '        <span class="sr-only"> </span>'
        + '    </button>'
        + '</div>'
        + '<div class="modal-body"></div>'
        + '<div class="modal-footer"></div>'
        + '</div>'
        + '</div>'
        + '</div>';
    $('body').append(htmlString);
}

/**
 * @typedef {Object} QuickViewHtml
 * @property {string} body - Main Quick View body
 * @property {string} footer - Quick View footer content
 */

/**
 * Parse HTML code in Ajax response
 *
 * @param {string} html - Rendered HTML from quickview template
 * @return {QuickViewHtml} - QuickView content components
 */
function parseHtml(html) {
    var $html = $('<div>').append($.parseHTML(html));

    var body = $html.find('.product-quickview');
    var footer = $html.find('.modal-footer').children();

    return { body: body, footer: footer };
}

/**
 * replaces the content in the modal window on for the selected product variation.
 * @param {string} selectedValueUrl - url to be used to retrieve a new product model
 */
function fillModalElement(selectedValueUrl) {
    $('.modal-body').spinner().start();
    $.ajax({
        url: selectedValueUrl,
        method: 'GET',
        dataType: 'json',
        success: function (data) {
            var parsedHtml = parseHtml(data.renderedTemplate);

            $('.modal-body').empty();
            $('.modal-body').html(parsedHtml.body);
            $('.modal-footer').html(parsedHtml.footer);
            $('.full-pdp-link').text(data.quickViewFullDetailMsg);
            $('#quickViewModal .full-pdp-link').attr('href', data.productUrl);
            $('#quickViewModal .size-chart').attr('href', data.productUrl);
            $('#quickViewModal .modal-header .close .sr-only').text(data.closeButtonText);
            $('#quickViewModal .enter-message').text(data.enterDialogMessage);
            $('#quickViewModal').modal('show');
            $('body').trigger('quickview:ready');

            $.spinner().stop();
        },
        error: function () {
            $.spinner().stop();
        }
    });
}
function querySelectorAllShadows(selector, el = document.body) {
    const childShadows = Array.from(el.querySelectorAll('*')).map(el => el.shadowRoot).filter(Boolean); // eslint-disable-line
    const childResults = childShadows.map(child => querySelectorAllShadows(selector, child));
    const result = Array.from(el.querySelectorAll(selector));
    return result.concat(childResults).flat();
}
function showQuickview() {
    setTimeout(() => {
        var field = querySelectorAllShadows('.quickview');
        $(field).on('click', function (e) {
            e.preventDefault();
            var selectedValueUrl = $(this).next().html();
            $(e.target).trigger('quickview:show');
            getModalHtmlElement();
            fillModalElement(selectedValueUrl);
            e.stopImmediatePropagation();
        });
    }, 1500);
}

quickView.showQuickview = showQuickview;

setTimeout(() => {
    let coveoLoadMore = document.querySelector(".coveo-load-more").shadowRoot.querySelector("button");
    $(coveoLoadMore).on('click', function () {
        showQuickview();
    });
}, 3000);


module.exports = quickView;
