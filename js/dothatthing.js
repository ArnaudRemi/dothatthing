///
/// Import
///

var App = {}

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
      $('.container').html(reinit);
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
      title: 'My first todo list',
      items: [
        {id: this.generate_random_id(), value: 'Create a new task'},
        {id: this.generate_random_id(), value: 'Mark the first task as done'},
        {id: this.generate_random_id(), value: 'Edit list title'}
      ]
    }]};
  },

  // show saved or initialized todolists
  show_todolists: function() {
    var self = this;
    App.todolists.lists.forEach(function(list) {

      if (list.deleted_at) {
          return;
        }

      var html_list = self.create_list(list.title, list.id);
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
    var value = item.closest('.item').find('.text-task').text();
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
      $('#todo-label-' + id).addClass('checked');
      v.play()
    }
    else{
      $('#todo-label-' + id).removeClass('checked');
      v.reset()
    }
  },

  init_item_interation: function(new_item) {
    var self = this;

    // Delete item if empty
    $(new_item).find('.text-task').blur(function (){

      if ($(new_item).find('.text-task').text() == '') {
        self.delete_item($(this));
        self.save_todolists();
      }
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
    var template = document.getElementById('temp-list-item').innerHTML;
    Mustache.parse(template);
    return $( Mustache.render(template, {id: id, value: value}) );
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
    var title = list.text();

    _.filter(App.todolists.lists, {id: id})[0].title = title;
  },

  add_list_item: function(btn) {
    var self = this;
    var id = self.generate_random_id();
    var new_list = App.task_manager.create_list('New List', id);
    new_list.insertBefore($(btn));
    self.push_new_list($(new_list).find('.title'));
    self.save_todolists();

    self.init_list_interaction(new_list);
  },

  init_list_interaction: function(new_list) {
    var self = this;

    $(new_list).find('.title').blur(function (){
      self.save_list_title($(this));
      self.save_todolists();
    });

    new_list.find('.add-item-btn').click(function(){
      App.task_manager.add_todo_item(this);
    });

    new_list.find('.parent-settings').mouseenter(function(){
      new_list.find('.list-settings').fadeIn({duration: 300})
    })

    new_list.find('.parent-settings').mouseleave(function(){
      new_list.find('.list-settings').fadeOut({duration: 300})
    })

    new_list.find('.delete-btn').click(function(){
      if (confirm('Are you sure you want to delete this list?')) {
        self.delete_list(new_list)
        self.save_todolists()
      }
    })
  },

  delete_list: function(list) {
    var id = this.get_item_id(list)
    var deleted_list = _.filter(App.todolists.lists, {id: id})[0]

    if (deleted_list.deleted_at) {
      deleted_list.deleted_at = null;
    }
    else {
      deleted_list.deleted_at = moment().format();
    }

    list.hide()
  },

  create_list: function(title, id) {
    var template = document.getElementById('temp-list').innerHTML;
    Mustache.parse(template);
    return $( Mustache.render(template, {id: id, title: title}) );
  }

}

$(document).ready(App.task_manager.init);
