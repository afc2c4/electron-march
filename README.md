# Electron To-Do Timer

Este projeto é um aplicativo de tarefas (To-Do) desenvolvido com Electron. Ele permite adicionar tarefas, iniciar um timer ajustável para cada tarefa e exibe animações e notificações ao término do timer.

## Estrutura do Projeto

A estrutura do projeto é organizada da seguinte forma:

```
.
├── package.json
├── src/
│   ├── main/
│   │   ├── main.js
│   │   ├── preload.js
│   ├── renderer/
│   │   ├── index.html
│   │   ├── renderer.js
│   │   ├── styles.css
```

### Arquivos na pasta `main`

#### `main.js`
Este arquivo é o ponto de entrada do aplicativo. Ele configura a janela principal, o menu, o tray e os atalhos globais. Também gerencia a comunicação entre o processo principal e o renderer.

**Código:**
```javascript
const { app, BrowserWindow, ipcMain, Menu, Tray, globalShortcut, dialog, shell, clipboard } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let tray;
let activeTimers = 0;

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 600,
        height: 700,
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
            nodeIntegration: false,
            contextIsolation: true
        }
    });

    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'));
    setupApplicationMenu();
}

// ... restante do código omitido para brevidade ...
```

#### `preload.js`
Este arquivo atua como um intermediário seguro entre o processo principal e o renderer. Ele expõe APIs específicas para o renderer usar.

**Código:**
```javascript
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    startTimer: () => ipcRenderer.send('timer-started'),
    stopTimer: () => ipcRenderer.send('timer-stopped'),
    adjustTimer: (duration) => ipcRenderer.invoke('adjust-timer', duration),
    exportTasks: (tasksString) => ipcRenderer.invoke('export-tasks', tasksString),
    showContextMenu: (taskText) => ipcRenderer.send('show-context-menu', taskText),
    onFocusInput: (callback) => ipcRenderer.on('focus-input', callback)
});
```

### Arquivos na pasta `renderer`

#### `index.html`
Este arquivo define a interface do usuário. Ele contém os elementos HTML necessários para adicionar tarefas, ajustar o timer e exibir a lista de tarefas.

**Código:**
```html
<!DOCTYPE html>
<html lang="pt-BR">
<head>
    <meta charset="UTF-8">
    <title>To-Do Nativo</title>
    <link rel="stylesheet" href="style.css">
</head>
<body>
    <div class="container">
        <h1>Minhas Tarefas</h1>
        <div class="input-group">
            <input type="text" id="taskInput" placeholder="O que você precisa fazer?">
            <button id="addTaskBtn">Adicionar</button>
        </div>
        <div class="timer-adjust">
            <label for="timerDuration">Duração do Timer (segundos):</label>
            <input type="number" id="timerDuration" placeholder="Ex: 1500">
            <button id="adjustTimerBtn">Ajustar Timer</button>
        </div>
        <ul id="taskList"></ul>
    </div>
    <script src="renderer.js"></script>
</body>
</html>
```

#### `renderer.js`
Este arquivo gerencia a lógica do frontend. Ele lida com eventos do usuário, como adicionar tarefas, iniciar/parar o timer e ajustar sua duração. Também se comunica com o processo principal via IPC.

**Código:**
```javascript
const taskInput = document.getElementById('taskInput');
const addTaskBtn = document.getElementById('addTaskBtn');
const taskList = document.getElementById('taskList');

// Arrays para guardar os dados (apenas em memória para este exemplo)
let tasks = [];

// Adicionar Tarefa
addTaskBtn.addEventListener('click', () => {
    const text = taskInput.value.trim();
    if (!text) return;

    tasks.push(text);
    renderTask(text);
    taskInput.value = '';
});

// ... restante do código omitido para brevidade ...
```

#### `styles.css`
Este arquivo define os estilos do aplicativo, incluindo animações e layout.

**Código:**
```css
body {
    font-family: Arial, sans-serif;
    background-color: #f4f4f4;
    margin: 0;
    padding: 0;
}

.container {
    max-width: 600px;
    margin: 50px auto;
    padding: 20px;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

/* ... restante do código omitido para brevidade ... */
```

## Como Executar o Projeto

1. Certifique-se de ter o Node.js instalado.
2. Clone este repositório.
3. Instale as dependências:
   ```bash
   npm install
   ```
4. Inicie o aplicativo:
   ```bash
   npm start
   ```

## Funcionalidades

- Adicionar tarefas.
- Iniciar e ajustar timers para cada tarefa.
- Exibir animações e notificações ao término do timer.

## Contribuição

Sinta-se à vontade para abrir issues e enviar pull requests para melhorias!