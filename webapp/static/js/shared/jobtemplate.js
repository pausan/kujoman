(function (exports) {
    // ---------------------------------------------------------------------------
    // _variables_ have the form
    //
    //   variables = [
    //     { type : 'integer', range : true, start : 2, end : 8},
    //     { type : 'string', range : false, value : 'my string' }
    //   ]
    //
    // _templates_ have the form
    //
    //   templates = {
    //     id : 'template-name',
    //     name : 'Template Name',
    //     template : 'Expands var={MY_VAR} other_var={OTHER_VAR}'
    //     template_variables : [
    //       { name : 'MY_VAR', type : 'string', range : false, default : 'default-string' },
    //       { name : 'OTHER_VAR', type : 'date',   range : true,  default : 'today' },
    //       ...
    //     ]
    //   }
    // ---------------------------------------------------------------------------

    // ---------------------------------------------------------------------------
    // jobIdFromName
    //
    // Return the normalized version of given job name which only allows numbers and
    // letters and the dash. Everything else is squeezed and converted to a single
    // dash.
    //
    // Example:
    //   >>> jobIdFromName ('This is my job')
    //   'this-is-my-job'
    //
    //   >>> jobIdFromName ('  my **lovely++ job  ')
    //   'my-lovely-job'
    // ---------------------------------------------------------------------------
    exports.jobIdFromName = function jobIdFromName (name) {
      return name.toLowerCase().replace(/[^a-z0-9-]+/g, '-').replace (/^\-+|\-+$/g, '');
    },

    // ---------------------------------------------------------------------------
    // createJobId
    //
    // Create a job template id using given name as prefix, and append some
    // randomness to avoid name collisions
    //
    // Example:
    //   >>> jobIdFromName ('This is my job')
    //   'this-is-my-job-84c2f66a'
    // ---------------------------------------------------------------------------
    exports.createJobId = function createJobId (name) {
      return (
        exports.jobIdFromName (name)
        + '-'
        + Math.random().toString(16).substr(-8).toLowerCase()
      );
    },

    // ---------------------------------------------------------------------------
    // jobVariablesExpandedCount
    //
    // Counts how many combinations exist.
    // ---------------------------------------------------------------------------
    exports.jobVariablesExpandedCount = function jobVariablesExpandedCount (variables) {
      let combinations = 1;

      for (let i = 0; i < variables.length; i++) {
        if (!variables[i].range)
          continue;

        combinations *= exports.jobVariablesExpandRangeCount (
          variables[i].type,
          variables[i].start,
          variables[i].end
        );
      }

      return combinations;
    }

    // ---------------------------------------------------------------------------
    // jobVariablesExpandRangeCount
    //
    // Counts the number of items that would be created if given range would expand.
    //
    // Example:
    //   >>> jobVariablesExpandRangeCount ('int', 3, 3)
    //   1
    //
    //   >>> jobVariablesExpandRangeCount ('int', 4, 0)
    //   5
    //
    //   >>> jobVariablesExpandRangeCount ('int', '2018-01-01', '2018-01-03')
    //   3
    // ---------------------------------------------------------------------------
    exports.jobVariablesExpandRangeCount = function jobVariablesExpandRangeCount (type, start, end) {
      switch (type) {
        case 'int':
        case 'integer':
          return 1 + Math.abs(end - start);

        case 'date':
          return 1 + parseInt(
            Math.ceil (Math.abs(Date.parse (end) - Date.parse(start)) / (86400 * 1000))
          );
      }
      return 1;
    }

    // ---------------------------------------------------------------------------
    // jobTemplateExpandVariables
    //
    // Expand all template variables and returns a list of the expanded templates.
    //
    // Expanded templates take into consideration the order of the variables.
    // Variable combinations will be performed taking into account the order
    // in which the variables have been passed.
    //
    // The list is returned because sometimes the variables might contain ranges,
    // if no ranges are given, a list of a single item will be returned.
    // ---------------------------------------------------------------------------
    exports.jobTemplateExpandVariables = function jobTemplateExpandVariables (template, variables) {
      let vars = variables.slice(); // clone
      return exports.jobTemplateExpandVariablesRecursively ([template], vars.reverse());
    }

    // ---------------------------------------------------------------------------
    // jobTemplateExpandVariablesRecursively
    //
    // Recursively expands templates passed with the remaining variables.
    //
    // WARN: This is far from optimal due to the temporary memory required and the
    //       performance hit... but it was the quickest approach to get it working.
    // ---------------------------------------------------------------------------
    exports.jobTemplateExpandVariablesRecursively = function jobTemplateExpandVariablesRecursively (templates, variables) {
      if (typeof (templates) === 'string')
        templates = [templates];

      if (variables.length == 0)
        return templates;

      let expandedTemplates = [];
      const currentVariable = variables.pop();
      for (let i = 0; i < templates.length; i++) {
        if (currentVariable.range) {
          const result = exports.jobTemplateExpandRange (
            templates[i],
            currentVariable.name,
            currentVariable.type,
            currentVariable.start,
            currentVariable.end
          );
          expandedTemplates.push (... result);
        }
        else {
          expandedTemplates.push(
            exports.jobTemplateReplaceAllValues (templates[i], currentVariable.name, currentVariable.value)
          );
        }
      }

      return exports.jobTemplateExpandVariablesRecursively (expandedTemplates, variables);
    }

    // ---------------------------------------------------------------------------
    // jobTemplateExpandRange
    //
    // Expand template variables with a range of values.
    //
    // Returns a list of templates expanded with each of the values.
    //
    // Example:
    //   >>> jobTemplateExpandRange ('n={NUMBER}', 'NUMBER', 'integer', 1, 3)
    //   ["n=1", "n=2", "n=3"]
    // ---------------------------------------------------------------------------
    exports.jobTemplateExpandRange = function jobTemplateExpandRange (template, key, type, start, end) {
      const values = exports.jobTemplateExpandRangeValues (type, start, end);

      let expanded = [];

      for (let i = 0; i < values.length; i++)
        expanded.push (
          exports.jobTemplateReplaceAllValues (template, key, values[i])
        );

      return expanded;
    }

    // ---------------------------------------------------------------------------
    // jobTemplateExpandRangeValues
    //
    // expand given range using the type provided
    //
    // Example:
    //   >>> jobTemplateExpandRangeValues ('int, '3', 8)
    //   [3, 4, 5, 6, 7, 8]
    // ---------------------------------------------------------------------------
    exports.jobTemplateExpandRangeValues = function jobTemplateExpandRangeValues (type, start, end) {
      // regardless of the type
      if (start == end)
        return [start];

      switch (type.toLowerCase()) {
        case 'int':
        case 'integer': return exports.jobTemplateExpandIntRangeValues (start, end);
        case 'date' :   return exports.jobTemplateExpandDateRangeValues (start, end);
      }

      // any other unknown range, should be expanded as 'start' and 'end'
      return [start, end];
    }

    // ---------------------------------------------------------------------------
    // jobTemplateExpandIntRangeValues
    //
    // expand integer range in direct or reverse order
    //
    // Example:
    //   >>> jobTemplateExpandIntRangeValues ('3', 8)
    //   [3, 4, 5, 6, 7, 8]
    // ---------------------------------------------------------------------------
    exports.jobTemplateExpandIntRangeValues = function jobTemplateExpandIntRangeValues (start, end) {
      start = parseInt (start);
      end = parseInt (end);

      if (start == end) {
        return [start];
      }
      else if (start > end) {
        return exports.jobTemplateExpandIntRangeValues (end, start).reverse();
      }

      let result = [];
      for (let i = start; i <= end; i++) {
        result.push (i);
      }

      return result;
    }

    // ---------------------------------------------------------------------------
    // jobTemplateExpandDateRangeValues
    //
    // expand date range in direct or reverse order. Please note that time values
    // appended to the dates will be ignored, only the absolute start-date and
    // end-dates will be taken into account.
    //
    // Example:
    //   >>> jobTemplateExpandDateRangeValues ('2018-01-01', '2018-01-04')
    //   ['2018-01-01', '2018-01-02', '2018-01-03', '2018-01-04']
    // ---------------------------------------------------------------------------
    exports.jobTemplateExpandDateRangeValues = function jobTemplateExpandDateRangeValues (startDate, endDate) {
      // remove hours:min:seconds, just keep yyyy-mm-dd or similar variations
      if (typeof (startDate) === 'string')
        startDate = startDate.slice (0,10)

      if (typeof (endDate) === 'string')
        endDate = endDate.slice (0,10)

      // parse dates
      const startDateSec = Date.parse (startDate) / 1000;
      const endDateSecs  = Date.parse (endDate) / 1000;

      if (startDateSec > endDateSecs) {
        return jobTemplateExpandDateRangeValues (endDate, startDate).reverse();
      }

      let result = [];
      for (let date = startDateSec; date <= endDateSecs; date += 86400) {
        const dateObj = new Date (date * 1000);

        const year  = dateObj.getFullYear();
        const month = ('00' + (dateObj.getMonth()+1)).slice(-2);
        const day   = ('00' + dateObj.getDate()).slice(-2);

        result.push (year + '-' + month + '-' + day);
      }

      return result;
    }

    // ---------------------------------------------------------------------------
    // jobTemplateReplaceAllValues
    //
    // Expand template variables using given values. Variables passed as template
    // argument should have the form of '{VARIABLE}' with no spaces within braces.
    //
    // _key_ parameter should not include braces.
    //
    // Example:
    //
    //   >>> jobTemplateReplaceAllValues ('I am {NAME}', 'NAME', 'Pau')
    //   "I am Pau"
    // ---------------------------------------------------------------------------
    exports.jobTemplateReplaceAllValues = function jobTemplateReplaceAllValues (template, key, value) {
      const keyEscaped = key.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
      return template.replace (new RegExp ('\\{' + keyEscaped + '\\}', 'g'), value);
    }

    // ---------------------------------------------------------------------------
    // templateFindAllVariables
    //
    // Returns a list of all template variables sorted by name and with no duplicates
    //
    // Example:
    //  >>> templateFindAllVariables ('my {NAME} is {VALUE}')
    //  ['NAME', 'VALUE']
    // ---------------------------------------------------------------------------
    exports.templateFindAllVariables = function templateFindAllVariables (template) {
      let variables = {};

      const re = /\{([A-Z0-9_-]+)\}/g;
      let m;
      while (m = re.exec(template)) {
        // m[1] contains name without braces {}
        variables [m[1]] = true;
      };

      return Object.keys(variables).sort();
    }

    // ---------------------------------------------------------------------------
    // getHtml5TypeForJobDataType
    //
    // Returns the HTML5 type for given job data type
    // ---------------------------------------------------------------------------
    exports.getHtml5TypeForJobDataType = function getHtml5TypeForJobDataType (jobDataType) {
      let html5Type = 'text';
      switch (jobDataType) {
        case 'int':
        case 'integer': html5Type = 'number'; break;
        case 'date' :   html5Type = 'text'; break;
        default: break;
      }
      return html5Type;
    }

})((typeof module !== 'undefined' && typeof module.exports !== 'undefined') ? module.exports : window);