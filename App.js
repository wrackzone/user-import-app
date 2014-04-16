var app = null;

Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    items:{ },
    margin : 25,

    // validation:
    // compare to type definitions to highlight which columns will be used (including custom)
    // identify required columns
    // for drop down fields does the value exist.
    // does the row already exist
    // do parent or related items exist
    // length of desc and other fields
    // if project specified does it exist

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
                Ext.MessageBox.show({
                    title: 'File Error',
                    msg: 'Error loading file',
                    buttons: Ext.MessageBox.OK
                });
                console.log('On Error Event');
            };
            // reader.readAsDataURL(file);
            reader.readAsText(file);
        });
    },

    addGrid : function(csv) {

        var items = csv.getAsJson();

        var columns = _.map( csv.getHeader(),function(k) {
                return { text: k, dataIndex: k, flex: 1, width : 100};
        });

        if (app.grid!==undefined && app.grid!==null) {
            app.grid.destroy();
        }

        Ext.create('Ext.data.Store', {
            storeId:'csvStore',
            fields: csv.getHeader(),
            data:{ 'items' : items },
            proxy: {
                type: 'memory',
                reader: {
                    type: 'json',
                    root: 'items'
                }
            }
        });

        app.grid = Ext.create('Ext.grid.Panel', {
            title: 'csv',
            store: Ext.data.StoreManager.lookup('csvStore'),
            columns: columns
        });

        app.add(app.grid);

    }


});
