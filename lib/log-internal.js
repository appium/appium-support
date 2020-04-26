import fs from './fs';
import _ from 'lodash';

const DEFAULT_SECURE_REPLACER = '**SECURE**';

/**
 * @typedef {Object} SecureValuePreprocessingRule
 * @property {RegExp} pattern The parsed pattern which is going to be used for replacement
 * @property {string} replacer [DEFAULT_SECURE_REPLACER] The replacer value to use. By default
 * equals to `DEFAULT_SECURE_REPLACER`
 */

class SecureValuesPreprocessor {
  constructor () {
    this._rules = [];
  }

  /**
   * @returns {Array<SecureValuePreprocessingRule>} The list of successfully
   * parsed preprocessing rules
   */
  get rules () {
    return this._rules;
  }

  /**
   * @typedef {Object} Rule
   * @property {string} pattern A valid RegExp pattern to be replaced
   * @property {string} text A text match to replace. Either this property or the
   * above one must be provided.
   * @property {string} flags ['g'] Regular expression flags for the given pattern.
   * Supported flag are the same as for the standard JavaScript RegExp constructor:
   * https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#Advanced_searching_with_flags_2
   * The 'g' (global matching) is always enabled though.
   * @property {string} replacer [DEFAULT_SECURE_REPLACER] The replacer value to use. By default
   * equals to `DEFAULT_SECURE_REPLACER`
   */

  /**
   * Parses single rule from the given JSON file
   *
   * @param {string|Rule} rule The rule might either be represented as a single string
   * or a configuration object
   * @throws {Error} If there was an error while parsing the rule
   * @returns {SecureValuePreprocessingRule} The parsed rule
   */
  parseRule (rule) {
    if (_.isString(rule)) {
      return {
        pattern: new RegExp(`\\b${_.escapeRegExp(rule)}\\b`, 'g'),
      };
    }

    if (_.isPlainObject(rule)) {
      let pattern;
      if (_.has(rule, 'pattern')) {
        pattern = rule.pattern;
      } else if (_.has(rule, 'text')) {
        pattern = `\\b${_.escapeRegExp(rule.text)}\\b`;
      }
      if (!pattern) {
        throw new Error(`${JSON.stringify(rule)} -> Must either have a field named 'pattern' or 'text'`);
      }

      let flags = ['g'];
      if (_.has(rule, 'flags')) {
        // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Regular_Expressions#Advanced_searching_with_flags_2
        for (const flag of ['i', 'g', 'm', 's', 'u', 'y']) {
          if (_.includes(rule.flags, flag)) {
            flags.push(flag);
          }
        }
        flags = _.uniq(flags);
      }

      const replacer = rule.replacer && _.isString(rule.replacer)
        ? rule.replacer
        : DEFAULT_SECURE_REPLACER;
      try {
        return {
          pattern: new RegExp(pattern, flags.join('')),
          replacer,
        };
      } catch (e) {
        throw new Error(`${JSON.stringify(rule)} -> ${e.message}`);
      }
    }

    throw new Error(`${JSON.stringify(rule)} -> Must either be a string or an object`);
  }

  /**
   * Loads rules from the given JSON file
   *
   * @param {string|Array<string|Rule>} source The full path to the JSON file containing secure
   * values replacement rules or the rules themselves represented as an array
   * @throws {Error} If the format of the source file is invalid or
   * it does not exist
   * @returns {Array<string>} The list of issues found while parsing each rule.
   * An empty list is returned if no rule parsing issues were found
   */
  async loadRules (source) {
    let rules;
    if (_.isArray(source)) {
      rules = source;
    } else {
      if (!await fs.exists(source)) {
        throw new Error(`'${source}' does not exist or is not accessible`);
      }
      try {
        rules = JSON.parse(await fs.readFile(source, 'utf8'));
      } catch (e) {
        throw new Error(`'${source}' must be a valid JSON file. Original error: ${e.message}`);
      }
      if (!_.isArray(rules)) {
        throw new Error(`'${source}' must contain a valid JSON array`);
      }
    }

    const issues = [];
    this._rules = [];
    for (const rule of rules) {
      try {
        this._rules.push(this.parseRule(rule));
      } catch (e) {
        issues.push(e.message);
      }
    }
    return issues;
  }

  /**
   * Performs secure values replacement inside the given string
   * according to the previously loaded rules. No replacement is made
   * if there are no rules or the given value is not a string
   *
   * @param {string} str The string to make replacements in
   * @returns {string} The string with replacements made
   */
  preprocess (str) {
    if (this._rules.length === 0 || !_.isString(str)) {
      return str;
    }

    let result = str;
    for (const rule of this._rules) {
      result = result.replace(rule.pattern, rule.replacer);
    }
    return result;
  }
}

const SECURE_VALUES_PREPROCESSOR = new SecureValuesPreprocessor();

export { SECURE_VALUES_PREPROCESSOR, SecureValuesPreprocessor };
export default SECURE_VALUES_PREPROCESSOR;
