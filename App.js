var app = null;
var console = window.console || {};

console.log   = console.log || Ext.emptyFn;
console.dir   = console.dir || Ext.emptyFn;
console.error = console.error || Ext.emptyFn;

Ext.define('CustomApp', {
    extend: 'Rally.app.App',
    componentCls: 'app',
    items:{ },
    margin : 25,

    types: ['User', 'UserProfile', 'WorkspacePermission', 'ProjectPermission'],
    blacklistFields: ['ObjectID'],
    requiredFields: ['UserName', 'EmailAddress'],
    specialFields: ['WorkspacePermissions', 'ProjectPermissions', 'DefaultWorkspace', 'DefaultProject'],
    defaultBlankFields: ['FirstName', 'MiddleName', 'LastName', 'OnpremLdapUsername'],
    customFields: [],
    fieldValues: {},

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
            emptyText: 'Select a CSV File',
            fieldLabel: 'Upload File',
            name: 'csv-path',
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
            //console.log("file",file);
            var reader = new FileReader();
            reader.onload = function(event){
                //console.log(event.target.result.length);
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
                console.error('On Error Event');
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

        Ext.create('Rally.data.custom.Store', {
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

        app.grid = Ext.create('Rally.ui.grid.Grid', {
            //title: 'csv',
            store: Ext.data.StoreManager.lookup('csvStore'),
            plugins: [ 'rallycellediting' ],
            enableEditing: true,
            columnCfgs: columns,
            tbar: [{
              xtype: 'tbfill'
            }, {
              xtype: 'rallybutton',
              text: 'Validate',
              handler: app.doValidation
            }, {
              xtype: 'rallybutton',
              text: 'Validate Projects',
              handler: Ext.emptyFn
            }, {
              xtype: 'rallybutton',
              text: 'Validate Users',
              handler: Ext.emptyFn
            }, {
              xtype: 'rallybutton',
              text: 'Import',
              handler: app._import
            }]
        });

        app.add(app.grid);

    },

    doValidation: function () {
      var headerPromise = app._validateHeaders();

      //console.log(headerPromise);
      headerPromise.then(function (hasAllRequired) {
        if (hasAllRequired) {
          app._validateRows();
        }
      });
    },

    _validateProjects: function () {
    },

    _validateRows: function () {
      var store = Ext.data.StoreManager.lookup('csvStore');
      var valid = true;

      store.each(function (row) {
        var v = app._validateRow(row);
        valid = valid && !!v.length;
      });

      return valid;
    },

    _validateRow: function (row) {
      return _(app.fieldValues).map(function (fields, typeName) {
        return _.map(fields, function (value, name) {
          var f = row.get(name);
          if (!f && _.contains(app.customFields, name)) {
            f = row.get(name.substring(2));
          }

          if (!f) {
            return null;
          } else if (_.isArray(value)) {
            return _.contains(value, f) ? null : name;
          } else if (value === 'STRING') {
            return f.length < 255 ? null : name;
          } else if (value === 'TEXT') {
            return f.length < 32535 ? null : name;
          } else if (value === 'BOOLEAN') {
            if (_.isString(f)) {
              return (f.toLowerCase() === 'true' || f.toLowerCase() === 'false') ? null : name;
            } else {
              return _.isBoolean(f) ? null : name;
            }
          } else if (value === 'EMAIL') {
            return f.indexOf('@') !== -1 ? null : name;
          } else if (value === 'OBJECT') {
            return null;
          //} else if (value === '') {
          //} else if (value === '') {
          } else {
            console.log(name, f, value);
            return null;
          }
        });
      }).flatten().unique().pull(null, undefined).value();
    },

    _validateHeaders: function () {
      var model = Ext.data.StoreManager.lookup('csvStore').first();
      var fields;
      var promises = [];
      var defer = Ext.create('Deft.promise.Deferred');

      if (!model) {
        defer.reject(new Error('No data was loaded'));
        return defer.promise;
      }

      fields = _.transform(model.data, function (res, f, k) { res[k] = 0; });

      Rally.data.ModelFactory.getModels({
        types: app.types,
        success: function (models) {
          _.each(models, function (model, type) {
            app.fieldValues[type] = app.fieldValues[type] || {};
            _.each(model.getFields(), function (f) {
              if (f.attributeDefinition) {
                app.fieldValues[type][f.name] = f.attributeDefinition.AttributeType;
                if (type === 'User' && (f.name.toLowerCase() === 'username' || f.name.toLowerCase() === 'emailaddress')) {
                  app.fieldValues[type][f.name] = 'EMAIL';
                }
                console.log(f.name, app.fieldValues[type][f.name]);
              }

              if (f.custom) {
                app.customFields.push(f.name);
              }

              if (_.isArray(f.allowedValues)) {
                if (f.allowedValues.length) {
                  app.fieldValues[type][f.name] = _.map(f.allowedValues, function (r) { return r.StringValue; });
                }
              } else if (_.isObject(f.allowedValues)) {
                (function (name, type) {
                  promises.push(f.getAllowedValueStore().load().then(function (records) {
                    if (records.length) {
                      app.fieldValues[type][name] = _.map(records, function (r) { return r.get('StringValue'); });
                    }
                  }));
                }(f.name, type));
              }

              if (fields.hasOwnProperty(f.name)) {
                fields[f.name] = 1;
              }

              if (f.required && f.creatable && !_.contains(app.blacklistFields, f.name)) {
                app.requiredFields.push(f.name);
              }
            });
          });


          app.requiredFields = _.unique(app.requiredFields);
          var hasAllRequired = _.all(app.requiredFields, function (rf) { return !!fields[rf] || _.contains(app.defaultBlankFields, rf); });

          Deft.Promise.all(promises).then(function () { defer.resolve(hasAllRequired); });
        }
      });

      return defer.promise;
    },

    _import: function () {
    }

});
