Ext.define("PartKeepr.Widgets.FilterExpression", {
    extend: "Ext.form.Panel",
    xtype: "partkeepr.filterexpression",

    layout: {
        type: 'vbox',
        align: 'stretch',
        pack: 'start'
    },

    minHeight: 150,
    minWidth: 400,
    width: 400,
    height: 150,
    requires: [],

    bbar: [{
        xtype: 'button',
        itemId: 'apply',
        disabled: true,
        text: i18n("Apply")
    }],
    items: [
        {
            xtype: 'fieldcontainer',
            fieldLabel: i18n("Field"),
            layout: 'hbox',
            items: [
                {
                    flex: 1,
                    xtype: 'textfield',
                    itemId: "field",
                    emptyText: i18n("Select a field"),
                    readOnly: true
                },
                {
                    width: 100,
                    xtype: 'button',
                    itemId: "selectField",
                    text: i18n("Select field")
                }
            ]
        },
        {
            xtype: 'fieldcontainer',
            fieldLabel: i18n("Operator"),
            layout: 'hbox',
            items: [
                {
                    itemId: "operator",
                    xtype: 'combobox',
                    displayField: 'operator',
                    emptyText: i18n("Select an operator"),
                    editable: false,
                    forceSelection: true,
                    valueField: 'operator',
                    flex: 1,
                    returnObject: true
                }
            ]
        }, {
            xtype: 'fieldcontainer',
            fieldLabel: i18n("Value"),
            layout: 'card',
            flex: 1,
            itemId: 'valueCards',
            items: [
                {
                    itemId: 'value',
                    layout: 'hbox',
                    border: false,
                    items: [
                        {
                            disabled: true,
                            itemId: "valueField",
                            xtype: 'textfield',
                            flex: 1
                        },
                        {
                            width: 100,
                            xtype: 'button',
                            hidden: true,
                            itemId: "selectEntity",
                            text: i18n("Select Entity")
                        }
                    ]
                },
                {
                    itemId: 'values',
                    xtype: "grid",
                    store: {
                        fields: ['value'],
                        data: []
                    },
                    columns: [
                        {
                            text: i18n("Value"), dataIndex: "value", flex: 1
                        }
                    ],
                    bbar: [
                        {
                            xtype: 'button',
                            iconCls: 'fugue-icon plus',
                            itemId: 'addValue',
                            text: i18n("Add…")
                        }, {
                            xtype: 'button',
                            iconCls: 'fugue-icon minus',
                            itemId: 'deleteValue',
                            disabled: true,
                            text: i18n("Delete")
                        }
                    ],
                    hideHeaders: false
                },
            ]
        },
    ],

    sourceModel: null,
    objectFilter: null,

    initComponent: function ()
    {
        this.callParent(arguments);
        var j = Ext.create("PartKeepr.Data.store.OperatorStore");
        this.down("#operator").on("change", this.onOperatorChange, this);
        this.down("#operator").setStore(j);
        this.down("#selectField").on("click", this.onFieldSelectClick, this);
        this.down("#selectEntity").on("click", this.onEntitySelectClick, this);
        this.down("#values").on("selectionchange", this.onValuesSelectionChange, this);
        this.down("#deleteValue").on("click", this.onValueDelete, this);
        this.down("#addValue").on("click", this.onValueAdd, this);
        this.down("#apply").on("click", this.onApplyClick, this);
        this.objectFilter = Ext.create("Ext.util.Filter", {
            property: "entity",
            operator: "!=",
            value: false
        });
    },
    onApplyClick: function () {
        var values;

        if (this.down("#operator").getValue().get("operator") == "in") {
            values = [];
            for (var j = 0;j<this.down("#values").getStore().getCount();j++) {
                values.push(this.down("#values").getStore().getAt(j).get("value"));
            }

        } else {
            values = this.down("#valueField").getValue();
        }

        var filter = Ext.create("PartKeepr.util.Filter", {
            property: this.selectedField.data.data.name,
            operator: this.down("#operator").getValue().get("operator"),
            value: values
        });

        this.fireEvent("applyfilter", filter);
    },
    onValueDelete: function ()
    {

        /**
         * @type {Ext.grid.Panel}
         */
        var grid = this.down("#values");
        var selection = grid.getSelection();

        for (var i = 0; i < selection.length; i++) {
            grid.getStore().remove(selection[i]);
        }
    },
    onValueAdd: function ()
    {
        if (this.selectedField.data.data.type == "manytoone") {
            this.onEntitySelectClick();
        } else {
            Ext.Msg.prompt(i18n("Add Value"), i18n("Enter the value to add"), this.onValueEntered, this);
        }
    },
    /**
     * @param grid {Ext.grid.Panel}
     * @param selection {Ext.data.Model[]}
     */
    onValuesSelectionChange: function (grid, selection)
    {
        if (selection.length === 1) {
            this.down("#deleteValue").enable();
        } else {
            this.down("#deleteValue").disable();
        }
    },
    onOperatorChange: function (combo, record)
    {
        this.validateApplyButton();

        if (record === null) {
            this.down("#valueCards").setActiveItem(this.down("#value"));
            this.down("#valueField").setDisabled(true);
            this.down("#apply").setDisabled(true);
            return;
        }

        if (record.get("operator") === "in") {
            this.down("#valueCards").setActiveItem(this.down("#values"));
        } else {
            this.down("#valueCards").setActiveItem(this.down("#value"));
            this.down("#valueField").setDisabled(false);
        }
    },
    validateApplyButton: function () {
        var applyButton = this.down("#apply");

        if (this.down("#field").getValue() === "") {
            applyButton.setDisabled(true);
            return;
        }

        if (this.down("#operator").getValue() === null) {
            applyButton.setDisabled(true);
            return;
        }

        if (this.selectedField.data.data.type == "manytoone") {
            if (this.down("#operator").getValue().get("operator") === "in") {
                if (this.down("#values").getStore().getCount() === 0) {
                    applyButton.setDisabled(true);
                    return;
                }
            } else {
                if (this.down("#valueField").getValue() === "") {
                    applyButton.setDisabled(true);
                    return;
                }
            }
        }

        applyButton.setDisabled(false);
    },
    onFieldSelectClick: function ()
    {
        var modelFieldSelector = Ext.create({
            xtype: 'modelFieldSelector',
            id: 'searchPartFieldSelector',
            border: false,
            sourceModel: this.sourceModel,
            useCheckBoxes: false,
            flex: 1,
            listeners: {
                selectionchange: function (selectionModel, selected)
                {
                    var addFieldButton = this.up("#filterSelectWindow").down("#addSelectedField");

                    if (selected.length == 1 && selected[0].data.data.type !== "onetomany") {
                        addFieldButton.enable();
                    } else {
                        addFieldButton.disable();
                    }
                }
            }
        });

        modelFieldSelector.on("itemdblclick", function (view, record)
        {
            if (record.data.data && record.data.data.type !== "onetomany") {

                this.down("#field").setValue(record.data.data.name);

                this.updateValueFieldState(record);

                this.modelFieldSelectorWindow.close();
            }
        }, this);

        this.modelFieldSelectorWindow = Ext.create("Ext.window.Window", {
            layout: 'fit',
            width: 600,
            height: 600,
            title: i18n("Select Field"),
            itemId: 'filterSelectWindow',
            items: modelFieldSelector,
            bbar: [
                {
                    xtype: 'button',
                    itemId: 'addSelectedField',
                    disabled: true,
                    text: i18n("Add selected Field"),
                    iconCls: 'fugue-icon flask--plus',
                    handler: function ()
                    {
                        var selection = modelFieldSelector.getSelection();

                        if (selection.length == 1 && selection[0].data.data.type !== "onetomany") {
                            this.down("#field").setValue(selection[0].data.data.name);

                            this.updateValueFieldState(selection[0]);
                            this.modelFieldSelectorWindow.close();
                        }
                    },
                    scope: this
                }
            ]
        });

        this.modelFieldSelectorWindow.show();
    },
    updateValueFieldState: function (record)
    {
        this.selectedField = record;


        if (record.data.data.type == "manytoone") {
            this.down("#operator").getStore().addFilter(this.objectFilter);
            this.down("#selectEntity").show();
            this.down("#valueField").setReadOnly(true);
        } else {
            this.down("#operator").getStore().removeFilter(this.objectFilter);
            this.down("#selectEntity").hide();
            this.down("#valueField").setReadOnly(false);
        }

        this.validateApplyButton();
    },
    onEntitySelectClick: function ()
    {
        this.entitySelector = Ext.create("Ext.window.Window", {
            items: Ext.create("PartKeepr.Widgets.EntityPicker", {
                model: this.selectedField.data.data.reference,
                listeners: {
                    entityselect: this.onEntitySelect,
                    scope: this
                },
                ittemId: "entitySelectorPanel"
            }),
            title: i18n("Select entity"),
            width: "80%",
            height: "80%",
            modal: true,
            layout: 'fit',
            maximizable: true,
            closeAction: 'destroy'
        });

        this.entitySelector.show();
    },
    /**
     * @param entity {Ext.data.Model} The entity
     */
    onEntitySelect: function (entity)
    {
        if (this.down("#operator").getValue().get("operator") === "in") {
            this.down("#values").getStore().add({value: entity.getId()});
        } else {
            this.down("#valueField").setValue(entity.getId());
        }
        this.entitySelector.close();
        this.validateApplyButton();
    },
    onValueEntered: function (btn, value)
    {
        if (btn == 'ok') {
            this.down("#values").getStore().add({value: value});
        }
        this.validateApplyButton();
    }
});
