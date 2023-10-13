'use strict';
var $ = require('jquery');
function querySelectorAllShadows(selector, el = document.body) {
    const childShadows = Array.from(el.querySelectorAll('*')).map(el => el.shadowRoot).filter(Boolean); // eslint-disable-line
    const childResults = childShadows.map(child => querySelectorAllShadows(selector, child));
    const result = Array.from(el.querySelectorAll(selector));
    return result.concat(childResults).flat();
}

(async () => {
    $('.coveo-search-results').addClass('d-none');
    if ($(".search-mobile").is(':visible')) {
        var coveoSearch = $('.search').find('.coveo-search-page');
        coveoSearch.remove();
    } else {
        var coveoSearchMobile = $('.search-mobile').find('.coveo-search-page');
        coveoSearchMobile.remove();
    }

    await customElements.whenDefined('atomic-search-interface');
    const searchInterface = document.querySelector('.coveo-search-page');
    var coveoApiKey = $('.coveosearch').data('api-key');
    var coveoOrganizationId = $('.coveosearch').data('organization-id');
    var coveoSearchQuery = $('.coveosearch').data('search-query');
    var coveoSearchHub = $('#search').attr('search-hub');

    await searchInterface.initialize({
        accessToken: coveoApiKey,
        organizationId: coveoOrganizationId,
        searchHub: coveoSearchHub,
        preprocessRequest: (request, clientOrigin) => { // eslint-disable-line
            if (clientOrigin === 'searchApiFetch') {
                const body = JSON.parse(request.body);
                body.q = coveoSearchQuery;
                request.body = JSON.stringify(body);
                return request;
            }
        },
        search: {
            preprocessSearchResponseMiddleware: (response) => {
                if (response.body.results.length > 0) {
                    $('.coveo-search-results').removeClass('d-none');
                } else {
                    $('.coveo-search-results').addClass('d-none');
                }
                response.body.results.forEach((prd) => {
                    setTimeout(() => {
                        prd.childResults.forEach((item) => {
                            var coveoSwatch = querySelectorAllShadows('a[href^="' + prd.Uri + '"]');
                            coveoSwatch = coveoSwatch.find(function (swatch) {
                                return $(swatch).children().length > 0;
                            });
                            if (coveoSwatch) {
                                var coveoPrdSwatch = $(coveoSwatch).parent().closest('div');
                                if (item.raw.ec_swatch) {
                                    $(coveoPrdSwatch).prepend("<span class='swatch'><a href='" + item.Uri + "'><img src= " + item.raw.ec_swatch + "></a></span>");
                                }
                            }
                        });
                    }, 1000);
                });
                var searchInput = querySelectorAllShadows('.list-root');
                $(searchInput).css({ 'gap': '0', 'grid-template-columns': 'auto auto auto', 'justify-content': 'flex-start' });
                return response;
            }
        }
    });
    searchInterface.executeFirstSearch();
})();

