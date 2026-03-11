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

// ==========================================================
// 1. MENU DA APLICAÇÃO E SHELL (O Mapa Global)
// ==========================================================
function setupApplicationMenu() {
    const template = [
        {
            label: 'Arquivo',
            submenu: [
                { role: 'quit', label: 'Sair do To-Do' }
            ]
        },
        {
            label: 'Ajuda',
            submenu: [
                {
                    label: 'Documentação Oficial',
                    click: () => {
                        // SHELL: Abre no navegador padrão (seguro e isolado)
                        shell.openExternal('[https://electronjs.org](https://electronjs.org)');
                    }
                }
            ]
        }
    ];
    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}

// ==========================================================
// CICLO DE VIDA DO APP
// ==========================================================
app.whenReady().then(() => {
    createWindow();
    setupTray();
    setupGlobalShortcuts();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

// LIMPEZA ÉTICA: Removendo atalhos ao fechar
app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});

// ==========================================================
// 2. SYSTEM TRAY (A Vida Oculta)
// ==========================================================
function setupTray() {
    // Nota: Use um png transparente. Se for macOS, adicione "Template" no nome (ex: iconTemplate.png)
    // Para fins de teste, você pode criar um ícone vazio ou apontar para um genérico.
    tray = new Tray(path.join(__dirname, 'icon.png')); // Ensure the icon exists in the correct path
    
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Mostrar App', click: () => mainWindow.show() },
        { role: 'quit', label: 'Sair' }
    ]);
    
    tray.setToolTip('To-Do Timer');
    tray.setContextMenu(contextMenu);
}

// ==========================================================
// 3. MENU DE CONTEXTO E CLIPBOARD (Ação Cirúrgica)
// ==========================================================
ipcMain.on('show-context-menu', (event, taskText) => {
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Copiar Texto da Tarefa',
            click: () => {
                // CLIPBOARD: Copia sem o usuário usar Ctrl+C
                clipboard.writeText(taskText);
            }
        },
        { type: 'separator' },
        { role: 'delete', label: 'Deletar' } // Exemplo de Role nativa
    ]);
    contextMenu.popup(BrowserWindow.fromWebContents(event.sender));
});

// ==========================================================
// 4. BADGES (Notificações Silenciosas)
// ==========================================================
ipcMain.on('timer-started', () => {
    activeTimers++;
    app.setBadgeCount(activeTimers); // Interrupção passiva: bolinha vermelha no ícone
});

ipcMain.on('timer-stopped', () => {
    if (activeTimers > 0) activeTimers--;
    app.setBadgeCount(activeTimers);
});

// ==========================================================
// 5. DIALOG E SHELL (Exportação Segura)
// ==========================================================
ipcMain.handle('export-tasks', async (event, tasksString) => {
    try {
        const { filePath, canceled } = await dialog.showSaveDialog(mainWindow, {
            title: 'Salvar Lista de Tarefas',
            defaultPath: 'minhas_tarefas.txt',
            filters: [{ name: 'Arquivos de Texto', extensions: ['txt'] }]
        });

        if (!canceled && filePath) {
            fs.writeFileSync(filePath, tasksString);
            shell.showItemInFolder(filePath);
            return true;
        }
        return false;
    } catch (error) {
        console.error('Erro ao salvar tarefas:', error);
        return false;
    }
});

// ==========================================================
// 6. GLOBAL SHORTCUTS (Não sendo um sequestrador)
// ==========================================================
function setupGlobalShortcuts() {
    // Usamos um atalho complexo para não sobrepor funções do SO
    const success = globalShortcut.register('CommandOrControl+Shift+T', () => {
        if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
            // Pede ao Renderer para dar foco no input
            mainWindow.webContents.send('focus-input'); 
        }
    });

    if (!success) {
        console.warn('O atalho global falhou ou já está em uso.');
    }
}

// ==========================================================
// 7. TIMER AJUSTÁVEL (Configuração Dinâmica)
// ==========================================================
ipcMain.handle('adjust-timer', (event, duration) => {
    try {
        if (typeof duration !== 'number' || duration <= 0) {
            throw new Error('Duração inválida. Deve ser um número positivo.');
        }
        console.log(`Timer ajustado para ${duration} segundos.`);
        return true;
    } catch (error) {
        console.error('Erro ao ajustar o timer:', error);
        return false;
    }
});
```

#### `preload.js`
Este arquivo atua como um intermediário seguro entre o processo principal e o renderer. Ele expõe APIs específicas para o renderer usar.

**Código:**
```javascript
const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
    // Comunicação para Menus de Contexto e Clipboard
    showContextMenu: (taskText) => ipcRenderer.send('show-context-menu', taskText),
    
    // Comunicação para Badges (Timers)
    startTimer: () => ipcRenderer.send('timer-started'),
    stopTimer: () => ipcRenderer.send('timer-stopped'),

    // Comunicação bidirecional (Invocar e esperar resposta)
    exportTasks: (tasks) => ipcRenderer.invoke('export-tasks', tasks),
    
    // Escutando atalhos globais
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

// Foco automático pelo Atalho Global
window.electronAPI.onFocusInput(() => {
    taskInput.focus();
});

// Renderizar Item
function renderTask(text) {
    const li = document.createElement('li');
    
    const span = document.createElement('span');
    span.textContent = text;
    
    // Disparar Menu de Contexto (Clique Direito)
    li.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        window.electronAPI.showContextMenu(text);
    });

    const timerBtn = document.createElement('button');
    timerBtn.className = 'timer-btn';
    timerBtn.textContent = 'Iniciar Timer 25m';
    
    let isTiming = false;
    let timerId = null;

    // Função para adicionar alerta visual ao botão do timer
    function addTimerAlert(button) {
        button.classList.add('timer-alert');
        const intervalId = setInterval(() => {
            button.classList.toggle('alert-active');
        }, 500);

        // Remover o alerta ao clicar no botão
        button.addEventListener('click', () => {
            clearInterval(intervalId);
            button.classList.remove('timer-alert', 'alert-active');
            button.textContent = 'Iniciar Timer';
            button.style.backgroundColor = '#36b37e'; // Verde
        }, { once: true });
    }

    // Atualizar lógica do Timer para usar o tempo ajustado pelo usuário
    timerBtn.addEventListener('click', () => {
        if (!isTiming) {
            isTiming = true;
            const durationInput = document.getElementById('timerDuration');
            let remainingTime = parseInt(durationInput.value, 10) || 0.10 * 60; // Usar valor ajustado ou padrão de 25 minutos
            timerBtn.textContent = formatTime(remainingTime);
            timerBtn.style.backgroundColor = '#ff5630'; // Vermelho

            // Avisa o SO que temos uma tarefa rodando (adiciona Badge)
            window.electronAPI.startTimer();

            // Atualizar o texto do botão a cada segundo
            timerId = setInterval(() => {
                remainingTime--;
                timerBtn.textContent = formatTime(remainingTime);

                if (remainingTime <= 0) {
                    clearInterval(timerId);
                    stopTimer();
                    new Notification('Timer Concluído!', { body: text });
                }
            }, 1000);
        } else {
            stopTimer();
        }
    });

    // Atualizar lógica para aplicar animação ao concluir o timer
    function stopTimer() {
        isTiming = false;
        clearInterval(timerId);
        timerBtn.textContent = 'Iniciar Timer';
        timerBtn.style.backgroundColor = '#36b37e'; // Verde

        // Avisa o SO para remover a Badge
        window.electronAPI.stopTimer();

        // Adicionar animação de pulsação com gradiente
        timerBtn.classList.add('timer-completed');
    }

    li.appendChild(span);
    li.appendChild(timerBtn);
    taskList.appendChild(li);
}

// Botão Extra de Exportar (Pode ser adicionado ao HTML dinamicamente)
const exportBtn = document.createElement('button');
exportBtn.textContent = "Exportar Lista (Txt)";
exportBtn.style.marginTop = "20px";
exportBtn.style.width = "100%";
exportBtn.addEventListener('click', async () => {
    if(tasks.length === 0) return alert('Nenhuma tarefa para exportar.');
    
    const content = tasks.map((t, i) => `${i+1}. ${t}`).join('\n');
    const success = await window.electronAPI.exportTasks(content);
    
    if(success) {
        console.log('Arquivo salvo e exibido no sistema com sucesso!');
    }
});
document.querySelector('.container').appendChild(exportBtn);

// Adicionar funcionalidade para ajustar o timer
document.getElementById('adjustTimerBtn').addEventListener('click', async () => {
    const durationInput = document.getElementById('timerDuration');
    const duration = parseInt(durationInput.value, 10);

    if (isNaN(duration) || duration <= 0) {
        alert('Por favor, insira um valor válido para o timer.');
        return;
    }

    const success = await window.electronAPI.adjustTimer(duration);
    if (success) {
        alert(`Timer ajustado para ${duration} segundos.`);
    } else {
        alert('Falha ao ajustar o timer. Verifique os logs para mais detalhes.');
    }
});

// Função para formatar o tempo em mm:ss
function formatTime(seconds) {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}
```

#### `styles.css`
Este arquivo define os estilos do aplicativo, incluindo animações e layout.

**Código:**
```css
body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    background-color: #f4f5f7;
    color: #172b4d;
    margin: 0;
    padding: 20px;
}

.container {
    max-width: 500px;
    margin: 0 auto;
    background: #ffffff;
    padding: 20px;
    border-radius: 8px;
    box-shadow: 0 4px 12px rgba(0,0,0,0.05);
}

h1 { font-size: 1.5rem; margin-top: 0; }

.input-group { display: flex; gap: 10px; margin-bottom: 20px; }

input[type="text"] {
    flex: 1;
    padding: 10px;
    border: 2px solid #dfe1e6;
    border-radius: 4px;
    outline: none;
}
input[type="text"]:focus { border-color: #4c9aff; }

button {
    background-color: #0052cc;
    color: white;
    border: none;
    padding: 10px 15px;
    border-radius: 4px;
    cursor: pointer;
    font-weight: bold;
}
button:hover { background-color: #0047b3; }
button.timer-btn { background-color: #36b37e; font-size: 0.8rem; padding: 5px 10px;}
button.timer-btn:hover { background-color: #2e9c6d; }

ul { list-style: none; padding: 0; margin: 0; }

li {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px;
    border-bottom: 1px solid #ebecf0;
}
li:last-child { border-bottom: none; }

/* Estilo para o alerta do timer */
.timer-alert {
    animation: pulse 1s infinite;
}

.alert-active {
    background-color: #ff0000 !important; /* Vermelho */
    color: #ffffff !important; /* Branco */
}

@keyframes pulse {
    0% {
        transform: scale(1);
    }
    50% {
        transform: scale(1.1);
    }
    100% {
        transform: scale(1);
    }
}

/* Estilo para animação de pulsação com gradiente verde e amarelo */
.timer-completed {
    animation: pulse-gradient 1.5s infinite;
    background: linear-gradient(90deg, #36b37e, #ffeb3b);
    background-size: 200% 200%;
    color: #ffffff;
}

@keyframes pulse-gradient {
    0% {
        transform: scale(1);
        background-position: 0% 50%;
    }
    50% {
        transform: scale(1.1);
        background-position: 100% 50%;
    }
    100% {
        transform: scale(1);
        background-position: 0% 50%;
    }
}
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