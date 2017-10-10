////

var App = App || {}

App.task_manager = {
  init: function() {
    $('.add-item-btn').click(function(){
      App.task_manager.add_todo_item(this);
    })

    $('.add-list-btn').click(function(){
      App.task_manager.add_list_item(this);
    })
  },

  add_todo_item: function(btn) {
    var new_item = App.task_manager.create_todo_item('');
    new_item.insertBefore($(btn));
    $(new_item).find('.text-task').change(function (){
      // save
    });
    $(new_item).find('.text-task').focus();
  },

  create_todo_item: function(value) {
    return $('<div class="item">' +
        '<input class="checkbox-task" type="checkbox" id="todo-3" value="option1">' +
        '<input class="text-task" type="text" id="text-task-3" value="' + value + '">' +
      '</div>');
  },

  add_list_item: function(btn) {
    var new_list = App.task_manager.create_list_item('New Todo List');
    new_list.insertBefore($(btn));
    // save
    new_list.find('.add-item-btn').click(function(){
      App.task_manager.add_todo_item(this);
    })
  },

  create_list_item: function(title) {
    return $('<div class="list">' +
        '<div class="title">' + title + '</div>' +
        '<div class="add-item-btn"><span class="add-icon">+</span> Add a task</div>' +
      '</div>');
  }

}

$(document).ready(App.task_manager.init);