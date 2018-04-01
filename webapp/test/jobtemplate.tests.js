const expect = require ('chai').expect;
const JobTemplate = require ('../static/js/shared/jobtemplate.js');

describe ('jobtemplate', function () {
  describe ('jobIdFromName', function () {
    it ('empty', function () {
      expect (JobTemplate.jobIdFromName ('')).to.equal ('');
    });

    it ('basic', function () {
      expect (JobTemplate.jobIdFromName ('this is my job')).to.equal ('this-is-my-job');
      expect (JobTemplate.jobIdFromName ('THIS IS mY JoB')).to.equal ('this-is-my-job');
      expect (JobTemplate.jobIdFromName ('this-is-my-job')).to.equal ('this-is-my-job');
    });

    it ('extra_spaces', function () {
      expect (JobTemplate.jobIdFromName (' this   is  my  job  ')).to.equal ('this-is-my-job');
    });

    it ('multichar', function () {
      expect (JobTemplate.jobIdFromName ('  my **lovely++ job  ')).to.equal ('my-lovely-job');
    });
  });

  describe ('jobVariablesExpandedCount', function () {
    it ('empty', function () {
      expect (
        JobTemplate.jobVariablesExpandedCount ([])
      ).to.equal (1);
    })

    it ('fixed', function () {
      expect (
        JobTemplate.jobVariablesExpandedCount ([
          { name : 'name1', range : false, value : 'value' },
          { name : 'name2', range : false, value : 'value' },
          { name : 'name3', range : false, value : 'value' },
          { name : 'name4', range : false, value : 'value' },
        ])
      ).to.equal (1);
    });

    it ('range', function () {
      expect (
        JobTemplate.jobVariablesExpandedCount ([
          { name : 'name1', range : true, type: 'integer', start : 0, end : 4 },
          { name : 'name2', range : true, type: 'integer', start : 0, end : 5 },
          { name : 'name3', range : true, type: 'integer', start : 0, end : 6 },
          { name : 'name4', range : true, type: 'integer', start : 0, end : 7 }
        ])
      ).to.equal (5*6*7*8);
    });

    it ('range.auto(int)', function () {
      expect (
        JobTemplate.jobVariablesExpandedCount ([
          { name : 'name1', range : true, type: 'auto', start : 0, end : 4 },
          { name : 'name2', range : true, type: 'auto', start : 0, end : 5 },
          { name : 'name3', range : true, type: 'auto', start : 0, end : 6 },
          { name : 'name4', range : true, type: 'auto', start : 0, end : 7 }
        ])
      ).to.equal (5*6*7*8);
    });

    it ('range.mixed', function () {
      expect (
        JobTemplate.jobVariablesExpandedCount ([
          { name : 'name1', range : true, type: 'auto', start : '0', end : 4 },
          { name : 'name2', range : false, type : 'auto', value : 'value' },
          { name : 'name3', range : true, type: 'auto', start : '0', end : '6' },
          { name : 'name4', range : false, type: 'auto', value : 0, start : 0, end : 3 },
          { name : 'name5', range : true, type: 'date', start: '2018-01-10', end: '2018-01-01' }
        ])
      ).to.equal (5*1*7*1*10);
    })

    it ('mixed', function () {
      expect (
        JobTemplate.jobVariablesExpandedCount ([
          { name : 'name1', range : true, type: 'integer', start : 0, end : 2 },
          { name : 'name2', range : false, value : 'value' },
          { name : 'name3', range : true, type: 'integer', start : 0, end : 6 },
          { name : 'name4', range : true, type: 'integer', start : 0, end : 3 }
        ])
      ).to.equal (3*1*7*4);
    })

    it ('date', function () {
      expect (
        JobTemplate.jobVariablesExpandedCount ([
          { name : 'name1', range : true, type: 'date', start: '2018-01-10', end: '2018-01-01' },
        ])
      ).to.equal (10);
    })
  })

  describe ('jobVariablesExpandRangeCount', function () {
    it ('integer', function () {
      expect (
        JobTemplate.jobVariablesExpandRangeCount ('integer', 1, 1)
      ).to.equal (1);

      expect (
        JobTemplate.jobVariablesExpandRangeCount ('int', 0, 2)
      ).to.equal (3);

      expect (
        JobTemplate.jobVariablesExpandRangeCount ('integer', 0, 2)
      ).to.equal (3);

      expect (
        JobTemplate.jobVariablesExpandRangeCount ('integer', -1, 1)
      ).to.equal (3);
    });

    it ('string', function () {
      expect (
        JobTemplate.jobVariablesExpandRangeCount ('string', 'abc', 'zba')
      ).to.equal (1);
    });

    it ('date', function () {
      expect (
        JobTemplate.jobVariablesExpandRangeCount ('date', '2018-01-01', '2018-01-10')
      ).to.equal (10);

      expect (
        JobTemplate.jobVariablesExpandRangeCount ('date', '2018-01-10', '2018-01-01')
      ).to.equal (10);

      expect (
        JobTemplate.jobVariablesExpandRangeCount ('date', '2018-01-10 10:10:10', '2018-01-01 12:12:12')
      ).to.equal (10);

    });
  });

  describe ('jobTemplateExpandVariables', function () {
    it ('mixed.order1', function () {
      const template = '{DATE}: i={I},j={J},k={FIXED}';
      const variables = [
        {name : 'DATE',  type : 'date',    range : true,  start : '2018-01-01', end : '2018-01-02' },
        {name : 'I',     type : 'integer', range : true,  start : 1, end : 2 },
        {name : 'J',     type : 'integer', range : true,  start : 10, end : 12 },
        {name : 'FIXED', type : 'string',  range : false, value: 'i+j' },
      ];

      expect (JobTemplate.jobVariablesExpandedCount (variables), 12);

      // order of vars is initially reversed so the variable with lowest index
      // in the array is keept static until rest of combinations have been applied
      // to the rest of variables
      expect (
        JobTemplate.jobTemplateExpandVariables (template, variables),
      ).to.deep.equal ([
        '2018-01-01: i=1,j=10,k=i+j',
        '2018-01-01: i=1,j=11,k=i+j',
        '2018-01-01: i=1,j=12,k=i+j',

        '2018-01-01: i=2,j=10,k=i+j',
        '2018-01-01: i=2,j=11,k=i+j',
        '2018-01-01: i=2,j=12,k=i+j',

        '2018-01-02: i=1,j=10,k=i+j',
        '2018-01-02: i=1,j=11,k=i+j',
        '2018-01-02: i=1,j=12,k=i+j',

        '2018-01-02: i=2,j=10,k=i+j',
        '2018-01-02: i=2,j=11,k=i+j',
        '2018-01-02: i=2,j=12,k=i+j'
      ]);

      expect (variables.length).to.equal (4);
    })

    // variables array order differs from the mixed.order1 test
    it ('mixed.order2', function () {
      const template = '{DATE}: i={I},j={J},k={FIXED}';
      const variables = [
        {name : 'I',     type : 'integer', range : true,  start : 1, end : 2 },
        {name : 'DATE',  type : 'date',    range : true,  start : '2018-01-01', end : '2018-01-02' },
        {name : 'J',     type : 'integer', range : true,  start : 10, end : 12 },
        {name : 'FIXED', type : 'string',  range : false, value: 'i+j' },
      ];

      expect (JobTemplate.jobVariablesExpandedCount (variables), 12);

      // order is, first j=10,11,12 then day=01-01,01-02 then i=1,2
      expect (
        JobTemplate.jobTemplateExpandVariables (template, variables),
      ).to.deep.equal ([
        '2018-01-01: i=1,j=10,k=i+j',
        '2018-01-01: i=1,j=11,k=i+j',
        '2018-01-01: i=1,j=12,k=i+j',

        '2018-01-02: i=1,j=10,k=i+j',
        '2018-01-02: i=1,j=11,k=i+j',
        '2018-01-02: i=1,j=12,k=i+j',

        '2018-01-01: i=2,j=10,k=i+j',
        '2018-01-01: i=2,j=11,k=i+j',
        '2018-01-01: i=2,j=12,k=i+j',

        '2018-01-02: i=2,j=10,k=i+j',
        '2018-01-02: i=2,j=11,k=i+j',
        '2018-01-02: i=2,j=12,k=i+j'
      ]);

      expect (variables.length).to.equal (4);
    })
  });

  describe ('jobTemplateExpandVariablesRecursively', function () {
    it ('mixed', function () {
      const template = '{DATE}: i={I},j={J},k={FIXED}';
      const variables = [
        {name : 'DATE',  type : 'date',    range : true,  start : '2018-01-01', end : '2018-01-02' },
        {name : 'I',     type : 'integer', range : true,  start : 1, end : 2 },
        {name : 'J',     type : 'integer', range : true,  start : 10, end : 12 },
        {name : 'FIXED', type : 'string',  range : false, value: 'i+j' },
      ];

      expect (JobTemplate.jobVariablesExpandedCount (variables), 12);

      expect (
        JobTemplate.jobTemplateExpandVariablesRecursively (template, variables.slice(0)),
      ).to.deep.equal ([
        '2018-01-01: i=1,j=10,k=i+j',
        '2018-01-02: i=1,j=10,k=i+j',
        '2018-01-01: i=2,j=10,k=i+j',
        '2018-01-02: i=2,j=10,k=i+j',
        '2018-01-01: i=1,j=11,k=i+j',
        '2018-01-02: i=1,j=11,k=i+j',
        '2018-01-01: i=2,j=11,k=i+j',
        '2018-01-02: i=2,j=11,k=i+j',
        '2018-01-01: i=1,j=12,k=i+j',
        '2018-01-02: i=1,j=12,k=i+j',
        '2018-01-01: i=2,j=12,k=i+j',
        '2018-01-02: i=2,j=12,k=i+j'
      ]);
    })
  });

  describe ('jobTemplateExpandRange', function () {
    it ('integer', function () {
      expect (
        JobTemplate.jobTemplateExpandRange ('n={NUMBER}', 'NUMBER', 'integer', 1, 3),
      ).to.deep.equal (["n=1", "n=2", "n=3"]);
    });
  });

  describe ('jobTemplateExpandRangeValues', function () {
    it ('integer', function () {
      expect (JobTemplate.jobTemplateExpandRangeValues ('integer', 0, 10)).to.deep.equal ([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    });

    it ('date', function () {
      expect (
        JobTemplate.jobTemplateExpandRangeValues ('date', '2018-03-01', '2018-03-03')
      ).to.deep.equal (['2018-03-01', '2018-03-02', '2018-03-03']);
    });

    it ('auto', function () {
      expect (
        JobTemplate.jobTemplateExpandRangeValues ('auto', '2018-03-01', '2018-03-03')
      ).to.deep.equal (['2018-03-01', '2018-03-02', '2018-03-03']);

      expect (
        JobTemplate.jobTemplateExpandRangeValues ('auto', '1', '3')
      ).to.deep.equal ([1, 2, 3]);

      expect (
        JobTemplate.jobTemplateExpandRangeValues ('auto', 1, 3)
      ).to.deep.equal ([1, 2, 3]);
    });
  });

  describe ('jobTemplateExpandIntRangeValues', function () {
    it ('check', function () {
      expect (JobTemplate.jobTemplateExpandIntRangeValues (0, 10)).to.deep.equal ([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      expect (JobTemplate.jobTemplateExpandIntRangeValues (0, '10')).to.deep.equal ([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
      expect (JobTemplate.jobTemplateExpandIntRangeValues (10, '10')).to.deep.equal ([10]);
      expect (JobTemplate.jobTemplateExpandIntRangeValues ('3', 10)).to.deep.equal ([3, 4, 5, 6, 7, 8, 9, 10]);
      expect (JobTemplate.jobTemplateExpandIntRangeValues ('5', '-5')).to.deep.equal ([5, 4, 3, 2, 1, 0, -1, -2, -3, -4, -5]);
    });
  });

  describe ('jobTemplateExpandDateRangeValues', function () {
    it ('same_day', function () {
      expect (
        JobTemplate.jobTemplateExpandDateRangeValues ('2018-03-03', '2018-03-03')
      ).to.deep.equal (['2018-03-03']);

      expect (
        JobTemplate.jobTemplateExpandDateRangeValues ('2001-12-31', '2001-12-31')
      ).to.deep.equal (['2001-12-31']);
    });

    it ('past_to_future', function () {
      expect (
        JobTemplate.jobTemplateExpandDateRangeValues ('2018-03-01', '2018-03-03')
      ).to.deep.equal (['2018-03-01', '2018-03-02', '2018-03-03']);
    });

    it ('past_to_future.across_months', function () {
      expect (
        JobTemplate.jobTemplateExpandDateRangeValues ('2018-02-27', '2018-03-03')
      ).to.deep.equal (['2018-02-27', '2018-02-28', '2018-03-01', '2018-03-02', '2018-03-03']);

      expect (
        JobTemplate.jobTemplateExpandDateRangeValues ('2016-02-27', '2016-03-03')
      ).to.deep.equal (['2016-02-27', '2016-02-28', '2016-02-29', '2016-03-01', '2016-03-02', '2016-03-03']);
    });

    it ('future_to_past', function () {
      expect (
        JobTemplate.jobTemplateExpandDateRangeValues ('2018-03-03', '2018-03-01')
      ).to.deep.equal (['2018-03-03', '2018-03-02', '2018-03-01']);
    });

    it ('ignore_time', function () {
      expect (
        JobTemplate.jobTemplateExpandDateRangeValues ('2018-03-03 10:47:21', '2018-03-01 00:00:00')
      ).to.deep.equal (['2018-03-03', '2018-03-02', '2018-03-01']);

      expect (
        JobTemplate.jobTemplateExpandDateRangeValues ('2018-03-03 23:59:59', '2018-03-01 00:00:00')
      ).to.deep.equal (['2018-03-03', '2018-03-02', '2018-03-01']);

      expect (
        JobTemplate.jobTemplateExpandDateRangeValues ('2018-03-01 23:59:59', '2018-03-03 00:00:00')
      ).to.deep.equal (['2018-03-01', '2018-03-02', '2018-03-03']);

      expect (
        JobTemplate.jobTemplateExpandDateRangeValues ('2018-03-03 00:00:00', '2018-03-01 23:59:59')
      ).to.deep.equal (['2018-03-03', '2018-03-02', '2018-03-01']);
    });
  });

  describe ('jobTemplateReplaceAllValues', function () {
    it ('string.simple', function () {
      expect (
        JobTemplate.jobTemplateReplaceAllValues ('I am {NAME}', 'NAME', 'Pau')
      ).to.equal ('I am Pau');
    });

    it ('string.multiple_times', function () {
      expect (
        JobTemplate.jobTemplateReplaceAllValues ('{NAME} said: I am {NAME}', 'NAME', 'Pau')
      ).to.equal ('Pau said: I am Pau');
    });

    it ('string.multiple_vars', function () {
      expect (
        JobTemplate.jobTemplateReplaceAllValues (
          JobTemplate.jobTemplateReplaceAllValues (
            'I am {NAME} {SURNAME}', 'NAME', 'Pau'
          ),
          'SURNAME',
          'Sanchez'
        )
      ).to.equal ('I am Pau Sanchez');
    });

    it ('integer', function () {
      expect (
        JobTemplate.jobTemplateReplaceAllValues ('n = {NAME}', 'NAME', 3)
      ).to.equal ('n = 3');
    });
  });

  describe ('templateFindAllVariables', function () {
    it ('multiple', function () {
      expect (
        JobTemplate.templateFindAllVariables ('this is { IS_NOT_A_VAR } {VAR1}, {AAA}, {VAR2}, {ZZZ} and {MY_VARIABLE_3}')
      ).to.deep.equal (['AAA', 'MY_VARIABLE_3', 'VAR1', 'VAR2', 'ZZZ'])
    })
  });

  describe ('detectType', function () {
    it ('null', function () {
      expect (JobTemplate.detectType (null)).to.equal ('string');
      expect (JobTemplate.detectType (undefined)).to.equal ('string');
    });

    it ('integer', function () {
      expect (JobTemplate.detectType (0)).to.equal ('integer');
      expect (JobTemplate.detectType (123)).to.equal ('integer');
      expect (JobTemplate.detectType ('1234')).to.equal ('integer');
    });

    it ('string', function () {
      expect (JobTemplate.detectType ('')).to.equal ('string');
      expect (JobTemplate.detectType ('something')).to.equal ('string');
    });

    it ('date', function () {
      expect (JobTemplate.detectType ('2018-01-01')).to.equal ('date');
      expect (JobTemplate.detectType (' 2018-01-01 ')).to.equal ('date');
      expect (JobTemplate.detectType (' 1999-12-17')).to.equal ('date');
    })
  });

  describe ('getHtml5TypeForJobDataType', function () {
    it ('integer', function () {
      expect (
        JobTemplate.getHtml5TypeForJobDataType ('int')
      ).to.equal ('number');

      expect (
        JobTemplate.getHtml5TypeForJobDataType ('integer')
      ).to.equal ('number');
    })

    it ('string', function () {
      expect (
        JobTemplate.getHtml5TypeForJobDataType ('string')
      ).to.equal ('text');
    })

    it ('date', function () {
      expect (
        JobTemplate.getHtml5TypeForJobDataType ('date')
      ).to.equal ('text');
    })
  });
});