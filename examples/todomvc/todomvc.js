//model
var state = {
	dispatch: function(action, args) {
		state[action].apply(state, args || [])
		requestAnimationFrame(function() {
			localStorage["todos-mithril"] = JSON.stringify(state.todos)
		})
	},
	
	todos: JSON.parse(localStorage["todos-mithril"] || "[]"),
	editing: null,
	filter: "",
	remaining: 0,
	todosByStatus: [],
	
	createTodo: function(title) {
		state.todos.push({title: title.trim(), completed: false})
	},
	setStatuses: function(completed) {
		for (var i = 0; i < state.todos.length; i++) state.todos[i].completed = completed
	},
	setStatus: function(todo, completed) {
		todo.completed = completed
	},
	destroy: function(todo) {
		var index = state.todos.indexOf(todo)
		if (index > -1) state.todos.splice(index, 1)
	},
	clear: function() {
		for (var i = 0; i < state.todos.length; i++) {
			if (state.todos[i].completed) state.destroy(state.todos[i--])
		}
	},

	edit: function(todo) {
		state.editing = todo
	},
	update: function(title) {
		if (state.editing != null) {
			state.editing.title = title.trim()
			if (state.editing.title === "") destroy(state.editing)
			state.editing = null
		}
	},
	reset: function() {
		state.editing = null
	},

	computed: function(vnode) {
		state.showing = vnode.attrs.status || ""
		state.remaining = state.todos.filter(function(todo) {return !todo.completed}).length
		state.todosByStatus = state.todos.filter(function(todo) {
			switch (state.showing) {
				case "": return true
				case "active": return !todo.completed
				case "completed": return todo.completed
			}
		})
	}
}

//view
var Todos = {
	add: function(e) {
		if (e.keyCode === 13) {
			state.dispatch("createTodo", [e.target.value])
			e.target.value = ""
		}
	},
	toggleAll: function() {
		state.dispatch("setStatuses", [document.getElementById("toggle-all").checked])
	},
	toggle: function(todo) {
		state.dispatch("setStatus", [todo, !todo.completed])
	},
	focus: function(vnode, todo) {
		if (todo === state.editing && vnode.dom !== document.activeElement) {
			vnode.dom.value = todo.title
			vnode.dom.focus()
			vnode.dom.selectionStart = vnode.dom.selectionEnd = todo.title.length
		}
	},
	save: function(e) {
		if (e.keyCode === 13 || e.type === "blur") state.dispatch("update", [e.target.value])
		else if (e.keyCode === 27) state.dispatch("reset")
	},
	dispatch: function(action, args) {
		state.dispatch(action, args)
	},
	oninit: state.computed,
	onbeforeupdate: state.computed,
	view: function(vnode) {
		var ui = vnode.state
		return [
			m("header.header", [
				m("h1", "todos"),
				m("input#new-todo[placeholder='What needs to be done?'][autofocus]", {onkeypress: ui.add}),
			]),
			m("section#main", {style: {display: state.todos.length > 0 ? "" : "none"}}, [
				m("input#toggle-all[type='checkbox']", {checked: state.remaining === 0, onclick: ui.toggleAll}),
				m("label[for='toggle-all']", {onclick: ui.toggleAll}, "Mark all as complete"),
				m("ul#todo-list", [
					state.todos.map(function(todo) {
						return m("li", {class: (todo.completed ? "completed" : "") + " " + (todo === state.editing ? "editing" : "")}, [
							m(".view", [
								m("input.toggle[type='checkbox']", {checked: todo.completed, onclick: function() {ui.toggle(todo)}}),
								m("label", {ondblclick: function() {ui.dispatch("edit", [todo])}}, todo.title),
								m("button.destroy", {onclick: function() {ui.dispatch("destroy", [todo])}}),
							]),
							m("input.edit", {onupdate: function(vnode) {ui.focus(vnode, todo)}, onkeypress: ui.save, onblur: ui.save})
						])
					}),
				]),
			]),
			state.todos.length ? m("footer#footer", [
				m("span#todo-count", [
					m("strong", state.remaining),
					state.remaining === 1 ? " item left" : " items left",
				]),
				m("ul#filters", [
					m("li", m("a[href='/']", {oncreate: m.route.link, class: state.filter === "" ? "selected" : ""}, "All")),
					m("li", m("a[href='/active']", {oncreate: m.route.link, class: state.filter === "active" ? "selected" : ""}, "Active")),
					m("li", m("a[href='/completed']", {oncreate: m.route.link, class: state.filter === "completed" ? "selected" : ""}, "Completed")),
				]),
				m("button#clear-completed", {onclick: function() {ui.dispatch("clear")}}, "Clear completed"),
			]) : null,
		]
	}
}

m.route(document.getElementById("todoapp"), "/", {
	"/": Todos,
	"/:status": Todos,
})
