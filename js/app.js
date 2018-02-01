{ /* global rilti localStorage location */
  const {dom, domfn: {Class}, model, run, route, each} = rilti
  const {a, p, ul, li, h1, div, span, input, label, button, section, footer, header} = dom

  const ENTER = 13
  const link = (href, contents, options = {}) => a(Object.assign(options, {href}), contents)

  const todo = model()

  const countTodos = () => {
    const total = todo.store.size
    let done = 0
    todo.each(state => state && done++)
    todo.emit.count(total - done)
    Class(main, 'hidden', total < 1)
  }
  const saveTodos = () => {
    localStorage.setItem('todos', JSON.stringify([...todo.store.entries()]))
    countTodos()
  }
  todo.on.set(saveTodos)
  todo.on.delete(saveTodos)

  todo.once.init(() => run(() => {
    each(
      JSON.parse(localStorage.getItem('todos') || '[]'),
      ([name, state]) => todoItem(name, state)
    )
    countTodos()
    todo.emit.initRoutes()
  }))

  const todoapp = section({class: 'todoapp', render: 'body'})

  footer({
    class: 'info',
    renderAfter: todoapp
  },
    p('Double-click to edit a todo'),
    p('Template by ', link('http://sindresorhus.com', 'Sindre Sorhus')),
    p('Created by ', link('https://github.com/SaulDoesCode', 'SaulDoesCode')),
    p('Part of ', link('http://todomvc.com', 'TodoMVC'))
  )

  header({
    class: 'header',
    render: todoapp
  },
    h1('todos'),
    input({
      class: 'new-todo',
      attr: {
        placeholder: 'What needs to be done?',
        autofocus: true
      },
      on_keydown ({keyCode}, el) {
        const value = el.value.trim()
        if (keyCode === ENTER && value.length > 1) {
          todoItem(value.trim())
          el.value = ''
        }
      }
    })
  )

  const todoList = ul({class: 'todo-list'})

  const main = section({
    class: 'main',
    render: todoapp
  },
    input({
      class: 'toggle-all',
      id: 'toggle-all',
      attr: {type: 'checkbox'},
      on_change (e, {checked}) { todo.emit.toggleAll(checked) }
    }),
    label({attr: {for: 'toggle-all'}}, 'Mark all as complete'),
    todoList
  )

  const todocount = span({class: 'todo-count'})
  todo.on.count((count = 0) => {
    todocount.innerHTML = `<strong>${count}</strong> item${count !== 1 ? 's' : ''} left`
  })

  let activeFilter = 'All'
  const filters = ul({
    class: 'filters'
  },
    [
      ['#/', 'All'],
      ['#/active', 'Active'],
      ['#/completed', 'Completed']
    ].map(([href, name]) => {
      const filter = link(href, name)
      todo.on.filter(type => Class(filter, 'selected', type === name))
      todo.on.initRoutes(() => {
        route(href, () => todo.emit.filter(activeFilter = name))
      })
      return li(filter)
    })
  )
  if (!location.hash) location.hash = '#/'

  footer({
    class: 'footer',
    render: main
  },
    todocount,
    filters,
    button({
      class: 'clear-completed',
      on_click: todo.emit.clearCompleted
    },
      'Clear completed'
    )
  )

  const todoItem = (value, completed = false) => {
    const view = div({class: 'view'})
    const edit = input({
      class: 'edit',
      attr: {value},
      on_blur: e => editingMode(false),
      on_keydown: ({keyCode}) => keyCode === ENTER && editingMode(false)
    })

    const item = li({render: todoList, class: {completed}}, view, edit)

    let oldValue = value
    const editingMode = editing => {
      Class(item, {editing})
      valueLabel.textContent = value = edit.value.trim()
      if (!editing && value !== oldValue) {
        todo.del(oldValue)
        todo[oldValue = value] = completed
      }
    }

    const remove = () => {
      item.remove()
      todo.del(value)
    }

    const applyFilter = (type = activeFilter) => {
      let hidden = false
      if (type === 'Active') hidden = completed
      else if (type === 'Completed') hidden = !completed
      Class(item, {hidden})
      if (toggle.checked !== completed) toggle.checked = completed
    }

    const setState = (state = !completed) => {
      Class(item, 'completed', completed = todo[value] = state)
      applyFilter()
    }

    const toggle = input({
      class: 'toggle',
      render: view,
      attr: {type: 'checkbox'},
      on_change: e => setState()
    })

    const valueLabel = label(
      {render: view, on_dblclick: e => editingMode(true)},
      value
    )

    applyFilter()
    todo.on.filter(applyFilter)
    todo.on.toggleAll(setState)
    todo.on.clearCompleted(() => completed && remove())

    button({class: 'destroy', render: view, once_click: remove})

    if (!todo.has(value)) todo[value] = completed
    return item
  }

  todo.emit.init()
}
