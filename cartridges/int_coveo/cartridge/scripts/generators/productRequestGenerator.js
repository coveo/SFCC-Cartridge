'use strict';

var ArrayList = require('dw/util/ArrayList');
var CatalogMgr = require('dw/catalog/CatalogMgr');
var ProductMgr = require('dw/catalog/ProductMgr');
var coveoConstant = require('*/cartridge/scripts/utils/coveoConstant');
var Logger = require('dw/system/Logger').getLogger('Coveo');
var ObjectAttributeDefinition = require('dw/object/ObjectAttributeDefinition');
var URLUtils = require('dw/web/URLUtils');

var attribute = null;
var coveoField = null;
var coveoFieldKey = null;
var coveoFieldValue = null;

/**
 * Get Additional Attribute
 * @function getAdditionalAttribute
 * @param {Object} object - product
 * @param {Object} coveoFieldMapper - product
 * @param {string} key - product
 * @returns {Object} - Object
 */
function getAdditionalAttribute(object, coveoFieldMapper, key) {
    try {
        if (!empty(object) && !coveoFieldMapper[key].hasOwnProperty('fieldName')) { // eslint-disable-line
            var nextKey = Object.keys(coveoFieldMapper[key]);
            getAdditionalAttribute(object[key], coveoFieldMapper[key], nextKey);
        } else if (!empty(object)) {
            coveoFieldKey = coveoFieldMapper[key];
            coveoFieldValue = object[key];
            attribute = {
                key: coveoFieldKey.fieldName,
                value: coveoFieldValue || ''
            };
        }
    } catch (ex) {
        Logger.error('(productRequestGenerator-getAdditionalAttribute) -> Error occured while processing attributes and exception is: {0} in {1} : {2}', ex.toString(), ex.fileName, ex.lineNumber);
    }
    return attribute;
}

/**
 * Get Coveo Field
 * @function getCoveoField
 * @param {Object} object - product
 * @param {Object} coveoFieldMapper - product
 * @param {string} key - product
 * @returns {Array} - array
 */
function getCoveoField(object, coveoFieldMapper, key) {
    var attributes = [];
    try {
        coveoField = coveoFieldMapper[key];
        if (!empty(object) && coveoFieldMapper[key].hasOwnProperty('fieldName')) { // eslint-disable-line
            coveoFieldKey = coveoFieldMapper[key];
            coveoFieldValue = object[key];
            attribute = {
                key: coveoFieldKey.fieldName,
                value: coveoFieldValue || ''
            };
            attributes.push(attribute);
        } else {
            Object.keys(coveoField).forEach(function (Akey) {
                attributes.push(getAdditionalAttribute(object[key], coveoField, Akey));
            });
        }
    } catch (ex) {
        Logger.error('(productRequestGenerator-getCoveoField) -> Error occured while getting product fields and exception is: {0} in {1} : {2}', ex.toString(), ex.fileName, ex.lineNumber);
    }
    return attributes;
}

/**
 * Get Attribute Value
 * @function getAttributeValue
 * @param {Object} product - product
 * @returns {Array} - array
 */
function getAttributeValue(product) {
    try {
        var additionalFields = [];
        var coveoFieldMapper = coveoConstant.COVEO_FIELD_MAPPER;
        Object.keys(coveoFieldMapper).forEach(function (key) {
            var coveoAttribute = coveoFieldMapper[key];
            var attributeModel = product.getAttributeModel();
            var attributeDefinition = attributeModel.getAttributeDefinition(key);
            var attributeTypeCode = attributeDefinition ? attributeDefinition.valueTypeCode : '';
            var attributeValue = null;
            if (attributeTypeCode) {
                if (attributeDefinition.system) {
                    attributeValue = product[key];
                } else {
                    attributeValue = product.custom[key];
                }
            } else if (empty(attributeDefinition)) {
                coveoAttribute = getCoveoField(product, coveoFieldMapper, key);
                additionalFields = additionalFields.concat(coveoAttribute);
            } else {
                Logger.error('(productRequestGenerator-getAttributeValue) -> Attribute Type Code does not match');
            }
            if (!empty(attributeTypeCode)) {
                var coveoValue = [];
                switch (attributeTypeCode) {
                    case ObjectAttributeDefinition.VALUE_TYPE_ENUM_OF_STRING:
                    case ObjectAttributeDefinition.VALUE_TYPE_ENUM_OF_INT:
                    case ObjectAttributeDefinition.VALUE_TYPE_SET_OF_NUMBER:
                    case ObjectAttributeDefinition.VALUE_TYPE_SET_OF_STRING:
                    case ObjectAttributeDefinition.VALUE_TYPE_SET_OF_INT:
                        var attributes = new ArrayList(attributeValue).toArray();
                        attributes.forEach(element => {
                            coveoValue.push(element.displayValue);
                        });
                        additionalFields.push({
                            key: coveoAttribute.fieldName,
                            value: coveoValue
                        });
                        break;
                    default:
                        additionalFields.push({
                            key: coveoAttribute.fieldName,
                            value: attributeValue
                        });
                        break;
                }
            }
        });
        return additionalFields;
    } catch (ex) {
        Logger.error('(productRequestGenerator-getAttributeValue) -> AttributeId is not system or custom Product Attribute and exception is: {0} in {1} : {2}', ex.toString(), ex.fileName, ex.lineNumber);
        return [];
    }
}

/**
 * Get Product Catagegories
 * @param {Object} product - product
 * @param {string} categoryid - categoryid
 * @param {Array} breadcrumbs - array of breadcrumbs object
 * @returns {string} - string
 */
function getAllCategories(product, categoryid, breadcrumbs) {
    var categories = '';
    try {
        var category;
        if (!empty(product) && empty(categoryid)) {
            category = product.variant
                ? product.masterProduct.primaryCategory
                : product.primaryCategory;
        } else if (!empty(categoryid)) {
            category = CatalogMgr.getCategory(categoryid);
        }

        if (category) {
            breadcrumbs.push(category.displayName);

            if (category.parent && category.parent.ID !== 'root') {
                return getAllCategories(null, category.parent.ID, breadcrumbs);
            }
        }
        var coveoCategory = breadcrumbs.reverse();

        for (let i = 0; i < coveoCategory.length; i++) {
            categories += coveoCategory.slice(0, i + 1).join('|');
            categories += ';';
        }

        categories = categories.slice(0, -1);
    } catch (ex) {
        Logger.error('(productRequestGenerator-getAllCategories) -> Error occured while generating product categories and exception is: {0} in {1} : {2}', ex.toString(), ex.fileName, ex.lineNumber);
    }
    return categories;
}

/**
 * Get product rating
 * @function getProductRating
 * @param {Object} product - product
 * @returns {string} - string
 */
function getProductRating(product) {
    var rateVal = null;
    var sum = null;
    try {
        var id = product.ID;
        sum = id.split('').reduce(function (total, letter) {
            return total + letter.charCodeAt(0);
        }, 0);

        rateVal = (Math.ceil(((sum % 3) + 2) + (((sum % 10) / 10) + 0.1)));
    } catch (ex) {
        Logger.error('(productRequestGenerator-getProductRating) -> Error occured while getting product rating and exception is: {0} in {1} : {2}', ex.toString(), ex.fileName, ex.lineNumber);
    }
    return (rateVal < 5 ? rateVal + (((sum % 10) * 0.1) + 0.1) : rateVal);
}

/**
 * Get product color
 * @function getProductColor
 * @param {Object} product - product
 * @returns {string} - string
 */
function getProductColor(product) {
    var productColor = null;
    try {
        if (product.variant) {
            var productAttribute = product.variationModel.getProductVariationAttribute('color');
            if (!empty(productAttribute)) {
                productColor = product.variationModel.getAllValues(productAttribute).toArray().find(function (color) {
                    return color.ID === product.custom.color;
                });
            }
        }
    } catch (ex) {
        Logger.error('(productRequestGenerator-getProductColor) -> Error occured while getting product color and exception is: {0} in {1} : {2}', ex.toString(), ex.fileName, ex.lineNumber);
    }
    return productColor ? productColor.displayValue : '';
}

/**
 * Get product size
 * @function getProductSize
 * @param {Object} product - product
 * @returns {string} - string
 */
function getProductSize(product) {
    var productSize = null;
    try {
        if (product.variant) {
            var productAttribute = product.variationModel.getProductVariationAttribute('size') || product.variationModel.getProductVariationAttribute('accessorySize');
            if (!empty(productAttribute)) {
                productSize = product.variationModel.getAllValues(productAttribute).toArray().find(function (size) {
                    return size.ID === product.custom.size;
                });
            }
        }
    } catch (ex) {
        Logger.error('(productRequestGenerator-getProductSize) -> Error occured while getting product size and exception is: {0} in {1} : {2}', ex.toString(), ex.fileName, ex.lineNumber);
    }
    return productSize ? productSize.displayValue : '';
}

/**
 * Get Product Data
 * @function getProductsData
 * @param {Object} product - product
 * @param {boolean} isVariant - isVariant
 * @returns {Object} - Object
 */
function getProductsData(product, isVariant) {
    var prdObj = null;
    try {
        var coveoProductAttribute = getAttributeValue(product);
        var coveoProductCategory = getAllCategories(product, null, []);
        var productImage = product.getImage('large');
        var swatchImage = product.getImage('swatch');
        var productRating = getProductRating(product);
        var productColor = getProductColor(product);

        var productCategory = null;
        if (product.variant) {
            productCategory = product.masterProduct && product.masterProduct.primaryCategory ? product.masterProduct.primaryCategory.ID : '';
        } else {
            productCategory = product.primaryCategory ? product.primaryCategory.ID : '';
        }
        prdObj = {
            DocumentId: URLUtils.abs('Product-Show', 'pid', product.ID).toString(),
            ec_sfraquickview: product.variant ? URLUtils.url('Product-ShowQuickView', 'pid', product.masterProduct.ID).toString() : URLUtils.url('Product-ShowQuickView', 'pid', product.ID).toString(),
            ec_sgquickview: product.variant ? URLUtils.url('Product-Show', 'pid', product.masterProduct.ID, 'cgid', productCategory).toString() : URLUtils.url('Product-Show', 'pid', product.ID, 'cgid', productCategory).toString(),
            FileExtension: coveoConstant.COVEO_CONSTANTS.EXTENSION,
            model: coveoConstant.COVEO_CONSTANTS.MODEL,
            ec_productid: product.ID,
            ec_images: productImage && productImage.httpsURL ? productImage.httpsURL.toString() : '',
            ec_swatch: swatchImage && swatchImage.httpsURL ? swatchImage.httpsURL.toString() : '',
            ec_price: product.priceModel.maxPrice.value,
            ec_category: coveoProductCategory,
            objecttype: coveoConstant.COVEO_CONSTANTS.OBJECT_TYPE_PRODUCT,
            ec_rating: productRating,
            ec_brand: product.brand,
            ec_description: product.shortDescription ? product.shortDescription.source : ''
        };
        coveoProductAttribute.forEach(field => {
            if (!empty(field) && field.key !== "ec_color") {
                prdObj[field.key] = field.value;
            }
        });
        if (product.variant && 'color' in product.custom && !empty(product.custom.color)) {
            prdObj.ec_color = productColor;
        }
        if (product.variant && 'size' in product.custom && !empty(product.custom.size)) {
            prdObj.ec_size = getProductSize(product);
        }
        const hasMultipleColors = product.variant ? product.masterProduct.variants.toArray().filter(
            (product, index, self) => self.findIndex(p => p.custom.color === product.custom.color) === index // eslint-disable-line
        ) : [];
        if ((product.variant && product.custom.color && (!empty(hasMultipleColors) && hasMultipleColors.length > 1)) || isVariant) {
            prdObj.ec_item_group_id = product.variant ? 'P' + product.masterProduct.ID : 'P' + product.ID;
        }
    } catch (ex) {
        Logger.error('(productRequestGenerator-getProductsData) -> Error occured while generating products and exception is: {0} in {1} : {2}', ex.toString(), ex.fileName, ex.lineNumber);
    }
    return prdObj;
}

/**
 * Get Variants Data
 * @function getVariantsData
 * @param {Object} product - product
 * @param {string} productId - productId
 * @returns {Object} - Object
 */
function getVariantsData(product, productId) {
    var variantObj = null;
    var variantUrl = product.bundle === true || product.productSet === true || product.optionProduct === true || product.productSetProduct === true;
    try {
        var coveoProductAttribute = getAttributeValue(product);
        variantObj = {
            DocumentId: variantUrl ? URLUtils.abs('Product-Show', 'pid', 's' + product.ID).toString() : URLUtils.abs('Product-Show', 'pid', 's' + product.ID).toString(),
            FileExtension: coveoConstant.COVEO_CONSTANTS.EXTENSION,
            ec_sku: 'S' + product.ID,
            ec_size: getProductSize(product),
            objecttype: coveoConstant.COVEO_CONSTANTS.OBJECT_TYPE_VARIANT,
            ec_productid: productId
        };
        coveoProductAttribute.forEach(field => {
            if (!empty(field) && field.key !== "ec_color") {
                variantObj[field.key] = field.value;
            }
        });
    } catch (ex) {
        Logger.error('(productRequestGenerator-getVariantsData) -> Error occured while generating Product variants and exception is: {0} in {1} : {2}', ex.toString(), ex.fileName, ex.lineNumber);
    }
    return variantObj;
}

/**
 * get product object to be exported
 * @function processProducts
 * @param {Object} product - product
 * @param {boolean} isDelta - isDelta
 * @returns {Object} - product object
 */
function processProducts(product, isDelta) {
    var coveoProducts = [];
    var color = [];

    try {
        var coveoPrd = ProductMgr.getProduct(product);

        if (coveoPrd.master) {
            var productVariant = coveoPrd.variants && coveoPrd.variants.length > 0 ? coveoPrd.variants.iterator() : null;
            var variants = coveoPrd.variants.toArray();
            if (productVariant) {
                var variant = null;
                while (productVariant.hasNext()) {
                    variant = productVariant.next();
                    if (color.indexOf(variant.custom.color) === -1) {
                        coveoProducts.push(getProductsData(variant));
                        var currentProductVariants = variants.filter(function (pvariant) { // eslint-disable-line
                            return pvariant.custom.color === variant.custom.color;
                        });
                        currentProductVariants.forEach(element => { // eslint-disable-line
                            coveoProducts.push(getVariantsData(element, variant.ID));
                        });
                        color.push(variant.custom.color);
                    } else {
                        continue; // eslint-disable-line
                    }
                }
            }
        } else {
            coveoProducts.push(getProductsData(coveoPrd, coveoPrd.variant));
            coveoProducts.push(getVariantsData(coveoPrd, coveoPrd.ID));
        }
    } catch (ex) {
        Logger.error('(productRequestGenerator-processProducts) -> Error occured while processing products and exception is: {0} in {1} : {2}', ex.toString(), ex.fileName, ex.lineNumber);
    }
    return coveoProducts;
}

module.exports = {
    processProducts: processProducts
};
