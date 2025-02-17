'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _merge2 = require('lodash/merge');

var _merge3 = _interopRequireDefault(_merge2);

var _set2 = require('lodash/set');

var _set3 = _interopRequireDefault(_set2);

var _isEmpty2 = require('lodash/isEmpty');

var _isEmpty3 = _interopRequireDefault(_isEmpty2);

var _cloneDeep2 = require('lodash/cloneDeep');

var _cloneDeep3 = _interopRequireDefault(_cloneDeep2);

var _isString2 = require('lodash/isString');

var _isString3 = _interopRequireDefault(_isString2);

var _each2 = require('lodash/each');

var _each3 = _interopRequireDefault(_each2);

var _isPlainObject2 = require('lodash/isPlainObject');

var _isPlainObject3 = _interopRequireDefault(_isPlainObject2);

var _isArray2 = require('lodash/isArray');

var _isArray3 = _interopRequireDefault(_isArray2);

exports.default = bodybuilder;

var _queryBuilder = require('./query-builder');

var _queryBuilder2 = _interopRequireDefault(_queryBuilder);

var _filterBuilder = require('./filter-builder');

var _filterBuilder2 = _interopRequireDefault(_filterBuilder);

var _aggregationBuilder = require('./aggregation-builder');

var _aggregationBuilder2 = _interopRequireDefault(_aggregationBuilder);

var _utils = require('./utils');

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

/**
 * **http://bodybuilder.js.org**
 *
 * **https://github.com/danpaz/bodybuilder**
 *
 * Bodybuilder is a small library that makes elasticsearch queries easier to
 * write, read, and maintain 💪. The whole public api is documented here, but
 * how about a simple example to get started:
 *
 * ```
 * bodybuilder()
 *   .query('match', 'message', 'this is a test')
 *   .build()
 *
 * // results in:
 * {
 *   query: {
 *     match: {
 *       message: 'this is a test'
 *     }
 *   }
 * }
 * ```
 *
 * You can chain multiple methods together to build up a more complex query.
 *
 * ```
 * bodybuilder()
 *   .query('match', 'message', 'this is a test')
 *   .filter('term', 'user', 'kimchy')
 *   .notFilter('term', 'user', 'cassie')
 *   .aggregation('terms', 'user')
 *   .build()
 * ```
 *
 * For nested sub-queries or sub-aggregations, pass a function as the last
 * argument and build the nested clause in the body of that function. Note that
 * you must `return` the builder object in the nested function. For example:
 *
 * ```
 * bodybuilder()
 *   .query('nested', 'path', 'obj1', (q) => {
 *     return q.query('match', 'obj1.color', 'blue')
 *   })
 *   .build()
 * ```
 *
 *
 *
 * The entire elasticsearch query DSL is available using the bodybuilder api.
 * There are many more examples in the docs as well as in the tests.
 *
 * @return {bodybuilder} Builder.
 */
function bodybuilder() {
  var body = {};

  return Object.assign({
    /**
     * Set a sort direction on a given field.
     *
     * ```
     * bodybuilder()
     *   .sort('timestamp', 'desc')
     *   .build()
     * ```
     * You can sort multiple fields at once
     *
     * ```
     * bodybuilder()
     *  .sort([
     *    {"categories": "desc"},
     *    {"content": "asc"}
     *  ])
     *   .build()
     * ```
     * Geo Distance sorting is also supported & it's the only sort type that allows for duplicates
     *
     * ```
     * bodyBuilder().sort([
     *     {
     *       _geo_distance: {
     *         'a.pin.location': [-70, 40],
     *         order: 'asc',
     *         unit: 'km',
     *         mode: 'min',
     *         distance_type: 'sloppy_arc'
     *       }
     *     },
     *     {
     *       _geo_distance: {
     *         'b.pin.location': [-140, 80],
     *         order: 'asc',
     *         unit: 'km',
     *         mode: 'min',
     *         distance_type: 'sloppy_arc'
     *       }
     *     }
     *   ])
     *   .sort([
     *     { timestamp: 'desc' },
     *     { content: 'desc' },
     *     { content: 'asc' },
     *    {"price" : {"order" : "asc", "mode" : "avg"}}
     *   ])
     * .build()
     * ```
     *
     * @param  {String} field             Field name.
     * @param  {String} [direction='asc'] A valid direction: 'asc' or 'desc'.
     * @returns {bodybuilder} Builder.
     */
    sort: function sort(field) {
      var direction = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'asc';

      body.sort = body.sort || [];

      if ((0, _isArray3.default)(field)) {

        if ((0, _isPlainObject3.default)(body.sort)) {
          body.sort = [body.sort];
        }

        if ((0, _isArray3.default)(body.sort)) {
          (0, _each3.default)(field, function (sorts) {
            if ((0, _isString3.default)(sorts)) {
              return (0, _utils.sortMerge)(body.sort, sorts, direction);
            }
            (0, _each3.default)(sorts, function (value, key) {
              (0, _utils.sortMerge)(body.sort, key, value);
            });
          });
        }
      } else {
        (0, _utils.sortMerge)(body.sort, field, direction);
      }
      return this;
    },


    /**
     * Set a *from* offset value, for paginating a query.
     *
     * @param  {Number} quantity The offset from the first result you want to
     *                           fetch.
     * @returns {bodybuilder} Builder.
     */
    from: function from(quantity) {
      body.from = quantity;
      return this;
    },


    /**
     * Set a *size* value for maximum results to return.
     *
     * @param  {Number} quantity Maximum number of results to return.
     * @returns {bodybuilder} Builder.
     */
    size: function size(quantity) {
      body.size = quantity;
      return this;
    },


    /**
     * Set any key-value on the elasticsearch body.
     *
     * @param  {String} k Key.
     * @param  {any}    v Value.
     * @returns {bodybuilder} Builder.
     */
    rawOption: function rawOption(k, v) {
      body[k] = v;
      return this;
    },


    /**
     * Collect all queries, filters, and aggregations and build the entire
     * elasticsearch query.
     *
     * @param  {string} [version] (optional) Pass `'v1'` to build for the
     *                            elasticsearch 1.x query dsl.
     *
     * @return {Object} Elasticsearch query body.
     */
    build: function build(version) {
      var queries = this.getQuery();
      var filters = this.getFilter();
      var aggregations = this.getAggregations();

      if (version === 'v1') {
        return _buildV1(body, queries, filters, aggregations);
      }

      return _build(body, queries, filters, aggregations);
    }
  }, (0, _queryBuilder2.default)(), (0, _filterBuilder2.default)(), (0, _aggregationBuilder2.default)());
}

function _buildV1(body, queries, filters, aggregations) {
  var clonedBody = (0, _cloneDeep3.default)(body);

  if (!(0, _isEmpty3.default)(filters)) {
    (0, _set3.default)(clonedBody, 'query.filtered.filter', filters);

    if (!(0, _isEmpty3.default)(queries)) {
      (0, _set3.default)(clonedBody, 'query.filtered.query', queries);
    }
  } else if (!(0, _isEmpty3.default)(queries)) {
    (0, _set3.default)(clonedBody, 'query', queries);
  }

  if (!(0, _isEmpty3.default)(aggregations)) {
    (0, _set3.default)(clonedBody, 'aggregations', aggregations);
  }
  return clonedBody;
}

function _build(body, queries, filters, aggregations) {
  var clonedBody = (0, _cloneDeep3.default)(body);

  if (!(0, _isEmpty3.default)(filters)) {
    var filterBody = {};
    var queryBody = {};
    (0, _set3.default)(filterBody, 'query.bool.filter', filters);
    if (!(0, _isEmpty3.default)(queries.bool)) {
      (0, _set3.default)(queryBody, 'query.bool', queries.bool);
    } else if (!(0, _isEmpty3.default)(queries)) {
      (0, _set3.default)(queryBody, 'query.bool.must', queries);
    }
    (0, _merge3.default)(clonedBody, filterBody, queryBody);
  } else if (!(0, _isEmpty3.default)(queries)) {
    (0, _set3.default)(clonedBody, 'query', queries);
  }

  if (!(0, _isEmpty3.default)(aggregations)) {
    (0, _set3.default)(clonedBody, 'aggs', aggregations);
  }

  return clonedBody;
}

module.exports = bodybuilder;