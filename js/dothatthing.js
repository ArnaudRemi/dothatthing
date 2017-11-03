///
/// Import
///

var App = App || {}

/// EXAMPLE
/// App.todolists = {
///   last_updater: 'tabid',
///   lists: [
///     {
///       id: 'autogenereatelistid',
///       title: 'What I have To Do',
///       deleted_at: null,
///       items: [{
///         id: 'autogenerateitemid',
///         value: 'One thing i have to do'
///         deleted_at: "2017-10-25T13:36:50+02:00"  // (ISO 8601)
///         },
///         {...}
///       ]
///     },
///     {...}
///   ]
/// }

App.task_manager = {
  init: function() {
    var self = this;

    App.tab_id = App.task_manager.generate_random_id();

    $('#today').html( moment().format("dddd, MMMM Do") );

    chrome.storage.local.get('todolists', function(result) {
      App.todolists = result.todolists || App.task_manager.init_todolists();
      App.task_manager.show_todolists();
    });

    // TODO
    // Set an ID for the tab -> know which tab save datas

    // synchronize tabs
    chrome.storage.onChanged.addListener(function(changes, namespace) {
      if (changes.todolists.newValue.last_updater == App.tab_id)
        return;

      App.todolists = changes.todolists.newValue;
      var reinit = '<div id="today"></div>' +
                    '<div class="add-list-btn">' +
                      'Add List'+
                    '</div>';
      $('#center').html(reinit);
      $('#today').html( moment().format("dddd, MMMM Do") );
      App.task_manager.show_todolists();
    });

    $('.add-list-btn').click(function(){
      App.task_manager.add_list_item(this);
    })
  },

  // init base todolist when no datas are saved
  init_todolists: function() {
    return {
      last_updater: App.tab_id,
      lists: [{
      id: this.generate_random_id(),
      title: 'What I have To Do',
      items: [{
        id: this.generate_random_id(),
        value: 'Do a list of things to do...'
      }]
    }]};
  },

  // show saved or initialized todolists
  show_todolists: function() {
    var self = this;
    App.todolists.lists.forEach(function(list) {
      var html_list = self.create_list_item(list.title, list.id);
      $(html_list).insertBefore($('.add-list-btn').first());
      self.init_list_interaction(html_list);

      var add_item_btn = html_list.find('.add-item-btn').first();
      list.items.forEach(function(item) {

        if (item.deleted_at) {
          return;
        }

        var html_item = self.create_todo_item(item.value, item.id);
        $(html_item).insertBefore(add_item_btn);
        self.init_item_interation(html_item);
      });
    });
  },

  ///
  /// UTILS
  ///

  save_todolists: function() {
    App.todolists.last_updater = App.tab_id;
    chrome.storage.local.set({'todolists': App.todolists});
  },

  generate_random_id: function() {
    return _.times(10, () => _.random(35).toString(36)).join('');
  },

  // get the id of item or list
  get_item_id: function(html) {
    return _.last($(html).attr('id').split('-'))
  },

  ///
  /// ITEMS
  ///

  save_item_value: function(item) {
    var id = this.get_item_id(item);
    var value = item.closest('.item').find('.text-task').val();
    var list_id = this.get_item_id(item.closest('.list'));
    var items = _.filter(App.todolists.lists, {id: list_id})[0].items

    if ( _.some(items, {id: id}) ){
      _.filter(items, {id: id} )[0].value = value;
    }
  },

  delete_item: function(ckbitem) {
    var id = this.get_item_id(ckbitem);
    var text_item = ckbitem.closest('.item').find('.text-task');
    var list_id = this.get_item_id(ckbitem.closest('.list'));
    var items = _.filter(App.todolists.lists, {id: list_id})[0].items
    var deleted_item = _.filter(items, {id: id})[0]

    if (deleted_item.deleted_at) {
      deleted_item.deleted_at = null;
      text_item.removeClass('strikeout');
      text_item.prop('disabled', false);
    }
    else {
      deleted_item.deleted_at = moment().format();
      text_item.addClass('strikeout');
      text_item.prop('disabled', true);
    }

    // if (_.some(items, {id: id})) {
    //   _.remove( items, {id: id} );
    //   text_item.addClass('strikeout');
    //   text_item.prop('disabled', true);
    // }
    // else {
    //   items.push({id: id, value: text_item.val()});
    //   text_item.removeClass('strikeout');
    //   text_item.prop('disabled', false);
  },

  push_new_item: function(item) {
    var id = this.get_item_id(item);
    var value = item.val();
    var list_id = this.get_item_id(item.closest('.list'));

    _.filter(App.todolists.lists, {id: list_id})[0].items.push({id: id, value: value, created_at: moment().format()})
  },

  add_todo_item: function(btn) {
    var self = this;
    var id = self.generate_random_id();
    var new_item = App.task_manager.create_todo_item('', id);
    new_item.insertBefore($(btn));
    self.push_new_item($(new_item).find('.text-task'));
    self.save_todolists();

    self.init_item_interation(new_item);

    $(new_item).find('.text-task').focus();
  },

  animate_custom_ckb: function(ckb) {
    var id = this.get_item_id(ckb);
    var v = new Vivus('svg-ckb-' + id, {duration: 28, start: 'manual'});

    if (ckb.is(':checked')) {
      v.play()
    }
    else{
      v.reset()
    }
  },

  init_item_interation: function(new_item) {
    var self = this;

    $(new_item).find('.text-task').change(function (){
      self.save_item_value($(this));
      self.save_todolists();
    });

    $(new_item).find('.checkbox-task').change(function (){
      self.animate_custom_ckb($(this));
      self.delete_item($(this));
      self.save_todolists();
    });
  },

  create_todo_item: function(value, id) {
    return $('<div class="item">' +
        '<input class="checkbox-task" type="checkbox" id="todo-item-' + id + '" value="option1">' +
        '<label for="todo-item-' + id + '" class="label-task-ckb">' +
          '<svg class="svg-ckb" id="svg-ckb-' + id + '"  width="17px" height="17px" >' +
            '<g transform="translate(-266.000000, -324.000000)">' +
              '<path class="path-ckb" fill="none" stroke="#185AC8" stroke-width="2" class="path" d="M278,335 C278,335 270,338.403765 270,336 C270,333.596235 279.324527,329.927169 278,329 C276.675473,328.072831 268.850732,330.41561 267.5,330 C266.149268,329.58439 272.705125,325 272.705125,325"/>' +
            '</g>' +
          '</svg>' +
          '</label>' +
        '<input class="text-task" type="text" id="todo-item-text-' + id + '" value="' + value + '" placeholder="Add a task">' +
      '</div>');
  },

  ///
  /// LISTS
  ///

  push_new_list: function(list) {
    var id = this.get_item_id(list);
    var title = list.val();

    App.todolists.lists.push({id: id, title: title, items: []})
  },

  save_list_title: function(list) {
    var id = this.get_item_id(list);
    var title = list.val();

    _.filter(App.todolists.lists, {id: id})[0].title = title;
  },

  add_list_item: function(btn) {
    var self = this;
    var id = self.generate_random_id();
    var new_list = App.task_manager.create_list_item('New List', id);
    new_list.insertBefore($(btn));
    self.push_new_list($(new_list).find('.title'));
    self.save_todolists();

    self.init_list_interaction(new_list);
  },

  init_list_interaction: function(new_list) {
    var self = this;
    $(new_list).find('.title').change(function (){
      self.save_list_title($(this));
      self.save_todolists();
    });

    new_list.find('.add-item-btn').click(function(){
      App.task_manager.add_todo_item(this);
    });
  },

  create_list_item: function(title, id) {
    return $('<div class="list" id="todo-list-' + id + '">' +
        '<input class="title" type="text" id="todo-list-text-' + id + '" value="' + title + '" placeholder="Add a list">' +
        '<div class="add-item-btn" id="todo-list-btn-' + id + '">Add a task</div>' +
      '</div>');
  }

}

$(document).ready(App.task_manager.init);
