// ---------------------------------------------------------------------------
// jobVariablesExpandedCount
//
// Counts how many combinations exist.
// ---------------------------------------------------------------------------
function jobVariablesExpandedCount (variables) {
  let combinations = 1;

  for (let i = 0; i < variables.length; i++) {
    if (!variables[i].range)
      continue;

    combinations *= jobVariablesExpandRangeCount (
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
function jobVariablesExpandRangeCount (type, start, end) {
  switch (type) {
    case 'int':
    case 'integer':
      return 1 + Math.abs(end - start);

    case 'date':
      return 1 + (Math.abs(Date.parse (end) - Date.parse(start)) / (86400 * 1000));
  }
  return 1;
}

// ---------------------------------------------------------------------------
// jobTemplateExpandVariables
//
// Expand all template variables and returns a list of the expanded templates.
//
// The list is returned because sometimes the variables might contain ranges,
// if no ranges are given, a list of a single item will be returned.
// ---------------------------------------------------------------------------
function jobTemplateExpandVariables (template, variables) {
  let vars = variables.slice(); // clone
  return jobTemplateExpandVariablesRecursively ([template], vars.reverse());
}

// ---------------------------------------------------------------------------
// jobTemplateExpandVariablesRecursively
//
// Recursively expands templates passed with the remaining variables.
//
// WARN: This is far from optimal due to the temporary memory required and the
//       performance hit... but it was the quickest approach to get it working.
// ---------------------------------------------------------------------------
function jobTemplateExpandVariablesRecursively (templates, variables) {
  if (variables.length == 0)
    return templates;

  let expandedTemplates = [];
  const currentVariable = variables.pop();
  for (let i = 0; i < templates.length; i++) {
    if (currentVariable.range) {
      const result = jobTemplateExpandRange (
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
        jobTemplateReplaceAllValues (templates[i], currentVariable.name, currentVariable.value)
      );
    }
  }

  return jobTemplateExpandVariablesRecursively (expandedTemplates, variables);
}

// ---------------------------------------------------------------------------
// jobTemplateExpandRange
//
// Expand template variables with a range of values.
//
// Returns a list of templates expanded with each of the values.
//
// Example:
//   >>> jobTemplateExpandRange ('I am {NAME}', 'NAME', 'Pau')
//   "I am Pau"
// ---------------------------------------------------------------------------
function jobTemplateExpandRange (template, key, type, start, end) {
  const values = jobTemplateExpandRangeValues (type, start, end);

  let expanded = [];

  for (let i = 0; i < values.length; i++)
    expanded.push (jobTemplateReplaceAllValues (template, key, values[i]));

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
function jobTemplateExpandRangeValues (type, start, end) {
  // regardless of the type
  if (start == end)
    return [start];

  switch (type.toLowerCase()) {
    case 'int':
    case 'integer': return jobTemplateExpandIntRangeValues (start, end);
    case 'date' :   return jobTemplateExpandDateRangeValues (start, end);
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
function jobTemplateExpandIntRangeValues (start, end) {
  start = parseInt (start);
  end = parseInt (end);

  if (start == end) {
    return [start];
  }
  else if (start > end) {
    return jobTemplateExpandIntRangeValues (end, start).reverse();
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
// expand date range in direct or reverse order
//
// Example:
//   >>> jobTemplateExpandDateRangeValues ('2018-01-01', '2018-01-04')
//   ['2018-01-01', '2018-01-02', '2018-01-03', '2018-01-04']
// ---------------------------------------------------------------------------
function jobTemplateExpandDateRangeValues (startDate, endDate) {
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
function jobTemplateReplaceAllValues (template, key, value) {
  const keyEscaped = key.replace(/([.*+?^=!:${}()|\[\]\/\\])/g, "\\$1");
  return template.replace (new RegExp ('\\{' + keyEscaped + '\\}', 'g'), value);
}

// TODO: unittest
//- console.log (jobTemplateExpandIntRangeValues (0, 10));
//- console.log (jobTemplateExpandIntRangeValues (0, '10'));
//- console.log (jobTemplateExpandIntRangeValues (10, '10'));
//- console.log (jobTemplateExpandIntRangeValues ('3', 10));
//- console.log (jobTemplateExpandIntRangeValues ('5', '-5'));


// ---------------------------------------------------------------------------
// getHtml5TypeForJobDataType
//
// Returns the HTML5 type for given job data type
// ---------------------------------------------------------------------------
function getHtml5TypeForJobDataType (jobDataType) {
  let html5Type = 'text';
  switch (jobDataType) {
    case 'int':
    case 'integer': html5Type = 'number'; break;
    case 'date' :   html5Type = 'text'; break;
    default: break;
  }
  return html5Type;
}
