# Explicação do Código do Arquivo `preload.js`

Este documento explica o código do arquivo `preload.js` no contexto do projeto To-Do Timer, desenvolvido com o framework Electron. O arquivo `preload.js` é responsável por atuar como um intermediário seguro entre o processo principal e o processo renderer.

---

## **Contexto do Arquivo**
No Electron, o arquivo `preload.js` é executado no contexto isolado da janela (BrowserWindow). Ele serve como uma ponte entre o processo principal e o processo renderer, permitindo que o renderer acesse APIs específicas do Electron sem comprometer a segurança da aplicação.

O uso do `contextBridge` e do `ipcRenderer` garante que apenas as funcionalidades explicitamente expostas estejam disponíveis para o renderer, reduzindo o risco de ataques como injeção de código.

---

## **Explicação do Código**

### **1. Importação de Módulos**
```javascript
const { contextBridge, ipcRenderer } = require('electron');
```
- **`contextBridge`**: Permite expor APIs seguras do processo principal para o processo renderer.
- **`ipcRenderer`**: Facilita a comunicação entre o processo renderer e o processo principal.

---

### **2. Expondo APIs Seguras**
```javascript
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

#### **2.1. Comunicação para Menus de Contexto e Clipboard**
```javascript
showContextMenu: (taskText) => ipcRenderer.send('show-context-menu', taskText),
```
- **Descrição**: Envia um evento para o processo principal para exibir um menu de contexto relacionado a uma tarefa específica.
- **Uso**: O processo renderer chama esta função ao detectar um clique com o botão direito em uma tarefa.

#### **2.2. Comunicação para Badges (Timers)**
```javascript
startTimer: () => ipcRenderer.send('timer-started'),
stopTimer: () => ipcRenderer.send('timer-stopped'),
```
- **Descrição**: Envia eventos para o processo principal para indicar o início ou término de um timer.
- **Uso**: O processo principal atualiza o badge do aplicativo com base nesses eventos.

#### **2.3. Comunicação Bidirecional**
```javascript
exportTasks: (tasks) => ipcRenderer.invoke('export-tasks', tasks),
```
- **Descrição**: Envia uma solicitação ao processo principal para exportar a lista de tarefas e aguarda uma resposta.
- **Uso**: O processo renderer chama esta função ao clicar no botão de exportar tarefas.

#### **2.4. Escutando Atalhos Globais**
```javascript
onFocusInput: (callback) => ipcRenderer.on('focus-input', callback)
```
- **Descrição**: Escuta eventos enviados pelo processo principal para focar no campo de entrada de tarefas.
- **Uso**: O processo principal envia este evento ao detectar um atalho global.

---

## **Resumo**
O arquivo `preload.js` desempenha um papel crucial na segurança e funcionalidade do projeto. Ele:
- Garante que apenas APIs seguras sejam expostas ao processo renderer.
- Facilita a comunicação entre o processo renderer e o processo principal.
- Reduz o risco de vulnerabilidades ao isolar o acesso às APIs do Electron.

Se precisar de mais explicações ou ajustes, é só avisar!