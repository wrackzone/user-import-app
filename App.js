var app = null;

Ext.define('CustomApp', {
	extend: 'Rally.app.App',
	componentCls: 'app',
	items:{ },
	margin : 25,

	launch: function() {

		app = this;

		var ff = Ext.create("Ext.form.field.File", {
			margin : 10,	
			id: 'form-file',
			emptyText: 'Select an image',
			fieldLabel: 'Upload File',
			name: 'photo-path',
			buttonText: 'Select',
			listeners : {
				afterrender : function() {
					var f = document.querySelector('input[type="file"]');
					app.addFileEvent(f);
				}
			},
			width : 400,
			autoRender : true
		});

		app.add(ff);
	},

	addFileEvent : function(f) {
		f.addEventListener('change',function(){
			file = event.target.files[0];
			console.log("file",file);
			var reader = new FileReader();
			reader.onload = function(event){
				var csvArray = app.csvToObject(app.csvToArray(event.target.result));
				// console.log("csv:",csvArray);
				app.addGrid(csvArray);
			};
			reader.onerror = function(){
				console.log('On Error Event');
			};
			// reader.readAsDataURL(file);
			reader.readAsText(file);
		});
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
			var rowArray = app.CSVRowtoArray(csvRows[rowIndex]); 
			if (rowIndex===0)
				console.log(rowArray);
			// console.log(rowArray);
			if (rowArray!==null)
				csvArray.push(rowArray);
		}
		return csvArray;
	},

	CSVRowtoArray : function(text) {
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

	csvToObject : function(csvArray) {
		var header = [];
		var csv = [];
		_.each(csvArray,function(row,i) {
			if (i===0) {
				header = row;
				// clean up the headers
				header = _.map(header,function(h){
					return h.replace(/\./g,"-");
				})

			} else {
				var r = {};
				_.each(header,function(cHeader,cIndex) {
					r[cHeader] = row[cIndex];
				});
				csv.push(r);
			}
		})
		return csv;
	},

	addGrid : function(csvData) {

		var colHeaders = _.keys(csvData[0]);
		console.log("Col Headers",colHeaders);

		Ext.create('Ext.data.Store', {
			storeId:'csvStore',
			fields: colHeaders,
			data:{ 'items' : csvData },
			proxy: {
				type: 'memory',
				reader: {
					type: 'json',
					root: 'items'
				}
			}
		});

		var columns = _.map(_.keys(csvData[0]),function(k) {
				return { text: k, dataIndex: k, flex: 1, width : 100};
		});

		console.log("cols:",columns);

		if (app.grid!==undefined && app.grid!==null)
			app.grid.destroy();

		app.grid = Ext.create('Ext.grid.Panel', {
			title: 'csv',
			store: Ext.data.StoreManager.lookup('csvStore'),
			columns: columns,
			// width: 400,
		});

		app.add(app.grid);

	}


});
