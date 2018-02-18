{ /* global rilti localStorage */
  const {dom, domfn: {Class}, model, run, route} = rilti
  const {a, p, ul, li, h1, div, span, input, label, button, section, footer, header} = dom

  const ENTER = 13
  const link = (href, contents) => a({href}, contents)

  const todo = model(localStorage.getItem('todos'))

  const saveTodos = () => {
    localStorage.setItem('todos', todo.toJSONArray())
    countTodos()
  }
  todo.on.set(saveTodos)
  todo.on.delete(saveTodos)

  todo.once.init(() => {
    todo.each((state, name) => todoItem(name, state))
    todo.emit.initRoutes()
    countTodos()
  })
  run(todo.emit.init) // defer inition

  const countTodos = () => {
    let done = 0
    todo.each(state => state && done++)
    const undone = todo.size - done
    todocount.innerHTML = `<strong>${undone}</strong> item${undone !== 1 ? 's' : ''} left`
    Class(main, 'hidden', todo.size < 1)
  }

  const todoapp = section({class: 'todoapp', render: 'body'})
  const todocount = span({class: 'todo-count'})

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
      onkeydown ({keyCode}, el) {
        const value = el.value.trim()
        if (keyCode === ENTER && value.length > 1) {
          todoItem(value.trim())
          el.value = ''
        }
      }
    })
  )

  footer({
    class: 'info',
    renderAfter: todoapp
  },
    p('Double-click to edit a todo'),
    p('Template by ', link('http://sindresorhus.com', 'Sindre Sorhus')),
    p('Created by ', link('https://github.com/SaulDoesCode', 'SaulDoesCode')),
    p('Part of ', link('http://todomvc.com', 'TodoMVC'))
  )

  const todoList = ul({class: 'todo-list'})

  const main = section({
    class: 'main',
    render: todoapp
  },
    input({
      class: 'toggle-all',
      id: 'toggle-all',
      type: 'checkbox',
      onchange: (e, {checked}) => todo.emit.toggleAll(checked)
    }),
    label({attr: {for: 'toggle-all'}}, 'Mark all as complete'),
    todoList
  )

  const filters = ul({
    class: 'filters',
    props: {active: 'All'}
  },
    [
      ['#/', 'All'],
      ['#/active', 'Active'],
      ['#/completed', 'Completed']
    ].map(([href, name]) => {
      const filter = link(href, name)
      todo.on.filter(type => Class(filter, 'selected', type === name))
      todo.on.initRoutes(() => {
        route(href, () => todo.emit.filter(filters.active = name))
      })
      return li(filter)
    })
  )

  footer({
    class: 'footer',
    render: main
  },
    todocount,
    filters,
    button({
      class: 'clear-completed',
      onclick: todo.emit.clearCompleted
    },
      'Clear completed'
    )
  )

  const todoItem = (value, completed = false) => {
    const view = div({class: 'view'})
    const edit = input({
      class: 'edit',
      value,
      on: {
        blur: e => editingMode(false),
        keydown: ({keyCode}) => keyCode === ENTER && editingMode(false)
      }
    })

    const item = li({render: todoList, class: {completed}}, view, edit)

    let oldValue = value
    const editingMode = editing => {
      Class(item, {editing})
      valueLabel.textContent = value = edit.value.trim()
      if (editing) edit.focus()
      else if (value !== oldValue) {
        todo.del(oldValue)
        todo(oldValue = value, completed)
      }
    }

    const remove = () => {
      item.remove()
      todo.del(value)
    }

    const setState = (state = !completed) => {
      Class(item, 'completed', todo(value, completed = state))
      applyFilter()
    }

    const toggle = input({
      class: 'toggle',
      render: view,
      type: 'checkbox',
      onchange: e => setState()
    })

    const valueLabel = label(
      {render: view, ondblclick: e => editingMode(true)},
      value
    )

    button({class: 'destroy', render: view, onceclick: remove})

    const applyFilter = (type = filters.active) => {
      if (toggle.checked !== completed) toggle.checked = completed
      Class(item, 'hidden', (type === 'Active' && completed) || (type === 'Completed' && !completed))
    }

    applyFilter()
    todo.on.filter(applyFilter)
    todo.on.toggleAll(setState)
    todo.on.clearCompleted(() => completed && remove())

    todo(value, completed)
    return item
  }
}
