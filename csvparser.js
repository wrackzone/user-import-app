Ext.define("CsvParser", function() {

    var self;

    return {

        config : {
            csvString : null
        },

        constructor:function(config) {
            self = this;
            this.initConfig(config);
            self.valid = true;
            self.errors = [];
            self.csvArray = self.csvToArray( self.getCsvString());
            return this;
        },

        isValid : function() {
            return self.valid;
        },

        getErrors : function() {
            return self.errors;
        },

        getHeader : function() {
            return self.header;
        },

        csvToArray : function(csvString){
            // The array we're going to build
            var csvArray   = [];
            // Break it into rows to start
            var csvRows    = csvString.split(/[\r\n]/);
            console.log("rows",csvRows.length);

            // Loop through remaining rows
            for(var rowIndex = 0; rowIndex < csvRows.length; rowIndex++) {
                // var rowArray  = csvRows[rowIndex].split(',');
                var rowArray = self.parseCsvRow(csvRows[rowIndex]); 
                // header row
                if (rowIndex===0) {
                    // console.log(rowArray);
                    self.header = rowArray;
                    self.valid = self.header.length > 0;
                } else { // other rows
                    // console.log(rowArray);
                    if (rowArray!==null&&rowArray.length>0) {
                        csvArray.push(rowArray);
                    } else {
                        self.errors.push(rowIndex + ":"+csvRows[rowIndex]);
                    }
                }
            }
            return csvArray;
        },

        parseCsvRow : function(text) {
            var re_valid = /^\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)\s*(?:,\s*(?:'[^'\\]*(?:\\[\S\s][^'\\]*)*'|"[^"\\]*(?:\\[\S\s][^"\\]*)*"|[^,'"\s\\]*(?:\s+[^,'"\s\\]+)*)\s*)*$/;
            var re_value = /(?!\s*$)\s*(?:'([^'\\]*(?:\\[\S\s][^'\\]*)*)'|"([^"\\]*(?:\\[\S\s][^"\\]*)*)"|([^,'"\s\\]*(?:\s+[^,'"\s\\]+)*))\s*(?:,|$)/g;
            // Return NULL if input string is not well formed CSV string.
            if (!re_valid.test(text)) {
            console.warn("CSVtoArray: Invalid csv text.\n\nSee http://stackoverflow.com/questions/8493195/how-can-i-parse-a-csv-string-with-javascript for help.");
            console.warn(text);
            return null;
            }
            var a = [];                     // Initialize array to receive values.
            text.replace(re_value, // "Walk" the string using replace with callback.
            function(m0, m1, m2, m3) {
                // Remove backslash from \' in single quoted values.
                if      (m1 !== undefined) a.push(m1.replace(/\\'/g, "'"));
                // Remove backslash from \" in double quoted values.
                else if (m2 !== undefined) a.push(m2.replace(/\\"/g, '"'));
                else if (m3 !== undefined) a.push(m3);
                return ''; // Return empty string.
            });
            // Handle special case of empty last value.
            if (/,\s*$/.test(text)) a.push('');
            return a;
        },

        getAsJson : function() {
            if (!self.valid)
                return null;
            var csv = [];
            _.each(self.csvArray,function(row,i) {
                // skip first row
                if (i!==0) {
                    var r = {};
                    _.each(self.header,function(cHeader,cIndex) {
                        r[cHeader] = row[cIndex];
                    });
                    csv.push(r);
                }
            });
            return csv;
        }
     };
 });
