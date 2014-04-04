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
				console.log(event.target.result.length);
				var csv = Ext.create("CsvParser", {
					csvString : event.target.result
				});
				app.addGrid(csv);
			};
			reader.onerror = function(){
				console.log('On Error Event');
			};
			// reader.readAsDataURL(file);
			reader.readAsText(file);
		});
	},

	addGrid : function(csv) {

		Ext.create('Ext.data.Store', {
			storeId:'csvStore',
			fields: csv.getHeader(),
			data:{ 'items' : csv.getAsJson() },
			proxy: {
				type: 'memory',
				reader: {
					type: 'json',
					root: 'items'
				}
			}
		});

		var columns = _.map( csv.getHeader(),function(k) {
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
