# Explicação do Código do Projeto To-Do Timer

Este documento explica o código do projeto To-Do Timer, desenvolvido com o framework Electron. O objetivo é detalhar como o código funciona no contexto do projeto e como ele utiliza os recursos do Electron.

---

## **Contexto do Projeto**
Este projeto é um aplicativo de tarefas (To-Do) desenvolvido com o framework Electron. Ele utiliza o processo principal e o processo renderer do Electron para criar uma interface gráfica que permite ao usuário adicionar tarefas, iniciar timers ajustáveis e interagir com o sistema operacional (como notificações e atalhos globais).

---

## **Explicação do Código**

### **1. Importação de Módulos**
```javascript
const { app, BrowserWindow, ipcMain, Menu, Tray, globalShortcut, dialog, shell, clipboard } = require('electron');
const path = require('path');
const fs = require('fs');
```
- **`electron`**: Fornece as APIs principais do Electron para criar janelas, gerenciar IPC (comunicação entre processos), criar menus, atalhos globais, etc.
- **`path`**: Facilita o trabalho com caminhos de arquivos e diretórios.
- **`fs`**: Permite manipular o sistema de arquivos (ler, escrever, etc.).

---

### **2. Variáveis Globais**
```javascript
let mainWindow;
let tray;
let activeTimers = 0;
```
- **`mainWindow`**: Representa a janela principal do aplicativo.
- **`tray`**: Representa o ícone na bandeja do sistema (System Tray).
- **`activeTimers`**: Contador para rastrear quantos timers estão ativos.

---

### **3. Criação da Janela Principal**
```javascript
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
```
- **`BrowserWindow`**: Cria uma nova janela do navegador.
- **`webPreferences`**:
  - **`preload`**: Especifica o arquivo `preload.js`, que atua como um intermediário seguro entre o processo principal e o renderer.
  - **`nodeIntegration: false`**: Desativa a integração do Node.js no renderer para segurança.
  - **`contextIsolation: true`**: Isola o contexto do renderer para evitar acesso direto ao Node.js.
- **`loadFile`**: Carrega o arquivo HTML que será exibido na janela.

---

### **4. Menu da Aplicação**
```javascript
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
                        shell.openExternal('https://electronjs.org');
                    }
                }
            ]
        }
    ];
    Menu.setApplicationMenu(Menu.buildFromTemplate(template));
}
```
- **`Menu`**: Define o menu da aplicação.
- **`shell.openExternal`**: Abre um link no navegador padrão do sistema.

---

### **5. Ciclo de Vida do App**
```javascript
app.whenReady().then(() => {
    createWindow();
    setupTray();
    setupGlobalShortcuts();

    app.on('activate', () => {
        if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
});

app.on('will-quit', () => {
    globalShortcut.unregisterAll();
});
```
- **`app.whenReady`**: Garante que o Electron esteja pronto antes de criar a janela.
- **`setupTray`**: Configura o ícone na bandeja do sistema.
- **`setupGlobalShortcuts`**: Configura atalhos globais.
- **`app.on('activate')`**: Reabre a janela principal se ela estiver fechada (comportamento padrão no macOS).
- **`app.on('will-quit')`**: Remove todos os atalhos globais ao sair.

---

### **6. System Tray**
```javascript
function setupTray() {
    tray = new Tray(path.join(__dirname, 'icon.png'));
    const contextMenu = Menu.buildFromTemplate([
        { label: 'Mostrar App', click: () => mainWindow.show() },
        { role: 'quit', label: 'Sair' }
    ]);
    tray.setToolTip('To-Do Timer');
    tray.setContextMenu(contextMenu);
}
```
- **`Tray`**: Cria um ícone na bandeja do sistema.
- **`setToolTip`**: Define a dica exibida ao passar o mouse sobre o ícone.
- **`setContextMenu`**: Define o menu de contexto exibido ao clicar no ícone.

---

### **7. Comunicação entre Processos (IPC)**
```javascript
ipcMain.on('show-context-menu', (event, taskText) => {
    const contextMenu = Menu.buildFromTemplate([
        {
            label: 'Copiar Texto da Tarefa',
            click: () => {
                clipboard.writeText(taskText);
            }
        },
        { type: 'separator' },
        { role: 'delete', label: 'Deletar' }
    ]);
    contextMenu.popup(BrowserWindow.fromWebContents(event.sender));
});
```
- **`ipcMain`**: Gerencia eventos enviados do processo renderer.
- **`clipboard.writeText`**: Copia texto para a área de transferência.

---

### **8. Notificações e Badges**
```javascript
ipcMain.on('timer-started', () => {
    activeTimers++;
    app.setBadgeCount(activeTimers);
});

ipcMain.on('timer-stopped', () => {
    if (activeTimers > 0) activeTimers--;
    app.setBadgeCount(activeTimers);
});
```
- **`app.setBadgeCount`**: Define o número exibido como badge no ícone do aplicativo (suportado no macOS).

---

### **9. Exportação de Tarefas**
```javascript
ipcMain.handle('export-tasks', async (event, tasksString) => {
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
});
```
- **`dialog.showSaveDialog`**: Abre uma janela para salvar arquivos.
- **`fs.writeFileSync`**: Salva o conteúdo no arquivo especificado.
- **`shell.showItemInFolder`**: Abre o gerenciador de arquivos na localização do arquivo salvo.

---

### **10. Atalhos Globais**
```javascript
function setupGlobalShortcuts() {
    const success = globalShortcut.register('CommandOrControl+Shift+T', () => {
        if (mainWindow) {
            mainWindow.show();
            mainWindow.focus();
            mainWindow.webContents.send('focus-input');
        }
    });

    if (!success) {
        console.warn('O atalho global falhou ou já está em uso.');
    }
}
```
- **`globalShortcut.register`**: Registra um atalho global.
- **`webContents.send`**: Envia um evento para o processo renderer.

---

### **11. Timer Ajustável**
```javascript
ipcMain.handle('adjust-timer', (event, duration) => {
    if (typeof duration !== 'number' || duration <= 0) {
        throw new Error('Duração inválida. Deve ser um número positivo.');
    }
    console.log(`Timer ajustado para ${duration} segundos.`);
    return true;
});
```
- **`ipcMain.handle`**: Gerencia chamadas assíncronas do processo renderer.
- **`duration`**: Define a duração do timer ajustável.

---

## **Resumo**
Este código utiliza o Electron para criar um aplicativo de tarefas com funcionalidades como:
- Interface gráfica com timers ajustáveis.
- Comunicação entre processos (IPC).
- Integração com o sistema operacional (notificações, atalhos, bandeja do sistema).

Se precisar de mais explicações ou ajustes, é só avisar!