import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import ConfirmationModal from './ConfirmationModal';
import './App.css';

function App() {
  const [todos, setTodos] = useState([]);
  const [inputValue, setInputValue] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalConfirmAction, setModalConfirmAction] = useState(() => {});

  const handleSubmit = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      setTodos([...todos, { id: Date.now(), text: inputValue.trim(), completed: false }]);
      setInputValue('');
    }
  };

  const toggleComplete = (id) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, completed: !todo.completed } : todo
    ));
  };

  const handleEdit = (id, newText) => {
    setTodos(todos.map(todo =>
      todo.id === id ? { ...todo, text: newText } : todo
    ));
  };

  const deleteTodo = (id) => {
    setTodos(todos.filter(todo => todo.id !== id));
  };

  const handleStore = async () => {
    try {
      const response = await fetch('/api/store-todos', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ todos }),
      });
      
      if (response.ok) {
        alert('Todos stored successfully!');
      } else {
        alert('Failed to store todos.');
      }
    } catch (error) {
      console.error('Error storing todos:', error);
      alert('An error occurred while storing todos.');
    }
  };

  const handleRetrieve = () => {
    setModalMessage('Are you sure you want to replace the current list with the one from the database?');
    setModalConfirmAction(() => performRetrieve);
    setIsModalOpen(true);
  };

  const performRetrieve = async () => {
    try {
      const response = await fetch('/api/retrieve-todos');
      const data = await response.json();
      
      if (response.ok) {
        setTodos(data);
        alert('Todos retrieved successfully!');
      } else {
        console.error('Server error:', data.error, data.details);
        alert(`Failed to retrieve todos. ${data.error} ${data.details || ''}`);
      }
    } catch (error) {
      console.error('Error retrieving todos:', error);
      alert(`An error occurred while retrieving todos: ${error.message}`);
    }
  };

  return (
    <div className="App">
      <div className="max-w-md mx-auto mt-8 p-4">
        <h2 className="text-2xl font-bold mb-4">To-Do List</h2>
        
        <form onSubmit={handleSubmit} className="mb-4">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="w-full p-2 border rounded"
            placeholder="Add a new task"
          />
          <button
            type="submit"
            className="mt-2 w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-600"
          >
            Add Task
          </button>
        </form>
        
        <ul className="list-none p-0 mb-4">
          <AnimatePresence>
            {todos.map((todo) => (
              <motion.li
                key={todo.id}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="flex items-center justify-between bg-gray-100 p-2 mb-2 rounded"
              >
                {editingId === todo.id ? (
                  <input
                    type="text"
                    value={todo.text}
                    onChange={(e) => handleEdit(todo.id, e.target.value)}
                    className="flex-grow p-1 mr-2"
                    onBlur={() => setEditingId(null)}
                    autoFocus
                  />
                ) : (
                  <span
                    className={`flex-grow ${todo.completed ? 'line-through text-gray-500' : ''}`}
                    onDoubleClick={() => setEditingId(todo.id)}
                  >
                    {todo.text}
                  </span>
                )}
                <div>
                  <button
                    onClick={() => toggleComplete(todo.id)}
                    className="mr-2 text-sm bg-green-500 text-white p-1 rounded hover:bg-green-600"
                  >
                    {todo.completed ? 'Undo' : 'Complete'}
                  </button>
                  <button
                    onClick={() => deleteTodo(todo.id)}
                    className="text-sm bg-red-500 text-white p-1 rounded hover:bg-red-600"
                  >
                    Delete
                  </button>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>

        <div className="flex justify-between mt-4">
          <button
            onClick={handleStore}
            className="w-48 bg-purple-500 text-white p-2 rounded hover:bg-purple-600"
          >
            Store Todos
          </button>
          <button
            onClick={handleRetrieve}
            className="w-48 bg-green-500 text-white p-2 rounded hover:bg-green-600"
          >
            Retrieve Todos
          </button>
        </div>
      </div>
      
      <ConfirmationModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onConfirm={() => {
          setIsModalOpen(false);
          modalConfirmAction();
        }}
        message={modalMessage}
      />
    </div>
  );
}

export default App;
